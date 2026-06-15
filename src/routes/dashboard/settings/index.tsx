import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/settings/")({
	component: SettingsIndexRedirect,
});

function SettingsIndexRedirect() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate({ to: "/dashboard/settings/account" });
	}, [navigate]);

	return null;
}
