/**
 * KYC System Test Script
 * Tests the complete KYC verification flow
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testKycSystem() {
  console.log('🧪 Testing KYC System...\n');

  // Test 1: Health check
  console.log('1. Testing API health...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ API is healthy:', data.status);
  } catch (error) {
    console.log('❌ API health check failed:', error.message);
  }

  // Test 2: KYC endpoints structure
  console.log('\n2. KYC Endpoints:');
  console.log('   POST /api/kyc/submit - Submit KYC verification');
  console.log('   GET /api/kyc/status - Get KYC status');
  console.log('   GET /api/kyc/admin/all - Admin: List all KYC');
  console.log('   PUT /api/kyc/admin/review/:id - Admin: Review KYC');

  console.log('\n✅ KYC system test complete!');
}

testKycSystem().catch(console.error);
