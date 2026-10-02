-- ============================================================================
-- Migration: Add storage RLS policies for arca_certs bucket
-- Date: 2026-09-01
-- Description:
--   Enables authenticated users to upload, update, and check certificates
--   under their branch folder in the private 'arca_certs' storage bucket.
-- ============================================================================

-- 1. Ensure the bucket exists and is marked as private
INSERT INTO storage.buckets (id, name, public)
VALUES ('arca_certs', 'arca_certs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Drop existing policy if already present
DROP POLICY IF EXISTS "Gestion de certificados ARCA para autenticados" ON storage.objects;

-- 3. Policy: allow authenticated users to manage files in their branch folder
CREATE POLICY "Gestion de certificados ARCA para autenticados" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'arca_certs'
  AND (
    (storage.foldername(name))[1] = public.get_user_branch_id()::text
    OR public.get_user_branch_id() IS NULL
  )
)
WITH CHECK (
  bucket_id = 'arca_certs'
  AND (
    (storage.foldername(name))[1] = public.get_user_branch_id()::text
    OR public.get_user_branch_id() IS NULL
  )
);
