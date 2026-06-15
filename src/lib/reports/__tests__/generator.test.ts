import { describe, expect, it } from "vitest";
import { generateHtmlReport } from "../generator";

const mockReportData = {
	generatedAt: "2026-06-14T00:00:00.000Z",
	summary: {
		totalRuns: 5,
		totalResults: 120,
		passCount: 90,
		warningCount: 20,
		failCount: 10,
		passRate: 75,
		warningRate: 17,
		failRate: 8,
	},
	dailyBreakdown: [
		{ date: "2026-06-01", pass: 10, warning: 2, fail: 1 },
		{ date: "2026-06-02", pass: 15, warning: 3, fail: 2 },
	],
	topViolations: [
		{ type: "type_mismatch", count: 8, severity: "error" },
		{ type: "missing_required", count: 5, severity: "error" },
	],
	endpointSummary: [
		{ method: "GET", path: "/users", total: 30, pass: 25, warning: 3, fail: 2 },
		{
			method: "POST",
			path: "/users",
			total: 20,
			pass: 15,
			warning: 4,
			fail: 1,
		},
	],
	runs: [
		{
			id: "run-1",
			name: "Nightly Run",
			status: "completed",
			totalChecks: 50,
			passedChecks: 40,
			warningChecks: 7,
			failedChecks: 3,
			createdAt: "2026-06-14T00:00:00.000Z",
		},
	],
};

describe("generateHtmlReport", () => {
	it("returns a complete HTML document", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("</html>");
	});

	it("includes the pass rate percentage", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("75%");
	});

	it("includes the warning rate percentage", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("17%");
	});

	it("includes the fail rate percentage", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("8%");
	});

	it("includes endpoint summary table", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("Endpoint Summary");
		expect(html).toContain("GET");
		expect(html).toContain("/users");
		expect(html).toContain("POST");
	});

	it("includes daily breakdown table", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("Daily Breakdown");
		expect(html).toContain("2026-06-01");
		expect(html).toContain("2026-06-02");
	});

	it("includes top violations section", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("Top Violations");
		expect(html).toContain("type_mismatch");
		expect(html).toContain("missing_required");
	});

	it("generated date appears in subtitle", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("Generated on 2026-06-14");
	});

	it("handles empty violations gracefully", () => {
		const noViolations = {
			...mockReportData,
			topViolations: [],
		};
		const html = generateHtmlReport(noViolations);
		expect(html).not.toContain("Top Violations");
	});

	it("includes total runs and total checks", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("5");
		expect(html).toContain("120");
	});

	it("includes endpoint count in coverage", () => {
		const html = generateHtmlReport(mockReportData);
		expect(html).toContain("endpoints tested");
		expect(html).toContain("2");
	});
});
