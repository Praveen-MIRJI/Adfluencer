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

async function checkKycStorage() {
    console.log('🔍 Checking KYC Storage Configuration...\n');

    try {
        // Check if bucket exists
        console.log('1️⃣ Checking if kyc-documents bucket exists...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listing buckets:', listError.message);
            return;
        }

        const kycBucket = buckets?.find(bucket => bucket.name === 'kyc-documents');

        if (!kycBucket) {
            console.log('❌ Bucket "kyc-documents" does NOT exist');
            console.log('\n📝 ACTION REQUIRED:');
            console.log('   1. Go to Supabase Dashboard > Storage');
            console.log('   2. Click "New bucket"');
            console.log('   3. Name: kyc-documents');
            console.log('   4. Public: ✅ CHECKED');
            console.log('   5. File size limit: 5242880 (5MB)');
            console.log('   6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp');
            return;
        }

        console.log('✅ Bucket "kyc-documents" exists');
        console.log('   - ID:', kycBucket.id);
        console.log('   - Public:', kycBucket.public ? '✅ YES' : '❌ NO (NEEDS TO BE PUBLIC!)');
        console.log('   - Created:', kycBucket.created_at);

        if (!kycBucket.public) {
            console.log('\n⚠️  WARNING: Bucket is NOT public!');
            console.log('📝 ACTION REQUIRED:');
            console.log('   1. Go to Supabase Dashboard > Storage > kyc-documents');
            console.log('   2. Click Settings (gear icon)');
            console.log('   3. Enable "Public bucket"');
            console.log('   4. Save changes');
        }

        // Check for existing files
        console.log('\n2️⃣ Checking for existing KYC files...');
        const { data: files, error: filesError } = await supabase.storage
            .from('kyc-documents')
            .list('', { limit: 10 });

        if (filesError) {
            console.log('⚠️  Could not list files:', filesError.message);
        } else {
            console.log(`📁 Found ${files?.length || 0} files/folders in bucket`);
            if (files && files.length > 0) {
                console.log('   Recent items:');
                files.slice(0, 5).forEach(file => {
                    console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
                });
            }
        }

        // Check KYC records in database
        console.log('\n3️⃣ Checking KYC verification records...');
        const { data: kycRecords, error: kycError } = await supabase
            .from('KycVerification')
            .select('id, userId, documentFrontUrl, documentBackUrl, selfieUrl, status')
            .limit(5);

        if (kycError) {
            console.log('⚠️  Could not fetch KYC records:', kycError.message);
        } else {
            console.log(`📋 Found ${kycRecords?.length || 0} KYC verification records`);
            if (kycRecords && kycRecords.length > 0) {
                console.log('   Sample records:');
                kycRecords.forEach(record => {
                    console.log(`   - User: ${record.userId.substring(0, 8)}... | Status: ${record.status}`);
                    console.log(`     Front: ${record.documentFrontUrl ? '✅' : '❌'}`);
                    console.log(`     Back: ${record.documentBackUrl ? '✅' : '❌'}`);
                    console.log(`     Selfie: ${record.selfieUrl ? '✅' : '❌'}`);
                });
            }
        }

        // Test URL generation
        console.log('\n4️⃣ Testing public URL generation...');
        const testPath = 'test-user-id/front_123456.jpg';
        const { data: urlData } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(testPath);

        console.log('   Sample URL format:', urlData.publicUrl);
        console.log('   Expected format: https://[project].supabase.co/storage/v1/object/public/kyc-documents/...');

        if (urlData.publicUrl.includes('/public/')) {
            console.log('   ✅ URL format is correct (includes /public/)');
        } else {
            console.log('   ❌ URL format is incorrect (missing /public/ - bucket may not be public)');
        }

        console.log('\n✨ Diagnostic check complete!');

        // Summary
        console.log('\n📊 SUMMARY:');
        if (kycBucket && kycBucket.public) {
            console.log('✅ Storage bucket is properly configured');
            console.log('✅ You should be able to upload and view KYC images');
        } else if (kycBucket && !kycBucket.public) {
            console.log('⚠️  Bucket exists but is NOT public');
            console.log('❌ Images will upload but won\'t display');
            console.log('👉 Make the bucket public in Supabase Dashboard');
        } else {
            console.log('❌ Bucket does not exist');
            console.log('👉 Create the bucket in Supabase Dashboard');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkKycStorage();
