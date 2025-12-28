import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
    console.log('🚀 Setting up KYC Documents Storage Bucket...\n');

    try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listing buckets:', listError);
            process.exit(1);
        }

        const bucketExists = buckets?.some(bucket => bucket.name === 'kyc-documents');

        if (bucketExists) {
            console.log('✅ Bucket "kyc-documents" already exists');

            // Update bucket to be public
            const { error: updateError } = await supabase.storage.updateBucket('kyc-documents', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            });

            if (updateError) {
                console.log('⚠️  Could not update bucket settings:', updateError.message);
            } else {
                console.log('✅ Updated bucket settings (public access, 5MB limit)');
            }
        } else {
            // Create new bucket
            const { data, error: createError } = await supabase.storage.createBucket('kyc-documents', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            });

            if (createError) {
                console.error('❌ Error creating bucket:', createError);
                process.exit(1);
            }

            console.log('✅ Created bucket "kyc-documents" with public access');
        }

        // Test upload and retrieval
        console.log('\n🧪 Testing bucket functionality...');

        const testFileName = 'test/test-file.txt';
        const testContent = 'Test file for KYC bucket verification';

        // Upload test file
        const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(testFileName, testContent, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Test upload failed:', uploadError);
        } else {
            console.log('✅ Test upload successful');

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(testFileName);

            console.log('✅ Public URL generated:', urlData.publicUrl);

            // Clean up test file
            await supabase.storage
                .from('kyc-documents')
                .remove([testFileName]);

            console.log('✅ Test file cleaned up');
        }

        console.log('\n✨ Storage bucket setup complete!');
        console.log('\n📋 Bucket Configuration:');
        console.log('   - Name: kyc-documents');
        console.log('   - Public Access: Yes');
        console.log('   - Max File Size: 5MB');
        console.log('   - Allowed Types: JPEG, JPG, PNG, WebP');
        console.log('\n💡 Users can now upload KYC documents!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

setupStorageBucket();
