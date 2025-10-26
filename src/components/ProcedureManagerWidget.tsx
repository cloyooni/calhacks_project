import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCustomProcedures, type CustomProcedure } from "@/hooks/use-custom-procedures";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddProcedureDialog } from "./AddProcedureDialog";

export function ProcedureManagerWidget() {
	const { procedures, addProcedure, removeProcedure } = useCustomProcedures();
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [procedureToDelete, setProcedureToDelete] = useState<CustomProcedure | null>(null);

	return (
		<>
			<Card className="border-[#5191c4]/20">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-xl text-gray-900 flex items-center gap-2">
								<Clock className="w-5 h-5 text-[#5191c4]" />
								Procedures
							</CardTitle>
							<CardDescription>
								Create and manage custom procedures for appointments
							</CardDescription>
						</div>
						<Button
							onClick={() => setAddDialogOpen(true)}
							variant="outline"
							size="sm"
							className="border-[#5191c4] text-[#5191c4] hover:bg-[#5191c4] hover:text-white"
						>
							<Plus className="w-4 h-4 mr-1" />
							Add Procedure
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{procedures.length === 0 ? (
						<div className="py-8 text-center text-gray-500">
							<Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
							<p>No procedures available</p>
							<p className="text-sm mt-1">Click "Add Procedure" to create your first procedure</p>
						</div>
					) : (
						<div className="space-y-2">
							{procedures.map((procedure: CustomProcedure) => (
								<div
									key={procedure.id}
									className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
								>
									<div className="w-10 h-10 bg-gradient-to-b from-[#2c6aa0] via-[#5191c4] to-[#beb9fe] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
										{procedure.name[0]}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium text-gray-900">
												{procedure.name}
											</p>
											<Badge variant="secondary" className="text-xs">
												Phase {procedure.phase}
											</Badge>
										</div>
										<p className="text-xs text-gray-600 mt-0.5">
											{procedure.durationMinutes} min
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setProcedureToDelete(procedure);
											setDeleteDialogOpen(true);
										}}
										className="text-red-500 hover:text-red-700 hover:bg-red-50"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<AddProcedureDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				onAdd={addProcedure}
			/>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Procedure</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{procedureToDelete?.name}"? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (procedureToDelete) {
									removeProcedure(procedureToDelete.id);
								}
								setDeleteDialogOpen(false);
								setProcedureToDelete(null);
							}}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

