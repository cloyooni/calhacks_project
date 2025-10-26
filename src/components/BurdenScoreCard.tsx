import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type PatientBurdenScoreResult,
	formatBurdenScore,
	getBurdenCategoryInfo,
} from "@/lib/burden-score";
import { calculatePatientBurden } from "@/lib/burden-score-api";
import type { AppointmentWithDetails } from "@/lib/types";
import { Activity, AlertCircle, Info, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface BurdenScoreCardProps {
	appointments: AppointmentWithDetails[];
	travelMinutes?: number;
	windowDays?: number;
}

export function BurdenScoreCard({
	appointments,
	travelMinutes = 60,
	windowDays = 3,
}: BurdenScoreCardProps) {
	const [burdenScore, setBurdenScore] =
		useState<PatientBurdenScoreResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		const loadBurdenScore = async () => {
			setLoading(true);
			try {
				const result = await calculatePatientBurden(appointments, {
					travelMinutes,
					windowDays,
				});
				setBurdenScore(result);
			} catch (error) {
				console.error("Failed to calculate burden score:", error);
			} finally {
				setLoading(false);
			}
		};

		if (appointments.length > 0) {
			loadBurdenScore();
		} else {
			setLoading(false);
		}
	}, [appointments, travelMinutes, windowDays]);

	if (loading) {
		return (
			<Card className="border-[#5191c4]/20">
				<CardHeader>
					<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
						<Activity className="w-5 h-5 text-[#5191c4] animate-pulse" />
						Calculating Burden Score...
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-32 flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5191c4]" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!burdenScore || appointments.length === 0) {
		return (
			<Card className="border-[#5191c4]/20">
				<CardHeader>
					<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
						<Activity className="w-5 h-5 text-[#5191c4]" />
						Trial Burden Score
					</CardTitle>
					<CardDescription>
						Schedule appointments to see your burden score
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-gray-500">
						<AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
						<p>No appointments scheduled yet</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const categoryInfo = getBurdenCategoryInfo(burdenScore.category);

	return (
		<Card className={`border-2 ${categoryInfo.borderColor}`}>
			<CardHeader>
					<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
							<Activity className="w-5 h-5 text-[#5191c4]" />
							Trial Burden Score
						</CardTitle>
						<CardDescription>
							Measures how demanding this clinical trial is for you
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowDetails(!showDetails)}
						className="border-[#5191c4] text-[#5191c4] hover:bg-[#5191c4] hover:text-white"
					>
						<Info className="w-4 h-4 mr-1" />
						{showDetails ? "Hide" : "Show"} Details
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Main Score Display */}
					<div
						className={`p-6 rounded-lg ${categoryInfo.bgColor} border-2 ${categoryInfo.borderColor}`}
					>
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-baseline gap-2 mb-2">
									<span className={`text-5xl font-bold ${categoryInfo.color}`}>
										{burdenScore.overallScore}
									</span>
									<span className="text-2xl text-gray-600">/100</span>
								</div>
								<Badge
									className={`${categoryInfo.bgColor} ${categoryInfo.color}`}
								>
									{categoryInfo.label}
								</Badge>
								<p className="text-sm text-gray-700 mt-2">
									{categoryInfo.description}
								</p>
							</div>
							<div className={`hidden sm:flex items-center justify-center w-32 h-32 rounded-full border-8 ${categoryInfo.borderColor}`}>
								<TrendingUp className={`w-16 h-16 ${categoryInfo.color}`} />
							</div>
						</div>
					</div>

					{/* Summary Stats */}
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center p-4 bg-white rounded-lg border border-[#5191c4]/20">
							<p className="text-2xl font-bold text-[#5191c4]">
								{burdenScore.visits.length}
							</p>
							<p className="text-xs text-gray-600 mt-1">Total Visits</p>
						</div>
						<div className="text-center p-4 bg-white rounded-lg border border-[#5191c4]/20">
							<p className="text-2xl font-bold text-gray-700">
								{burdenScore.totalRawBurden.toFixed(1)}
							</p>
							<p className="text-xs text-gray-600 mt-1">Raw Burden Points</p>
						</div>
						<div className="text-center p-4 bg-white rounded-lg border border-[#5191c4]/20">
							<p className="text-2xl font-bold text-gray-700">
								{(
									burdenScore.totalRawBurden / burdenScore.visits.length
								).toFixed(1)}
							</p>
							<p className="text-xs text-gray-600 mt-1">Avg per Visit</p>
						</div>
					</div>

					{/* Detailed Breakdown */}
					{showDetails && (
						<div className="space-y-4">
							<div className="border-t pt-4">
								<h3 className="font-semibold text-gray-900 mb-3">
									Visit-by-Visit Breakdown
								</h3>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Visit</TableHead>
												<TableHead className="text-right">
													Time On Site
												</TableHead>
												<TableHead className="text-right">Procedures</TableHead>
												<TableHead className="text-right">
													Preparation
												</TableHead>
												<TableHead className="text-right">Travel</TableHead>
												<TableHead className="text-right">Window</TableHead>
												<TableHead className="text-right">Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{burdenScore.visits.map((visit) => (
												<TableRow key={visit.visitNumber}>
													<TableCell className="font-medium">
														Visit {visit.visitNumber}
													</TableCell>
													<TableCell className="text-right">
														{visit.breakdown.timeOnSite.toFixed(1)}
													</TableCell>
													<TableCell className="text-right">
														{visit.breakdown.procedures.toFixed(1)}
													</TableCell>
													<TableCell className="text-right">
														{visit.breakdown.preparation.toFixed(1)}
													</TableCell>
													<TableCell className="text-right">
														{visit.breakdown.travel.toFixed(1)}
													</TableCell>
													<TableCell className="text-right">
														{visit.breakdown.windowTightness.toFixed(1)}
													</TableCell>
													<TableCell className="text-right font-bold">
														{visit.totalBurden.toFixed(1)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							<div className="bg-[#5191c4]/5 border border-[#5191c4]/20 rounded-lg p-4">
								<h4 className="font-semibold text-[#5191c4] mb-2 flex items-center gap-2">
									<Info className="w-4 h-4" />
									How is this calculated?
								</h4>
								<ul className="text-sm text-gray-700 space-y-1">
									<li>
										• <strong>Time on Site:</strong> Duration of each visit
									</li>
									<li>
										• <strong>Procedures:</strong> Number and invasiveness of
										procedures
									</li>
									<li>
										• <strong>Preparation:</strong> Pre-visit requirements
										(fasting, etc.)
									</li>
									<li>
										• <strong>Travel:</strong> Round-trip travel time to clinic
									</li>
									<li>
										• <strong>Window:</strong> Scheduling flexibility (tighter
										windows = higher burden)
									</li>
								</ul>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
