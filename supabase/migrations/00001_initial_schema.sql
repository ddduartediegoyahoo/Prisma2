-- ============================================================
-- Migration 00001: Initial Schema — Adapte Minha Prova
-- Creates all 11 tables with constraints
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending Supabase auth.users';
comment on column public.profiles.role is 'User role: teacher (default) or admin (set manually)';
comment on column public.profiles.blocked is 'If true, user cannot access the system';

-- 2. AI Models (LLM configurations)
create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  api_key text not null,
  model_id text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.ai_models is 'LLM model configurations managed by admin';
comment on column public.ai_models.base_url is 'OpenAI-compatible API base URL';
comment on column public.ai_models.api_key is 'API key for the LLM provider (encrypted at rest recommended)';
comment on column public.ai_models.model_id is 'Model identifier, e.g. gpt-4o, claude-sonnet-4-20250514';

-- 3. Agents (AI prompts)
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.agents is 'AI agents with prompts for adaptation behavior';

-- 4. Supports (educational needs / apoios)
create table public.supports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_id uuid not null references public.agents(id),
  model_id uuid not null references public.ai_models(id),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.supports is 'Educational support types linking an agent to a model';

-- 5. Subjects (disciplinas)
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.subjects is 'School subjects/disciplines configured by admin';

-- 6. Grade Levels (anos/séries)
create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.grade_levels is 'Grade levels/years configured by admin';

-- 7. Exams (provas)
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject_id uuid not null references public.subjects(id),
  grade_level_id uuid not null references public.grade_levels(id),
  topic text,
  pdf_path text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'extracting', 'awaiting_answers', 'analyzing', 'completed', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exams is 'Exam records with processing status';
comment on column public.exams.status is 'Processing pipeline status';
comment on column public.exams.pdf_path is 'Path in Supabase Storage bucket';

-- 8. Exam Supports (many-to-many: exam ↔ supports)
create table public.exam_supports (
  exam_id uuid not null references public.exams(id) on delete cascade,
  support_id uuid not null references public.supports(id),
  primary key (exam_id, support_id)
);

comment on table public.exam_supports is 'Selected supports for each exam';

-- 9. Questions (extracted questions)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  order_num integer not null,
  content text not null,
  question_type text not null check (question_type in ('objective', 'essay')),
  alternatives jsonb,
  correct_answer text,
  visual_elements jsonb,
  extraction_warning text,
  created_at timestamptz not null default now()
);

comment on table public.questions is 'Questions extracted from exam PDF';
comment on column public.questions.alternatives is 'Array of {label, text} for objective questions';
comment on column public.questions.correct_answer is 'Correct answer provided by the teacher';
comment on column public.questions.visual_elements is 'Array of {type, description} for images/tables/charts';
comment on column public.questions.extraction_warning is 'Warning if OCR extraction was partial';

-- 10. Adaptations (adapted questions per support)
create table public.adaptations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  support_id uuid not null references public.supports(id),
  adapted_content text,
  bncc_skills jsonb,
  bloom_level text,
  bncc_analysis text,
  bloom_analysis text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'error')),
  created_at timestamptz not null default now()
);

comment on table public.adaptations is 'Adapted versions of questions per educational support';
comment on column public.adaptations.bncc_skills is 'Array of BNCC skill codes, e.g. ["EF06MA01"]';
comment on column public.adaptations.bloom_level is 'Bloom taxonomy cognitive level';

-- 11. Feedbacks (teacher feedback per adaptation)
create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references public.adaptations(id) on delete cascade,
  rating integer not null check (rating >= 0 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

comment on table public.feedbacks is 'Teacher feedback on adapted questions';

-- 12. Agent Evolutions (prompt evolution history)
create table public.agent_evolutions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id),
  original_prompt text not null,
  suggested_prompt text not null,
  llm_commentary text,
  feedback_ids uuid[] not null,
  accepted boolean,
  created_at timestamptz not null default now()
);

comment on table public.agent_evolutions is 'History of agent prompt evolution based on teacher feedback';
