-- Expand workflow_mode to include hackathon and final_year, add CHECK constraint, backfill NULLs

-- Backfill existing NULLs to vc_pitch
UPDATE projects SET workflow_mode = 'vc_pitch' WHERE workflow_mode IS NULL;

-- Add CHECK constraint for valid modes (nullable for backwards compat)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_workflow_mode_valid;
ALTER TABLE projects ADD CONSTRAINT projects_workflow_mode_valid
  CHECK (workflow_mode IN ('elevator', 'vc_pitch', 'hackathon', 'final_year') OR workflow_mode IS NULL);
