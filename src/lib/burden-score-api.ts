// Burden Score API
// Simulated API endpoints for calculating patient burden scores

import {
	type PatientBurdenScoreResult,
	type VisitBurdenInput,
	calculatePatientBurdenScore,
} from "./burden-score";
import type { AppointmentWithDetails } from "./types";

/**
 * Convert appointment data to visit burden input
 */
function appointmentToVisitBurdenInput(
	appointment: AppointmentWithDetails,
	travelMinutes = 60, // Default 60 min round-trip travel
	windowDays = 3, // Default 3-day window
): VisitBurdenInput {
	const procedures =
		appointment.procedures?.map((proc) => {
			// Map procedure names to burden types
			const name = proc.name.toLowerCase();
			let type: VisitBurdenInput["procedures"][0]["type"] = "other";

			if (name.includes("vital") || name.includes("vitals")) {
				type = "vitals";
			} else if (name.includes("ecg") || name.includes("ekg")) {
				type = "ecg";
			} else if (name.includes("blood")) {
				type = "blood_draw";
			} else if (name.includes("infusion") || name.includes("iv")) {
				type = "infusion";
			} else if (name.includes("ct") || name.includes("cat scan")) {
				type = "ct_scan";
			} else if (name.includes("mri")) {
				type = "mri";
			} else if (name.includes("biopsy")) {
				type = "biopsy";
			}

			return {
				type,
				name: proc.name,
				bloodVolumeML: type === "blood_draw" ? 30 : undefined, // Assume standard blood draw
				infusionHours: type === "infusion" ? 1 : undefined, // Assume 1 hour infusion
			};
		}) || [];

	// Infer preparation requirements from procedures
	const preparations: VisitBurdenInput["preparations"] = [];
	const procedureNames = procedures.map((p) => p.name.toLowerCase()).join(" ");

	if (procedureNames.includes("fast") || procedureNames.includes("fasting")) {
		preparations.push("fasting");
	}
	if (
		procedureNames.includes("sedat") ||
		procedureNames.includes("anesthesia")
	) {
		preparations.push("sedation");
	}
	if (procedureNames.includes("contrast")) {
		preparations.push("contrast_dye");
	}
	if (
		procedureNames.includes("bowel") ||
		procedureNames.includes("colonoscopy")
	) {
		preparations.push("bowel_prep");
	}

	return {
		durationMinutes: appointment.duration_minutes || 60,
		procedures,
		preparations,
		travelMinutes,
		windowDays,
	};
}

/**
 * Calculate burden score for a patient's appointments
 */
export async function calculatePatientBurden(
	appointments: AppointmentWithDetails[],
	options?: {
		travelMinutes?: number;
		windowDays?: number;
	},
): Promise<PatientBurdenScoreResult> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Convert appointments to visit burden inputs
	const visits = appointments.map((apt) =>
		appointmentToVisitBurdenInput(
			apt,
			options?.travelMinutes,
			options?.windowDays,
		),
	);

	// Calculate burden score
	const result = calculatePatientBurdenScore(visits);

	return result;
}

/**
 * API endpoint: POST /api/burden-score/calculate
 * Calculate burden score from raw visit data
 */
export async function apiCalculateBurdenScore(
	visits: VisitBurdenInput[],
): Promise<{
	success: boolean;
	data?: PatientBurdenScoreResult;
	error?: string;
}> {
	try {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));

		if (!visits || visits.length === 0) {
			return {
				success: false,
				error: "No visits provided",
			};
		}

		const result = calculatePatientBurdenScore(visits);

		return {
			success: true,
			data: result,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to calculate burden score",
		};
	}
}

/**
 * API endpoint: POST /api/burden-score/patient/{patientId}
 * Calculate burden score for a specific patient
 */
export async function apiGetPatientBurdenScore(
	patientId: string,
	appointments: AppointmentWithDetails[],
): Promise<{
	success: boolean;
	data?: PatientBurdenScoreResult & { patientId: string };
	error?: string;
}> {
	try {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 400));

		const result = await calculatePatientBurden(appointments);

		return {
			success: true,
			data: {
				...result,
				patientId,
			},
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch burden score",
		};
	}
}

/**
 * Sample data generator for testing
 */
export function generateSampleVisits(): VisitBurdenInput[] {
	return [
		{
			// Screening Visit
			durationMinutes: 90,
			procedures: [
				{ type: "blood_draw", name: "Blood Draw", bloodVolumeML: 25 },
				{ type: "ecg", name: "ECG" },
				{ type: "vitals", name: "Vital Signs" },
			],
			preparations: ["fasting"],
			travelMinutes: 60,
			windowDays: 3,
		},
		{
			// Week 4 Visit
			durationMinutes: 120,
			procedures: [
				{ type: "mri", name: "MRI Scan" },
				{ type: "vitals", name: "Vital Signs" },
			],
			preparations: ["contrast_dye"],
			travelMinutes: 90,
			windowDays: 2,
		},
		{
			// Week 8 Visit
			durationMinutes: 60,
			procedures: [{ type: "infusion", name: "IV Infusion", infusionHours: 1 }],
			preparations: [],
			travelMinutes: 90,
			windowDays: 3,
		},
		{
			// Week 12 Visit
			durationMinutes: 45,
			procedures: [
				{ type: "ct_scan", name: "CT Scan" },
				{ type: "blood_draw", name: "Blood Draw", bloodVolumeML: 20 },
			],
			preparations: ["medication_hold"],
			travelMinutes: 30,
			windowDays: 3,
		},
	];
}
