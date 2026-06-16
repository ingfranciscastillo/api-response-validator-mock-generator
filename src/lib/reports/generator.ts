import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { endpoint, validationResult, validationRun } from "@/db/schema";

export interface ReportData {
	generatedAt: string;
	summary: {
		totalRuns: number;
		totalResults: number;
		passCount: number;
		warningCount: number;
		failCount: number;
		passRate: number;
		warningRate: number;
		failRate: number;
	};
	dailyBreakdown: Array<{
		date: string;
		pass: number;
		warning: number;
		fail: number;
	}>;
	topViolations: Array<{
		type: string;
		count: number;
		severity: string;
	}>;
	endpointSummary: Array<{
		method: string;
		path: string;
		total: number;
		pass: number;
		warning: number;
		fail: number;
	}>;
	runs: Array<{
		id: string;
		name: string | null;
		status: string;
		totalChecks: number;
		passedChecks: number;
		warningChecks: number;
		failedChecks: number;
		createdAt: string;
	}>;
}

export async function generateValidationSummary(
	organizationId: string,
	runIds?: string[],
	days?: number,
): Promise<ReportData> {
	const since = new Date();
	since.setDate(since.getDate() - (days ?? 30));

	const runFilter = and(
		eq(validationRun.workspaceId, organizationId),
		gte(validationRun.createdAt, since),
	);

	const runs = await db
		.select()
		.from(validationRun)
		.where(
			runIds?.length
				? and(runFilter, ...runIds.map((id) => eq(validationRun.id, id)))
				: runFilter,
		)
		.orderBy(desc(validationRun.createdAt));

	const resultFilter = runIds?.length
		? and(
				eq(validationResult.workspaceId, organizationId),
				...runIds.map((id) => eq(validationResult.runId, id)),
			)
		: and(
				eq(validationResult.workspaceId, organizationId),
				gte(validationResult.createdAt, since),
			);

	const allResults = await db
		.select()
		.from(validationResult)
		.where(resultFilter)
		.orderBy(desc(validationResult.createdAt));

	const passCount = allResults.filter((r) => r.outcome === "pass").length;
	const failCount = allResults.filter((r) => r.outcome === "fail").length;
	const warningCount = allResults.filter((r) => r.outcome === "warning").length;
	const totalResults = allResults.length;

	const passRate =
		totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;
	const warningRate =
		totalResults > 0 ? Math.round((warningCount / totalResults) * 100) : 0;
	const failRate =
		totalResults > 0 ? Math.round((failCount / totalResults) * 100) : 0;

	const dailyMap = new Map<
		string,
		{ pass: number; warning: number; fail: number }
	>();
	for (let i = (days ?? 30) - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const key = d.toISOString().slice(0, 10);
		dailyMap.set(key, { pass: 0, warning: 0, fail: 0 });
	}
	for (const r of allResults) {
		const key = new Date(r.createdAt).toISOString().slice(0, 10);
		const entry = dailyMap.get(key);
		if (entry) {
			if (r.outcome === "pass") entry.pass++;
			else if (r.outcome === "fail") entry.fail++;
			else if (r.outcome === "warning") entry.warning++;
		}
	}

	const violationCount = new Map<string, { count: number; severity: string }>();
	for (const r of allResults) {
		const violations = r.violations as Array<{
			type: string;
			severity: string;
		}> | null;
		if (violations) {
			for (const v of violations) {
				const existing = violationCount.get(v.type);
				if (existing) {
					existing.count++;
				} else {
					violationCount.set(v.type, { count: 1, severity: v.severity });
				}
			}
		}
	}

	const distinctEndpointIds = [
		...new Set(allResults.map((r) => r.endpointId).filter(Boolean)),
	];
	const endpointsMap = new Map<string, { method: string; path: string }>();
	if (distinctEndpointIds.length > 0) {
		const eps = await db
			.select({ id: endpoint.id, method: endpoint.method, path: endpoint.path })
			.from(endpoint)
			.where(and(...distinctEndpointIds.map((id) => eq(endpoint.id, id!))));
		for (const ep of eps) {
			endpointsMap.set(ep.id, { method: ep.method, path: ep.path });
		}
	}

	const epAgg = new Map<
		string,
		{ total: number; pass: number; warning: number; fail: number }
	>();
	for (const r of allResults) {
		if (!r.endpointId) continue;
		const ep = epAgg.get(r.endpointId) ?? {
			total: 0,
			pass: 0,
			warning: 0,
			fail: 0,
		};
		ep.total++;
		if (r.outcome === "pass") ep.pass++;
		else if (r.outcome === "fail") ep.fail++;
		else if (r.outcome === "warning") ep.warning++;
		epAgg.set(r.endpointId, ep);
	}

	const endpointSummary = Array.from(epAgg.entries())
		.map(([id, data]) => {
			const info = endpointsMap.get(id);
			return {
				method: info?.method ?? "UNKNOWN",
				path: info?.path ?? id,
				...data,
			};
		})
		.sort((a, b) => b.total - a.total);

	return {
		generatedAt: new Date().toISOString(),
		summary: {
			totalRuns: runs.length,
			totalResults,
			passCount,
			warningCount,
			failCount,
			passRate,
			warningRate,
			failRate,
		},
		dailyBreakdown: Array.from(dailyMap.entries()).map(([date, v]) => ({
			date,
			...v,
		})),
		topViolations: Array.from(violationCount.entries())
			.map(([type, v]) => ({ type, ...v }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 20),
		endpointSummary,
		runs: runs.map((r) => ({
			id: r.id,
			name: r.name,
			status: r.status,
			totalChecks: r.totalChecks,
			passedChecks: r.passedChecks,
			warningChecks: r.warningChecks,
			failedChecks: r.failedChecks,
			createdAt: r.createdAt.toISOString(),
		})),
	};
}

export function generateHtmlReport(data: ReportData): string {
	const passPct = data.summary.passRate;
	const warnPct = data.summary.warningRate;
	const failPct = data.summary.failRate;

	const rows = data.endpointSummary
		.map(
			(ep) => `
		<tr>
			<td style="padding:6px 12px;border:1px solid #ddd;"><strong>${ep.method}</strong></td>
			<td style="padding:6px 12px;border:1px solid #ddd;font-family:monospace;">${ep.path}</td>
			<td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${ep.total}</td>
			<td style="padding:6px 12px;border:1px solid #ddd;text-align:center;color:#16a34a;">${ep.pass}</td>
			<td style="padding:6px 12px;border:1px solid #ddd;text-align:center;color:#ca8a04;">${ep.warning}</td>
			<td style="padding:6px 12px;border:1px solid #ddd;text-align:center;color:#dc2626;">${ep.fail}</td>
		</tr>`,
		)
		.join("");

	const dailyRows = data.dailyBreakdown
		.map(
			(d) => `
		<tr>
			<td style="padding:4px 8px;border:1px solid #ddd;">${d.date}</td>
			<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;color:#16a34a;">${d.pass}</td>
			<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;color:#ca8a04;">${d.warning}</td>
			<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;color:#dc2626;">${d.fail}</td>
		</tr>`,
		)
		.join("");

	const violationRows = data.topViolations
		.map(
			(v) => `
		<tr>
			<td style="padding:4px 8px;border:1px solid #ddd;font-family:monospace;">${v.type}</td>
			<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${v.count}</td>
			<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${v.severity}</td>
		</tr>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Validation Report</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; color: #1a1a2e; background: #f8f9fa; }
.container { max-width: 960px; margin: 0 auto; padding: 24px; }
h1 { font-size: 24px; margin-bottom: 4px; }
.subtitle { color: #6b7280; margin-bottom: 24px; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.stat-card h3 { font-size: 14px; color: #6b7280; margin: 0 0 8px 0; }
.stat-card .value { font-size: 28px; font-weight: 700; }
.stat-card .value.green { color: #16a34a; }
.stat-card .value.yellow { color: #ca8a04; }
.stat-card .value.red { color: #dc2626; }
.card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
.card h2 { font-size: 16px; margin: 0 0 12px 0; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: #f3f4f6; text-align: left; padding: 6px 12px; border: 1px solid #ddd; font-weight: 600; }
</style>
</head>
<body>
<div class="container">
	<h1>API Validation Report</h1>
	<p class="subtitle">Generated on ${data.generatedAt.slice(0, 10)}</p>

	<div class="stats-grid">
		<div class="stat-card">
			<h3>Pass Rate</h3>
			<div class="value green">${passPct}%</div>
		</div>
		<div class="stat-card">
			<h3>Warning Rate</h3>
			<div class="value yellow">${warnPct}%</div>
		</div>
		<div class="stat-card">
			<h3>Fail Rate</h3>
			<div class="value red">${failPct}%</div>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<h3>Total Runs</h3>
			<div class="value">${data.summary.totalRuns}</div>
		</div>
		<div class="stat-card">
			<h3>Total Checks</h3>
			<div class="value">${data.summary.totalResults}</div>
		</div>
		<div class="stat-card">
			<h3>Coverage</h3>
			<div class="value">${data.endpointSummary.length}</div>
			<div style="font-size:12px;color:#6b7280;">endpoints tested</div>
		</div>
	</div>

	<div class="card">
		<h2>Endpoint Summary</h2>
		<table>
			<thead>
				<tr>
					<th>Method</th>
					<th>Path</th>
					<th>Total</th>
					<th>Pass</th>
					<th>Warning</th>
					<th>Fail</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
		</table>
	</div>

	<div class="card">
		<h2>Daily Breakdown</h2>
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Pass</th>
					<th>Warning</th>
					<th>Fail</th>
				</tr>
			</thead>
			<tbody>${dailyRows}</tbody>
		</table>
	</div>

	${
		violationRows
			? `
	<div class="card">
		<h2>Top Violations</h2>
		<table>
			<thead>
				<tr>
					<th>Type</th>
					<th>Count</th>
					<th>Severity</th>
				</tr>
			</thead>
			<tbody>${violationRows}</tbody>
		</table>
	</div>`
			: ""
	}
	</div>
</body>
</html>`;
}

import { buildStorageKey, isR2Configured, uploadToR2 } from "#/lib/storage";

export async function generateAndStoreReport(
	type: string,
	data: ReportData,
	workspaceId: string,
	reportId: string,
): Promise<{ htmlStorageKey?: string; jsonStorageKey?: string }> {
	const html = await generateHtmlReport(data);
	const jsonStr = JSON.stringify(data, null, 2);
	const result: { htmlStorageKey?: string; jsonStorageKey?: string } = {};

	if (isR2Configured()) {
		const htmlKey = buildStorageKey(
			workspaceId,
			"reports",
			reportId,
			"report.html",
		);
		const jsonKey = buildStorageKey(
			workspaceId,
			"reports",
			reportId,
			"report.json",
		);
		await uploadToR2(htmlKey, html, "text/html");
		await uploadToR2(jsonKey, jsonStr, "application/json");
		result.htmlStorageKey = htmlKey;
		result.jsonStorageKey = jsonKey;
	}

	return result;
}
