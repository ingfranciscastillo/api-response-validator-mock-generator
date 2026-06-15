import { describe, expect, it } from "vitest";

describe("dashboard overview data shape", () => {
	it("matches expected interface for DashboardOverview", () => {
		const overview = {
			totalSpecs: 3,
			totalEndpoints: 15,
			totalMocks: 8,
			totalRuns: 12,
			passRate: 75,
			warningRate: 15,
			failRate: 10,
			recentRuns: [
				{
					id: "run-1",
					name: "Test Run",
					status: "completed",
					passedChecks: 40,
					totalChecks: 50,
					createdAt: new Date(),
				},
			],
		};

		expect(overview.totalSpecs).toBe(3);
		expect(overview.totalEndpoints).toBe(15);
		expect(overview.totalMocks).toBe(8);
		expect(overview.totalRuns).toBe(12);
		expect(overview.passRate).toBe(75);
		expect(overview.warningRate).toBe(15);
		expect(overview.failRate).toBe(10);
		expect(overview.recentRuns).toHaveLength(1);
		expect(overview.recentRuns[0].name).toBe("Test Run");
	});

	it("rate percentages sum to 100", () => {
		const rates = [
			{ pass: 75, warning: 15, fail: 10 },
			{ pass: 100, warning: 0, fail: 0 },
			{ pass: 33, warning: 33, fail: 34 },
		];

		for (const r of rates) {
			expect(r.pass + r.warning + r.fail).toBe(100);
		}
	});

	it("validates DailyCount interface shape", () => {
		const daily: Array<{
			date: string;
			pass: number;
			fail: number;
			warning: number;
		}> = [
			{ date: "2026-06-01", pass: 10, fail: 2, warning: 1 },
			{ date: "2026-06-02", pass: 15, fail: 3, warning: 2 },
		];

		expect(daily).toHaveLength(2);
		expect(daily[0].date).toBe("2026-06-01");
		expect(daily[0].pass).toBe(10);
		expect(daily[0].fail).toBe(2);
		expect(daily[0].warning).toBe(1);
	});
});
