import { useMCPClient } from "@/hooks/use-mcp-client";
import { useQuery } from "@tanstack/react-query";

// MCP Configuration
const GOOGLE_CALENDAR_MCP_ID = "6874a16d565d2b53f95cd043";
const GOOGLE_CALENDAR_SERVER_URL =
	"https://mcp.composio.dev/composio/server/a123b074-4724-4fa8-89c2-a7746b7f8828/mcp?user_id=68fd5421128d32154869dba0";
const TOOL_NAME = "GOOGLECALENDAR_SYNC_EVENTS";

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
 * Input parameters for syncing Google Calendar events
 */
export interface GoogleCalendarSyncEventsInput {
	/** Google Calendar identifier; 'primary' refers to the authenticated user's main calendar */
	calendar_id?: string;
	/** Token for incremental sync, retrieving only changes since issued */
	sync_token?: string;
	/** Token for paginating results, from a previous response's nextPageToken */
	pageToken?: string;
	/** Max events per page (max 2500); Google Calendar's default is used if unspecified */
	max_results?: number;
	/** Filters events by specified types (e.g., 'default', 'focusTime', 'outOfOffice', 'workingLocation') */
	event_types?: string[];
	/** If True, expands recurring events into individual instances */
	single_events?: boolean;
}

/**
 * Calendar event data structure
 */
export interface CalendarEvent {
	/** Unique identifier of the event */
	id?: string;
	/** Title of the event */
	summary?: string;
	/** Description of the event */
	description?: string;
	/** Event start time details */
	start?: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	/** Event end time details */
	end?: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	/** Event status: 'confirmed', 'tentative', or 'cancelled' */
	status?: string;
	/** Geographic location of the event */
	location?: string;
	/** URL to access the event in Google Calendar web interface */
	htmlLink?: string;
	/** List of attendees */
	attendees?: Array<{
		email?: string;
		displayName?: string;
		responseStatus?: string;
	}>;
	/** Event organizer */
	organizer?: {
		email?: string;
		displayName?: string;
		self?: boolean;
	};
	/** Event creation time (RFC3339 timestamp) */
	created?: string;
	/** Event last modification time (RFC3339 timestamp) */
	updated?: string;
	/** Recurring event ID if this is an instance */
	recurringEventId?: string;
	/** Original start time for recurring event instances */
	originalStartTime?: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	[key: string]: unknown;
}

/**
 * Output data structure from syncing Google Calendar events
 */
export interface GoogleCalendarSyncEventsOutput {
	data: {
		event_data: {
			/** List of changed event resources */
			items?: CalendarEvent[];
			/** Token for the next page of results (for pagination) */
			nextPageToken?: string;
			/** Token for next incremental sync */
			nextSyncToken?: string;
			/** Title of the calendar */
			summary?: string;
			/** The time zone of the calendar */
			timeZone?: string;
			/** User's access role for this calendar */
			accessRole?: string;
			/** Default reminders on the calendar */
			defaultReminders?: Array<{
				method?: string;
				minutes?: number;
			}>;
			[key: string]: unknown;
		};
	};
	error: string | null;
	successful: boolean;
}

/**
 * React hook for syncing Google Calendar events
 *
 * Retrieves events from Google Calendar with support for incremental sync
 * to detect external changes. Use sync_token for efficient incremental updates
 * that only fetch events that have changed since the last sync.
 *
 * Features:
 * - Initial full sync without sync_token
 * - Incremental sync with sync_token to get only changes
 * - Pagination support with pageToken
 * - Event type filtering
 * - Recurring event expansion
 *
 * Note: A 410 GONE response indicates an expired sync_token, requiring a full sync.
 *
 * @param params - Sync parameters including calendar_id and optional sync_token
 * @param enabled - Whether the query should run automatically
 *
 * @example
 * ```tsx
 * // Initial full sync
 * const { data: initialSync } = useGoogleCalendarSyncEvents({
 *   calendar_id: 'primary',
 *   max_results: 100
 * });
 *
 * // Incremental sync using token from previous sync
 * const syncToken = initialSync?.data.event_data.nextSyncToken;
 * const { data: incrementalSync } = useGoogleCalendarSyncEvents({
 *   calendar_id: 'primary',
 *   sync_token: syncToken
 * }, !!syncToken);
 * ```
 */
export function useGoogleCalendarSyncEvents(
	params?: GoogleCalendarSyncEventsInput,
	enabled = true,
) {
	const { callTool } = useMCPClient();

	return useQuery({
		queryKey: ["google-calendar-sync-events", params],
		queryFn: async () => {
			// Default calendar_id to 'primary' if not provided
			const queryParams = {
				calendar_id: "primary",
				...params,
			};

			// CRITICAL: Use MCPToolResponse and parse JSON response
			const mcpResponse = await callTool<
				MCPToolResponse,
				GoogleCalendarSyncEventsInput
			>(
				GOOGLE_CALENDAR_SERVER_URL,
				GOOGLE_CALENDAR_MCP_ID,
				TOOL_NAME,
				queryParams,
			);

			if (!mcpResponse.content?.[0]?.text) {
				throw new Error("Invalid MCP response format: missing content[0].text");
			}

			try {
				const toolData: GoogleCalendarSyncEventsOutput = JSON.parse(
					mcpResponse.content[0].text,
				);

				if (!toolData.successful) {
					throw new Error(toolData.error || "Failed to sync calendar events");
				}

				return toolData;
			} catch (parseError) {
				throw new Error(
					`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
		enabled: enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
