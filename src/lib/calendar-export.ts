// Calendar Export Utilities
// Generate ICS files and Google Calendar links for appointments

import type { AppointmentWithDetails } from "./types";

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ format in UTC)
 */
function formatICSDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Generate ICS file content for a single appointment
 */
export function generateICSFile(appointment: AppointmentWithDetails): string {
	const start = new Date(appointment.scheduled_date);
	const end = new Date(
		start.getTime() + (appointment.duration_minutes || 60) * 60000,
	);

	const procedureNames =
		appointment.procedures?.map((p) => p.name).join(", ") || "Procedure";
	const title = `Clinical Trial: ${procedureNames}`;
	const location = escapeICSText(appointment.location || "");
	const description = escapeICSText(
		appointment.notes ||
			`Scheduled appointment for ${procedureNames}.\n\nDuration: ${appointment.duration_minutes || 60} minutes`,
	);

	// Generate unique UID for this event
	const uid = `appointment-${appointment.id}@trialflow.app`;

	// Current timestamp for DTSTAMP
	const now = formatICSDate(new Date());

	const icsContent = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//TrialFlow//Clinical Trial Scheduler//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		`DTSTART:${formatICSDate(start)}`,
		`DTEND:${formatICSDate(end)}`,
		`SUMMARY:${escapeICSText(title)}`,
		`DESCRIPTION:${description}`,
		location ? `LOCATION:${location}` : "",
		"STATUS:CONFIRMED",
		"SEQUENCE:0",
		// Add reminder 24 hours before
		"BEGIN:VALARM",
		"TRIGGER:-PT24H",
		"ACTION:DISPLAY",
		"DESCRIPTION:Reminder: Clinical trial appointment tomorrow",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
	]
		.filter(Boolean)
		.join("\r\n");

	return icsContent;
}

/**
 * Generate ICS file for multiple appointments
 */
export function generateMultipleICSFile(
	appointments: AppointmentWithDetails[],
): string {
	const now = formatICSDate(new Date());

	const events = appointments.map((appointment) => {
		const start = new Date(appointment.scheduled_date);
		const end = new Date(
			start.getTime() + (appointment.duration_minutes || 60) * 60000,
		);

		const procedureNames =
			appointment.procedures?.map((p) => p.name).join(", ") || "Procedure";
		const title = `Clinical Trial: ${procedureNames}`;
		const location = escapeICSText(appointment.location || "");
		const description = escapeICSText(
			appointment.notes ||
				`Scheduled appointment for ${procedureNames}.\n\nDuration: ${appointment.duration_minutes || 60} minutes`,
		);

		const uid = `appointment-${appointment.id}@trialflow.app`;

		return [
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`DTSTAMP:${now}`,
			`DTSTART:${formatICSDate(start)}`,
			`DTEND:${formatICSDate(end)}`,
			`SUMMARY:${escapeICSText(title)}`,
			`DESCRIPTION:${description}`,
			location ? `LOCATION:${location}` : "",
			"STATUS:CONFIRMED",
			"SEQUENCE:0",
			"BEGIN:VALARM",
			"TRIGGER:-PT24H",
			"ACTION:DISPLAY",
			"DESCRIPTION:Reminder: Clinical trial appointment tomorrow",
			"END:VALARM",
			"END:VEVENT",
		]
			.filter(Boolean)
			.join("\r\n");
	});

	const icsContent = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//TrialFlow//Clinical Trial Scheduler//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		...events,
		"END:VCALENDAR",
	].join("\r\n");

	return icsContent;
}

/**
 * Download ICS file for a single appointment
 */
export function downloadICSFile(
	appointment: AppointmentWithDetails,
	filename?: string,
): void {
	const icsContent = generateICSFile(appointment);
	const blob = new Blob([icsContent], {
		type: "text/calendar;charset=utf-8",
	});

	const procedureNames =
		appointment.procedures?.map((p) => p.name).join("-") || "appointment";
	const defaultFilename = `trialflow-${procedureNames.toLowerCase().replace(/\s+/g, "-")}.ics`;

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename || defaultFilename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Download ICS file for multiple appointments
 */
export function downloadMultipleICSFile(
	appointments: AppointmentWithDetails[],
	filename = "trialflow-appointments.ics",
): void {
	const icsContent = generateMultipleICSFile(appointments);
	const blob = new Blob([icsContent], {
		type: "text/calendar;charset=utf-8",
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for a single appointment
 */
export function generateGoogleCalendarURL(
	appointment: AppointmentWithDetails,
): string {
	const start = new Date(appointment.scheduled_date);
	const end = new Date(
		start.getTime() + (appointment.duration_minutes || 60) * 60000,
	);

	const procedureNames =
		appointment.procedures?.map((p) => p.name).join(", ") || "Procedure";
	const title = `Clinical Trial: ${procedureNames}`;
	const description =
		appointment.notes ||
		`Scheduled appointment for ${procedureNames}.\n\nDuration: ${appointment.duration_minutes || 60} minutes`;
	const location = appointment.location || "";

	// Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
	const startFormatted = formatICSDate(start);
	const endFormatted = formatICSDate(end);

	// Build Google Calendar URL
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title,
		dates: `${startFormatted}/${endFormatted}`,
		details: description,
		location: location,
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open Google Calendar link in new tab
 */
export function addToGoogleCalendar(appointment: AppointmentWithDetails): void {
	const url = generateGoogleCalendarURL(appointment);
	window.open(url, "_blank", "noopener,noreferrer");
}
