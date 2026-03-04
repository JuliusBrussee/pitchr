-- Rework projects: add context fields, relax old constraints, un-seed

-- Add context fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_market text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_metrics text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_notes text;

-- Relax old constraints (keep columns for backward compat, make nullable)
ALTER TABLE projects ALTER COLUMN type DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN workflow_mode DROP NOT NULL;

-- Un-seed all projects, drop seed index
UPDATE projects SET is_seeded = false WHERE is_seeded = true;
DROP INDEX IF EXISTS idx_projects_seed_unique;
