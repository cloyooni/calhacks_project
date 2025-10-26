import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Calendar, CheckCircle, Sparkles } from "lucide-react";

export function AIRecommendations() {
	// Mock AI recommendations
	const recommendations = [
		{
			id: "1",
			type: "bundle_procedures",
			title: "Bundle Procedures for Patient Sarah Johnson",
			description:
				"Combine ECG and Blood Draw appointments on the same day to reduce patient visits by 50%",
			confidence: 0.92,
			actions: ["View suggested schedule", "Apply recommendation"],
		},
		{
			id: "2",
			type: "optimize_window",
			title: "Optimize Time Window Utilization",
			description:
				"Tuesday 2-4 PM slots have 80% booking rate. Consider adding more availability.",
			confidence: 0.85,
			actions: ["Create time window"],
		},
	];

	if (recommendations.length === 0) {
		return null;
	}

	return (
		<Card className="border-[#0066CC]/20 bg-gradient-to-br from-white to-purple-50/30">
			<CardHeader>
				<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
					<Sparkles className="w-5 h-5 text-purple-600" />
					AI Scheduling Recommendations
				</CardTitle>
				<CardDescription>
					Smart suggestions to optimize your scheduling workflow
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{recommendations.map((rec) => (
						<Card key={rec.id} className="border-purple-200 bg-white">
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											{rec.type === "bundle_procedures" && (
												<Calendar className="w-4 h-4 text-purple-600" />
											)}
											{rec.type === "optimize_window" && (
												<AlertTriangle className="w-4 h-4 text-orange-600" />
											)}
											<h3 className="font-semibold text-gray-900">
												{rec.title}
											</h3>
											<Badge className="bg-purple-100 text-purple-700 text-xs">
												{Math.round(rec.confidence * 100)}% confident
											</Badge>
										</div>
										<p className="text-sm text-gray-600 mb-3">
											{rec.description}
										</p>
										<div className="flex gap-2">
											{rec.actions.map((action) => {
												const idx = rec.actions.indexOf(action);
												return (
													<Button
														key={`${rec.id}-${action}`}
														size="sm"
														variant={idx === 0 ? "default" : "outline"}
														className={
															idx === 0
																? "bg-purple-600 hover:bg-purple-700 text-white"
																: "border-purple-600 text-purple-600 hover:bg-purple-50"
														}
													>
														{idx === rec.actions.length - 1 && (
															<CheckCircle className="w-3 h-3 mr-1" />
														)}
														{action}
													</Button>
												);
											})}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
