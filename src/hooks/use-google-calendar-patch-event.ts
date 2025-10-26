import { useMCPClient } from "@/hooks/use-mcp-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// MCP Configuration
const GOOGLE_CALENDAR_MCP_ID = "6874a16d565d2b53f95cd043";
const GOOGLE_CALENDAR_SERVER_URL =
	"https://mcp.composio.dev/composio/server/a123b074-4724-4fa8-89c2-a7746b7f8828/mcp?user_id=68fd5421128d32154869dba0";
const TOOL_NAME = "GOOGLECALENDAR_PATCH_EVENT";

/**
 * MCP Response wrapper interface - MANDATORY
 * All MCP tools return data wrapped in content[0].text as JSON string
 */
export interface MCPToolResponse {
	content: Array<{
		type: "text";
		text: string;
	}>;
}

/**
 * Input parameters for patching a Google Calendar event
 */
export interface GoogleCalendarPatchEventInput {
	/** Identifier of the calendar. Use 'primary' for the primary calendar of the logged-in user. */
	calendar_id: string;
	/** Identifier of the event to update */
	event_id: string;
	/** New title for the event */
	summary?: string;
	/** New description for the event; can include HTML */
	description?: string;
	/** New start time (RFC3339 timestamp, e.g., '2024-07-01T10:00:00-07:00') */
	start_time?: string;
	/** New end time (RFC3339 timestamp, e.g., '2024-07-01T11:00:00-07:00') */
	end_time?: string;
	/** List of email addresses for attendees. Replaces existing attendees. Provide an empty list to remove all. */
	attendees?: string[];
	/** New geographic location (physical address or virtual meeting link) */
	location?: string;
	/** IANA Time Zone Database name for start/end times (e.g., 'America/Los_Angeles') */
	timezone?: string;
	/** Whether to send update notifications to attendees: 'all', 'externalOnly', or 'none' */
	send_updates?: "all" | "externalOnly" | "none";
	/** RSVP response status for the authenticated user: 'needsAction', 'declined', 'tentative', 'accepted' */
	rsvp_response?: "needsAction" | "declined" | "tentative" | "accepted";
	/** Maximum attendees in response; does not affect invited count */
	max_attendees?: number;
	/** Client application supports event attachments */
	supports_attachments?: boolean;
	/** API client's conference data support version. Set to 1 to manage conference details */
	conference_data_version?: 0 | 1;
}

/**
 * Output data structure from patching a Google Calendar event
 */
export interface GoogleCalendarPatchEventOutput {
	data: {
		/** Unique identifier of the event */
		id: string;
		/** Event status: 'confirmed', 'tentative', or 'cancelled' */
		status: string;
		/** URL to access the event in Google Calendar web interface */
		htmlLink: string;
		/** Event creation time (RFC3339 timestamp, e.g., '2024-07-01T09:00:00.000Z') */
		created: string;
		/** Event last modification time (RFC3339 timestamp, e.g., '2024-07-01T09:30:00.000Z') */
		updated: string;
		/** User who created the event, including 'email' and 'displayName' */
		creator: {
			email?: string;
			displayName?: string;
			[key: string]: unknown;
		};
		/** Event organizer, including 'email', 'displayName', and 'self' */
		organizer: {
			email?: string;
			displayName?: string;
			self?: boolean;
			[key: string]: unknown;
		};
		/** Event start time: 'dateTime' (RFC3339) or 'date' (YYYY-MM-DD), and 'timeZone' */
		start: {
			dateTime?: string;
			date?: string;
			timeZone?: string;
			[key: string]: unknown;
		};
		/** Event end time: 'dateTime' (RFC3339) or 'date' (YYYY-MM-DD, exclusive), and 'timeZone' */
		end: {
			dateTime?: string;
			date?: string;
			timeZone?: string;
			[key: string]: unknown;
		};
		/** Title of the event */
		summary?: string;
		/** Description of the event; may contain HTML */
		description?: string;
		/** Geographic location of the event */
		location?: string;
		/** List of attendees, with details like 'email', 'displayName', 'responseStatus' */
		attendees?: Array<{
			email?: string;
			displayName?: string;
			responseStatus?: string;
			[key: string]: unknown;
		}>;
	};
	error: string | null;
	successful: boolean;
}

/**
 * React hook for patching Google Calendar events
 *
 * Updates existing calendar events (reschedule, modify details, update attendees, cancel).
 * Uses PATCH method to update only specified fields, leaving other fields unchanged.
 *
 * Supports:
 * - Rescheduling events with new start/end times
 * - Updating event details (summary, description, location)
 * - Managing attendees (add/remove/replace)
 * - Changing RSVP status
 * - Sending notifications to attendees
 *
 * @example
 * ```tsx
 * const patchEvent = useGoogleCalendarPatchEvent();
 *
 * // Reschedule an event
 * patchEvent.mutate({
 *   calendar_id: 'primary',
 *   event_id: 'abc123xyz',
 *   start_time: '2025-01-21T15:00:00-05:00',
 *   end_time: '2025-01-21T16:00:00-05:00',
 *   send_updates: 'all'
 * });
 *
 * // Update RSVP status
 * patchEvent.mutate({
 *   calendar_id: 'primary',
 *   event_id: 'abc123xyz',
 *   rsvp_response: 'accepted'
 * });
 * ```
 */
export function useGoogleCalendarPatchEvent() {
	const { callTool } = useMCPClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: GoogleCalendarPatchEventInput) => {
			if (!params.calendar_id || !params.event_id) {
				throw new Error(
					"calendar_id and event_id are required for patching a calendar event",
				);
			}

			// CRITICAL: Use MCPToolResponse and parse JSON response
			const mcpResponse = await callTool<
				MCPToolResponse,
				GoogleCalendarPatchEventInput
			>(GOOGLE_CALENDAR_SERVER_URL, GOOGLE_CALENDAR_MCP_ID, TOOL_NAME, params);

			if (!mcpResponse.content?.[0]?.text) {
				throw new Error("Invalid MCP response format: missing content[0].text");
			}

			try {
				const toolData: GoogleCalendarPatchEventOutput = JSON.parse(
					mcpResponse.content[0].text,
				);

				if (!toolData.successful) {
					throw new Error(toolData.error || "Failed to patch calendar event");
				}

				return toolData;
			} catch (parseError) {
				throw new Error(
					`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
		onSuccess: () => {
			// Invalidate related queries to refresh calendar data
			queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
			queryClient.invalidateQueries({
				queryKey: ["google-calendar-sync-events"],
			});
		},
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
