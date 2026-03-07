-- Rework projects: add context fields, relax old constraints, un-seed

-- Add context fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_market text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_metrics text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_notes text;

-- Relax old constraints (keep columns for backward compat, make nullable)
ALTER TABLE projects ALTER COLUMN type DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN type SET DEFAULT 'two_min_pitch';
ALTER TABLE projects ALTER COLUMN workflow_mode DROP NOT NULL;

-- Drop CHECK constraints so NULL / any value is accepted
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_workflow_mode_check;

-- Un-seed all projects, drop seed index
UPDATE projects SET is_seeded = false WHERE is_seeded = true;
DROP INDEX IF EXISTS idx_projects_seed_unique;
