import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { report } from "@/db/schema";
import { auth } from "@/lib/auth";
import { generateValidationSummary } from "./generator";

export const createReport = createServerFn({ method: "POST" })
	.validator(
		(input: {
			organizationId: string;
			name: string;
			description?: string;
			type?: string;
			runIds?: string[];
			days?: number;
		}) => input,
	)
	.handler(async ({ data }): Promise<{ id: string }> => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const reportData = await generateValidationSummary(
			data.organizationId,
			data.runIds,
			data.days ?? 30,
		);

		const id = crypto.randomUUID();
		await db.insert(report).values({
			id,
			workspaceId: data.organizationId,
			name: data.name,
			description: data.description ?? null,
			type: data.type ?? "validation-summary",
			config: { runIds: data.runIds ?? null, days: data.days ?? 30 },
			data: reportData as unknown as Record<string, unknown>,
			status: "ready",
			generatedBy: session.user.id,
		});

		return { id };
	});

export const getReports = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

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
			.where(eq(report.workspaceId, data.organizationId))
			.orderBy(desc(report.createdAt));
	});

export const getReport = createServerFn({ method: "GET" })
	.validator((input: { reportId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const row = await db
			.select()
			.from(report)
			.where(eq(report.id, data.reportId))
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
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db.delete(report).where(eq(report.id, data.reportId));
		return { success: true };
	});
