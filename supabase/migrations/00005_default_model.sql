-- ============================================================
-- Migration 00005: Add is_default column to ai_models
-- Allows admin to select a default model for system-wide use
-- (e.g., question extraction flow)
-- ============================================================

ALTER TABLE public.ai_models ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Partial unique index ensures at most one model can be the default
CREATE UNIQUE INDEX idx_ai_models_single_default ON public.ai_models (is_default) WHERE is_default = true;

COMMENT ON COLUMN public.ai_models.is_default IS 'If true, this model is the system default for extraction and other flows';

-- Make supports.model_id nullable so supports can survive model deletion
-- (kept disabled for historical integrity via exam_supports)
ALTER TABLE public.supports ALTER COLUMN model_id DROP NOT NULL;
