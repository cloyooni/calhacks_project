import { AboutPage } from "@/components/AboutPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: () => <AboutPage />,
});
