-- KYC Documents Storage Bucket Setup
-- Run this in Supabase SQL Editor

-- This script sets up the storage bucket and policies for KYC document uploads

-- Note: Storage buckets are created via the Supabase Dashboard or API
-- This script only sets up the RLS policies

-- First, ensure the bucket 'kyc-documents' exists in Storage
-- Go to: Storage > Create a new bucket
-- Name: kyc-documents
-- Public: Yes (checked)
-- File size limit: 5242880 (5MB)
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- Storage policies for kyc-documents bucket
-- These policies control who can upload, view, and delete files

-- Policy: Allow authenticated users to upload their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow admins to view all KYC documents
CREATE POLICY IF NOT EXISTS "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy: Allow users to delete their own KYC documents
CREATE POLICY IF NOT EXISTS "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public access to view KYC documents (if bucket is public)
-- This is needed for displaying images in the admin review panel
CREATE POLICY IF NOT EXISTS "Public can view KYC documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'kyc-documents');

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%KYC%'
ORDER BY policyname;
