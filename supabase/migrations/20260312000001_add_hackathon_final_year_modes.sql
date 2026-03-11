-- Add hackathon and final_year to the runs.mode check constraint
-- Previously only ('elevator', 'vc_pitch') were allowed

ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_mode_check;
ALTER TABLE runs ADD CONSTRAINT runs_mode_check
  CHECK (mode IN ('elevator', 'vc_pitch', 'hackathon', 'final_year'));
