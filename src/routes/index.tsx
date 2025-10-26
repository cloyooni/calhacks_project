import { TrialFlowApp } from "@/components/TouchFlowApp";
import { createFileRoute } from "@tanstack/react-router";
import "@/styles/calendar.css";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return <TrialFlowApp />;
}
