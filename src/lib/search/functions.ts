import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	endpoint,
	mockDataset,
	specification,
	validationRun,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export const globalSearch = createServerFn({ method: "GET" })
	.validator(
		(input: { organizationId: string; query: string; limit?: number }) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const q = `%${data.query}%`;
		const limit = data.limit ?? 10;

		type SearchRow = {
			id: string;
			type: "specification" | "endpoint" | "mock" | "validation_run";
			label: string;
			subtitle: string | null;
			route: string;
		};

		const specs = (await db
			.select({
				id: specification.id,
				type: sql<string>`'specification'`.as("type"),
				label: specification.name,
				subtitle: sql<string | null>`NULL`,
				route: sql<string>`'/dashboard/specs/' || ${specification.id}`.as(
					"route",
				),
			})
			.from(specification)
			.where(
				and(
					eq(specification.organizationId, data.organizationId),
					ilike(specification.name, q),
				),
			)
			.limit(limit)) as unknown as SearchRow[];

		const endpoints = (await db
			.select({
				id: endpoint.id,
				type: sql<string>`'endpoint'`.as("type"),
				label: sql<string>`${endpoint.method} || ' ' || ${endpoint.path}`.as(
					"label",
				),
				subtitle: sql<string | null>`NULL`,
				route:
					sql<string>`'/dashboard/specs/' || ${endpoint.specId} || '/endpoints/' || ${endpoint.id}`.as(
						"route",
					),
			})
			.from(endpoint)
			.where(ilike(endpoint.path, q))
			.limit(limit)) as unknown as SearchRow[];

		const mocks = (await db
			.select({
				id: mockDataset.id,
				type: sql<string>`'mock'`.as("type"),
				label: mockDataset.name,
				subtitle: sql<string | null>`NULL`,
				route: sql<string>`'/dashboard/mocks/' || ${mockDataset.id}`.as(
					"route",
				),
			})
			.from(mockDataset)
			.where(
				and(
					eq(mockDataset.workspaceId, data.organizationId),
					sql`${mockDataset.deletedAt} IS NULL`,
					ilike(mockDataset.name, q),
				),
			)
			.limit(limit)) as unknown as SearchRow[];

		const runs = (await db
			.select({
				id: validationRun.id,
				type: sql<string>`'validation_run'`.as("type"),
				label:
					sql<string>`coalesce(${validationRun.name}, 'Run ' || ${validationRun.id})`.as(
						"label",
					),
				subtitle: validationRun.status,
				route:
					sql<string>`'/dashboard/validation/runs/' || ${validationRun.id}`.as(
						"route",
					),
			})
			.from(validationRun)
			.where(
				and(
					eq(validationRun.workspaceId, data.organizationId),
					or(
						ilike(sql<string>`coalesce(${validationRun.name}, '')`, q),
						ilike(validationRun.status, q),
					),
				),
			)
			.limit(limit)) as unknown as SearchRow[];

		return [...specs, ...endpoints, ...mocks, ...runs];
	});
