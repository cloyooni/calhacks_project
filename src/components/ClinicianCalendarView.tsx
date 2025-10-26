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
} from "@/lib/types";
import { addDays, format, getDay, parse, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlotInfo, View } from "react-big-calendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from "date-fns/locale";
import { CreateTimeWindowDialog } from "./CreateTimeWindowDialog";
import "@/styles/calendar.css";
import { toast } from "sonner";

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
	// Track last time selection to apply to horizontal all-day range selections
	const [lastTimeRange, setLastTimeRange] = useState<{ start: Date; end: Date } | null>(null);
	// Persist created time window highlights as calendar events
	const [createdTimeWindows, setCreatedTimeWindows] = useState<CalendarEvent[]>([]);

	// Control date and view so toolbar navigation and view buttons work consistently
	const [currentDate, setCurrentDate] = useState(new Date());
	const [currentView, setCurrentView] = useState<View>("week");

	// Week-only: custom rectangular drag state (disabled for read-only calendar)
	const calendarWrapperRef = useRef<HTMLDivElement | null>(null);
	const [dragging, setDragging] = useState(false);
	const [dragStartPt, setDragStartPt] = useState<{ x: number; y: number } | null>(null);
	const [dragCurrPt, setDragCurrPt] = useState<{ x: number; y: number } | null>(null);
	const enableDrag = false;

	// Convert appointments to calendar events and combine with created time windows
	const appointmentEvents = useMemo(
		() => mockAppointments.map((apt) => appointmentToCalendarEvent(apt)),
		[],
	);
	const events = useMemo(
		() => [...appointmentEvents, ...createdTimeWindows],
		[appointmentEvents, createdTimeWindows],
	);

	// Selection disabled (read-only calendar)
	const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
		// Block selection if it overlaps a created time window
		const s = slotInfo.start instanceof Date ? slotInfo.start : new Date(slotInfo.start);
		const e = slotInfo.end instanceof Date ? slotInfo.end : new Date(slotInfo.end);
		const overlapsExisting = events.some((ev) => {
			return e > ev.start && s < ev.end;
		});
		if (overlapsExisting) {
			return;
		}
	}, [events]);

	// Map function used for drag overlay (disabled)
	const mapPointToDate = useCallback(
		(pt: { x: number; y: number }) => {
			const root = calendarWrapperRef.current?.querySelector(
				".trialflow-calendar .rbc-time-content",
			) as HTMLElement | null;
			if (!root) return null;
			// Identify day columns and choose nearest column center
			const columns = Array.from(root.querySelectorAll(".rbc-day-slot")) as HTMLElement[];
			if (columns.length === 0) return null;
			let dayIdx = 0;
			let bestDist = Number.POSITIVE_INFINITY;
			for (let i = 0; i < columns.length; i++) {
				const cRect = columns[i].getBoundingClientRect();
				const cx = (cRect.left + cRect.right) / 2;
				const d = Math.abs(pt.x - cx);
				if (d < bestDist) {
					bestDist = d;
					dayIdx = i;
				}
			}
			// Compute y within the selected column
			const colRect = columns[dayIdx].getBoundingClientRect();
			const yRelCol = Math.min(Math.max(pt.y - colRect.top, 0), colRect.height);
			// Snap minutes to 15-min increments
			const minutesPerDay = 24 * 60;
			const fraction = colRect.height > 0 ? yRelCol / colRect.height : 0;
			let minutes = Math.round((fraction * minutesPerDay) / 15) * 15;
			minutes = Math.min(Math.max(minutes, 0), 24 * 60);
			const base = new Date(currentDate);
			const weekStart = startOfWeek(base, { locale: enUS, weekStartsOn: 0 });
			const date = addDays(weekStart, dayIdx);
			date.setHours(0, 0, 0, 0);
			date.setMinutes(minutes);
			return date;
		},
		[currentDate],
	);

	// Attach week-only mouse listeners for rectangular drag in time grid (disabled)
	useEffect(() => {
		if (!enableDrag || currentView !== "week") return;
		const root = calendarWrapperRef.current?.querySelector(
			".trialflow-calendar .rbc-time-content",
		) as HTMLElement | null;
		if (!root) return;

		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return;
			// Ignore clicks outside the time grid area
			const rect = root.getBoundingClientRect();
			if (e.clientY < rect.top || e.clientY > rect.bottom) return;
			setDragging(true);
			setDragStartPt({ x: e.clientX, y: e.clientY });
			setDragCurrPt({ x: e.clientX, y: e.clientY });
			// Prevent text selection during drag
			e.preventDefault();
		};
		const onMouseMove = (e: MouseEvent) => {
			if (!dragging) return;
			setDragCurrPt({ x: e.clientX, y: e.clientY });
			e.preventDefault();
		};
		const onMouseUp = () => {
			if (!dragging || !dragStartPt || !dragCurrPt) {
				setDragging(false);
				setDragStartPt(null);
				setDragCurrPt(null);
				return;
			}
			const a = mapPointToDate(dragStartPt);
			const b = mapPointToDate(dragCurrPt);
			setDragging(false);
			setDragStartPt(null);
			setDragCurrPt(null);
			if (!a || !b) return;
			const start = a < b ? a : b;
			const end = a < b ? b : a;
			if (end.getTime() === start.getTime()) end.setMinutes(end.getMinutes() + 15);
			// Build slots as midnight boundaries per day in range
			const slots: Date[] = [];
			const d0 = new Date(start);
			d0.setHours(0, 0, 0, 0);
			const d1 = new Date(end);
			d1.setHours(0, 0, 0, 0);
			for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
				slots.push(new Date(d));
			}
			const slotInfo: SlotInfo = { start, end, action: "select", slots };
			setLastTimeRange({ start, end });
			setSelectedSlot(slotInfo);
			setShowCreateWindow(true);
		};

		root.addEventListener("mousedown", onMouseDown);
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			root.removeEventListener("mousedown", onMouseDown);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [enableDrag, currentView, dragging, dragStartPt, dragCurrPt, mapPointToDate]);

	// Helper to access day columns for overlay rendering
	const getDayColumns = useCallback(() => {
		const root = calendarWrapperRef.current?.querySelector(
			".trialflow-calendar .rbc-time-content",
		) as HTMLElement | null;
		if (!root) return [] as HTMLElement[];
		return Array.from(root.querySelectorAll(".rbc-day-slot")) as HTMLElement[];
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
                            <div className="relative" style={{ height: `${hours.length * 48}px` }}>
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
                                    const isTimeWindow = ev.resource?.type === "time_window";
                                    const bg = isTimeWindow ? "bg-green-500" : "bg-blue-600";
                                    const border = isTimeWindow ? "border-green-600" : "border-blue-700";
                                    return (
                                        <div key={ev.id} className={`absolute left-2 right-2 ${bg} ${border} border rounded-md text-white text-xs px-2 py-1 shadow`}
                                            style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                                        >
                                            <div className="font-medium truncate">{ev.title}</div>
                                            <div className="opacity-90">
                                                {format(ev.start, 'h:mm a')} – {format(ev.end, 'h:mm a')}
                                            </div>
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

	// After dialog creates a time window, persist the selection as highlighted events (per-day when multi-day)
	const handleTimeWindowCreated = useCallback((payload: { start: Date; end: Date; slots?: Date[] }) => {
		const selectedStart = payload.start;
		const selectedEnd = payload.end;
		const baseId = `tw-${Date.now()}`;
		const slotDays = (payload.slots || []).map((d) => new Date(d));
		let newEvents: CalendarEvent[] = [];

		if (slotDays.length > 1) {
			const startH = selectedStart.getHours();
			const startM = selectedStart.getMinutes();
			const endH = selectedEnd.getHours();
			const endM = selectedEnd.getMinutes();
			newEvents = slotDays.map((day, idx) => {
				const y = day.getFullYear();
				const m = day.getMonth();
				const d = day.getDate();
				const start = new Date(y, m, d, startH, startM, 0, 0);
				const end = new Date(y, m, d, endH, endM, 0, 0);
				if (end.getTime() <= start.getTime()) end.setMinutes(start.getMinutes() + 15);
				const id = `${baseId}-${idx}`;
				const startTime = format(start, 'h:mm a');
				const endTime = format(end, 'h:mm a');
				return {
					id,
					title: `${startTime} - ${endTime}`,
					start,
					end,
					allDay: false,
					resource: {
						type: "time_window" as const,
						data: {
							id,
							start_date: start.toISOString(),
							end_date: end.toISOString(),
							status: TimeWindowStatus.Open,
						} as any,
						status: TimeWindowStatus.Open,
					},
				};
			});
		} else {
			const id = baseId;
			const sy = selectedStart.getFullYear();
			const sm = selectedStart.getMonth();
			const sd = selectedStart.getDate();
			const ey = selectedEnd.getFullYear();
			const em = selectedEnd.getMonth();
			const ed = selectedEnd.getDate();
			const start = new Date(sy, sm, sd, selectedStart.getHours(), selectedStart.getMinutes(), 0, 0);
			const end = new Date(ey, em, ed, selectedEnd.getHours(), selectedEnd.getMinutes(), 0, 0);
			if (end.getTime() <= start.getTime()) end.setMinutes(start.getMinutes() + 15);
			const startTime = format(start, 'h:mm a');
			const endTime = format(end, 'h:mm a');
			newEvents = [{
				id,
				title: `${startTime} - ${endTime}`,
				start,
				end,
				allDay: false,
				resource: {
					type: "time_window" as const,
					data: {
						id,
						start_date: start.toISOString(),
						end_date: end.toISOString(),
						status: TimeWindowStatus.Open,
					} as any,
					status: TimeWindowStatus.Open,
				},
			}];
		}

		setCreatedTimeWindows((prev) => [...prev, ...newEvents]);
	}, []);

	// Handle selecting an existing event
	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		setSelectedEvent(event);
	}, []);

	// Custom event style based on type and status
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		const isTimeWindow = event.resource?.type === "time_window";
		const status = event.resource?.status;

		let backgroundColor = "#5191c4";
		let borderColor = "#3b7ca8";

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
			backgroundColor = "#5191c4";
			borderColor = "#3b7ca8";
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
			<Card className="border-[#5191c4]/20">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
								<CalendarIcon className="w-5 h-5 text-[#5191c4]" />
								Appointment Calendar
							</CardTitle>
							<CardDescription>
								View upcoming appointments and time windows
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<button
								className="bg-[#5191c4] text-white rounded-md px-4 py-2"
								onClick={() => setShowCreateWindow(true)}
							>
								Create Time Window
							</button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="h-[600px]" ref={calendarWrapperRef}>
                        <Toolbar date={currentDate} setDate={setCurrentDate} view={currentView} setView={setCurrentView} />
                        {currentView === "month" ? (
                            <div className="h-[520px] relative">
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    selectable={false}
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
				selectedSlot={selectedSlot}
				onCreated={(ranges) => {
					const baseId = `tw-${Date.now()}`;
					const existingWindows = createdTimeWindows.filter((e) => e.resource?.type === "time_window");
					const overlaps = ranges.filter((r) => existingWindows.some((ev) => r.end > ev.start && r.start < ev.end));
					const allowed = ranges.filter((r) => !existingWindows.some((ev) => r.end > ev.start && r.start < ev.end));
					const newEvents: CalendarEvent[] = allowed.map((r, idx): CalendarEvent => {
						const startTime = format(r.start, 'h:mm a');
						const endTime = format(r.end, 'h:mm a');
						const event: CalendarEvent = {
							id: `${baseId}-${idx}`,
							title: `${startTime} - ${endTime}`,
							start: r.start,
							end: r.end,
							allDay: false,
							resource: {
								type: "time_window" as const,
								data: {
									id: `${baseId}-${idx}`,
									start_date: r.start.toISOString(),
									end_date: r.end.toISOString(),
									status: TimeWindowStatus.Open,
								} as any,
								status: TimeWindowStatus.Open,
							},
						};
						console.log(`Created event ${idx}:`, {
							id: event.id,
							start: event.start.toISOString(),
							end: event.end.toISOString(),
							allDay: event.allDay,
						});
						return event;
					});
					setCreatedTimeWindows((prev) => [...prev, ...newEvents]);
					if (overlaps.length > 0) {
						toast.warning(`${overlaps.length} selection${overlaps.length > 1 ? "s were" : " was"} skipped due to overlap with existing windows.`);
					}
				}}
			/>
		</div>
	);
}
