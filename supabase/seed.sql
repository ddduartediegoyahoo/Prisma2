-- ============================================================
-- Seed Data: Initial Subjects and Grade Levels
-- Common Brazilian education subjects and grade levels
-- ============================================================

-- Disciplinas (Subjects)
insert into public.subjects (name, enabled) values
  ('Língua Portuguesa', true),
  ('Matemática', true),
  ('Ciências', true),
  ('História', true),
  ('Geografia', true),
  ('Arte', true),
  ('Educação Física', true),
  ('Língua Inglesa', true),
  ('Ensino Religioso', true),
  ('Física', true),
  ('Química', true),
  ('Biologia', true),
  ('Sociologia', true),
  ('Filosofia', true)
on conflict (name) do nothing;

-- Anos/Séries (Grade Levels)
insert into public.grade_levels (name, enabled) values
  ('1º Ano - Ensino Fundamental', true),
  ('2º Ano - Ensino Fundamental', true),
  ('3º Ano - Ensino Fundamental', true),
  ('4º Ano - Ensino Fundamental', true),
  ('5º Ano - Ensino Fundamental', true),
  ('6º Ano - Ensino Fundamental', true),
  ('7º Ano - Ensino Fundamental', true),
  ('8º Ano - Ensino Fundamental', true),
  ('9º Ano - Ensino Fundamental', true),
  ('1ª Série - Ensino Médio', true),
  ('2ª Série - Ensino Médio', true),
  ('3ª Série - Ensino Médio', true),
  ('EJA - Ensino Fundamental', true),
  ('EJA - Ensino Médio', true)
on conflict (name) do nothing;
