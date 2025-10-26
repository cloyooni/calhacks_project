import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/lib/types";
import { Calendar, Users } from "lucide-react";
import { useState } from "react";
import { ClinicianDashboard } from "./ClinicianDashboard";
import { PatientDashboard } from "./PatientDashboard";

export function TrialFlowApp() {
	const [userRole, setUserRole] = useState<UserRole>("clinician");

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white">
			{/* Header */}
			<header className="bg-white border-b border-[#0066CC]/10 shadow-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center">
								<Calendar className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">TrialFlow</h1>
								<p className="text-sm text-gray-600">
									Clinical Trial Scheduling Platform
								</p>
							</div>
						</div>

						{/* Role Switcher */}
						<Tabs
							value={userRole}
							onValueChange={(value) => setUserRole(value as UserRole)}
							className="w-auto"
						>
							<TabsList className="bg-[#0066CC]/10">
								<TabsTrigger
									value="clinician"
									className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white"
								>
									<Users className="w-4 h-4 mr-2" />
									Clinician View
								</TabsTrigger>
								<TabsTrigger
									value="patient"
									className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white"
								>
									<Calendar className="w-4 h-4 mr-2" />
									Patient View
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				{userRole === "clinician" ? (
					<ClinicianDashboard />
				) : (
					<PatientDashboard />
				)}
			</main>
		</div>
	);
}
