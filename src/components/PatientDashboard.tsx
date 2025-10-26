import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	addToGoogleCalendar,
	downloadICSFile,
	downloadMultipleICSFile,
} from "@/lib/calendar-export";
import { mockPatientAppointments } from "@/lib/mock-data";
import {
	AppointmentStatus,
	formatDateTime,
	getAppointmentStatusColor,
	getAppointmentStatusLabel,
} from "@/lib/types";
import type { AppointmentWithDetails } from "@/lib/types";
import {
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	Download,
	List,
	MapPin,
	Share2,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PatientCalendarView } from "./PatientCalendarView";

// Mock data for simple display
const mockUpcomingAppointments = [
	{
		id: "1",
		procedureNames: ["Blood Draw", "Vital Signs"],
		scheduledDate: "2025-01-28T10:00:00Z",
		location: "Building A, Room 201",
		durationMinutes: 45,
		status: AppointmentStatus.Scheduled,
	},
	{
		id: "2",
		procedureNames: ["ECG", "Questionnaire"],
		scheduledDate: "2025-02-05T14:30:00Z",
		location: "Building B, Room 105",
		durationMinutes: 60,
		status: AppointmentStatus.Scheduled,
	},
];

const mockOpenTimeWindows = [
	{
		id: "1",
		procedureNames: ["MRI Scan"],
		startDate: "2025-02-10T00:00:00Z",
		endDate: "2025-02-14T00:00:00Z",
		availableSlots: 8,
	},
	{
		id: "2",
		procedureNames: ["Blood Draw", "Physical Exam"],
		startDate: "2025-02-20T00:00:00Z",
		endDate: "2025-02-22T00:00:00Z",
		availableSlots: 12,
	},
];

export function PatientDashboard() {
	const [selectedTimeWindow, setSelectedTimeWindow] = useState<string | null>(
		null,
	);

	const completionPercentage = 45;
	const completedProcedures = 9;
	const totalProcedures = 20;

	return (
		<div className="space-y-6">
			{/* Burden Score Card moved to clinician dashboard */}

			{/* Progress Tracker */}
			<Card className="border-[#5191c4]/20 bg-gradient-to-br from-white to-[#E6F2FF]/30">
				<CardHeader>
					<CardTitle className="text-xl text-gray-900">
						Your Trial Progress
					</CardTitle>
					<CardDescription>
						You are making great progress on your clinical trial journey!
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-4xl font-bold text-[#5191c4]">
									{completionPercentage}%
								</p>
								<p className="text-sm text-gray-600 mt-1">
									{completedProcedures} of {totalProcedures} procedures
									completed
								</p>
							</div>
							<div className="w-32 h-32 rounded-full border-8 border-[#5191c4] flex items-center justify-center">
								<CheckCircle2 className="w-16 h-16 text-[#5191c4]" />
							</div>
						</div>

						<div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-[#5191c4] to-[#6397d5] transition-all duration-500"
								style={{ width: `${completionPercentage}%` }}
							/>
						</div>

						<div className="grid grid-cols-3 gap-4 pt-4">
							<div className="text-center p-3 bg-white rounded-lg border border-[#5191c4]/10">
								<p className="text-2xl font-bold text-green-600">
									{completedProcedures}
								</p>
								<p className="text-xs text-gray-600 mt-1">Completed</p>
							</div>
							<div className="text-center p-3 bg-white rounded-lg border border-[#5191c4]/10">
								<p className="text-2xl font-bold text-[#5191c4]">2</p>
								<p className="text-xs text-gray-600 mt-1">Upcoming</p>
							</div>
							<div className="text-center p-3 bg-white rounded-lg border border-[#5191c4]/10">
								<p className="text-2xl font-bold text-gray-600">
									{totalProcedures - completedProcedures}
								</p>
								<p className="text-xs text-gray-600 mt-1">Remaining</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* View Tabs - Calendar vs List */}
			<Tabs defaultValue="list" className="w-full">
				<TabsList className="bg-[#5191c4]/10">
					<TabsTrigger
						value="list"
						className="data-[state=active]:bg-[#5191c4] data-[state=active]:text-white"
					>
						<List className="w-4 h-4 mr-2" />
						List View
					</TabsTrigger>
					<TabsTrigger
						value="calendar"
						className="data-[state=active]:bg-[#5191c4] data-[state=active]:text-white"
					>
						<CalendarDays className="w-4 h-4 mr-2" />
						Calendar View
					</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="mt-6 space-y-6">
					{/* Upcoming Appointments */}
					<Card className="border-[#5191c4]/20">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
										<Calendar className="w-5 h-5 text-[#5191c4]" />
										Upcoming Appointments
									</CardTitle>
									<CardDescription>
										Your scheduled procedures and visits
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											downloadMultipleICSFile(mockPatientAppointments)
										}
										className="border-[#5191c4] text-[#5191c4] hover:bg-[#5191c4]/10"
									>
										<Download className="w-4 h-4 mr-1" />
										Export All
									</Button>
									<Button
										size="sm"
										onClick={() => {
											for (const apt of mockPatientAppointments) {
												addToGoogleCalendar(apt);
											}
										}}
										className="bg-[#5191c4] hover:bg-[#6397d5] text-white"
									>
										<Share2 className="w-4 h-4 mr-1" />
										Sync to Google
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{mockUpcomingAppointments.map((appointment) => (
									<Card
										key={appointment.id}
										className="border-[#5191c4]/10 bg-white"
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<div className="w-10 h-10 bg-[#5191c4]/10 rounded-lg flex items-center justify-center">
															<Calendar className="w-5 h-5 text-[#5191c4]" />
														</div>
														<div>
															<h3 className="font-semibold text-gray-900">
																{appointment.procedureNames.join(", ")}
															</h3>
															<p className="text-sm text-gray-600">
																{formatDateTime(appointment.scheduledDate)}
															</p>
														</div>
													</div>

													<div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
														<div className="flex items-center gap-1">
															<Clock className="w-4 h-4" />
															{appointment.durationMinutes} min
														</div>
														<div className="flex items-center gap-1">
															<MapPin className="w-4 h-4" />
															{appointment.location}
														</div>
													</div>
												</div>

												<div className="flex flex-col items-end gap-2">
													<Badge
														className={getAppointmentStatusColor(
															appointment.status,
														)}
													>
														{getAppointmentStatusLabel(appointment.status)}
													</Badge>
													<Button
														variant="outline"
														size="sm"
														className="border-red-500 text-red-500 hover:bg-red-50"
													>
														<XCircle className="w-4 h-4 mr-1" />
														Cancel
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}

								{mockUpcomingAppointments.length === 0 && (
									<div className="text-center py-8 text-gray-500">
										<Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p>No upcoming appointments scheduled</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Available Time Windows */}
					<Card className="border-[#5191c4]/20">
						<CardHeader>
							<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
								<Clock className="w-5 h-5 text-[#5191c4]" />
								Available Time Windows
							</CardTitle>
							<CardDescription>
								Select a time that works best for you
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{mockOpenTimeWindows.map((window) => (
									<Card
										key={window.id}
										className={`border-[#5191c4]/20 cursor-pointer transition-all ${
											selectedTimeWindow === window.id
												? "ring-2 ring-[#5191c4] bg-[#E6F2FF]/30"
												: "hover:border-[#5191c4]/40"
										}`}
										onClick={() => setSelectedTimeWindow(window.id)}
									>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<h3 className="font-semibold text-gray-900 mb-1">
														{window.procedureNames.join(", ")}
													</h3>
													<p className="text-sm text-gray-600 mb-2">
														Available: {formatDateTime(window.startDate)} -{" "}
														{formatDateTime(window.endDate)}
													</p>
													<Badge className="bg-green-50 text-green-700 hover:bg-green-100">
														{window.availableSlots} slots available
													</Badge>
												</div>

												<Button
													className="bg-[#5191c4] hover:bg-[#6397d5] text-white"
													onClick={(e) => {
														e.stopPropagation();
														// Open scheduling dialog
													}}
												>
													<Calendar className="w-4 h-4 mr-2" />
													Book Appointment
												</Button>
											</div>
										</CardContent>
									</Card>
								))}

								{mockOpenTimeWindows.length === 0 && (
									<div className="text-center py-8 text-gray-500">
										<Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p>No available time windows at the moment</p>
										<p className="text-sm mt-1">
											Check back soon for new scheduling options
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="calendar" className="mt-6">
					<PatientCalendarView />
				</TabsContent>
			</Tabs>
		</div>
	);
}
