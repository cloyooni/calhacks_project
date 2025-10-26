// TrialFlow Type Definitions
// This file provides additional type definitions and helpers for the TrialFlow application

import {
	type AppointmentModel,
	AppointmentStatus,
} from "@/components/data/orm/orm_appointment";
import {
	type PatientModel,
	PatientTrialPhase,
} from "@/components/data/orm/orm_patient";
import type { ProcedureModel } from "@/components/data/orm/orm_procedure";
import {
	type TimeWindowModel,
	TimeWindowStatus,
} from "@/components/data/orm/orm_time_window";

// Re-export ORM types for convenience
export type Patient = PatientModel;
export type Appointment = AppointmentModel;
export type TimeWindow = TimeWindowModel;
export type Procedure = ProcedureModel;

export { PatientTrialPhase, AppointmentStatus, TimeWindowStatus };

// Time block structure for availability
export interface TimeBlock {
	dayOfWeek: string; // 'Monday', 'Tuesday', etc.
	startTime: string; // '09:00'
	endTime: string; // '17:00'
}

// Reminder tracking
export interface ReminderStatus {
	sent48h: boolean;
	sent24h: boolean;
}

// Extended types with computed fields
export interface PatientWithStats extends Patient {
	upcomingAppointmentsCount: number;
	completedProceduresCount: number;
	totalProceduresCount: number;
}

export interface AppointmentWithDetails extends Appointment {
	patient?: Patient;
	procedures?: Procedure[];
	timeWindow?: TimeWindow;
}

// User role for conditional UI rendering
export type UserRole = "clinician" | "patient";

// Scheduling conflict types
export interface SchedulingConflict {
	type: "overlap" | "recovery_time" | "duration";
	appointmentIds: string[];
	message: string;
	suggestedResolution?: string;
}

// AI recommendation types
export interface AISchedulingRecommendation {
	type: "bundle_procedures" | "optimize_window" | "resolve_conflict";
	title: string;
	description: string;
	suggestedActions: string[];
	confidence: number; // 0-1
}

// Form data types for creating/editing
export interface CreateTimeWindowInput {
	patientId: string;
	procedureIds: string[];
	startDate: Date;
	endDate: Date;
	timeBlocks: TimeBlock[];
}

export interface CreateAppointmentInput {
	timeWindowId: string;
	patientId: string;
	procedureIds: string[];
	scheduledDate: Date;
	location?: string;
	notes?: string;
}

// Helper functions
export function getTrialPhaseLabel(phase: PatientTrialPhase): string {
	switch (phase) {
		case PatientTrialPhase.Phase1:
			return "Phase 1";
		case PatientTrialPhase.Phase2:
			return "Phase 2";
		case PatientTrialPhase.Phase3:
			return "Phase 3";
		case PatientTrialPhase.Phase4:
			return "Phase 4";
		default:
			return "Unspecified";
	}
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
	switch (status) {
		case AppointmentStatus.Scheduled:
			return "Scheduled";
		case AppointmentStatus.Completed:
			return "Completed";
		case AppointmentStatus.Cancelled:
			return "Cancelled";
		case AppointmentStatus.NoShow:
			return "No Show";
		default:
			return "Unspecified";
	}
}

export function getTimeWindowStatusLabel(status: TimeWindowStatus): string {
	switch (status) {
		case TimeWindowStatus.Open:
			return "Open";
		case TimeWindowStatus.PartiallyBooked:
			return "Partially Booked";
		case TimeWindowStatus.FullyBooked:
			return "Fully Booked";
		case TimeWindowStatus.Closed:
			return "Closed";
		default:
			return "Unspecified";
	}
}

export function getAppointmentStatusColor(status: AppointmentStatus): string {
	switch (status) {
		case AppointmentStatus.Scheduled:
			return "text-blue-600 bg-blue-50";
		case AppointmentStatus.Completed:
			return "text-green-600 bg-green-50";
		case AppointmentStatus.Cancelled:
			return "text-gray-600 bg-gray-50";
		case AppointmentStatus.NoShow:
			return "text-red-600 bg-red-50";
		default:
			return "text-gray-600 bg-gray-50";
	}
}

// Date formatting helpers
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function formatDateTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export function formatTimeOnly(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

// Calendar event types for react-big-calendar integration
export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	resource?: {
		type: "appointment" | "time_window";
		data: Appointment | TimeWindow;
		patientName?: string;
		procedureNames?: string[];
		status?: AppointmentStatus | TimeWindowStatus;
	};
}

// Helper to convert appointment to calendar event
export function appointmentToCalendarEvent(
	appointment: AppointmentWithDetails,
): CalendarEvent {
	const start = new Date(appointment.scheduled_date);
	const end = new Date(
		start.getTime() + (appointment.duration_minutes || 60) * 60000,
	);

	const patientName = appointment.patient
		? `${appointment.patient.first_name} ${appointment.patient.last_name}`
		: "Patient";

	const procedureNames =
		appointment.procedures?.map((p) => p.name).join(", ") || "Procedure";

	return {
		id: appointment.id,
		title: `${patientName} - ${procedureNames}`,
		start,
		end,
		allDay: false,
		resource: {
			type: "appointment",
			data: appointment,
			patientName,
			procedureNames: appointment.procedures?.map((p) => p.name),
			status: appointment.status,
		},
	};
}

// Helper to convert time window to calendar event
export function timeWindowToCalendarEvent(
	timeWindow: TimeWindow,
	patientName?: string,
): CalendarEvent {
	const start = new Date(timeWindow.start_date);
	const end = new Date(timeWindow.end_date);

	return {
		id: timeWindow.id,
		title: `Time Window: ${patientName || "Patient"}`,
		start,
		end,
		allDay: false,
		resource: {
			type: "time_window",
			data: timeWindow,
			patientName,
			status: timeWindow.status,
		},
	};
}
