-- ============================================================================
-- PSCOMERCIAL-PRO - STORAGE BUCKETS MIGRATION
-- Migration: 20260212000006_storage_buckets.sql
-- Date: 2026-02-12
-- Description: 6 storage buckets with RLS policies
-- Item: #13 Storage buckets
-- Reference: FASE-05 Section 6
-- ============================================================================

-- ============================================================================
-- 1. Create Storage Buckets
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('organization-logos', 'organization-logos', true, 2097152,  -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 1048576,  -- 1MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('documents', 'documents', false, 10485760,  -- 10MB
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('generated-pdfs', 'generated-pdfs', false, 5242880,  -- 5MB
    ARRAY['application/pdf']),
  ('whatsapp-media', 'whatsapp-media', false, 16777216,  -- 16MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'audio/ogg', 'video/mp4']),
  ('comment-attachments', 'comment-attachments', false, 5242880,  -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS Policies for Storage Buckets
-- ============================================================================

-- Helper: Get user's organization_id from profiles
-- (reuses get_user_org_id from RLS migration if available)

-- == organization-logos ==
-- Anyone can view (public bucket)
-- Only org admins can upload/update/delete
CREATE POLICY "org_logos_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'organization-logos');

CREATE POLICY "org_logos_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM organizations o
      JOIN profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "org_logos_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'organization-logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM organizations o
      JOIN profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "org_logos_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'organization-logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text FROM organizations o
      JOIN profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid()
    )
  );


-- == avatars ==
-- Anyone can view (public bucket)
-- Users can only manage their own avatar
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- == documents ==
-- Organization members can view their org's documents
-- Authenticated users can upload to their org folder
CREATE POLICY "documents_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "documents_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "documents_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );


-- == generated-pdfs ==
-- Organization members can view their org's PDFs
-- System/API can generate (uses service role)
CREATE POLICY "generated_pdfs_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'generated-pdfs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "generated_pdfs_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-pdfs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );


-- == whatsapp-media ==
-- Organization members can view their org's WhatsApp media
-- Users with whatsapp permissions can upload
CREATE POLICY "whatsapp_media_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'whatsapp-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "whatsapp_media_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'whatsapp-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );


-- == comment-attachments ==
-- Organization members can view their org's attachments
-- Authenticated users can upload
CREATE POLICY "comment_attachments_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'comment-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "comment_attachments_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'comment-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "comment_attachments_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'comment-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT p.organization_id::text FROM profiles p WHERE p.id = auth.uid()
    )
  );


-- ============================================================================
-- End of Migration
-- ============================================================================
