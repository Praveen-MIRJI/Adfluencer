import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dkhthctzwameiiqrxprs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraHRoY3R6d2FtZWlpcXJ4cHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTEwNzgsImV4cCI6MjA4MTI2NzA3OH0.wjEKm9doFlE9Hi5y1ejwRu8wykWAJF9PoWo1kUrJ1pg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadKycDocument = async (
  file: File,
  userId: string,
  documentType: 'front' | 'back' | 'selfie'
): Promise<UploadResult> => {
  try {
    // Validate file
    if (!file) {
      console.error('Upload failed: No file provided');
      return { success: false, error: 'No file provided' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Upload failed: File too large', file.size);
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Upload failed: Invalid file type', file.type);
      return { success: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    console.log(`Uploading ${documentType} document for user ${userId}...`);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${timestamp}.${fileExtension}`;

    console.log('File path:', fileName);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });

      // Provide more specific error messages
      if (error.message.includes('Bucket not found')) {
        return { success: false, error: 'Storage bucket not configured. Please contact support.' };
      }
      if (error.message.includes('not allowed')) {
        return { success: false, error: 'File upload not permitted. Please check permissions.' };
      }

      return { success: false, error: `Upload failed: ${error.message}` };
    }

    console.log('Upload successful, generating public URL...');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to generate public URL');
      return { success: false, error: 'Failed to generate file URL' };
    }

    console.log('Public URL generated:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Unexpected upload error:', error);
    return { success: false, error: 'Upload failed due to unexpected error' };
  }
};

export const deleteKycDocument = async (url: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/kyc-documents/');
    if (urlParts.length !== 2) {
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('kyc-documents')
      .remove([filePath]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

export const validateImageFile = (file: File): string | null => {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return 'File size must be less than 5MB';
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }

  return null;
};