import { SignInPage } from "@/components/SignInPage";
import { TrialFlowApp } from "@/components/TouchFlowApp";
import { OnboardingPage } from "@/components/OnboardingPage";
import { useAuth } from "@/lib/auth-context";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import "@/styles/calendar.css";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();

	// Handle navigation after auth state changes
	useEffect(() => {
		if (!isLoading) {
			if (!user) {
				// No user - stay on sign-in page
				return;
			} else if (!user.role) {
				// User exists but no role - go to onboarding
				console.log('Navigating to onboarding');
				navigate({ to: '/onboarding', replace: true });
			} else {
				// User has role - go to main app
				console.log('Navigating to app');
				navigate({ to: '/app', replace: true });
			}
		}
	}, [user, isLoading, navigate]);

	// Show loading state
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

	// Default to sign-in page
	return <SignInPage />;
}
