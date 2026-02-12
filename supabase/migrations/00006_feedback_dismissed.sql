-- ============================================================
-- Migration 00006: Add dismissed_from_evolution to feedbacks
-- Allows admin to dismiss a feedback from the evolution flow
-- without affecting the teacher's view of their feedback.
-- ============================================================

ALTER TABLE public.feedbacks
  ADD COLUMN dismissed_from_evolution boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.feedbacks.dismissed_from_evolution
  IS 'If true, this feedback is excluded from agent evolution selection (admin-only flag)';
