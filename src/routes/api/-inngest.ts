import { serve } from "inngest/react-start";
import { inngest } from "@/lib/inngest/client";
import {
	breakingChangeAlert,
	scheduledDriftCheck,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [scheduledDriftCheck, breakingChangeAlert],
});
