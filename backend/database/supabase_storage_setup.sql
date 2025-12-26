-- SUPABASE STORAGE BUCKET SETUP FOR KYC DOCUMENTS

-- Create kyc-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2097152;

-- Storage policies for kyc-documents
CREATE POLICY "Allow KYC document uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents');
CREATE POLICY "Allow KYC document viewing" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents');
CREATE POLICY "Allow KYC document deletion" ON storage.objects FOR DELETE USING (bucket_id = 'kyc-documents');

-- Storage policies for avatars
CREATE POLICY "Allow avatar uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow avatar viewing" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow avatar deletion" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
