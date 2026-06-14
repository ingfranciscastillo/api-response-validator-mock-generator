import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { mockDataset, mockServeConfig } from "#/db/schema";

export const Route = createFileRoute("/api/public/mocks/$mockId")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { mockId } = params;

				const mock = await db
					.select()
					.from(mockDataset)
					.where(eq(mockDataset.id, mockId))
					.then((r) => r[0] ?? null);

				if (!mock || !mock.payload) {
					return new Response(JSON.stringify({ error: "Mock not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				const config = await db
					.select()
					.from(mockServeConfig)
					.where(eq(mockServeConfig.mockDatasetId, mockId))
					.then((r) => r[0] ?? null);

				if (!config?.isEnabled) {
					return new Response(
						JSON.stringify({ error: "Mock not enabled for serving" }),
						{ status: 403, headers: { "Content-Type": "application/json" } },
					);
				}

				if (config.latencyMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, config.latencyMs));
				}

				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, x-api-key",
				};

				if (config.responseHeadersOverride) {
					const override = config.responseHeadersOverride as Record<
						string,
						string
					>;
					for (const [key, value] of Object.entries(override)) {
						headers[key] = value;
					}
				}

				return new Response(JSON.stringify(mock.payload), {
					status: 200,
					headers,
				});
			},
			OPTIONS: async () => {
				return new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, x-api-key",
					},
				});
			},
		},
	},
});
