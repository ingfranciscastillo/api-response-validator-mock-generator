import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	endpoint,
	mockDataset,
	specification,
	validationResult,
	validationRun,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface DashboardOverview {
	totalSpecs: number;
	totalEndpoints: number;
	totalMocks: number;
	totalRuns: number;
	passRate: number;
	warningRate: number;
	failRate: number;
	recentRuns: Array<{
		id: string;
		name: string | null;
		status: string;
		outcome?: string;
		passedChecks: number;
		totalChecks: number;
		createdAt: Date;
	}>;
}

export const getDashboardOverview = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }): Promise<DashboardOverview> => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const [specs] = await db
			.select({ count: count() })
			.from(specification)
			.where(eq(specification.organizationId, data.organizationId));
		const totalSpecs = specs?.count ?? 0;

		const [eps] = await db
			.select({ count: count() })
			.from(endpoint)
			.innerJoin(specification, eq(endpoint.specId, specification.id))
			.where(eq(specification.organizationId, data.organizationId));
		const totalEndpoints = eps?.count ?? 0;

		const [mocks] = await db
			.select({ count: count() })
			.from(mockDataset)
			.where(
				and(
					eq(mockDataset.workspaceId, data.organizationId),
					sql`${mockDataset.deletedAt} IS NULL`,
				),
			);
		const totalMocks = mocks?.count ?? 0;

		const [runs] = await db
			.select({ count: count() })
			.from(validationRun)
			.where(eq(validationRun.workspaceId, data.organizationId));
		const totalRuns = runs?.count ?? 0;

		const [passResult] = await db
			.select({ count: count() })
			.from(validationResult)
			.where(
				and(
					eq(validationResult.workspaceId, data.organizationId),
					eq(validationResult.outcome, "pass"),
				),
			);
		const [failResult] = await db
			.select({ count: count() })
			.from(validationResult)
			.where(
				and(
					eq(validationResult.workspaceId, data.organizationId),
					eq(validationResult.outcome, "fail"),
				),
			);
		const [warnResult] = await db
			.select({ count: count() })
			.from(validationResult)
			.where(
				and(
					eq(validationResult.workspaceId, data.organizationId),
					eq(validationResult.outcome, "warning"),
				),
			);

		const passCount = passResult?.count ?? 0;
		const failCount = failResult?.count ?? 0;
		const warnCount = warnResult?.count ?? 0;
		const totalResults = passCount + failCount + warnCount;

		const passRate =
			totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;
		const warningRate =
			totalResults > 0 ? Math.round((warnCount / totalResults) * 100) : 0;
		const failRate =
			totalResults > 0 ? Math.round((failCount / totalResults) * 100) : 0;

		const recentRuns = await db
			.select({
				id: validationRun.id,
				name: validationRun.name,
				status: validationRun.status,
				passedChecks: validationRun.passedChecks,
				totalChecks: validationRun.totalChecks,
				createdAt: validationRun.createdAt,
			})
			.from(validationRun)
			.where(eq(validationRun.workspaceId, data.organizationId))
			.orderBy(desc(validationRun.createdAt))
			.limit(10);

		return {
			totalSpecs,
			totalEndpoints,
			totalMocks,
			totalRuns,
			passRate,
			warningRate,
			failRate,
			recentRuns,
		};
	});

export interface DailyCount {
	date: string;
	pass: number;
	fail: number;
	warning: number;
}

export const getDashboardCharts = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string; days?: number }) => input)
	.handler(async ({ data }): Promise<{ daily: DailyCount[] }> => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const days = data.days ?? 14;
		const since = new Date();
		since.setDate(since.getDate() - days);

		const rows = await db
			.select({
				date: sql<string>`DATE(${validationResult.createdAt})`,
				outcome: validationResult.outcome,
				count: count(),
			})
			.from(validationResult)
			.where(
				and(
					eq(validationResult.workspaceId, data.organizationId),
					gte(validationResult.createdAt, since),
				),
			)
			.groupBy(
				sql`DATE(${validationResult.createdAt})`,
				validationResult.outcome,
			)
			.orderBy(sql`DATE(${validationResult.createdAt})`);

		const dailyMap = new Map<string, DailyCount>();

		for (let i = days - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = d.toISOString().slice(0, 10);
			dailyMap.set(key, { date: key, pass: 0, fail: 0, warning: 0 });
		}

		for (const row of rows) {
			const entry = dailyMap.get(row.date);
			if (entry) {
				if (row.outcome === "pass") entry.pass = row.count;
				else if (row.outcome === "fail") entry.fail = row.count;
				else if (row.outcome === "warning") entry.warning = row.count;
			}
		}

		return { daily: Array.from(dailyMap.values()) };
	});
