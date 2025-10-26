import { SignInPage } from "@/components/SignInPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({
	component: SignInRoute,
});

function SignInRoute() {
	return <SignInPage />;
}
