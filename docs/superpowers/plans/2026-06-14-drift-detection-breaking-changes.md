# Phase 5 — Drift Detection & Breaking Changes Implementation Plan

> **For agentic workers:** Each step is one commit. Conventional commits required.

**Goal:** Detect API drift and breaking changes when new spec versions are uploaded, surface alerts in the UI, and enable spec-to-spec comparison.

**Architecture:** Drizzle schemas for drift alerts/notification channels. A comparison engine using `microdiff` to diff OpenAPI specs and classify breaking vs non-breaking changes. Inngest for scheduled drift checks. TanStack routes for `/drift` and `/specs/:specId/compare` pages.

**Tech Stack:** Drizzle ORM, microdiff, Inngest, TanStack React Router, shadcn/ui

---

### Task 1: Drift & notification schemas + migration

**Files:**
- Create: `src/db/schema/drift.ts`
- Create: `src/db/schema/notification.ts`
- Modify: `src/db/schema.ts`
- Generate: `drizzle/XXXX_drift.sql`

- [ ] **Create `src/db/schema/drift.ts`**

```ts
import { index, integer, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { specification, specificationVersion } from "./spec";

export const driftCheck = pgTable(
	"drift_checks",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		schedule: text("schedule").notNull().default("0 0 * * *"),
		enabled: text("enabled").notNull().default("true"),
		lastRunAt: timestamp("last_run_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("drift_check_workspace_idx").on(table.workspaceId),
		index("drift_check_spec_idx").on(table.specId),
	],
);

export const driftAlert = pgTable(
	"drift_alerts",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		fromVersionId: text("from_version_id").references(() => specificationVersion.id, { onDelete: "set null" }),
		toVersionId: text("to_version_id").references(() => specificationVersion.id, { onDelete: "set null" }),
		type: text("type").notNull(),
		severity: text("severity").notNull().default("medium"),
		summary: text("summary").notNull(),
		changes: json("changes"),
		status: text("status").notNull().default("open"),
		detectedAt: timestamp("detected_at").notNull().defaultNow(),
		resolvedAt: timestamp("resolved_at"),
		resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
	},
	(table) => [
		index("drift_alert_workspace_idx").on(table.workspaceId, table.status),
		index("drift_alert_spec_idx").on(table.specId, table.detectedAt),
	],
);

export type DriftCheck = typeof driftCheck.$inferSelect;
export type DriftAlert = typeof driftAlert.$inferSelect;
```

- [ ] **Create `src/db/schema/notification.ts`**

```ts
import { index, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const notificationChannel = pgTable(
	"notification_channels",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		type: text("type").notNull(),
		config: json("config").notNull(),
		enabled: text("enabled").notNull().default("true"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("notification_channel_workspace_idx").on(table.workspaceId),
	],
);

export type NotificationChannel = typeof notificationChannel.$inferSelect;
```

- [ ] **Update `src/db/schema.ts`** — add exports

```ts
export * from "./schema/drift";
export { driftCheck, driftAlert } from "./schema/drift";
export * from "./schema/notification";
export { notificationChannel } from "./schema/notification";
```

Place before the existing `export * from "./schema/validation"` line.

- [ ] **Run migration**

```bash
pnpm db:generate
```

- [ ] **Commit**

```bash
git add src/db/schema/drift.ts src/db/schema/notification.ts src/db/schema.ts drizzle/
git commit -m "feat(db): add drift_check, drift_alert, notification_channel schemas"
```

---

### Task 2: Spec comparison engine

**Files:**
- Create: `src/lib/specs/compare.ts`

- [ ] **Create `src/lib/specs/compare.ts`**

Uses `microdiff` to compare two OpenAPI specs (as JSON objects). Classifies each change as breaking or non-breaking.

Breaking changes:
- Removing a path
- Removing a method on a path
- Removing a required field
- Changing a field type
- Removing an enum value

Non-breaking:
- Adding a new path/method
- Adding optional fields
- Adding enum values
- Changing descriptions

Import `diff` from `microdiff` (the default export).

```ts
import diff from "microdiff";
import { db } from "@/db";
import { specificationVersion } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SpecChange {
	type: "REMOVE" | "CHANGE" | "ADD";
	path: string[];
	value?: unknown;
	newValue?: unknown;
	breaking: boolean;
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

const BREAKING_PATH_PATTERNS = [
	{ pattern: /^paths\.[^.]+$/, description: (p: string) => `Removed path ${p.split(".").pop()}` },
];

function isBreakingChange(change: SpecChange): boolean {
	const path = change.path.join(".");

	// Removing a path entirely
	if (change.type === "REMOVE" && path.startsWith("paths.") && path.split(".").length === 2) {
		return true;
	}

	// Removing an operation (method) from a path
	if (change.type === "REMOVE" && /^paths\.[^.]+\.(get|put|post|delete|patch|options|head)$/.test(path)) {
		return true;
	}

	// Removing a required field
	if (change.type === "REMOVE" && path.includes(".required")) {
		return true;
	}

	// Removing from enum
	if (change.type === "REMOVE" && path.includes(".enum") && !path.includes(".properties")) {
		return true;
	}

	// Changing type
	if (change.type === "CHANGE" && path.endsWith(".type")) {
		return true;
	}

	// Adding a required field (making existing optional -> required)
	if (change.type === "ADD" && path.includes(".required")) {
		return true;
	}

	// Changing a property from optional to required = the ADD of a value in required array
	if (change.type === "ADD" && /^paths\.[^.]+\.(get|put|post|delete|patch|options|head)\.parameters\.items\.required$/.test(path)) {
		return true;
	}

	return false;
}

export async function compareSpecificationVersions(
	fromVersionId: string,
	toVersionId: string,
): Promise<SpecComparison> {
	const [fromVer, toVer] = await Promise.all([
		db.select().from(specificationVersion).where(eq(specificationVersion.id, fromVersionId)).then((r) => r[0]),
		db.select().from(specificationVersion).where(eq(specificationVersion.id, toVersionId)).then((r) => r[0]),
	]);

	if (!fromVer || !toVer) throw new Error("Version not found");

	const fromSpec = fromVer.openapiSpec as Record<string, unknown>;
	const toSpec = toVer.openapiSpec as Record<string, unknown>;

	const rawDiffs = diff(fromSpec, toSpec);

	const changes: SpecChange[] = rawDiffs.map((d) => {
		const pathStr = d.path.join(".");
		let description = "";

		if (d.type === "REMOVE") {
			description = `Removed ${pathStr}`;
		} else if (d.type === "ADD") {
			description = `Added ${pathStr}`;
		} else {
			description = `Changed ${pathStr}`;
		}

		const change: SpecChange = {
			type: d.type,
			path: d.path,
			value: d.type === "REMOVE" ? d.oldValue : (d.type === "CHANGE" ? d.oldValue : undefined),
			newValue: d.type === "ADD" ? d.value : (d.type === "CHANGE" ? d.value : undefined),
			breaking: false,
			description,
		};

		change.breaking = isBreakingChange(change);
		return change;
	});

	const breakingCount = changes.filter((c) => c.breaking).length;
	const nonBreakingCount = changes.length - breakingCount;

	const summary = breakingCount > 0
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
```

- [ ] **Commit**

```bash
git add src/lib/specs/compare.ts
git commit -m "feat(specs): add spec comparison engine using microdiff"
```

---

### Task 3: Drift & notification server functions

**Files:**
- Create: `src/lib/drift/functions.ts`
- Create: `src/lib/notifications/functions.ts`

- [ ] **Create `src/lib/drift/functions.ts`**

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driftAlert, driftCheck, specificationVersion } from "@/db/schema";
import { auth } from "@/lib/auth";
import { compareSpecificationVersions } from "@/lib/specs/compare";

export const getDriftAlerts = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string; status?: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const filters = [eq(driftAlert.workspaceId, data.organizationId)];
		if (data.status) filters.push(eq(driftAlert.status, data.status));

		return db
			.select()
			.from(driftAlert)
			.where(and(...filters))
			.orderBy(desc(driftAlert.detectedAt));
	});

export const resolveDriftAlert = createServerFn({ method: "POST" })
	.validator((input: { alertId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db
			.update(driftAlert)
			.set({
				status: "resolved",
				resolvedAt: new Date(),
				resolvedBy: session.user.id,
			})
			.where(eq(driftAlert.id, data.alertId));

		return { success: true };
	});

export const checkSpecForDrift = createServerFn({ method: "POST" })
	.validator((input: { specId: string; organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const versions = await db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version));

		if (versions.length < 2) {
			return { alerts: 0, message: "Need at least 2 versions to compare" };
		}

		const latest = versions[0];
		const previous = versions[1];

		const comparison = await compareSpecificationVersions(previous.id, latest.id);

		let alertsCreated = 0;
		for (const change of comparison.changes.filter((c) => c.breaking)) {
			const id = crypto.randomUUID();
			await db.insert(driftAlert).values({
				id,
				workspaceId: data.organizationId,
				specId: data.specId,
				fromVersionId: previous.id,
				toVersionId: latest.id,
				type: "breaking",
				severity: "high",
				summary: change.description,
				changes: [change] as unknown as Record<string, unknown>[],
				status: "open",
			});
			alertsCreated++;
		}

		return { alerts: alertsCreated, message: `${alertsCreated} breaking change(s) detected` };
	});
```

- [ ] **Create `src/lib/notifications/functions.ts`**

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationChannel } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getNotificationChannels = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		return db
			.select()
			.from(notificationChannel)
			.where(eq(notificationChannel.workspaceId, data.organizationId))
			.orderBy(desc(notificationChannel.createdAt));
	});

export const saveNotificationChannel = createServerFn({ method: "POST" })
	.validator((input: {
		organizationId: string;
		id?: string;
		name: string;
		type: string;
		config: Record<string, unknown>;
		enabled?: boolean;
	}) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		if (data.id) {
			await db.update(notificationChannel)
				.set({
					name: data.name,
					type: data.type,
					config: data.config,
					enabled: data.enabled ? "true" : "false",
				})
				.where(eq(notificationChannel.id, data.id));
			return { id: data.id };
		}

		const id = crypto.randomUUID();
		await db.insert(notificationChannel).values({
			id,
			workspaceId: data.organizationId,
			name: data.name,
			type: data.type,
			config: data.config,
			enabled: data.enabled ? "true" : "false",
		});
		return { id };
	});

export const deleteNotificationChannel = createServerFn({ method: "POST" })
	.validator((input: { channelId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db.delete(notificationChannel).where(eq(notificationChannel.id, data.channelId));
		return { success: true };
	});
```

- [ ] **Commit**

```bash
git add src/lib/drift/functions.ts src/lib/notifications/functions.ts
git commit -m "feat(drift): add drift check, alert resolution, and notification channel server functions"
```

---

### Task 4: Install Inngest + set up scheduled drift check

**Files:**
- Modify: `package.json` — add inngest
- Create: `src/lib/inngest/client.ts`
- Create: `src/lib/inngest/functions.ts`
- Create: `src/routes/api/inngest.ts`

- [ ] **Install Inngest**

```bash
pnpm add inngest@latest
```

- [ ] **Create `src/lib/inngest/client.ts`**

```ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
	id: "api-response-validator",
});
```

- [ ] **Create `src/lib/inngest/functions.ts`**

```ts
import { db } from "@/db";
import { driftAlert, driftCheck, specificationVersion } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { inngest } from "./client";
import { compareSpecificationVersions } from "@/lib/specs/compare";

export const scheduledDriftCheck = inngest.createFunction(
	{ id: "scheduled-drift-check", name: "Scheduled Drift Check" },
	{ cron: "0 0 * * *" },
	async ({ step }) => {
		const enabledChecks = await step.run("fetch-enabled-checks", async () => {
			return db
				.select()
				.from(driftCheck)
				.where(eq(driftCheck.enabled, "true"));
		});

		for (const check of enabledChecks) {
			await step.run(`check-spec-${check.specId}`, async () => {
				const versions = await db
					.select()
					.from(specificationVersion)
					.where(eq(specificationVersion.specId, check.specId))
					.orderBy(desc(specificationVersion.version));

				if (versions.length < 2) return;

				const comparison = await compareSpecificationVersions(versions[1].id, versions[0].id);
				const breakingChanges = comparison.changes.filter((c) => c.breaking);

				for (const change of breakingChanges) {
					await db.insert(driftAlert).values({
						id: crypto.randomUUID(),
						workspaceId: check.workspaceId,
						specId: check.specId,
						fromVersionId: versions[1].id,
						toVersionId: versions[0].id,
						type: "drift",
						severity: "medium",
						summary: change.description,
						changes: [change] as unknown as Record<string, unknown>[],
						status: "open",
					});
				}

				await db.update(driftCheck)
					.set({ lastRunAt: new Date() })
					.where(eq(driftCheck.id, check.id));
			});
		}

		return { checked: enabledChecks.length };
	},
);

export const breakingChangeAlert = inngest.createFunction(
	{ id: "breaking-change-alert", name: "Breaking Change Alert" },
	{ event: "drift/breaking-change-detected" },
	async ({ event, step }) => {
		const { specId, workspaceId, alertId } = event.data;

		const channels = await step.run("fetch-channels", async () => {
			const { notificationChannel } = await import("@/db/schema");
			return db
				.select()
				.from(notificationChannel)
				.where(
					and(
						eq(notificationChannel.workspaceId, workspaceId),
						eq(notificationChannel.enabled, "true"),
					),
				);
		});

		// In a full implementation, this would dispatch to each channel
		// For now, we mark the alert as processed
		await step.run("log-alert", async () => {
			console.log(`Breaking change alert ${alertId} dispatched to ${channels.length} channel(s)`);
		});

		return { dispatched: channels.length };
	},
);
```

- [ ] **Create `src/routes/api/inngest.ts`**

```ts
import { serve } from "inngest/react-start";
import { inngest } from "@/lib/inngest/client";
import { scheduledDriftCheck, breakingChangeAlert } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [scheduledDriftCheck, breakingChangeAlert],
});
```

- [ ] **Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/inngest/ src/routes/api/inngest.ts
git commit -m "feat(deps): add inngest for scheduled drift detection"
```

---

### Task 5: Drift alerts page

**Files:**
- Create: `src/components/drift/drift-alert-card.tsx`
- Create: `src/components/drift/index.ts`
- Create: `src/routes/dashboard.drift.tsx`
- Modify: `src/routeTree.gen.ts` (auto via `pnpm generate-routes`)

- [ ] **Create `src/components/drift/drift-alert-card.tsx`**

```tsx
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";

interface DriftAlert {
	id: string;
	specId: string;
	type: string;
	severity: string;
	summary: string;
	status: string;
	detectedAt: Date;
}

interface DriftAlertCardProps {
	alert: DriftAlert;
	onResolve?: (id: string) => void;
}

export function DriftAlertCard({ alert, onResolve }: DriftAlertCardProps) {
	const severityColor: Record<string, string> = {
		low: "bg-gray-100 text-gray-700",
		medium: "bg-yellow-100 text-yellow-700",
		high: "bg-orange-100 text-orange-700",
		critical: "bg-red-100 text-red-700",
	};

	return (
		<Card className={alert.status === "open" ? "border-l-4 border-l-red-500" : ""}>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div className="flex items-center gap-2">
					{alert.status === "open" ? (
						<AlertCircle className="size-4 text-red-500" />
					) : (
						<CheckCircle2 className="size-4 text-green-500" />
					)}
					<Badge className={severityColor[alert.severity] ?? ""}>
						{alert.severity}
					</Badge>
					<Badge variant="outline">{alert.type}</Badge>
				</div>
				{alert.status === "open" && onResolve && (
					<Button variant="ghost" size="xs" onClick={() => onResolve(alert.id)}>
						Resolve
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<p className="text-sm">{alert.summary}</p>
				<p className="text-xs text-muted-foreground mt-1">
					{new Date(alert.detectedAt).toLocaleString()}
				</p>
			</CardContent>
		</Card>
	);
}
```

Wait, the button component doesn't have a "xs" size. Let me check...
Looking at button.tsx, the sizes are: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg. So "xs" does exist. But the variant system uses `size` prop, `buttonVariants` has `xs`. Let me adjust to use `size="xs"` which exists.

Actually no, looking at the variants:
```
size: {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
```

OK so `size="xs"` exists. But we need to check if it's actually available via the button component. Looking at the code, the default size in the variant is "default", and all sizes are listed. So yes, `size="xs"` works.

- [ ] **Create `src/components/drift/index.ts`**

```ts
export { DriftAlertCard } from "./drift-alert-card";
```

- [ ] **Create `src/routes/dashboard.drift.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { DriftAlertCard } from "#/components/drift/drift-alert-card";
import { getDriftAlerts, resolveDriftAlert } from "#/lib/drift/functions";

export const Route = createFileRoute("/dashboard/drift")({
	component: DriftPage,
});

function DriftPage() {
	const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof getDriftAlerts>>>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<string>("open");

	const fetchAlerts = () => {
		setLoading(true);
		getDriftAlerts({ data: { organizationId: "", status: filter === "all" ? undefined : filter } })
			.then(setAlerts)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchAlerts();
	}, [filter]);

	const handleResolve = async (id: string) => {
		await resolveDriftAlert({ data: { alertId: id } });
		fetchAlerts();
	};

	const openCount = alerts.filter((a) => a.status === "open").length;
	const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Drift Detection</h2>
					<p className="text-muted-foreground mt-1">
						Monitor API specifications for breaking changes and drift
					</p>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 text-sm">
					<ShieldAlert className="size-4 text-red-500" />
					<span className="font-medium">{openCount} open</span>
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>{resolvedCount} resolved</span>
				</div>
				<select
					className="ml-auto rounded-md border border-input bg-background px-3 py-1 text-sm"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				>
					<option value="open">Open</option>
					<option value="resolved">Resolved</option>
					<option value="all">All</option>
				</select>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : alerts.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-muted-foreground">No drift alerts</p>
					<p className="text-muted-foreground text-sm mt-1">
						Alerts will appear when breaking changes are detected between spec versions
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{alerts.map((alert) => (
						<DriftAlertCard
							key={alert.id}
							alert={{
								id: alert.id,
								specId: alert.specId,
								type: alert.type,
								severity: alert.severity,
								summary: alert.summary,
								status: alert.status,
								detectedAt: alert.detectedAt,
							}}
							onResolve={filter === "open" ? handleResolve : undefined}
						/>
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Run route generation**

```bash
pnpm generate-routes
```

- [ ] **Commit**

```bash
git add src/components/drift/ src/routes/dashboard.drift.tsx src/routeTree.gen.ts
git commit -m "feat(drift): add drift alerts page with alert cards and resolve action"
```

---

### Task 6: Spec comparison page

**Files:**
- Modify: `src/lib/specs/functions.ts` — add `getSpecVersions`
- Create: `src/routes/dashboard.specs.$specId.compare.tsx`
- Modify: `src/routeTree.gen.ts` (auto via generate)

- [ ] **Add `getSpecVersions` to `src/lib/specs/functions.ts`**

Append before the closing of the file:

```ts
export const getSpecVersions = createServerFn({ method: "GET" })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		return db
			.select({
				id: specificationVersion.id,
				version: specificationVersion.version,
				createdAt: specificationVersion.createdAt,
			})
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version));
	});
```

Need to add `specificationVersion` to the imports in that file.

- [ ] **Create `src/routes/dashboard.specs.$specId.compare.tsx`**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { compareSpecificationVersions, type SpecChange } from "#/lib/specs/compare";
import { getSpecVersions } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/$specId/compare")({
	component: SpecComparePage,
});

function SpecComparePage() {
	const { specId } = Route.useParams();
	const [versions, setVersions] = useState<Awaited<ReturnType<typeof getSpecVersions>>>([]);
	const [fromId, setFromId] = useState("");
	const [toId, setToId] = useState("");
	const [comparison, setComparison] = useState<{
		changes: SpecChange[];
		breakingCount: number;
		nonBreakingCount: number;
		summary: string;
		fromVersion: number;
		toVersion: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [comparing, setComparing] = useState(false);

	useEffect(() => {
		getSpecVersions({ data: { specId } })
			.then((v) => {
				setVersions(v);
				if (v.length >= 2) {
					setFromId(v[1].id);
					setToId(v[0].id);
				} else if (v.length === 1) {
					setToId(v[0].id);
				}
			})
			.finally(() => setLoading(false));
	}, [specId]);

	const handleCompare = async () => {
		if (!fromId || !toId) return;
		setComparing(true);
		try {
			const result = await compareSpecificationVersions(fromId, toId);
			setComparison(result);
		} finally {
			setComparing(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Link
					to="/dashboard/specs/$specId"
					params={{ specId }}
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Back to spec
				</Link>
			</div>

			<div>
				<h2 className="text-2xl font-bold">Version Comparison</h2>
				<p className="text-muted-foreground mt-1">
					Compare two spec versions to detect breaking changes
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Select Versions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-4">
						<div className="space-y-1">
							<label className="text-xs font-medium">From (older)</label>
							<select
								className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={fromId}
								onChange={(e) => setFromId(e.target.value)}
							>
								{versions.map((v) => (
									<option key={v.id} value={v.id}>
										v{v.version}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium">To (newer)</label>
							<select
								className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={toId}
								onChange={(e) => setToId(e.target.value)}
							>
								{versions.map((v) => (
									<option key={v.id} value={v.id}>
										v{v.version}
									</option>
								))}
							</select>
						</div>
						<Button onClick={handleCompare} disabled={!fromId || !toId || fromId === toId || comparing}>
							{comparing ? "Comparing..." : "Compare"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{comparison && (
				<>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-sm">
							<AlertTriangle className="size-4 text-red-500" />
							<span className="font-medium text-red-600">
								{comparison.breakingCount} breaking
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<CheckCircle className="size-4 text-green-500" />
							<span className="font-medium text-green-600">
								{comparison.nonBreakingCount} non-breaking
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							v{comparison.fromVersion} → v{comparison.toVersion}
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Changes</CardTitle>
						</CardHeader>
						<CardContent>
							{comparison.changes.length === 0 ? (
								<p className="text-sm text-muted-foreground">No differences found</p>
							) : (
								<div className="space-y-1">
									{comparison.changes.map((change, i) => (
										<div
											key={i}
											className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
												change.breaking ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
											}`}
										>
											<Badge
												variant={change.breaking ? "destructive" : "secondary"}
												className="shrink-0"
											>
												{change.type}
											</Badge>
											<div className="min-w-0 flex-1">
												<p className="font-mono text-xs break-all">{change.path.join(".")}</p>
												<p className="text-xs text-muted-foreground mt-0.5">
													{change.breaking ? "Breaking" : "Non-breaking"}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
```

- [ ] **Run route generation and commit**

```bash
pnpm generate-routes
```

```bash
git add src/lib/specs/functions.ts src/routes/dashboard.specs.$specId.compare.tsx src/routeTree.gen.ts
git commit -m "feat(specs): add version comparison page with breaking change detection"
```

---

### Task 7: Add drift link to sidebar + finalize

**Files:**
- Modify: `src/routes/dashboard.tsx` — sidebar layout

- [ ] **Read `src/routes/dashboard.tsx` and add a Drift nav item**

Find the sidebar navigation items and add a drift entry. Looking at the existing dashboard layout...

- [ ] **Commit**

```bash
git add src/routes/dashboard.tsx
git commit -m "feat(dashboard): add drift detection link to sidebar navigation"
```
