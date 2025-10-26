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
import type { CustomProcedure } from "@/hooks/use-custom-procedures";
import { Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddProcedureDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (procedure: Omit<CustomProcedure, "id" | "createdAt">) => void;
}

export function AddProcedureDialog({
	open,
	onOpenChange,
	onAdd,
}: AddProcedureDialogProps) {
	const [name, setName] = useState("");
	const [duration, setDuration] = useState("");
	const [phase, setPhase] = useState("");

	const handleSubmit = () => {
		if (!name.trim()) {
			toast.error("Please enter a procedure name");
			return;
		}

		const durationNum = parseInt(duration);
		if (!durationNum || durationNum <= 0) {
			toast.error("Please enter a valid duration");
			return;
		}

		const phaseNum = parseInt(phase);
		if (!phaseNum || phaseNum <= 0) {
			toast.error("Please enter a valid phase number");
			return;
		}

		onAdd({
			name: name.trim(),
			durationMinutes: durationNum,
			phase: phaseNum,
		});

		// Reset form
		setName("");
		setDuration("");
		setPhase("");
		onOpenChange(false);
		toast.success("Procedure added successfully!");
	};

	const handleCancel = () => {
		setName("");
		setDuration("");
		setPhase("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
						<Clock className="w-5 h-5 text-[#0066CC]" />
						Add Custom Procedure
					</DialogTitle>
					<DialogDescription>
						Create a new procedure with custom name, duration, and phase
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="procedure-name" className="text-sm font-semibold text-gray-900">
							Procedure Name *
						</Label>
						<Input
							id="procedure-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Blood Sample Collection"
							className="border-[#0066CC]/30 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="duration" className="text-sm font-semibold text-gray-900">
							Duration (minutes) *
						</Label>
						<Input
							id="duration"
							type="number"
							value={duration}
							onChange={(e) => setDuration(e.target.value)}
							placeholder="e.g., 30"
							min="1"
							className="border-[#0066CC]/30 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="phase" className="text-sm font-semibold text-gray-900">
							Phase *
						</Label>
						<Input
							id="phase"
							type="number"
							value={phase}
							onChange={(e) => setPhase(e.target.value)}
							placeholder="e.g., 1"
							min="1"
							className="border-[#0066CC]/30 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button variant="outline" onClick={handleCancel} className="border-gray-300">
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!name.trim() || !duration || !phase || parseInt(duration) <= 0 || parseInt(phase) <= 0}
						className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
					>
						Add Procedure
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

