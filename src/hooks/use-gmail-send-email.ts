import { useMCPClient } from "@/hooks/use-mcp-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// MCP Configuration
const GMAIL_MCP_ID = "686de5276fd1cae1afbb55be";
const GMAIL_SERVER_URL =
	"https://mcp.composio.dev/composio/server/64ddd793-75d0-4c3d-8abf-56c7554f19be/mcp?user_id=68fd5421128d32154869dba0";
const TOOL_NAME = "GMAIL_SEND_EMAIL";

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
 * Input parameters for sending a Gmail email
 */
export interface GmailSendEmailInput {
	/** Primary recipient's email address */
	recipient_email: string;
	/** Email content (plain text or HTML); if HTML, is_html must be True */
	body: string;
	/** Subject line of the email */
	subject?: string;
	/** Set to True if the email body contains HTML tags */
	is_html?: boolean;
	/** Additional 'To' recipients' email addresses (not Cc or Bcc) */
	extra_recipients?: string[];
	/** Carbon Copy (CC) recipients' email addresses */
	cc?: string[];
	/** Blind Carbon Copy (BCC) recipients' email addresses */
	bcc?: string[];
	/** File to attach; ensure s3key, mimetype, and name are set if provided */
	attachment?: string;
	/** User's email address; the literal 'me' refers to the authenticated user */
	user_id?: string;
}

/**
 * Output data structure from sending a Gmail email
 */
export interface GmailSendEmailOutput {
	data: {
		response_data: {
			/** Immutable ID of the sent message */
			id?: string;
			/** Thread ID the message belongs to */
			threadId?: string;
			/** List of label IDs applied to this message */
			labelIds?: string[];
			[key: string]: unknown;
		};
	};
	error: string | null;
	successful: boolean;
}

/**
 * React hook for sending Gmail emails
 *
 * Sends automated emails through Gmail API with support for:
 * - Plain text and HTML email bodies
 * - Multiple recipients (To, Cc, Bcc)
 * - File attachments
 * - Custom subject lines
 *
 * Useful for:
 * - Automated reminder emails to patients
 * - Appointment confirmations
 * - Follow-up communications
 * - Status notifications
 *
 * @example
 * ```tsx
 * const sendEmail = useGmailSendEmail();
 *
 * // Send plain text email
 * sendEmail.mutate({
 *   recipient_email: 'patient@example.com',
 *   subject: 'Appointment Reminder',
 *   body: 'This is a reminder for your appointment tomorrow at 2:00 PM.'
 * });
 *
 * // Send HTML email with CC
 * sendEmail.mutate({
 *   recipient_email: 'patient@example.com',
 *   subject: 'Appointment Confirmation',
 *   body: '<h1>Appointment Confirmed</h1><p>Your appointment is scheduled for January 20, 2025.</p>',
 *   is_html: true,
 *   cc: ['admin@clinic.com']
 * });
 * ```
 */
export function useGmailSendEmail() {
	const { callTool } = useMCPClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: GmailSendEmailInput) => {
			if (!params.recipient_email || !params.body) {
				throw new Error(
					"recipient_email and body are required for sending an email",
				);
			}

			// Set default user_id to 'me' if not provided
			const emailParams = {
				user_id: "me",
				...params,
			};

			// CRITICAL: Use MCPToolResponse and parse JSON response
			const mcpResponse = await callTool<MCPToolResponse, GmailSendEmailInput>(
				GMAIL_SERVER_URL,
				GMAIL_MCP_ID,
				TOOL_NAME,
				emailParams,
			);

			if (!mcpResponse.content?.[0]?.text) {
				throw new Error("Invalid MCP response format: missing content[0].text");
			}

			try {
				const toolData: GmailSendEmailOutput = JSON.parse(
					mcpResponse.content[0].text,
				);

				if (!toolData.successful) {
					throw new Error(toolData.error || "Failed to send email");
				}

				return toolData;
			} catch (parseError) {
				throw new Error(
					`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
		onSuccess: () => {
			// Invalidate related queries to refresh email data
			queryClient.invalidateQueries({ queryKey: ["gmail-sent-messages"] });
			queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
		},
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
