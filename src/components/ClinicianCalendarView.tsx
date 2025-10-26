import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AppointmentStatus,
	type AppointmentWithDetails,
	type CalendarEvent,
	TimeWindowStatus,
	appointmentToCalendarEvent,
	formatDateTime,
	getAppointmentStatusColor,
	getAppointmentStatusLabel,
	timeWindowToCalendarEvent,
} from "@/lib/types";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from "date-fns/locale";
import { CreateTimeWindowDialog } from "./CreateTimeWindowDialog";

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

// Mock data - in production, this would come from ORM
const mockAppointments: AppointmentWithDetails[] = [
	{
		id: "1",
		data_creator: "clinician1",
		data_updater: "clinician1",
		create_time: "1704067200",
		update_time: "1704067200",
		patient_id: "1",
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
		patient: {
			id: "1",
			data_creator: "clinician1",
			data_updater: "clinician1",
			create_time: "1704067200",
			update_time: "1704067200",
			first_name: "John",
			last_name: "Smith",
			email: "john.smith@example.com",
			phone: "555-0101",
			trial_phase: 2,
			enrollment_date: "2024-01-01T00:00:00Z",
			completion_percentage: 45,
		},
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
		patient_id: "2",
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
		patient: {
			id: "2",
			data_creator: "clinician1",
			data_updater: "clinician1",
			create_time: "1704153600",
			update_time: "1704153600",
			first_name: "Sarah",
			last_name: "Johnson",
			email: "sarah.j@example.com",
			phone: "555-0102",
			trial_phase: 3,
			enrollment_date: "2024-01-15T00:00:00Z",
			completion_percentage: 78,
		},
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

export function ClinicianCalendarView() {
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const [showCreateWindow, setShowCreateWindow] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

	// Convert appointments to calendar events
	const events = useMemo(
		() => mockAppointments.map((apt) => appointmentToCalendarEvent(apt)),
		[],
	);

	// Handle selecting a time slot (drag to create)
	const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
		setSelectedSlot(slotInfo);
		setShowCreateWindow(true);
	}, []);

	// Handle selecting an existing event
	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		setSelectedEvent(event);
	}, []);

	// Custom event style based on type and status
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		const isTimeWindow = event.resource?.type === "time_window";
		const status = event.resource?.status;

		let backgroundColor = "#0066CC";
		let borderColor = "#0052A3";

		if (isTimeWindow) {
			if (status === TimeWindowStatus.Open) {
				backgroundColor = "#22c55e";
				borderColor = "#16a34a";
			} else if (status === TimeWindowStatus.PartiallyBooked) {
				backgroundColor = "#f59e0b";
				borderColor = "#d97706";
			}
		} else {
			// Appointment
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
								Appointment Calendar
							</CardTitle>
							<CardDescription>
								Drag to create time windows, click events to view details
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge className="bg-[#0066CC]/10 text-[#0066CC]">
								Scheduled
							</Badge>
							<Badge className="bg-green-50 text-green-700">Completed</Badge>
							<Badge className="bg-orange-50 text-orange-700">
								Time Window
							</Badge>
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
							selectable
							onSelectSlot={handleSelectSlot}
							onSelectEvent={handleSelectEvent}
							eventPropGetter={eventStyleGetter}
							views={["month", "week", "day"]}
							defaultView="week"
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
						<CardTitle className="text-lg text-gray-900">
							Event Details
						</CardTitle>
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
											Patient:
										</p>
										<p className="text-sm text-gray-900">
											{selectedEvent.resource.patientName}
										</p>
									</div>

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

			{/* Create Time Window Dialog */}
			<CreateTimeWindowDialog
				open={showCreateWindow}
				onOpenChange={setShowCreateWindow}
				selectedPatient={null}
			/>
		</div>
	);
}
