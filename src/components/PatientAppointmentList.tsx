import { Badge } from "@/components/ui/badge";
import {
	AppointmentStatus,
	formatDateTime,
	getAppointmentStatusColor,
	getAppointmentStatusLabel,
} from "@/lib/types";
import { Calendar, Clock } from "lucide-react";

interface PatientAppointmentsListProps {
	patientId: string;
}

export function PatientAppointmentsList({
	patientId,
}: PatientAppointmentsListProps) {
	// Mock data - in production, fetch from AppointmentORM
	const appointments = [
		{
			id: "1",
			procedureNames: ["Blood Draw", "Vital Signs"],
			scheduledDate: "2025-10-27T09:00:00Z",
			durationMinutes: 30,
			status: AppointmentStatus.Scheduled,
		},
		{
			id: "2",
			procedureNames: ["ECG", "Questionnaire"],
			scheduledDate: "2025-10-23T12:00:00Z",
			durationMinutes: 45,
			status: AppointmentStatus.Completed,
		},
	];

	if (appointments.length === 0) {
		return (
			<div className="text-center py-6 text-gray-500">
				<Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
				<p className="text-sm">No appointments scheduled for this patient</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<h4 className="font-semibold text-sm text-gray-700 mb-3">Appointments</h4>
			{appointments.map((appointment) => (
				<div
					key={appointment.id}
					className="flex items-center justify-between p-3 bg-[#E6F2FF]/30 rounded-lg border border-[#5191c4]/10"
				>
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#5191c4]/20">
							<Calendar className="w-4 h-4 text-[#5191c4]" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-900">
								{appointment.procedureNames.join(", ")}
							</p>
							<div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
								<span className="flex items-center gap-1">
									<Clock className="w-3 h-3" />
									{formatDateTime(appointment.scheduledDate)}
								</span>
							</div>
						</div>
					</div>
					<Badge className={getAppointmentStatusColor(appointment.status)}>
						{getAppointmentStatusLabel(appointment.status)}
					</Badge>
				</div>
			))}
		</div>
	);
}
