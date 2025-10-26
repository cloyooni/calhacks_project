import { TrialFlowApp } from "@/components/TouchFlowApp";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
	component: AppRoute,
});

function AppRoute() {
	return <TrialFlowApp />;
}
