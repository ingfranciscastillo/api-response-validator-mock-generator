CREATE TABLE "mock_datasets" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"specification_id" text NOT NULL,
	"endpoint_id" text NOT NULL,
	"name" text NOT NULL,
	"status_code" integer NOT NULL,
	"variant_type" text NOT NULL,
	"variant_label" text,
	"payload" json,
	"storage_key" text,
	"generation_rules" json,
	"seed" text,
	"tags" json,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mock_serve_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"mock_dataset_id" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"response_headers_override" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mock_serve_configs_mock_dataset_id_unique" UNIQUE("mock_dataset_id")
);
--> statement-breakpoint
ALTER TABLE "mock_datasets" ADD CONSTRAINT "mock_datasets_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_datasets" ADD CONSTRAINT "mock_datasets_specification_id_specifications_id_fk" FOREIGN KEY ("specification_id") REFERENCES "public"."specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_datasets" ADD CONSTRAINT "mock_datasets_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_datasets" ADD CONSTRAINT "mock_datasets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_serve_configs" ADD CONSTRAINT "mock_serve_configs_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_serve_configs" ADD CONSTRAINT "mock_serve_configs_mock_dataset_id_mock_datasets_id_fk" FOREIGN KEY ("mock_dataset_id") REFERENCES "public"."mock_datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mock_dataset_workspace_created_idx" ON "mock_datasets" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "mock_dataset_endpoint_status_idx" ON "mock_datasets" USING btree ("endpoint_id","status_code");--> statement-breakpoint
CREATE INDEX "mock_dataset_spec_idx" ON "mock_datasets" USING btree ("specification_id");--> statement-breakpoint
CREATE INDEX "mock_serve_config_workspace_idx" ON "mock_serve_configs" USING btree ("workspace_id");