import React from 'react';
import KycVerificationDark from '../components/KycVerificationDark';

const KycVerificationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold text-white mb-2">Account Verification</h1>
        <p className="text-slate-300">
          Complete your KYC verification to unlock all platform features and build trust with other users.
        </p>
      </div>
      <KycVerificationDark />
    </div>
  );
};

export default KycVerificationPage;