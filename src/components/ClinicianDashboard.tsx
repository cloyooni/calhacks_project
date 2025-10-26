import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Patient,
	PatientTrialPhase,
	getTrialPhaseLabel,
} from "@/lib/types";
import {
	AlertCircle,
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	List,
	Plus,
	Search,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AIRecommendations } from "./AIRecommendations";
import { ClinicianCalendarView } from "./ClinicianCalendarView";
import { CreateTimeWindowDialog } from "./CreateTimeWindowDialog";
import { PatientAppointmentsList } from "./PatientAppointmentList";

// Mock data for demonstration - in production, this would come from ORM
const mockPatients: Patient[] = [
	{
		id: "1",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704067200",
		update_time: "1704067200",
		first_name: "John",
		last_name: "Smith",
		email: "john.smith@example.com",
		phone: "555-0101",
		trial_phase: PatientTrialPhase.Phase2,
		enrollment_date: "2024-01-01T00:00:00Z",
		completion_percentage: 45,
	},
	{
		id: "2",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704153600",
		update_time: "1704153600",
		first_name: "Sarah",
		last_name: "Johnson",
		email: "sarah.j@example.com",
		phone: "555-0102",
		trial_phase: PatientTrialPhase.Phase3,
		enrollment_date: "2024-01-15T00:00:00Z",
		completion_percentage: 78,
	},
	{
		id: "3",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704240000",
		update_time: "1704240000",
		first_name: "Michael",
		last_name: "Davis",
		email: "mdavis@example.com",
		phone: "555-0103",
		trial_phase: PatientTrialPhase.Phase1,
		enrollment_date: "2024-02-01T00:00:00Z",
		completion_percentage: 12,
	},
];

export function ClinicianDashboard() {
	const [searchQuery, setSearchQuery] = useState("");
	const [phaseFilter, setPhaseFilter] = useState<string>("all");
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
	const [showCreateWindow, setShowCreateWindow] = useState(false);

	const filteredPatients = mockPatients.filter((patient) => {
		const matchesSearch =
			patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			patient.email.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesPhase =
			phaseFilter === "all" ||
			patient.trial_phase === Number.parseInt(phaseFilter);

		return matchesSearch && matchesPhase;
	});

	return (
		<div className="space-y-6">
			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="border-[#0066CC]/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0066CC]" />
							Total Patients
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-[#0066CC]">
							{mockPatients.length}
						</p>
					</CardContent>
				</Card>

				<Card className="border-[#0066CC]/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Calendar className="w-4 h-4 text-[#0066CC]" />
							Upcoming Appointments
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-[#0066CC]">12</p>
					</CardContent>
				</Card>

				<Card className="border-[#0066CC]/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<Clock className="w-4 h-4 text-orange-500" />
							Open Time Windows
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-orange-500">8</p>
					</CardContent>
				</Card>

				<Card className="border-[#0066CC]/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4 text-green-500" />
							Completed Today
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-green-500">5</p>
					</CardContent>
				</Card>
			</div>

			{/* AI Recommendations */}
			<AIRecommendations />

			{/* View Tabs - Calendar vs List */}
			<Tabs defaultValue="list" className="w-full">
				<TabsList className="bg-[#0066CC]/10">
					<TabsTrigger
						value="list"
						className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white"
					>
						<List className="w-4 h-4 mr-2" />
						Patient List
					</TabsTrigger>
					<TabsTrigger
						value="calendar"
						className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white"
					>
						<CalendarDays className="w-4 h-4 mr-2" />
						Calendar View
					</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="mt-6">
					{/* Patients List */}
					<Card className="border-[#0066CC]/20">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl text-gray-900">
										Enrolled Patients
									</CardTitle>
									<CardDescription>
										Manage appointments and view trial progress
									</CardDescription>
								</div>
								<Button
									onClick={() => setShowCreateWindow(true)}
									className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
								>
									<Plus className="w-4 h-4 mr-2" />
									Create Time Window
								</Button>
							</div>

							{/* Search and Filter */}
							<div className="flex gap-3 mt-4">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										placeholder="Search patients by name or email..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10 border-[#0066CC]/20 focus:border-[#0066CC]"
									/>
								</div>
								<Select value={phaseFilter} onValueChange={setPhaseFilter}>
									<SelectTrigger className="w-48 border-[#0066CC]/20">
										<SelectValue placeholder="Filter by phase" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Phases</SelectItem>
										<SelectItem value={PatientTrialPhase.Phase1.toString()}>
											Phase 1
										</SelectItem>
										<SelectItem value={PatientTrialPhase.Phase2.toString()}>
											Phase 2
										</SelectItem>
										<SelectItem value={PatientTrialPhase.Phase3.toString()}>
											Phase 3
										</SelectItem>
										<SelectItem value={PatientTrialPhase.Phase4.toString()}>
											Phase 4
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{filteredPatients.map((patient) => (
									<Card
										key={patient.id}
										className="border-[#0066CC]/10 hover:border-[#0066CC]/30 transition-all cursor-pointer"
										onClick={() =>
											setSelectedPatient(
												selectedPatient?.id === patient.id ? null : patient,
											)
										}
									>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-full flex items-center justify-center text-white font-semibold">
														{patient.first_name[0]}
														{patient.last_name[0]}
													</div>
													<div>
														<h3 className="font-semibold text-gray-900">
															{patient.first_name} {patient.last_name}
														</h3>
														<p className="text-sm text-gray-600">
															{patient.email}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-6">
													<div className="text-right">
														<Badge className="bg-[#0066CC]/10 text-[#0066CC] hover:bg-[#0066CC]/20">
															{getTrialPhaseLabel(patient.trial_phase)}
														</Badge>
													</div>

													<div className="text-right">
														<p className="text-sm text-gray-600">Progress</p>
														<div className="flex items-center gap-2 mt-1">
															<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
																<div
																	className="h-full bg-gradient-to-r from-[#0066CC] to-[#0052A3] transition-all"
																	style={{
																		width: `${patient.completion_percentage}%`,
																	}}
																/>
															</div>
															<span className="text-sm font-semibold text-[#0066CC]">
																{patient.completion_percentage}%
															</span>
														</div>
													</div>

													<Button
														variant="outline"
														size="sm"
														className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedPatient(patient);
															setShowCreateWindow(true);
														}}
													>
														Schedule
													</Button>
												</div>
											</div>

											{/* Expanded Details */}
											{selectedPatient?.id === patient.id && (
												<div className="mt-4 pt-4 border-t border-[#0066CC]/10">
													<PatientAppointmentsList patientId={patient.id} />
												</div>
											)}
										</CardContent>
									</Card>
								))}

								{filteredPatients.length === 0 && (
									<div className="text-center py-12 text-gray-500">
										<AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p>No patients found matching your search criteria</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="calendar" className="mt-6">
					<ClinicianCalendarView />
				</TabsContent>
			</Tabs>

			{/* Create Time Window Dialog */}
			<CreateTimeWindowDialog
				open={showCreateWindow}
				onOpenChange={setShowCreateWindow}
				selectedPatient={selectedPatient}
			/>
		</div>
	);
}
