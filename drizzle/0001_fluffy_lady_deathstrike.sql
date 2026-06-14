CREATE TABLE "validation_results" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"endpoint_id" text,
	"workspace_id" text NOT NULL,
	"request_snapshot" json,
	"response_status_code" integer NOT NULL,
	"response_headers" json,
	"response_body" json,
	"expected_schema" json,
	"outcome" text NOT NULL,
	"violations" json,
	"diff" json,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"specification_id" text,
	"name" text,
	"trigger_type" text NOT NULL,
	"status" text NOT NULL,
	"total_checks" integer DEFAULT 0 NOT NULL,
	"passed_checks" integer DEFAULT 0 NOT NULL,
	"warning_checks" integer DEFAULT 0 NOT NULL,
	"failed_checks" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_run_id_validation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."validation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_specification_id_specifications_id_fk" FOREIGN KEY ("specification_id") REFERENCES "public"."specifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "validation_result_run_idx" ON "validation_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "validation_result_endpoint_idx" ON "validation_results" USING btree ("endpoint_id","created_at");--> statement-breakpoint
CREATE INDEX "validation_result_workspace_outcome_idx" ON "validation_results" USING btree ("workspace_id","outcome");--> statement-breakpoint
CREATE INDEX "validation_run_workspace_created_idx" ON "validation_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "validation_run_spec_idx" ON "validation_runs" USING btree ("specification_id","created_at");--> statement-breakpoint
CREATE INDEX "validation_run_workspace_status_idx" ON "validation_runs" USING btree ("workspace_id","status");