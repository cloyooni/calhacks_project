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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	addToGoogleCalendar,
	downloadICSFile,
	downloadMultipleICSFile,
} from "@/lib/calendar-export";
import { toast } from "sonner";
import {
	AppointmentStatus,
	type AppointmentWithDetails,
	type CalendarEvent,
	appointmentToCalendarEvent,
	formatDateTime,
	getAppointmentStatusColor,
	getAppointmentStatusLabel,
} from "@/lib/types";
import { addDays, format, getDay, parse, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Clock, Download, MapPin, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useMemo, useState } from "react";
import type { View } from "react-big-calendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from "date-fns/locale";
import { mockPatientAppointments } from "@/lib/mock-data";
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

// Hardcoded time windows created by clinician
const mockAvailableTimeWindows = [
	{
		id: "2",
		procedureNames: ["Physical Exam"],
		startDate: "2025-10-28T10:00:00Z",
		endDate: "2025-10-30T14:00:00Z",
		availableSlots: 7,
		durationMinutes: 60,
	},
];

export function PatientCalendarView() {
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const [showScheduleDialog, setShowScheduleDialog] = useState(false);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [currentView, setCurrentView] = useState<View>("week");
    const [appointments, setAppointments] = useState(mockPatientAppointments);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [slotOptions, setSlotOptions] = useState<string[]>([
        "2025-10-28-10",
        "2025-10-28-12",
        "2025-10-29-10",
        "2025-10-29-12",
        "2025-10-29-13",
        "2025-10-30-11",
        "2025-10-30-12",
    ]);
    const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

    const reAddSlotFromDate = (d: Date) => {
        const y = d.getFullYear();
        const m = d.getMonth() + 1; // 1-based
        const day = d.getDate();
        const hh = d.getHours();
        const val = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hh).padStart(2, '0')}`;
        setSlotOptions((prev) => (prev.includes(val) ? prev : [...prev, val].sort()));
    };

    const SlotButton = ({ label, onSelect }: { label: string; onSelect: () => void }) => (
        <Button
            variant="outline"
            className="justify-start text-[#5191c4] border-[#5191c4]/30 hover:bg-[#5191c4]/10"
            onClick={onSelect}
        >
            {label}
        </Button>
    );

    const handleBookSlot = (start: Date) => {
        const id = Date.now().toString();
        const nowSec = Math.floor(Date.now() / 1000).toString();
        const duration = 60;
        const newAppointment: AppointmentWithDetails = {
            id,
            data_creator: "patient1",
            data_updater: "patient1",
            create_time: nowSec,
            update_time: nowSec,
            patient_id: "patient1",
            clinician_id: "clinician1",
            time_window_id: mockAvailableTimeWindows[0].id,
            procedure_ids: ["physical_exam"],
            // Store as local ISO (no Z) so parseLocal renders correct hour in grid
            scheduled_date: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
            duration_minutes: duration,
            location: "Clinic",
            status: AppointmentStatus.Scheduled,
            notes: "",
            google_calendar_event_id: null,
            reminders_sent: null,
        };
        setAppointments((prev) => [...prev, newAppointment]);
        setActiveWindowId(null);
        setShowScheduleDialog(false);
        setCurrentView("week");
        setCurrentDate(new Date(start));
        toast.success("Appointment scheduled");
    };

	// Convert appointments to calendar events
	const events = useMemo(
		() => appointments.map((apt) => {
            const ev = appointmentToCalendarEvent(apt);
            // Show specific procedure name for bookings from the available window
            if (apt.time_window_id === mockAvailableTimeWindows[0].id) {
                ev.title = "Physical Exam";
            }
            return ev;
        }),
		[appointments],
	);

	// Handle selecting an existing event
	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		setSelectedEvent(event);
	}, []);

	// Custom event style based on status
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		const status = event.resource?.status as AppointmentStatus;

		let backgroundColor = "#5191c4";
		let borderColor = "#3b7ca8";

		// If this is the newly booked slot (Physical Exam), match the Unavailable fill color
		if (event.title === "Physical Exam") {
			backgroundColor = "#5191c4"; // same as Unavailable blocks
			borderColor = "#5191c4";
		}

		if (status === AppointmentStatus.Completed) {
			backgroundColor = "#5191c4";
			borderColor = "#3b7ca8";
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

	const Toolbar = ({
		date,
		setDate,
		view,
		setView,
	}: { date: Date; setDate: (d: Date) => void; view: View; setView: (v: View) => void }) => {
		const label = useMemo(() => {
			const options: Intl.DateTimeFormatOptions = view === "month"
				? { year: "numeric", month: "long" }
				: view === "week"
				? { year: "numeric", month: "short", day: "numeric" }
				: { year: "numeric", month: "short", day: "numeric" };
			if (view === "week") {
				const start = startOfWeek(date, { weekStartsOn: 0, locale: enUS });
				const end = addDays(start, 6);
				return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
			}
			return date.toLocaleDateString("en-US", options);
		}, [date, view]);
		const goToday = () => {
			const t = new Date();
			t.setHours(0, 0, 0, 0);
			setDate(t);
		};
		const goPrev = () => {
			if (view === "month") {
				const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			} else if (view === "day") {
				const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			} else {
				const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			}
		};
		const goNext = () => {
			if (view === "month") {
				const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			} else if (view === "day") {
				const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			} else {
				const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
				d.setHours(0, 0, 0, 0);
				setDate(d);
			}
		};
		// Check if today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const viewDate = new Date(date);
		viewDate.setHours(0, 0, 0, 0);
		const isToday = viewDate.getTime() === today.getTime();
		
		return (
			<div className="flex items-center justify-between mb-4 gap-2">
				<div className="flex items-center gap-2">
					<button className="bg-white border border-[#5191c4]/30 text-[#5191c4] px-3 py-2 rounded" onClick={goPrev}>Prev</button>
					<button className={`border px-3 py-2 rounded ${isToday ? "bg-[#5191c4] text-white border-[#3b7ca8]" : "bg-white border-[#5191c4]/30 text-[#5191c4]"}`} onClick={goToday}>Today</button>
					<button className="bg-white border border-[#5191c4]/30 text-[#5191c4] px-3 py-2 rounded" onClick={goNext}>Next</button>
				</div>
				<div className="font-semibold text-[#5191c4]">{label}</div>
				<div className="flex items-center gap-2">
					<button className={`px-3 py-2 rounded border ${view === "month" ? "bg-[#5191c4] text-white border-[#3b7ca8]" : "bg-white border-[#5191c4]/30 text-[#5191c4]"}`} onClick={() => setView("month")}>Month</button>
					<button className={`px-3 py-2 rounded border ${view === "week" ? "bg-[#5191c4] text-white border-[#3b7ca8]" : "bg-white border-[#5191c4]/30 text-[#5191c4]"}`} onClick={() => setView("week")}>Week</button>
					<button className={`px-3 py-2 rounded border ${view === "day" ? "bg-[#5191c4] text-white border-[#3b7ca8]" : "bg-white border-[#5191c4]/30 text-[#5191c4]"}`} onClick={() => setView("day")}>Day</button>
				</div>
			</div>
		);
	};

	const TimeGrid = ({
		mode,
		date,
		events,
	}: { mode: "week" | "day"; date: Date; events: CalendarEvent[] }) => {
		const START_HOUR = 7;
		const END_HOUR = 18; // exclusive end label at 6pm
		const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
		const dayStart = mode === "week" ? startOfWeek(date, { weekStartsOn: 0, locale: enUS }) : new Date(date);
		if (mode === "day") dayStart.setHours(0, 0, 0, 0);
		const days = mode === "week" ? Array.from({ length: 7 }, (_, i) => addDays(dayStart, i)) : [new Date(date.getFullYear(), date.getMonth(), date.getDate())];
		const minutesInView = (END_HOUR - START_HOUR) * 60;
		const colHeader = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

		const eventsByDay = days.map((d) => {
			const y = d.getFullYear(), m = d.getMonth(), da = d.getDate();
			return events.filter((ev) => {
				const sy = ev.start.getFullYear(), sm = ev.start.getMonth(), sd = ev.start.getDate();
				return sy === y && sm === m && sd === da;
			});
		});

		return (
			<div className="border border-[#5191c4]/20 rounded-md overflow-hidden">
				<div className="grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
					<div className="bg-white border-b border-[#5191c4]/20" />
					{days.map((d, idx) => (
						<div key={idx} className="bg-white border-b border-l border-[#5191c4]/20 px-2 py-2 text-sm font-medium text-[#5191c4]">
							{colHeader(d)}
						</div>
					))}
				</div>
				<div className="grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
					<div className="relative">
						{hours.map((h) => (
							<div key={h} className="h-12 border-t border-[#5191c4]/10 text-xs text-gray-500 pr-2 flex items-start justify-end pt-1">
								{new Date(1970, 0, 1, h).toLocaleTimeString("en-US", { hour: "numeric" })}
							</div>
						))}
					</div>
					{days.map((d, col) => (
						<div key={col} className="relative border-l border-[#5191c4]/10">
							<div className="absolute inset-0">
								{hours.map((h) => (
									<div key={h} className="h-12 border-t border-[#5191c4]/10" />
								))}
							</div>
							<div
								className="relative"
								style={{ height: `${hours.length * 48}px` }}
							>
								{/* Highlight available time window */}
								{(() => {
									const dayDate = days[col];
									const windowStart = mockAvailableTimeWindows[0] ? new Date(mockAvailableTimeWindows[0].startDate) : null;
									const windowEnd = mockAvailableTimeWindows[0] ? new Date(mockAvailableTimeWindows[0].endDate) : null;
									
									if (!windowStart || !windowEnd) return null;
									
									// Get just the date part (ignore time)
									const dayDateOnly = new Date(dayDate);
									dayDateOnly.setHours(0, 0, 0, 0);
									
									const windowStartDateOnly = new Date(windowStart);
									windowStartDateOnly.setHours(0, 0, 0, 0);
									
									const windowEndDateOnly = new Date(windowEnd);
									windowEndDateOnly.setHours(0, 0, 0, 0);
									
									// Check if this day is within the available time window
									const isInWindow = dayDateOnly >= windowStartDateOnly && dayDateOnly <= windowEndDateOnly;
									
									if (isInWindow) {
										const startH = 10; // 10 AM
										const endH = 14;  // 2 PM
										const windowStartMin = startH * 60;
										const windowEndMin = endH * 60;
										const topPct = ((windowStartMin - START_HOUR * 60) / minutesInView) * 100;
										const heightPct = ((windowEndMin - windowStartMin) / minutesInView) * 100;
										
										return (
											<div 
												className="absolute left-0 right-0 rounded"
												style={{ 
													top: `${topPct}%`, 
													height: `${heightPct}%`,
													background: '#BFD9F2',
													opacity: 0.6
												}}
											/>
										);
									}
									return null;
								})()}
								
								{/* Booked time slots overlay */}
								{(() => {
									const dayDate = days[col];
									const windowStart = mockAvailableTimeWindows[0] ? new Date(mockAvailableTimeWindows[0].startDate) : null;
									const windowEnd = mockAvailableTimeWindows[0] ? new Date(mockAvailableTimeWindows[0].endDate) : null;
									
									if (!windowStart || !windowEnd) return null;
									
									const dayDateOnly = new Date(dayDate);
									dayDateOnly.setHours(0, 0, 0, 0);
									
									const windowStartDateOnly = new Date(windowStart);
									windowStartDateOnly.setHours(0, 0, 0, 0);
									
									const windowEndDateOnly = new Date(windowEnd);
									windowEndDateOnly.setHours(0, 0, 0, 0);
									
									const isInWindow = dayDateOnly >= windowStartDateOnly && dayDateOnly <= windowEndDateOnly;
									
									if (!isInWindow) return null;
									
									// Define booked time slots for each day
									const bookedSlots: { start: number; end: number }[] = [];
									const dayOfMonth = dayDate.getDate();
									
									// Oct 28 (day 28): 11am-12pm, 1pm-2pm
									if (dayOfMonth === 28) {
										bookedSlots.push({ start: 10 + 54/60, end: 11 + 51/60 }); // 11am-12pm
										bookedSlots.push({ start: 12 + 42/60, end: 13 + 40/60}); // 1pm-2pm
									}
									// Oct 29 (day 29): 11am-12pm
									else if (dayOfMonth === 29) {
										bookedSlots.push({ start: 10 + 54/60, end: 11 + 51/60 }); // 11am-12pm
									}
									// Oct 30 (day 30): 10am-11am, 1pm-2pm
									else if (dayOfMonth === 30) {
										bookedSlots.push({ start: 10, end: 10 + 54/60 }); // 10am-11am
										bookedSlots.push({ start: 12 + 42/60, end: 13 + 40/60 }); // 1pm-2pm
									}
									
									return bookedSlots.map((slot, idx) => {
										const windowStartMin = slot.start * 60;
										const windowEndMin = slot.end * 60;
										const topPct = ((windowStartMin - START_HOUR * 60) / minutesInView) * 100;
										const heightPct = ((windowEndMin - windowStartMin) / minutesInView) * 100;
										
										return (
											<div 
												key={`booked-${idx}`}
												className="absolute left-0 right-0 rounded flex items-center justify-center"
												style={{ 
													top: `${topPct}%`, 
													height: `${heightPct}%`,
													background: '#6397d5',
													opacity: 0.8
												}}
											>
												<span className="text-xs font-medium text-white">Unavailable</span>
											</div>
										);
									});
								})()}
								
								{/* Monday Oct 27 appointment - Blood Draw and Vitals at 9am */}
								{(() => {
									const dayDate = days[col];
									const dayOfMonth = dayDate.getDate();
									const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
									
									// Check if it's Monday October 27
									if (dayOfMonth === 27) {
										const startH = 8.86; // 9 AM
										const endH = 9.50; // 9:15 AM
										const windowStartMin = startH * 60;
										const windowEndMin = endH * 60;
										const topPct = ((windowStartMin - START_HOUR * 60) / minutesInView) * 100;
										const heightPct = ((windowEndMin - windowStartMin) / minutesInView) * 100;
										
										return (
											<div 
												className="absolute left-0 right-0 rounded flex items-center justify-center"
												style={{ 
													top: `${topPct}%`, 
													height: `${heightPct}%`,
													background: '#6397d5',
													opacity: 0.9,
													border: '1px solid #3b7ca8'
												}}
											>
											<div className="text-center">
												<div className="text-xs font-bold text-white">Blood Draw, Vitals</div>
												<div className="text-xs text-white opacity-90">9:00 AM - 9:30 AM</div>
											</div>
											</div>
										);
									}
									return null;
								})()}
								
								{eventsByDay[col].map((ev) => {
									const mStartAbs = ev.start.getHours() * 60 + ev.start.getMinutes();
									const mEndAbs = ev.end.getHours() * 60 + ev.end.getMinutes();
									const windowStart = START_HOUR * 60;
									const windowEnd = END_HOUR * 60;
									const clampedStart = Math.max(mStartAbs, windowStart);
									const clampedEnd = Math.min(mEndAbs, windowEnd);
									if (clampedEnd <= clampedStart) return null; // out of visible window
									const topPct = ((clampedStart - windowStart) / minutesInView) * 100;
									const heightPct = Math.max(((clampedEnd - clampedStart) / minutesInView) * 100, (15 / minutesInView) * 100);
									const isPE = ev.title === "Physical Exam";
									const bg = isPE ? '#6397d5' : '#5191c4';
									const border = isPE ? '#6397d5' : '#3b7ca8';
									return (
										<div
											key={ev.id}
											className="absolute left-2 right-2 border rounded-md text-white text-xs px-2 py-1 shadow group"
											style={{ top: `${topPct}%`, height: `${heightPct}%`, backgroundColor: bg, borderColor: border }}
											onClick={() => setPendingCancelId((prev) => (prev === ev.id ? null : ev.id))}
										>
											<div className="font-medium truncate">{ev.title}</div>
											<div className="opacity-90">
												{format(ev.start, 'h:mm a')} – {format(ev.end, 'h:mm a')}
											</div>
											{pendingCancelId === ev.id && isPE && (
												<div className="absolute top-1 right-1">
													<button
														className="text-[11px] bg-white/90 text-[#ef4444] border border-[#ef4444]/40 rounded px-2 py-[2px] hover:bg-white"
														onClick={(e) => {
															e.stopPropagation();
															// Remove appointment and return slot to dropdown
															setAppointments((prev) => prev.filter((a) => a.id !== ev.id));
															reAddSlotFromDate(ev.start);
															setPendingCancelId(null);
															toast.success('Appointment canceled');
														}}
													>
														Cancel
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			{/* Calendar View */}
			<Card className="border-[#5191c4]/20">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
								<CalendarIcon className="w-5 h-5 text-[#5191c4]" />
								My Appointment Calendar
							</CardTitle>
							<CardDescription>
								View your scheduled appointments and procedures
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
								Export ICS
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
								Add to Google
							</Button>
							<Button
								size="sm"
								onClick={() => setShowScheduleDialog(true)}
								className="bg-[#5191c4] hover:bg-[#6397d5] text-white"
							>
								<CalendarIcon className="w-4 h-4 mr-1" />
								Schedule Appointment
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="h-[600px]">
						<Toolbar date={currentDate} setDate={setCurrentDate} view={currentView} setView={setCurrentView} />
						{currentView === "month" ? (
							<div className="h-[520px] relative">
								<Calendar
									localizer={localizer}
									events={events}
									startAccessor="start"
									endAccessor="end"
									selectable={false}
									onSelectEvent={handleSelectEvent}
									eventPropGetter={eventStyleGetter}
									views={["month"]}
									view="month"
									date={currentDate}
									onNavigate={(d) => setCurrentDate(d)}
									className="trialflow-calendar"
									components={{ toolbar: () => null as any }}
								/>
							</div>
						) : currentView === "week" ? (
							<div className="h-[520px] overflow-auto">
								<TimeGrid mode="week" date={currentDate} events={events} />
							</div>
						) : (
							<div className="h-[520px] overflow-auto">
								<TimeGrid mode="day" date={currentDate} events={events} />
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Event Details Panel */}
			{selectedEvent && (
				<Card className="border-[#5191c4]/20">
					<CardHeader>
						<CardTitle className="text-lg text-gray-900">
							Appointment Details
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
											Procedures:
										</p>
										<div className="flex flex-wrap gap-2 mt-1">
											{selectedEvent.resource.procedureNames?.map((name) => (
												<Badge
													key={name}
													className="bg-[#5191c4]/10 text-[#5191c4]"
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

									<div className="flex items-center gap-2">
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

									<div className="flex items-center gap-2 pt-2">
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
											className="border-[#5191c4] text-[#5191c4] hover:bg-[#5191c4]/10"
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
											className="bg-[#5191c4] hover:bg-[#6397d5] text-white"
										>
											<Share2 className="w-4 h-4 mr-1" />
											Add to Google
										</Button>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Schedule Appointment Dialog */}
			<Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
							<CalendarIcon className="w-5 h-5 text-[#5191c4]" />
							Schedule Appointment
						</DialogTitle>
						<DialogDescription>
							Browse available time windows and schedule your appointment
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
						<div className="space-y-3">
							{mockAvailableTimeWindows.map((window) => (
								<Card
									key={window.id}
									className="border-[#5191c4]/20 hover:border-[#5191c4]/40 transition-all cursor-pointer"
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<h3 className="font-semibold text-gray-900 mb-1">
													{window.procedureNames.join(", ")}
												</h3>
												<div className="text-sm text-gray-600 mb-2">
													<p>Oct 28-30, 2025</p>
													<p>10:00 AM - 2:00 PM</p>
													{(window as any).durationMinutes && (
														<p className="text-xs text-gray-500">
															Duration: {(window as any).durationMinutes} minutes
														</p>
													)}
												</div>
												<Badge className="bg-[#5191c4]/10 text-[#5191c4] hover:bg-[#5191c4]/20">
													{window.availableSlots} slots available
												</Badge>
											</div>

											<div className="flex items-center gap-3">
												<Button
													type="button"
													className="bg-[#5191c4] hover:bg-[#6397d5] text-white"
													onClick={() => setActiveWindowId(window.id)}
												>
													<CalendarIcon className="w-4 h-4 mr-2" />
													Book Now
												</Button>
												{activeWindowId === window.id && (
													<div className="w-56">
														<Select
															onValueChange={(val) => {
																const [y, m, d, hh] = val.split("-").map((n) => parseInt(n, 10));
																const local = new Date(y, (m || 1) - 1, d || 1, hh || 10, 0, 0, 0);
																setSlotOptions((prev) => prev.filter((v) => v !== val));
																handleBookSlot(local);
																setShowScheduleDialog(false);
															}}
														>
															<SelectTrigger className="w-full border-[#5191c4]/30">
																<SelectValue placeholder="Choose a time" />
															</SelectTrigger>
															<SelectContent>
																{slotOptions.map((val) => {
																	const [y, m, d, hh] = val.split("-").map((n) => parseInt(n, 10));
																	const dt = new Date(y, (m || 1) - 1, d || 1, hh || 10, 0, 0, 0);
																	const datePart = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
																	const timePart = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
																	const label = `${datePart} • ${timePart}`;
																	return (
																		<SelectItem key={val} value={val}>{label}</SelectItem>
																	);
																})}
															</SelectContent>
														</Select>
													</div>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="flex items-center justify-end gap-2 pt-4">
							<Button
								variant="outline"
								onClick={() => setShowScheduleDialog(false)}
							>
								Close
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
