CREATE TABLE "drift_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"spec_id" text NOT NULL,
	"schedule" text DEFAULT '0 0 * * *' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drift_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"spec_id" text NOT NULL,
	"from_version_id" text,
	"to_version_id" text,
	"type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"summary" text NOT NULL,
	"changes" json,
	"status" text DEFAULT 'open' NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" json NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drift_checks" ADD CONSTRAINT "drift_checks_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_checks" ADD CONSTRAINT "drift_checks_spec_id_specifications_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_spec_id_specifications_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_from_version_id_specification_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."specification_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_to_version_id_specification_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."specification_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_alerts" ADD CONSTRAINT "drift_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drift_check_workspace_idx" ON "drift_checks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "drift_check_spec_idx" ON "drift_checks" USING btree ("spec_id");--> statement-breakpoint
CREATE INDEX "drift_alert_workspace_idx" ON "drift_alerts" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "drift_alert_spec_idx" ON "drift_alerts" USING btree ("spec_id","detected_at");--> statement-breakpoint
CREATE INDEX "notification_channel_workspace_idx" ON "notification_channels" USING btree ("workspace_id");
