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
	addToGoogleCalendar,
	downloadICSFile,
	downloadMultipleICSFile,
} from "@/lib/calendar-export";
import {
	AppointmentStatus,
	type AppointmentWithDetails,
	type CalendarEvent,
	appointmentToCalendarEvent,
	formatDateTime,
	getAppointmentStatusColor,
	getAppointmentStatusLabel,
} from "@/lib/types";
import { format, getDay, parse, startOfWeek } from "date-fns";
import {
	Calendar as CalendarIcon,
	Clock,
	Download,
	MapPin,
	Share2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { mockPatientAppointments } from "@/lib/mock-data";
import { enUS } from "date-fns/locale";
import "@/styles/calendar.css";

const locales = {
	"en-US": enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

// Legacy mock data - replaced by imported version
const _legacyMockPatientAppointments: AppointmentWithDetails[] = [
	{
		id: "1",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704067200",
		update_time: "1704067200",
		patient_id: "patient1",
		clinician_id: "clinician1",
		time_window_id: "1",
		procedure_ids: ["1", "2"],
		scheduled_date: "2025-01-28T10:00:00Z",
		duration_minutes: 45,
		location: "Building A, Room 201",
		status: AppointmentStatus.Scheduled,
		notes: "",
		google_calendar_event_id: null,
		reminders_sent: null,
		procedures: [
			{
				id: "1",
				data_creator: "clinician1",
				data_updater: "clinician1",
				create_time: "1704067200",
				update_time: "1704067200",
				name: "Blood Draw",
				description: "Standard blood draw procedure",
				duration_minutes: 15,
				requires_recovery_time: false,
			},
			{
				id: "2",
				data_creator: "clinician1",
				data_updater: "clinician1",
				create_time: "1704067200",
				update_time: "1704067200",
				name: "Vital Signs",
				description: "Blood pressure, heart rate, temperature",
				duration_minutes: 10,
				requires_recovery_time: false,
			},
		],
	},
	{
		id: "2",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704153600",
		update_time: "1704153600",
		patient_id: "patient1",
		clinician_id: "clinician1",
		time_window_id: "2",
		procedure_ids: ["3", "4"],
		scheduled_date: "2025-02-05T14:30:00Z",
		duration_minutes: 60,
		location: "Building B, Room 105",
		status: AppointmentStatus.Scheduled,
		notes: "",
		google_calendar_event_id: null,
		reminders_sent: null,
		procedures: [
			{
				id: "3",
				data_creator: "clinician1",
				data_updater: "clinician1",
				create_time: "1704067200",
				update_time: "1704067200",
				name: "ECG",
				description: "Electrocardiogram",
				duration_minutes: 30,
				requires_recovery_time: false,
			},
			{
				id: "4",
				data_creator: "clinician1",
				data_updater: "clinician1",
				create_time: "1704067200",
				update_time: "1704067200",
				name: "Questionnaire",
				description: "Health assessment questionnaire",
				duration_minutes: 20,
				requires_recovery_time: false,
			},
		],
	},
];

export function PatientCalendarView() {
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [currentView, setCurrentView] = useState<View>("week");

	// Convert appointments to calendar events
	const events = useMemo(
		() => mockPatientAppointments.map((apt) => appointmentToCalendarEvent(apt)),
		[],
	);

	// Handle selecting an existing event
	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		setSelectedEvent(event);
	}, []);

	// Handle navigation (today, back, next buttons)
	const handleNavigate = useCallback((newDate: Date) => {
		setCurrentDate(newDate);
	}, []);

	// Handle view changes (month, week, day)
	const handleViewChange = useCallback((newView: View) => {
		setCurrentView(newView);
	}, []);

	// Custom event style based on status
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		const status = event.resource?.status as AppointmentStatus;

		let backgroundColor = "#0066CC";
		let borderColor = "#0052A3";

		if (status === AppointmentStatus.Completed) {
			backgroundColor = "#10b981";
			borderColor = "#059669";
		} else if (status === AppointmentStatus.Cancelled) {
			backgroundColor = "#9ca3af";
			borderColor = "#6b7280";
		} else if (status === AppointmentStatus.NoShow) {
			backgroundColor = "#ef4444";
			borderColor = "#dc2626";
		}

		return {
			style: {
				backgroundColor,
				borderColor,
				borderWidth: "2px",
				borderStyle: "solid",
				borderRadius: "6px",
				color: "white",
				fontSize: "0.875rem",
				padding: "4px 8px",
			},
		};
	}, []);

	return (
		<div className="space-y-6">
			{/* Calendar View */}
			<Card className="border-[#0066CC]/20">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
								<CalendarIcon className="w-5 h-5 text-[#0066CC]" />
								My Appointment Calendar
							</CardTitle>
							<CardDescription>
								View your scheduled appointments and procedures
							</CardDescription>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<Badge className="bg-[#0066CC]/10 text-[#0066CC]">
									Scheduled
								</Badge>
								<Badge className="bg-green-50 text-green-700">Completed</Badge>
								<Badge className="bg-gray-50 text-gray-700">Cancelled</Badge>
							</div>
							<div className="h-6 w-px bg-gray-300" />
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadMultipleICSFile(mockPatientAppointments)
									}
									className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/10"
								>
									<Download className="w-4 h-4 mr-1" />
									Export ICS
								</Button>
								<Button
									size="sm"
									onClick={() => {
										// Add all appointments to Google Calendar
										for (const apt of mockPatientAppointments) {
											addToGoogleCalendar(apt);
										}
									}}
									className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
								>
									<Share2 className="w-4 h-4 mr-1" />
									Add to Google Calendar
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="h-[600px]">
						<Calendar
							localizer={localizer}
							events={events}
							startAccessor="start"
							endAccessor="end"
							selectable={false}
							onSelectEvent={handleSelectEvent}
							eventPropGetter={eventStyleGetter}
							views={["month", "week", "day"]}
							view={currentView}
							onView={handleViewChange}
							date={currentDate}
							onNavigate={handleNavigate}
							step={15}
							timeslots={4}
							className="trialflow-calendar"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Event Details Panel */}
			{selectedEvent && (
				<Card className="border-[#0066CC]/20">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg text-gray-900">
								Appointment Details
							</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const appointment = selectedEvent.resource
											?.data as AppointmentWithDetails;
										if (appointment) {
											downloadICSFile(appointment);
										}
									}}
								>
									<Download className="w-4 h-4 mr-1" />
									Export
								</Button>
								<Button
									size="sm"
									onClick={() => {
										const appointment = selectedEvent.resource
											?.data as AppointmentWithDetails;
										if (appointment) {
											addToGoogleCalendar(appointment);
										}
									}}
									className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
								>
									<Share2 className="w-4 h-4 mr-1" />
									Add to Google
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									{selectedEvent.title}
								</h3>
								<div className="flex items-center gap-4 text-sm text-gray-600">
									<div className="flex items-center gap-1">
										<CalendarIcon className="w-4 h-4" />
										{formatDateTime(selectedEvent.start.toISOString())}
									</div>
									<div className="flex items-center gap-1">
										<Clock className="w-4 h-4" />
										{Math.round(
											(selectedEvent.end.getTime() -
												selectedEvent.start.getTime()) /
												60000,
										)}{" "}
										min
									</div>
								</div>
							</div>

							{selectedEvent.resource?.type === "appointment" && (
								<>
									<div>
										<p className="text-sm font-medium text-gray-700">
											Procedures:
										</p>
										<div className="flex flex-wrap gap-2 mt-1">
											{selectedEvent.resource.procedureNames?.map((name) => (
												<Badge
													key={name}
													className="bg-[#0066CC]/10 text-[#0066CC]"
												>
													{name}
												</Badge>
											))}
										</div>
									</div>

									{(selectedEvent.resource.data as AppointmentWithDetails)
										.location && (
										<div>
											<p className="text-sm font-medium text-gray-700">
												Location:
											</p>
											<div className="flex items-center gap-1 text-sm text-gray-900">
												<MapPin className="w-4 h-4" />
												{
													(
														selectedEvent.resource
															.data as AppointmentWithDetails
													).location
												}
											</div>
										</div>
									)}

									{(selectedEvent.resource.data as AppointmentWithDetails)
										.notes && (
										<div>
											<p className="text-sm font-medium text-gray-700">
												Notes:
											</p>
											<p className="text-sm text-gray-900">
												{
													(
														selectedEvent.resource
															.data as AppointmentWithDetails
													).notes
												}
											</p>
										</div>
									)}

									<div>
										<p className="text-sm font-medium text-gray-700">Status:</p>
										<Badge
											className={getAppointmentStatusColor(
												selectedEvent.resource.status as AppointmentStatus,
											)}
										>
											{getAppointmentStatusLabel(
												selectedEvent.resource.status as AppointmentStatus,
											)}
										</Badge>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
