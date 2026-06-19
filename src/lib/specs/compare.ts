import { eq } from "drizzle-orm";
import diff from "microdiff";
import { downloadFromR2, isR2Configured } from "#/lib/storage";
import { db } from "@/db";
import { specificationVersion } from "@/db/schema";
export interface SpecChange {
	type: "REMOVE" | "CHANGE" | "CREATE";
	path: string[];
	value?: unknown;
	newValue?: unknown;
	breaking: boolean;
	severity: "high" | "medium" | "low";
	description: string;
}

export interface SpecComparison {
	fromVersion: number;
	toVersion: number;
	changes: SpecChange[];
	breakingCount: number;
	nonBreakingCount: number;
	summary: string;
}

function getSeverity(change: SpecChange): "high" | "medium" | "low" {
	if (!change.breaking) return "low";

	const path = change.path.join(".");

	// Eliminar un endpoint completo (todos sus métodos) o un método HTTP = high
	const removedWholePath =
		change.type === "REMOVE" && /^paths\.[^.]+$/.test(path);
	const removedMethod =
		change.type === "REMOVE" &&
		/^paths\.[^.]+\.(get|put|post|delete|patch|options|head)$/.test(path);

	if (removedWholePath || removedMethod) return "high";

	// required/enum removidos o cambios de tipo = medium
	return "medium";
}

async function resolveSpecContent(
	version: typeof specificationVersion.$inferSelect,
): Promise<Record<string, unknown>> {
	if (version.openapiSpec)
		return version.openapiSpec as Record<string, unknown>;
	if (version.storageKey && isR2Configured()) {
		const buf = await downloadFromR2(version.storageKey);
		return JSON.parse(buf.toString());
	}
	throw new Error(`No spec content available for version ${version.id}`);
}

function isBreakingChange(change: SpecChange): boolean {
	const path = change.path.join(".");

	if (
		change.type === "REMOVE" &&
		path.startsWith("paths.") &&
		path.split(".").length === 2
	) {
		return true;
	}

	if (
		change.type === "REMOVE" &&
		/^paths\.[^.]+\.(get|put|post|delete|patch|options|head)$/.test(path)
	) {
		return true;
	}

	if (change.type === "REMOVE" && path.includes(".required")) {
		return true;
	}

	if (change.type === "REMOVE" && path.includes(".enum")) {
		return true;
	}

	if (change.type === "CHANGE" && path.endsWith(".type")) {
		return true;
	}

	if (change.type === "CREATE" && path.includes(".required")) {
		return true;
	}

	return false;
}

export async function compareSpecificationVersions(
	fromVersionId: string,
	toVersionId: string,
): Promise<SpecComparison> {
	const [fromVer, toVer] = await Promise.all([
		db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.id, fromVersionId))
			.then((r) => r[0]),
		db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.id, toVersionId))
			.then((r) => r[0]),
	]);

	if (!fromVer || !toVer) throw new Error("Version not found");

	const fromSpec = await resolveSpecContent(fromVer);
	const toSpec = await resolveSpecContent(toVer);

	const rawDiffs = diff(fromSpec, toSpec);

	const changes: SpecChange[] = rawDiffs.map((d) => {
		const pathStr = d.path.map(String).join(".");

		let description = "";
		let value: unknown | undefined;
		let newValue: unknown | undefined;

		if (d.type === "REMOVE") {
			description = `Removed ${pathStr}`;
			value = d.oldValue;
		} else if (d.type === "CREATE") {
			description = `Added ${pathStr}`;
			newValue = d.value;
		} else {
			description = `Changed ${pathStr}`;
			value = d.oldValue;
			newValue = d.value;
		}

		const change: SpecChange = {
			type: d.type,
			path: d.path.map(String),
			value,
			newValue,
			breaking: false,
			severity: "low",
			description,
		};

		change.breaking = isBreakingChange(change);
		change.severity = getSeverity(change);
		return change;
	});

	const breakingCount = changes.filter((c) => c.breaking).length;
	const nonBreakingCount = changes.length - breakingCount;

	const summary =
		breakingCount > 0
			? `${breakingCount} breaking change${breakingCount !== 1 ? "s" : ""} detected`
			: `${nonBreakingCount} non-breaking change${nonBreakingCount !== 1 ? "s" : ""}`;

	return {
		fromVersion: fromVer.version,
		toVersion: toVer.version,
		changes,
		breakingCount,
		nonBreakingCount,
		summary,
	};
}
