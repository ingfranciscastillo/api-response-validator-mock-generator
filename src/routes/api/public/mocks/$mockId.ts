import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { mockDataset, mockServeConfig } from "#/db/schema";
import { downloadFromR2, isR2Configured } from "#/lib/storage";

export const Route = createFileRoute("/api/public/mocks/$mockId")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { mockId } = params;

				const dataset = await db
					.select()
					.from(mockDataset)
					.where(eq(mockDataset.id, mockId))
					.then((r) => r[0]);

				if (!dataset) {
					return new Response(JSON.stringify({ error: "Mock not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				const config = await db
					.select()
					.from(mockServeConfig)
					.where(
						and(
							eq(mockServeConfig.mockDatasetId, mockId),
							eq(mockServeConfig.isEnabled, true),
						),
					)
					.then((r) => r[0]);

				if (!config) {
					return new Response(
						JSON.stringify({ error: "Mock serving is disabled" }),
						{
							status: 404,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				let payload: Record<string, unknown> | null = null;
				if (dataset.storageKey && isR2Configured()) {
					const buf = await downloadFromR2(dataset.storageKey);
					payload = JSON.parse(buf.toString("utf-8"));
				} else {
					payload = dataset.payload as Record<string, unknown>;
				}

				if (config.latencyMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, config.latencyMs));
				}

				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
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

				return new Response(JSON.stringify(payload), {
					status: dataset.statusCode,
					headers,
				});
			},
			OPTIONS: async () => {
				return new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				});
			},
		},
	},
});
