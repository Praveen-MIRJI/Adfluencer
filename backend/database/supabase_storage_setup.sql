-- SUPABASE STORAGE BUCKET SETUP FOR PRODUCTION ESCROW SYSTEM

-- Create kyc-documents bucket (PRIVATE - for KYC document uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880;

-- Create avatars bucket (PUBLIC - for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2097152;

-- Create deliverables bucket (PRIVATE - for work submissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables', 
  'deliverables', 
  false, 
  52428800, -- 50MB limit for videos
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false, 
  file_size_limit = 52428800;

-- Create dispute-evidence bucket (PRIVATE - for dispute attachments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dispute-evidence', 
  'dispute-evidence', 
  false, 
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false, 
  file_size_limit = 20971520;

-- Storage policies for kyc-documents
DROP POLICY IF EXISTS "Allow KYC document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow KYC document viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow KYC document deletion" ON storage.objects;

CREATE POLICY "Allow KYC document uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents');
CREATE POLICY "Allow KYC document viewing" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents');
CREATE POLICY "Allow KYC document deletion" ON storage.objects FOR DELETE USING (bucket_id = 'kyc-documents');

-- Storage policies for avatars
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletion" ON storage.objects;

CREATE POLICY "Allow avatar uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow avatar viewing" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow avatar deletion" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- Storage policies for deliverables
DROP POLICY IF EXISTS "deliverables_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "deliverables_delete_policy" ON storage.objects;

CREATE POLICY "deliverables_insert_policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deliverables');
CREATE POLICY "deliverables_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'deliverables');
CREATE POLICY "deliverables_delete_policy" ON storage.objects FOR DELETE USING (bucket_id = 'deliverables');

-- Storage policies for dispute-evidence
DROP POLICY IF EXISTS "dispute_evidence_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "dispute_evidence_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "dispute_evidence_delete_policy" ON storage.objects;

CREATE POLICY "dispute_evidence_insert_policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dispute-evidence');
CREATE POLICY "dispute_evidence_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'dispute-evidence');
CREATE POLICY "dispute_evidence_delete_policy" ON storage.objects FOR DELETE USING (bucket_id = 'dispute-evidence');
