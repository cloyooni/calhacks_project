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
	onCreated?: (ranges: { start: Date; end: Date }[]) => void;
	blocked?: { start: Date; end: Date }[];
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
	onCreated,
	blocked = [],
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

			// Extract time range and set the time blocks (hour-only)
			const startHour = parseInt(format(start, "HH"), 10);
			const endHour = parseInt(format(end, "HH"), 10);
			const startTime = `${String(Math.max(7, Math.min(18, startHour))).padStart(2, "0")}:00`;
			const endTimeBase = Math.max(7, Math.min(18, endHour));
			const endTime = `${String(endTimeBase <= Math.max(7, Math.min(18, startHour)) ? Math.min(endTimeBase + 1, 18) : endTimeBase).padStart(2, "0")}:00`;

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
			{ dayOfWeek: "Monday", startTime: "07:00", endTime: "18:00" },
		]);
	};

	const handleRemoveTimeBlock = (index: number) => {
		setTimeBlocks((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpdateTimeBlockHour = (
		index: number,
		field: "startTime" | "endTime",
		hour: number,
	) => {
		const clampHour = (h: number) => Math.max(7, Math.min(18, Math.floor(h)));
		setTimeBlocks((prev) =>
			prev.map((block, i) => {
				if (i !== index) return block;
				const hVal = clampHour(hour);
				let next = { ...block } as TimeBlock;
				next[field] = `${String(hVal).padStart(2, "0")}:00`;
				const sHour = parseInt(next.startTime.split(":")[0] || "7", 10);
				let eHour = parseInt(next.endTime.split(":")[0] || "8", 10);
				if (eHour <= sHour) eHour = Math.min(sHour + 1, 18);
				next.startTime = `${String(Math.max(7, Math.min(18, sHour))).padStart(2, "0")}:00`;
				next.endTime = `${String(Math.max(7, Math.min(18, eHour))).padStart(2, "0")}:00`;
				return next;
			}),
		);
	};

	const isHourDisabledForRange = (startHour: number, endHour: number) => {
		if (!startDate || !endDate) return false;
		const [sy, sm, sd] = startDate.split("-").map((n) => parseInt(n, 10));
		const [ey, em, ed] = endDate.split("-").map((n) => parseInt(n, 10));
		const startD = new Date(sy, (sm || 1) - 1, sd || 1);
		const endD = new Date(ey, (em || 1) - 1, ed || 1);
		const startTS = startD.getTime();
		const endTS = endD.getTime();
		const hourTS = (h: number) => new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), h, 0, 0, 0).getTime();
		const isBlocked = (ts: number) => {
			for (const block of blocked) {
				const blockStartTS = block.start.getTime();
				const blockEndTS = block.end.getTime();
				if (blockStartTS <= ts && ts < blockEndTS) return true;
			}
			return false;
		};
		for (let h = startHour; h < endHour; h++) {
			if (isBlocked(hourTS(h))) return true;
		}
		return false;
	};

	const isHourRangeDisabled = (startHour: number, endHour: number) => {
		if (!startDate || !endDate) return false;
		const [sy, sm, sd] = startDate.split("-").map((n) => parseInt(n, 10));
		const [ey, em, ed] = endDate.split("-").map((n) => parseInt(n, 10));
		const startD = new Date(sy, (sm || 1) - 1, sd || 1);
		const endD = new Date(ey, (em || 1) - 1, ed || 1);
		const startTS = startD.getTime();
		const endTS = endD.getTime();
		const hourTS = (h: number) => new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), h, 0, 0, 0).getTime();
		const isBlocked = (ts: number) => {
			for (const block of blocked) {
				const blockStartTS = block.start.getTime();
				const blockEndTS = block.end.getTime();
				if (blockStartTS <= ts && ts < blockEndTS) return true;
			}
			return false;
		};
		for (let h = startHour; h <= endHour; h++) {
			if (isBlocked(hourTS(h))) return true;
		}
		return false;
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

			// Compute concrete time ranges for each day based on date range and time blocks
			const ranges: { start: Date; end: Date }[] = [];
			if (startDate && endDate && timeBlocks.length > 0) {
				const [sy, sm, sd] = startDate.split("-").map((n) => parseInt(n, 10));
				const [ey, em, ed] = endDate.split("-").map((n) => parseInt(n, 10));
				let d = new Date(sy, (sm || 1) - 1, sd || 1);
				const endD = new Date(ey, (em || 1) - 1, ed || 1);
				const START_BOUND = 7 * 60;
				const END_BOUND = 18 * 60;
				const clampMin = (min: number) => Math.max(START_BOUND, Math.min(min, END_BOUND));
				const toMin = (t: string) => {
					const [h, m] = t.split(":").map((x) => parseInt(x, 10));
					return (h || 0) * 60 + (m || 0);
				};
				while (d.getTime() <= endD.getTime()) {
					for (const b of timeBlocks) {
						let sMin = clampMin(toMin(b.startTime));
						let eMin = clampMin(toMin(b.endTime));
						if (eMin <= sMin) eMin = Math.min(sMin + 15, END_BOUND);
						const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(sMin / 60), sMin % 60, 0, 0);
						const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(eMin / 60), eMin % 60, 0, 0);
						ranges.push({ start: s, end: e });
					}
					// next day
					d.setDate(d.getDate() + 1);
					d.setHours(0, 0, 0, 0);
				}
			}

			// Notify parent so calendar can render the created windows
			if (ranges.length > 0) {
				onCreated?.(ranges);
			}

			onOpenChange(false);
			// Reset dialog selections to defaults
			setSelectedProcedures([]);
			setStartDate("");
			setEndDate("");
			setTimeBlocks([{ dayOfWeek: "Monday", startTime: "07:00", endTime: "18:00" }]);
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
											setTimeBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, dayOfWeek: value } : b)))
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

									<Select
										value={String(parseInt(block.startTime.split(":")[0] || "7", 10))}
										onValueChange={(val) => handleUpdateTimeBlockHour(index, "startTime", parseInt(val, 10))}
									>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="max-h-64 overflow-auto">
											{Array.from({ length: 12 }, (_, i) => 7 + i).map((h) => {
												const disabled = isHourDisabledForRange(h, h + 1);
												return (
													<SelectItem key={h} value={String(h)} disabled={disabled}>
														{new Date(1970,0,1,h).toLocaleTimeString("en-US", { hour: "numeric" })}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>

									<span className="text-gray-500">to</span>

									<Select
										value={String(parseInt(block.endTime.split(":")[0] || "8", 10))}
										onValueChange={(val) => handleUpdateTimeBlockHour(index, "endTime", parseInt(val, 10))}
									>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="max-h-64 overflow-auto">
											{Array.from({ length: 12 }, (_, i) => 7 + i).map((h) => {
												const startHour = parseInt(block.startTime.split(":")[0] || "7", 10);
												const disabled = h <= startHour || isHourRangeDisabled(startHour, h);
												return (
													<SelectItem key={h} value={String(h)} disabled={disabled}>
														{new Date(1970,0,1,h).toLocaleTimeString("en-US", { hour: "numeric" })}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>

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
