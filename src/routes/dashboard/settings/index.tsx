import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/settings/")({
	head: () => ({
		meta: [
			{
				title: "Settings — API Response Validator & Mock Generator",
			},
		],
	}),
	component: SettingsIndexRedirect,
});

function SettingsIndexRedirect() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate({ to: "/dashboard/settings/account" });
	}, [navigate]);

	return null;
}
