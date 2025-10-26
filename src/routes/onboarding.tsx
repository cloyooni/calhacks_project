import { OnboardingPage } from "@/components/OnboardingPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingRoute,
});

function OnboardingRoute() {
	return <OnboardingPage />;
}