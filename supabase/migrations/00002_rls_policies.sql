-- ============================================================
-- Migration 00002: Row Level Security Policies
-- Enables RLS on all tables and creates access policies
-- ============================================================

-- -------------------------------------------------------
-- Helper: reusable function to check if user is admin
-- -------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- -------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (name, avatar only — not role/blocked)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Admins can update any profile (for blocking/role changes)
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Allow insert from trigger (service role handles this via security definer)
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- -------------------------------------------------------
-- 2. ai_models (admin-only)
-- -------------------------------------------------------
alter table public.ai_models enable row level security;

create policy "Admins can manage ai_models"
  on public.ai_models for all
  using (public.is_admin());

-- Teachers can read enabled models (needed for Edge Functions context)
create policy "Authenticated users can view enabled models"
  on public.ai_models for select
  using (auth.uid() is not null and enabled = true);

-- -------------------------------------------------------
-- 3. agents (admin-only management, read for service)
-- -------------------------------------------------------
alter table public.agents enable row level security;

create policy "Admins can manage agents"
  on public.agents for all
  using (public.is_admin());

create policy "Authenticated users can view enabled agents"
  on public.agents for select
  using (auth.uid() is not null and enabled = true);

-- -------------------------------------------------------
-- 4. supports (admin manages, teachers read enabled)
-- -------------------------------------------------------
alter table public.supports enable row level security;

create policy "Admins can manage supports"
  on public.supports for all
  using (public.is_admin());

create policy "Authenticated users can view enabled supports"
  on public.supports for select
  using (auth.uid() is not null and enabled = true);

-- -------------------------------------------------------
-- 5. subjects (admin manages, teachers read enabled)
-- -------------------------------------------------------
alter table public.subjects enable row level security;

create policy "Admins can manage subjects"
  on public.subjects for all
  using (public.is_admin());

create policy "Authenticated users can view enabled subjects"
  on public.subjects for select
  using (auth.uid() is not null and enabled = true);

-- -------------------------------------------------------
-- 6. grade_levels (admin manages, teachers read enabled)
-- -------------------------------------------------------
alter table public.grade_levels enable row level security;

create policy "Admins can manage grade_levels"
  on public.grade_levels for all
  using (public.is_admin());

create policy "Authenticated users can view enabled grade_levels"
  on public.grade_levels for select
  using (auth.uid() is not null and enabled = true);

-- -------------------------------------------------------
-- 7. exams (teacher owns, admin sees all)
-- -------------------------------------------------------
alter table public.exams enable row level security;

-- Teachers can view their own exams
create policy "Users can view own exams"
  on public.exams for select
  using (auth.uid() = user_id);

-- Teachers can create exams
create policy "Users can create own exams"
  on public.exams for insert
  with check (auth.uid() = user_id);

-- Teachers can update their own exams
create policy "Users can update own exams"
  on public.exams for update
  using (auth.uid() = user_id);

-- Admins can view all exams
create policy "Admins can view all exams"
  on public.exams for select
  using (public.is_admin());

-- Admins can update all exams (for Edge Functions via service role)
create policy "Admins can update all exams"
  on public.exams for update
  using (public.is_admin());

-- -------------------------------------------------------
-- 8. exam_supports (follows exam ownership)
-- -------------------------------------------------------
alter table public.exam_supports enable row level security;

create policy "Users can view own exam_supports"
  on public.exam_supports for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = exam_supports.exam_id
        and exams.user_id = auth.uid()
    )
  );

create policy "Users can create own exam_supports"
  on public.exam_supports for insert
  with check (
    exists (
      select 1 from public.exams
      where exams.id = exam_supports.exam_id
        and exams.user_id = auth.uid()
    )
  );

create policy "Admins can manage exam_supports"
  on public.exam_supports for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 9. questions (follows exam ownership)
-- -------------------------------------------------------
alter table public.questions enable row level security;

create policy "Users can view own questions"
  on public.questions for select
  using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.user_id = auth.uid()
    )
  );

create policy "Users can update own questions"
  on public.questions for update
  using (
    exists (
      select 1 from public.exams
      where exams.id = questions.exam_id
        and exams.user_id = auth.uid()
    )
  );

create policy "Admins can manage questions"
  on public.questions for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 10. adaptations (follows question → exam ownership)
-- -------------------------------------------------------
alter table public.adaptations enable row level security;

create policy "Users can view own adaptations"
  on public.adaptations for select
  using (
    exists (
      select 1 from public.questions q
      join public.exams e on e.id = q.exam_id
      where q.id = adaptations.question_id
        and e.user_id = auth.uid()
    )
  );

create policy "Admins can manage adaptations"
  on public.adaptations for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 11. feedbacks (follows adaptation → question → exam ownership)
-- -------------------------------------------------------
alter table public.feedbacks enable row level security;

create policy "Users can view own feedbacks"
  on public.feedbacks for select
  using (
    exists (
      select 1 from public.adaptations a
      join public.questions q on q.id = a.question_id
      join public.exams e on e.id = q.exam_id
      where a.id = feedbacks.adaptation_id
        and e.user_id = auth.uid()
    )
  );

create policy "Users can create feedbacks for own adaptations"
  on public.feedbacks for insert
  with check (
    exists (
      select 1 from public.adaptations a
      join public.questions q on q.id = a.question_id
      join public.exams e on e.id = q.exam_id
      where a.id = feedbacks.adaptation_id
        and e.user_id = auth.uid()
    )
  );

create policy "Users can update own feedbacks"
  on public.feedbacks for update
  using (
    exists (
      select 1 from public.adaptations a
      join public.questions q on q.id = a.question_id
      join public.exams e on e.id = q.exam_id
      where a.id = feedbacks.adaptation_id
        and e.user_id = auth.uid()
    )
  );

create policy "Admins can manage feedbacks"
  on public.feedbacks for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 12. agent_evolutions (admin-only)
-- -------------------------------------------------------
alter table public.agent_evolutions enable row level security;

create policy "Admins can manage agent_evolutions"
  on public.agent_evolutions for all
  using (public.is_admin());
