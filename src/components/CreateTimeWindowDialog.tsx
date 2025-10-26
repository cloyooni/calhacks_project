import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGmailSendEmail } from "@/hooks/use-gmail-send-email";
import { useCustomProcedures, type CustomProcedure } from "@/hooks/use-custom-procedures";
import emailjs from '@emailjs/browser';
import type { Patient, TimeBlock } from "@/lib/types";
import { Calendar, Clock, Plus, X, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SlotInfo } from "react-big-calendar";
import { format } from "date-fns";

interface CreateTimeWindowDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedPatient: Patient | null;
	selectedSlot?: SlotInfo | null;
}


const daysOfWeek = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

// Hardcoded patient email addresses for testing
const mockPatientEmails = [
	"ryanvu657564@gmail.com", // Ryan Vu
];

export function CreateTimeWindowDialog({
	open,
	onOpenChange,
	selectedPatient,
	selectedSlot,
}: CreateTimeWindowDialogProps) {
	const { procedures } = useCustomProcedures();
	const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
		{ dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" },
	]);
	const [isCreating, setIsCreating] = useState(false);
	const sendEmail = useGmailSendEmail();

	// Pre-populate dates and times when a slot is selected
	useEffect(() => {
		if (selectedSlot && open) {
			const start = selectedSlot.start instanceof Date ? selectedSlot.start : new Date(selectedSlot.start);
			const end = selectedSlot.end instanceof Date ? selectedSlot.end : new Date(selectedSlot.end);

			console.log("Selected slot full data:", selectedSlot);

			// Determine earliest/latest day directly from slot Date objects (avoid UTC string parsing)
			let earliestDate = start;
			let latestDate = end;
			if (selectedSlot.slots && Array.isArray(selectedSlot.slots) && selectedSlot.slots.length > 0) {
				const slotDates = selectedSlot.slots.map((slot) => (slot instanceof Date ? slot : new Date(slot)));
				// Normalize to local midnight for comparison
				const norm = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
				const normalized = slotDates.map(norm);
				normalized.sort((a, b) => a.getTime() - b.getTime());
				earliestDate = normalized[0] ?? start;
				latestDate = normalized[normalized.length - 1] ?? end;
			}

			// Extract date range strings
			setStartDate(format(earliestDate, "yyyy-MM-dd"));
			setEndDate(format(latestDate, "yyyy-MM-dd"));

			// Extract time range and set the time blocks
			const startTime = format(start, "HH:mm");
			const endTime = format(end, "HH:mm");

			// Get the day of week from the start date
			const dayOfWeek = format(start, "EEEE"); // e.g., "Monday"

			// Pre-populate time blocks with the selected time range
			setTimeBlocks([
				{
					dayOfWeek: dayOfWeek,
					startTime: startTime,
					endTime: endTime,
				},
			]);

			console.log("Extracted time range:", {
				dates: `${format(earliestDate, "yyyy-MM-dd")} to ${format(latestDate, "yyyy-MM-dd")}`,
				times: `${startTime} to ${endTime}`,
				dayOfWeek: dayOfWeek,
				slotsCount: selectedSlot.slots?.length || 0,
			});
		}
	}, [selectedSlot, open]);

	const handleToggleProcedure = (procedureId: string) => {
		setSelectedProcedures((prev) =>
			prev.includes(procedureId)
				? prev.filter((id) => id !== procedureId)
				: [...prev, procedureId],
		);
	};

	const handleAddTimeBlock = () => {
		setTimeBlocks((prev) => [
			...prev,
			{ dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" },
		]);
	};

	const handleRemoveTimeBlock = (index: number) => {
		setTimeBlocks((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpdateTimeBlock = (
		index: number,
		field: keyof TimeBlock,
		value: string,
	) => {
		setTimeBlocks((prev) =>
			prev.map((block, i) =>
				i === index ? { ...block, [field]: value } : block,
			),
		);
	};

	const sendEmailsToPatients = async () => {
		try {
			// Get procedure names for the email
			const procedureNames = selectedProcedures
				.map((id) => procedures.find((p: CustomProcedure) => p.id === id)?.name)
				.filter(Boolean)
				.join(", ");

			// Create email content
			const emailSubject = "New Appointment Time Window Available";
			const emailBody = `
				<h2>New Appointment Time Window Available</h2>
				<p>Dear Patient,</p>
				<p>A new appointment time window has been created for the following procedures:</p>
				<ul>
					<li><strong>Procedures:</strong> ${procedureNames}</li>
					<li><strong>Available Period:</strong> ${startDate} to ${endDate}</li>
					<li><strong>Available Time Blocks:</strong> ${timeBlocks.map(block => `${block.dayOfWeek} ${block.startTime}-${block.endTime}`).join(", ")}</li>
				</ul>
				<p>Please log in to your patient dashboard to schedule your appointment:</p>
				<p><a href="${window.location.origin}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule Appointment</a></p>
				<p>Best regards,<br>Clinical Trial Team</p>
			`;

			// Send emails to all patients using EmailJS
			console.log("Attempting to send emails to:", mockPatientEmails);
			
			const emailPromises = mockPatientEmails.map(async (email) => {
				try {
					// Send email using EmailJS (no backend needed!)
					await emailjs.send(
						'service_hb00nba',
						'template_t1txlyv',
						{
							to_email: email,
							subject: emailSubject,
							message: emailBody,
						},
						'7aAhaDAm7axw9-yEw'
					);
					
					console.log(`✅ Email sent successfully to ${email}`);
					return { success: true };
				} catch (error) {
					console.error(`❌ Failed to send email to ${email}:`, error);
					// Don't throw - just log the error
					return { success: false, error };
				}
			});

			await Promise.all(emailPromises);
			
			toast.success(`Time window created and ${mockPatientEmails.length} patients notified via email!`);
		} catch (error) {
			console.error("Error sending emails to patients:", error);
			toast.error("Failed to send email notifications: " + (error instanceof Error ? error.message : "Unknown error"));
		}
	};

	const handleSubmit = async () => {
		setIsCreating(true);
		
		try {
			// In production, this would call TimeWindowORM.insert()
			console.log("Creating time window:", {
				patientId: selectedPatient?.id,
				procedureIds: selectedProcedures,
				startDate,
				endDate,
				timeBlocks,
			});

			// Send emails to all patients
			await sendEmailsToPatients();
			
			onOpenChange(false);
		} catch (error) {
			console.error("Error creating time window:", error);
			toast.error("Failed to create time window");
		} finally {
			setIsCreating(false);
		}
	};

	const totalDuration = selectedProcedures.reduce((sum, id) => {
		const procedure = procedures.find((p: CustomProcedure) => p.id === id);
		return sum + (procedure?.durationMinutes || 0);
	}, 0);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
						<Calendar className="w-5 h-5 text-[#0066CC]" />
						Create Time Window
					</DialogTitle>
					<DialogDescription>
						{selectedPatient
							? `Creating time window for ${selectedPatient.first_name} ${selectedPatient.last_name}`
							: "Set up available time slots for patient appointments"}
						{selectedSlot && startDate && endDate && (
							<span className="block mt-1 text-[#0066CC] font-medium">
								Selected range: {startDate}
								{startDate !== endDate && ` to ${endDate}`}
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Select Procedures */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold text-gray-900">
							Select Procedure *
						</Label>
						
						{procedures.length === 0 ? (
							<div className="p-4 text-center text-gray-500 text-sm border rounded-lg">
								No procedures available. Add procedures in the main dashboard.
							</div>
						) : (
							<>
								<Select
									onValueChange={(value) => {
										if (!selectedProcedures.includes(value)) {
											handleToggleProcedure(value);
										}
									}}
								>
									<SelectTrigger className="border-[#0066CC]/30 focus:border-[#0066CC]">
										<SelectValue placeholder="Select a procedure to add..." />
									</SelectTrigger>
									<SelectContent className="max-h-[200px]">
										{procedures.map((procedure: CustomProcedure) => (
											<SelectItem key={procedure.id} value={procedure.id}>
												<div className="flex items-center justify-between w-full">
													<span>{procedure.name}</span>
													<span className="text-xs text-gray-500 ml-2">
														({procedure.durationMinutes} min, Phase {procedure.phase})
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								
								{/* Selected Procedures */}
								{selectedProcedures.length > 0 && (
									<div className="space-y-2">
										<div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
											{selectedProcedures.map((id) => {
												const procedure = procedures.find((p: CustomProcedure) => p.id === id);
												if (!procedure) return null;
												return (
													<Badge
														key={id}
														variant="secondary"
														className="pr-1 cursor-pointer hover:bg-red-100"
														onClick={() => handleToggleProcedure(id)}
													>
														{procedure.name}
														<span className="ml-1 text-xs">×</span>
													</Badge>
												);
											})}
										</div>
										<div className="flex items-center gap-2 p-3 bg-[#E6F2FF]/30 rounded-lg border border-[#0066CC]/20">
											<Clock className="w-4 h-4 text-[#0066CC]" />
											<p className="text-sm text-gray-700">
												Total estimated duration:{" "}
												<span className="font-semibold text-[#0066CC]">
													{totalDuration} minutes
												</span>
											</p>
										</div>
									</div>
								)}
							</>
						)}
					</div>

					{/* Date Range */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-semibold text-gray-900">
								Date Range *
							</Label>
							<p className="text-xs text-gray-500">
								Extend range for multi-day window
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label
									htmlFor="startDate"
									className="text-sm font-medium text-gray-700"
								>
									Start Date
								</Label>
								<Input
									id="startDate"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="border-[#0066CC]/30 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20"
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="endDate"
									className="text-sm font-medium text-gray-700"
								>
									End Date
								</Label>
								<Input
									id="endDate"
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="border-[#0066CC]/30 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20"
								/>
							</div>
						</div>
						{startDate && endDate && startDate !== endDate && (
							<div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
								<Calendar className="w-4 h-4 text-[#0066CC]" />
								<p className="text-sm text-[#0066CC]">
									Multi-day window: Time blocks will apply to all days in range
								</p>
							</div>
						)}
					</div>

					{/* Time Blocks */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-semibold text-gray-900">
								Available Time Blocks *
							</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddTimeBlock}
								className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white"
							>
								<Plus className="w-4 h-4 mr-1" />
								Add Time Block
							</Button>
						</div>

						<div className="space-y-2">
							{timeBlocks.map((block, index) => (
								<div
									key={`${block.dayOfWeek}-${block.startTime}-${block.endTime}-${index}`}
									className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
								>
									<Select
										value={block.dayOfWeek}
										onValueChange={(value) =>
											handleUpdateTimeBlock(index, "dayOfWeek", value)
										}
									>
										<SelectTrigger className="flex-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{daysOfWeek.map((day) => (
												<SelectItem key={day} value={day}>
													{day}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Input
										type="time"
										value={block.startTime}
										onChange={(e) =>
											handleUpdateTimeBlock(index, "startTime", e.target.value)
										}
										className="w-32"
									/>

									<span className="text-gray-500">to</span>

									<Input
										type="time"
										value={block.endTime}
										onChange={(e) =>
											handleUpdateTimeBlock(index, "endTime", e.target.value)
										}
										className="w-32"
									/>

									{timeBlocks.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveTimeBlock(index)}
											className="text-red-500 hover:text-red-700 hover:bg-red-50"
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Summary */}
					{selectedProcedures.length > 0 && startDate && endDate && (
						<div className="p-4 bg-[#E6F2FF]/30 rounded-lg border border-[#0066CC]/20">
							<h4 className="font-semibold text-sm text-gray-900 mb-2">
								Summary
							</h4>
							<div className="space-y-1 text-sm text-gray-700">
								<p>
									<span className="font-medium">Procedures:</span>{" "}
									{selectedProcedures
										.map((id) => procedures.find((p: CustomProcedure) => p.id === id)?.name)
										.join(", ")}
								</p>
								<p>
									<span className="font-medium">Window:</span> {startDate} to{" "}
									{endDate}
								</p>
								<p>
									<span className="font-medium">Available slots:</span>{" "}
									{timeBlocks.length} time blocks configured
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="border-gray-300"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={selectedProcedures.length === 0 || !startDate || !endDate || isCreating}
						className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
					>
						{isCreating ? (
							<>
								<Mail className="w-4 h-4 mr-2 animate-spin" />
								Creating & Sending Emails...
							</>
						) : (
							<>
								<Mail className="w-4 h-4 mr-2" />
								Create Time Window & Notify Patients
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
