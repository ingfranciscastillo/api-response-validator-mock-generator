import { createFileRoute } from "@tanstack/react-router";
import { serve } from "inngest/edge";
import { inngest } from "@/lib/inngest/client";
import {
	breakingChangeAlert,
	scheduledDriftCheck,
} from "@/lib/inngest/functions";

const handler = serve({
	client: inngest,
	functions: [scheduledDriftCheck, breakingChangeAlert],
});

export const Route = createFileRoute("/api/inngest")({
	server: {
		handlers: {
			GET: async ({ request }) => handler(request),
			POST: async ({ request }) => handler(request),
			PUT: async ({ request }) => handler(request),
		},
	},
});
