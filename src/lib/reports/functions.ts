import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { report } from "@/db/schema";
import { requireOrg } from "@/lib/auth/org";
import { generateAndStoreReport, generateValidationSummary } from "./generator";

export const createReport = createServerFn({ method: "POST" })
	.validator(
		(input: {
			name: string;
			description?: string;
			type?: string;
			runIds?: string[];
			days?: number;
		}) => input,
	)
	.handler(async ({ data }): Promise<{ id: string }> => {
		const { orgId, userId } = await requireOrg();

		const reportData = await generateValidationSummary(
			orgId,
			data.runIds,
			data.days ?? 30,
		);

		const id = crypto.randomUUID();
		const storageKeys = await generateAndStoreReport(
			data.type ?? "validation-summary",
			reportData,
			orgId,
			id,
		);

		await db.insert(report).values({
			id,
			workspaceId: orgId,
			name: data.name,
			description: data.description ?? null,
			type: data.type ?? "validation-summary",
			config: { runIds: data.runIds ?? null, days: data.days ?? 30 },
			data: reportData as unknown as Record<string, unknown>,
			htmlStorageKey: storageKeys.htmlStorageKey ?? null,
			jsonStorageKey: storageKeys.jsonStorageKey ?? null,
			status: "ready",
			generatedBy: userId,
		});

		return { id };
	});

export const getReports = createServerFn({ method: "GET" }).handler(
	async () => {
		const { orgId } = await requireOrg();

		return db
			.select({
				id: report.id,
				name: report.name,
				description: report.description,
				type: report.type,
				status: report.status,
				createdAt: report.createdAt,
			})
			.from(report)
			.where(eq(report.workspaceId, orgId))
			.orderBy(desc(report.createdAt));
	},
);

export const getReport = createServerFn({ method: "GET" })
	.validator((input: { reportId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		const row = await db
			.select()
			.from(report)
			.where(and(eq(report.id, data.reportId), eq(report.workspaceId, orgId)))
			.then((r) => r[0] ?? null);

		if (!row) throw new Error("Report not found");
		return row as unknown as {
			id: string;
			workspaceId: string;
			name: string;
			description: string | null;
			type: string;
			runId: string | null;
			config: object | null;
			data: object;
			status: string;
			generatedBy: string | null;
			createdAt: Date;
			updatedAt: Date;
		};
	});

export const deleteReport = createServerFn({ method: "POST" })
	.validator((input: { reportId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		await db
			.delete(report)
			.where(and(eq(report.id, data.reportId), eq(report.workspaceId, orgId)));
		return { success: true };
	});
