import { SignInPage } from "@/components/SignInPage";
import { TrialFlowApp } from "@/components/TouchFlowApp";
import { useAuth } from "@/lib/auth-context";
import { createFileRoute } from "@tanstack/react-router";
import "@/styles/calendar.css";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-[#E6F2FF] to-white flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center mx-auto mb-4">
						<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return user ? <TrialFlowApp /> : <SignInPage />;
}
