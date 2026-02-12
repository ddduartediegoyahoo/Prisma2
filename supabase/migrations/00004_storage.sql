-- ============================================================
-- Migration 00004: Storage Bucket for Exam PDFs
-- ============================================================

-- Create the exams bucket (25 MB file size limit, PDFs only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exams',
  'exams',
  false,
  26214400, -- 25 MB in bytes
  array['application/pdf']
);

-- -------------------------------------------------------
-- Storage RLS Policies
-- -------------------------------------------------------

-- Teachers can upload PDFs to their own folder: {userId}/{examId}.pdf
create policy "Users can upload own exam PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'exams'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Teachers can read their own PDFs
create policy "Users can read own exam PDFs"
  on storage.objects for select
  using (
    bucket_id = 'exams'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Teachers can delete their own PDFs
create policy "Users can delete own exam PDFs"
  on storage.objects for delete
  using (
    bucket_id = 'exams'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all PDFs
create policy "Admins can read all exam PDFs"
  on storage.objects for select
  using (
    bucket_id = 'exams'
    and public.is_admin()
  );
