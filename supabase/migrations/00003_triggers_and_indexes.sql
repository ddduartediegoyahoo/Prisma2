-- ============================================================
-- Migration 00003: Triggers and Indexes
-- ============================================================

-- -------------------------------------------------------
-- Trigger: auto-create profile on auth.users signup
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------
-- Trigger: auto-update updated_at timestamp
-- -------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables that have the column
create trigger set_updated_at
  before update on public.exams
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.agents
  for each row execute function public.handle_updated_at();

-- -------------------------------------------------------
-- Indexes for frequently queried columns
-- -------------------------------------------------------

-- exams: lookup by user and status
create index idx_exams_user_id on public.exams(user_id);
create index idx_exams_status on public.exams(status);
create index idx_exams_user_status on public.exams(user_id, status);

-- questions: lookup by exam
create index idx_questions_exam_id on public.questions(exam_id);
create index idx_questions_exam_order on public.questions(exam_id, order_num);

-- adaptations: lookup by question and support
create index idx_adaptations_question_id on public.adaptations(question_id);
create index idx_adaptations_support_id on public.adaptations(support_id);
create index idx_adaptations_status on public.adaptations(status);

-- feedbacks: lookup by adaptation
create index idx_feedbacks_adaptation_id on public.feedbacks(adaptation_id);

-- exam_supports: lookup by exam
create index idx_exam_supports_exam_id on public.exam_supports(exam_id);

-- supports: lookup by agent (for agent evolution feedback query)
create index idx_supports_agent_id on public.supports(agent_id);

-- agent_evolutions: lookup by agent
create index idx_agent_evolutions_agent_id on public.agent_evolutions(agent_id);
