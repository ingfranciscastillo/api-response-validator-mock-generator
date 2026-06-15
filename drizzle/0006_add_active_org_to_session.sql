ALTER TABLE "sessions" ADD COLUMN "active_organization_id" text REFERENCES "organizations"("id") ON DELETE SET NULL;
