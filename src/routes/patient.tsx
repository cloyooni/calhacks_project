import { PatientDashboard } from "@/components/PatientDashboard";
import { useAuth } from "@/lib/auth-context";
import { Calendar, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/patient")({
	component: PatientPage,
});

function PatientPage() {
	const { user, signOut } = useAuth();
	const navigate = useNavigate();

	const handleSignOut = () => {
		signOut();
		navigate({ to: '/' });
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white">
			{/* Header */}
			<header className="bg-white border-b border-[#0066CC]/10 shadow-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center">
								<Calendar className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">TrialFlow</h1>
								<p className="text-sm text-gray-600">Clinical Trial Scheduling Platform</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							{/* User Info */}
							<div className="flex items-center gap-2 text-sm text-gray-600">
								{user?.picture && (
									<img 
										src={user.picture} 
										alt={user.name}
										className="w-8 h-8 rounded-full"
									/>
								)}
								<div className="flex flex-col">
									<span>Welcome, {user?.name}</span>
									{user?.role && (
										<span className="text-xs text-gray-500 capitalize">{user.role}</span>
									)}
								</div>
							</div>

						{/* Sign Out Button */}
						<button
							onClick={handleSignOut}
							className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
						>
							<LogOut className="w-4 h-4" />
							Sign Out
						</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<PatientDashboard />
			</main>
		</div>
	);
}