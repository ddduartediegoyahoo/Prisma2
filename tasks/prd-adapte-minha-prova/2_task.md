# Tarefa 2.0: Schema do Banco de Dados & Migrações

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar todas as migrações SQL do Supabase para as 11 tabelas do sistema, incluindo constraints, índices, RLS (Row Level Security) e triggers. Inicializar o Supabase CLI no projeto.

<requirements>
- Supabase CLI inicializado (`supabase init`)
- Migração SQL com todas as 11 tabelas definidas na techspec
- RLS habilitado em todas as tabelas
- Políticas RLS para: professor acessa apenas seus próprios exames/questões/adaptações/feedbacks; admin acessa tudo
- Trigger para criar `profiles` automaticamente após signup via `auth.users`
- Trigger para atualizar `updated_at` em tabelas que possuem esse campo
- Bucket `exams` criado no Storage com limite de 25 MB
- Seed data opcional para disciplinas e anos/séries comuns
</requirements>

## Subtarefas

- [ ] 2.1 Inicializar Supabase CLI no projeto (`supabase init`)
- [ ] 2.2 Criar migração com tabelas: `profiles`, `ai_models`, `agents`, `supports`, `subjects`, `grade_levels`
- [ ] 2.3 Criar migração com tabelas: `exams`, `exam_supports`, `questions`, `adaptations`, `feedbacks`, `agent_evolutions`
- [ ] 2.4 Criar trigger `handle_new_user` para auto-criação de `profiles` a partir de `auth.users`
- [ ] 2.5 Criar trigger `handle_updated_at` para atualizar `updated_at` automaticamente em `exams` e `agents`
- [ ] 2.6 Habilitar RLS em todas as tabelas e criar políticas de acesso
- [ ] 2.7 Criar índices para colunas frequentemente consultadas (`exams.user_id`, `exams.status`, `questions.exam_id`, `adaptations.question_id`, `adaptations.support_id`, `feedbacks.adaptation_id`)
- [ ] 2.8 Criar bucket `exams` no Storage com política RLS (professor acessa apenas `{userId}/*`)
- [ ] 2.9 Criar seed SQL com disciplinas e anos/séries iniciais (opcional)
- [ ] 2.10 Validar migração com `supabase db reset` local

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados (Supabase Postgres)"** da `techspec.md` para o schema completo das 11 tabelas.

Políticas RLS principais:

```sql
-- Exemplo: professor só vê seus próprios exames
create policy "Users can view own exams"
  on public.exams for select
  using (auth.uid() = user_id);

-- Exemplo: admin vê tudo
create policy "Admins can view all exams"
  on public.exams for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

Trigger para auto-criação de profiles:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## Critérios de Sucesso

- `supabase db reset` executa sem erros
- Todas as 11 tabelas criadas com constraints corretas
- RLS habilitado e políticas testáveis via Supabase Dashboard (SQL Editor)
- Trigger de `profiles` cria registro ao fazer signup de teste
- Bucket `exams` acessível com política RLS correta
- Índices criados e visíveis no dashboard

## Arquivos relevantes

- `supabase/config.toml`
- `supabase/migrations/00001_initial_schema.sql`
- `supabase/migrations/00002_rls_policies.sql`
- `supabase/migrations/00003_triggers_and_indexes.sql`
- `supabase/seed.sql`
