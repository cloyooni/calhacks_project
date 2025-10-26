// Patient Burden Score Calculation
// Measures how demanding a clinical trial is for each patient (0-100 scale)

export interface ProcedureWeight {
	name: string;
	invasivenessWeight: number;
}

export interface PreparationRequirement {
	type:
		| "fasting"
		| "sedation"
		| "bowel_prep"
		| "contrast_dye"
		| "medication_hold";
	weight: number;
}

export interface VisitBurdenInput {
	// (1) Time on site (minutes)
	durationMinutes: number;

	// (2) Procedures and invasiveness
	procedures: Array<{
		type:
			| "vitals"
			| "ecg"
			| "blood_draw"
			| "infusion"
			| "ct_scan"
			| "mri"
			| "biopsy"
			| "other";
		name: string;
		bloodVolumeML?: number; // For blood draws
		infusionHours?: number; // For infusions
	}>;

	// (3) Preparation requirements
	preparations: PreparationRequirement["type"][];

	// (4) Travel burden (round-trip minutes)
	travelMinutes: number;

	// (5) Visit window tightness (days)
	windowDays: number;
}

export interface VisitBurdenResult {
	visitNumber: number;
	totalBurden: number;
	breakdown: {
		timeOnSite: number;
		procedures: number;
		preparation: number;
		travel: number;
		windowTightness: number;
	};
}

export interface PatientBurdenScoreResult {
	overallScore: number; // 0-100
	category: "low" | "medium" | "high";
	totalRawBurden: number;
	maxPossibleBurden: number;
	visits: VisitBurdenResult[];
}

// Default parameter constants
export const BURDEN_CONSTANTS = {
	// (1) Time on site: (duration / 30) * alpha
	alpha: 0.5,

	// (2) Procedures: sum(procedure_weights) * beta
	beta: 1.0,

	// (3) Preparation: sum(prep_weights) * gamma
	gamma: 1.0,

	// (4) Travel: (travel_minutes / 15) * delta
	delta: 0.5,

	// (5) Window tightness: (3 - window_days) * epsilon (if window < 3 days)
	epsilon: 1.5,

	// Maximum possible burden per visit (for normalization)
	maxBurdenPerVisit: 25,
};

// Default procedure invasiveness weights
export const PROCEDURE_WEIGHTS: Record<string, number> = {
	vitals: 0.5,
	ecg: 1.0,
	blood_draw: 2.0,
	blood_draw_large: 3.0, // >30ml adds +1
	infusion: 3.0, // per hour
	ct_scan: 4.0,
	mri: 5.0,
	biopsy: 7.0,
	other: 1.0,
};

// Default preparation weights
export const PREPARATION_WEIGHTS: Record<
	PreparationRequirement["type"],
	number
> = {
	fasting: 2.0,
	sedation: 4.0,
	bowel_prep: 6.0,
	contrast_dye: 2.0,
	medication_hold: 1.0,
};

/**
 * Calculate burden for a single visit
 */
export function calculateVisitBurden(
	input: VisitBurdenInput,
	visitNumber: number,
): VisitBurdenResult {
	// (1) Time on site burden
	const timeOnSite = (input.durationMinutes / 30) * BURDEN_CONSTANTS.alpha;

	// (2) Procedure burden
	let procedureTotal = 0;
	for (const proc of input.procedures) {
		let weight = PROCEDURE_WEIGHTS[proc.type] || PROCEDURE_WEIGHTS.other;

		// Special handling for blood draw volume
		if (
			proc.type === "blood_draw" &&
			proc.bloodVolumeML &&
			proc.bloodVolumeML > 30
		) {
			weight += 1.0;
		}

		// Special handling for infusion duration
		if (proc.type === "infusion" && proc.infusionHours) {
			weight = weight * proc.infusionHours;
		}

		procedureTotal += weight;
	}
	const procedures = procedureTotal * BURDEN_CONSTANTS.beta;

	// (3) Preparation burden
	let preparationTotal = 0;
	for (const prep of input.preparations) {
		preparationTotal += PREPARATION_WEIGHTS[prep];
	}
	const preparation = preparationTotal * BURDEN_CONSTANTS.gamma;

	// (4) Travel burden
	const travel = (input.travelMinutes / 15) * BURDEN_CONSTANTS.delta;

	// (5) Visit window tightness
	let windowTightness = 0;
	if (input.windowDays < 3) {
		windowTightness = (3 - input.windowDays) * BURDEN_CONSTANTS.epsilon;
	}

	// Total burden for this visit
	const totalBurden =
		timeOnSite + procedures + preparation + travel + windowTightness;

	return {
		visitNumber,
		totalBurden,
		breakdown: {
			timeOnSite,
			procedures,
			preparation,
			travel,
			windowTightness,
		},
	};
}

/**
 * Calculate overall patient burden score from multiple visits
 */
export function calculatePatientBurdenScore(
	visits: VisitBurdenInput[],
): PatientBurdenScoreResult {
	// Calculate burden for each visit
	const visitResults = visits.map((visit, index) =>
		calculateVisitBurden(visit, index + 1),
	);

	// Sum up total raw burden
	const totalRawBurden = visitResults.reduce(
		(sum, visit) => sum + visit.totalBurden,
		0,
	);

	// Calculate maximum possible burden
	const maxPossibleBurden = BURDEN_CONSTANTS.maxBurdenPerVisit * visits.length;

	// Normalize to 0-100 scale
	const overallScore = Math.min(
		100,
		Math.round((totalRawBurden / maxPossibleBurden) * 100),
	);

	// Determine category
	let category: "low" | "medium" | "high";
	if (overallScore <= 33) {
		category = "low";
	} else if (overallScore <= 66) {
		category = "medium";
	} else {
		category = "high";
	}

	return {
		overallScore,
		category,
		totalRawBurden,
		maxPossibleBurden,
		visits: visitResults,
	};
}

/**
 * Get burden category label with description
 */
export function getBurdenCategoryInfo(category: "low" | "medium" | "high") {
	switch (category) {
		case "low":
			return {
				label: "Low Burden",
				description:
					"This trial schedule is manageable with minimal impact on daily life",
				color: "text-green-600",
				bgColor: "bg-green-50",
				borderColor: "border-green-200",
			};
		case "medium":
			return {
				label: "Medium Burden",
				description:
					"This trial requires moderate time commitment and planning",
				color: "text-yellow-600",
				bgColor: "bg-yellow-50",
				borderColor: "border-yellow-200",
			};
		case "high":
			return {
				label: "High Burden",
				description:
					"This trial is demanding and may require significant lifestyle adjustments",
				color: "text-red-600",
				bgColor: "bg-red-50",
				borderColor: "border-red-200",
			};
	}
}

/**
 * Format burden score for display
 */
export function formatBurdenScore(score: number): string {
	return `${score}/100`;
}
