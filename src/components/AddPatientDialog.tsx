import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { PatientTrialPhase, type Patient } from "@/lib/types";
import { useState } from "react";

interface AddPatientDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddPatient: (patient: Omit<Patient, "id" | "data_creator" | "data_updater" | "create_time" | "update_time">) => void;
}

export function AddPatientDialog({
	open,
	onOpenChange,
	onAddPatient,
}: AddPatientDialogProps) {
	const [formData, setFormData] = useState({
		first_name: "",
		last_name: "",
		email: "",
		phone: "",
		trial_phase: PatientTrialPhase.Phase1,
	});

	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validate required fields
		if (!formData.first_name || !formData.last_name || !formData.email) {
			setError("Please fill in all required fields");
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError("Please enter a valid email address");
			return;
		}

		// Create patient data with auto-populated fields
		const newPatient: Omit<Patient, "id" | "data_creator" | "data_updater" | "create_time" | "update_time"> = {
			first_name: formData.first_name,
			last_name: formData.last_name,
			email: formData.email,
			phone: formData.phone || null,
			trial_phase: formData.trial_phase,
			enrollment_date: new Date().toISOString(),
			completion_percentage: 0,
		};

		onAddPatient(newPatient);

		// Reset form
		setFormData({
			first_name: "",
			last_name: "",
			email: "",
			phone: "",
			trial_phase: PatientTrialPhase.Phase1,
		});

		// Close dialog
		onOpenChange(false);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add New Patient</DialogTitle>
					<DialogDescription>
						Add a new patient to your trial. The patient will receive an email
						notification and can create an account using their email address.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* First Name */}
						<div className="space-y-2">
							<Label htmlFor="first_name">
								First Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="first_name"
								name="first_name"
								placeholder="John"
								value={formData.first_name}
								onChange={handleInputChange}
								required
								className="border-[#0066CC]/20 focus:border-[#0066CC]"
							/>
						</div>

						{/* Last Name */}
						<div className="space-y-2">
							<Label htmlFor="last_name">
								Last Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="last_name"
								name="last_name"
								placeholder="Doe"
								value={formData.last_name}
								onChange={handleInputChange}
								required
								className="border-[#0066CC]/20 focus:border-[#0066CC]"
							/>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">
								Email <span className="text-red-500">*</span>
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="john.doe@example.com"
								value={formData.email}
								onChange={handleInputChange}
								required
								className="border-[#0066CC]/20 focus:border-[#0066CC]"
							/>
							<p className="text-xs text-gray-500">
								Patient will create their account using this email
							</p>
						</div>

						{/* Phone (Optional) */}
						<div className="space-y-2">
							<Label htmlFor="phone">Phone Number (Optional)</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								placeholder="188-888-8888"
								value={formData.phone}
								onChange={handleInputChange}
								className="border-[#0066CC]/20 focus:border-[#0066CC]"
							/>
						</div>

						{/* Trial Phase */}
						<div className="space-y-2">
							<Label htmlFor="trial_phase">Trial Phase</Label>
							<Select
								value={formData.trial_phase.toString()}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										trial_phase: Number.parseInt(value) as PatientTrialPhase,
									}))
								}
							>
								<SelectTrigger className="border-[#0066CC]/20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={PatientTrialPhase.Phase1.toString()}>
										Phase 1
									</SelectItem>
									<SelectItem value={PatientTrialPhase.Phase2.toString()}>
										Phase 2
									</SelectItem>
									<SelectItem value={PatientTrialPhase.Phase3.toString()}>
										Phase 3
									</SelectItem>
									<SelectItem value={PatientTrialPhase.Phase4.toString()}>
										Phase 4
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Auto-populated info display */}
						<div className="rounded-lg bg-[#E6F2FF]/50 border border-[#0066CC]/20 p-3 text-sm text-gray-600">
							<p className="font-semibold text-[#0066CC] mb-1">
								Auto-populated:
							</p>
							<ul className="space-y-1 text-xs">
								<li>• Enrollment Date: Today&apos;s date</li>
								<li>• Progress: 0% (new enrollment)</li>
								<li>• Account Link: Patient will receive email instructions</li>
							</ul>
						</div>

						{/* Error message */}
						{error && (
							<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
								{error}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
						>
							Add Patient
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

