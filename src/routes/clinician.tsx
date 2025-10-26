import { ClinicianDashboard } from "@/components/ClinicianDashboard";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

function LogoTF({ size = 48, className = "" }: { size?: number; className?: string }) {
  const deepBlue = "#1e40af";
  return (
    <div
      className={`rounded-lg flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, background: "transparent" }}
      aria-label="TrialFlow logo"
    >
      <span
        style={{
          fontFamily:
            "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: Math.round(size * 0.56),
          lineHeight: 1,
          color: deepBlue,
          letterSpacing: -1.5,
        }}
      >
        <span style={{ position: "relative", left: -2 }}>t</span>
        <span style={{ position: "relative", marginLeft: -6 }}>f</span>
      </span>
    </div>
  );
}

export const Route = createFileRoute("/clinician")({
	component: ClinicianPage,
});

function ClinicianPage() {
	const { user, signOut } = useAuth();
	const navigate = useNavigate();

	const handleSignOut = () => {
		signOut();
		navigate({ to: '/' });
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white">
			{/* Header */}
			<header className="bg-white border-b border-[#5191c4]/10 shadow-sm">
				<div className="container mx-auto px-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<LogoTF size={72} />
							<p className="text-xl font-bold text-gray-600">Clinical Trial Scheduling Platform</p>
						</div>

						<div className="flex items-center gap-4">
							{/* User Info */}
							<div className="flex items-center gap-2 text-sm">
								{user?.picture && (
									<img 
										src={user.picture} 
										alt={user.name}
										className="w-8 h-8 rounded-full"
									/>
								)}
								<div className="flex flex-col items-end">
									<span className="text-gray-900 font-medium">Welcome, {user?.name}</span>
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
				<ClinicianDashboard />
			</main>
		</div>
	);
}
