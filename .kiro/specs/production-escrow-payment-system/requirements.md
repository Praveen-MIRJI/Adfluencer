# Requirements Document

## Introduction

This document specifies the requirements for a production-grade Escrow Payment System for the Adfluencer influencer marketplace platform. The system handles the complete payment lifecycle from advertisement posting fees, bid submission fees, escrow-based contract payments, work submission, approval, and fund release to influencers. All transactions are in Indian Rupees (INR) using Razorpay as the payment gateway with real money transactions.

The system ensures secure, transparent, and dispute-resistant payment flows between Clients (advertisers) and Influencers, with comprehensive admin controls and KYC verification for payment method security.

## Glossary

- **Client**: A user who posts advertisements seeking influencer services
- **Influencer**: A user who bids on advertisements and provides promotional services
- **Admin**: Platform administrator with full system control
- **Escrow**: A secure holding mechanism where funds are held by the platform until work is approved
- **Credit**: Pre-purchased tokens used for posting ads (post credits) or submitting bids (bid credits)
- **KYC**: Know Your Customer - identity verification process
- **Payment Method Verification**: ₹1 charge to verify bank account/UPI ownership
- **Razorpay**: Indian payment gateway for processing real money transactions
- **Wallet**: User's platform balance for receiving payouts and making payments
- **Platform Fee**: Commission charged by Adfluencer (10% of transaction value)
- **Gateway Fee**: Razorpay processing fee (~2.36% including GST)

## Requirements

### Requirement 1: Credit System for Posting and Bidding

**User Story:** As a platform user, I want to purchase credits to post advertisements or submit bids, so that I can participate in the marketplace with a pay-per-action model.

#### Acceptance Criteria

1. WHEN a Client purchases post credits THEN the System SHALL create a Razorpay order for ₹10 per credit and process real payment
2. WHEN an Influencer purchases bid credits THEN the System SHALL create a Razorpay order for ₹5 per credit and process real payment
3. WHEN payment is verified THEN the System SHALL add the purchased credits to the user's credit balance immediately
4. WHEN a Client posts an advertisement THEN the System SHALL deduct 1 post credit from the Client's balance
5. WHEN an Influencer submits a bid THEN the System SHALL deduct 1 bid credit from the Influencer's balance
6. WHEN a user has insufficient credits THEN the System SHALL prevent the action and prompt credit purchase
7. WHEN the Admin disables the credit system THEN the System SHALL allow free posting and bidding for all users

### Requirement 2: Wallet System with Real Money

**User Story:** As a platform user, I want to add real money to my wallet and withdraw earnings, so that I can manage my platform finances securely.

#### Acceptance Criteria

1. WHEN a user initiates wallet top-up THEN the System SHALL create a Razorpay order with minimum ₹100 amount
2. WHEN Razorpay payment is successful THEN the System SHALL credit the exact amount to the user's wallet balance
3. WHEN an Influencer receives escrow release THEN the System SHALL credit the payout amount to the Influencer's wallet
4. WHEN a user requests withdrawal THEN the System SHALL verify the user has a verified payment method
5. WHEN withdrawal is processed THEN the System SHALL initiate Razorpay payout to the user's verified bank account
6. WHILE a dispute is active THEN the System SHALL lock the disputed amount in the user's wallet
7. WHEN displaying wallet balance THEN the System SHALL show available balance and locked balance separately

### Requirement 3: Payment Method Verification (KYC)

**User Story:** As a platform user, I want to verify my payment method securely, so that I can receive payouts and ensure transaction safety.

#### Acceptance Criteria

1. WHEN a user adds a bank account THEN the System SHALL collect account holder name, account number, IFSC code, and bank name
2. WHEN a user adds UPI ID THEN the System SHALL validate the UPI ID format
3. WHEN a user initiates payment method verification THEN the System SHALL charge ₹1 via Razorpay to the provided payment method
4. WHEN the ₹1 verification charge succeeds THEN the System SHALL mark the payment method as verified and credit ₹1 to user's wallet
5. WHEN the ₹1 verification charge fails THEN the System SHALL mark verification as failed and display the error reason
6. WHEN a user has no verified payment method THEN the System SHALL prevent withdrawal requests
7. WHEN a user submits KYC documents THEN the System SHALL store documents securely in Supabase Storage with user-specific paths

### Requirement 4: Escrow Payment Flow for Contracts

**User Story:** As a Client, I want to fund an escrow when accepting a bid, so that the Influencer is assured of payment upon work completion.

#### Acceptance Criteria

1. WHEN a Client accepts a bid THEN the System SHALL create an escrow record with calculated fee breakdown
2. WHEN escrow is created THEN the System SHALL display: gross amount, Razorpay fee (2.36%), platform fee (10%), and Influencer payout amount
3. WHEN Client initiates escrow funding THEN the System SHALL create a Razorpay order for the gross amount
4. WHEN escrow payment is verified THEN the System SHALL update escrow status to HELD_IN_ESCROW
5. WHILE funds are in escrow THEN the System SHALL prevent any party from accessing the funds
6. WHEN escrow is funded THEN the System SHALL notify the Influencer that payment is secured

### Requirement 5: Work Submission and Approval

**User Story:** As an Influencer, I want to submit my completed work with proof, so that the Client can review and approve for payment release.

#### Acceptance Criteria

1. WHEN an Influencer submits work THEN the System SHALL require at least one deliverable (screenshot, link, video, or analytics)
2. WHEN deliverables are uploaded THEN the System SHALL store files in Supabase Storage under contract-specific paths
3. WHEN work is submitted THEN the System SHALL update escrow status to WORK_SUBMITTED and notify the Client
4. WHEN Client reviews deliverables THEN the System SHALL allow approval, rejection, or revision request
5. IF Client requests revision THEN the System SHALL notify the Influencer with feedback and keep escrow status unchanged
6. WHEN Client approves work THEN the System SHALL update escrow status to APPROVED

### Requirement 6: Payment Release to Influencer

**User Story:** As an Influencer, I want to receive payment automatically when my work is approved, so that I get paid promptly for completed work.

#### Acceptance Criteria

1. WHEN Client approves work THEN the System SHALL calculate Influencer payout (gross - gateway fee - platform fee)
2. WHEN payout is calculated THEN the System SHALL credit the payout amount to Influencer's wallet immediately
3. WHEN wallet is credited THEN the System SHALL create a wallet transaction record with escrow reference
4. WHEN payout completes THEN the System SHALL update escrow status to PAID_OUT and contract status to COMPLETED
5. WHEN payout completes THEN the System SHALL notify the Influencer with the credited amount
6. WHEN payout completes THEN the System SHALL record platform revenue from the platform fee

### Requirement 7: Dispute Resolution System

**User Story:** As a platform user, I want to raise disputes when issues arise, so that conflicts can be resolved fairly by the platform.

#### Acceptance Criteria

1. WHEN a user raises a dispute THEN the System SHALL require reason, description, and optional evidence uploads
2. WHEN dispute is raised THEN the System SHALL update escrow status to DISPUTED and lock the funds
3. WHEN dispute is raised THEN the System SHALL notify the other party and platform admins
4. WHEN Admin reviews dispute THEN the System SHALL allow resolution in favor of Client, Influencer, or split
5. IF dispute resolves for Client THEN the System SHALL refund the escrow amount minus gateway fee to Client's wallet
6. IF dispute resolves for Influencer THEN the System SHALL release the payout amount to Influencer's wallet
7. IF dispute resolves as split THEN the System SHALL distribute funds according to Admin-specified percentages

### Requirement 8: Refund Processing

**User Story:** As a Client, I want to request a refund before work starts, so that I can cancel contracts that are no longer needed.

#### Acceptance Criteria

1. WHILE escrow status is HELD_IN_ESCROW THEN the System SHALL allow Client to request refund
2. WHEN refund is requested THEN the System SHALL refund (gross amount - Razorpay fee) to Client's wallet
3. WHEN refund is processed THEN the System SHALL update escrow status to REFUNDED and contract status to CANCELLED
4. WHEN refund is processed THEN the System SHALL notify both Client and Influencer
5. IF escrow status is WORK_SUBMITTED THEN the System SHALL prevent direct refund and require dispute process

### Requirement 9: Admin Dashboard for Payment Management

**User Story:** As an Admin, I want comprehensive controls over the payment system, so that I can manage platform finances and resolve issues.

#### Acceptance Criteria

1. WHEN Admin accesses payment dashboard THEN the System SHALL display total escrow held, total payouts, and platform revenue
2. WHEN Admin views transactions THEN the System SHALL show all escrow transactions with filtering by status, date, and user
3. WHEN Admin manages credits THEN the System SHALL allow enabling/disabling credit system and adjusting prices
4. WHEN Admin reviews disputes THEN the System SHALL display all open disputes with evidence and allow resolution
5. WHEN Admin adjusts user credits THEN the System SHALL record the adjustment with reason and Admin ID
6. WHEN Admin views KYC requests THEN the System SHALL display pending verifications with submitted documents
7. WHEN Admin approves/rejects KYC THEN the System SHALL update user verification status and send notification

### Requirement 10: Secure File Storage

**User Story:** As a platform user, I want my documents and deliverables stored securely, so that my sensitive information is protected.

#### Acceptance Criteria

1. WHEN a user uploads KYC documents THEN the System SHALL store files at path `kyc/{userId}/{documentType}/{filename}`
2. WHEN an Influencer uploads deliverables THEN the System SHALL store files at path `deliverables/{contractId}/{filename}`
3. WHEN a user uploads profile images THEN the System SHALL store files at path `profiles/{userId}/{filename}`
4. WHEN files are accessed THEN the System SHALL verify the requesting user has permission to view
5. WHEN generating file URLs THEN the System SHALL create signed URLs with expiration for security

### Requirement 11: Transaction Audit Trail

**User Story:** As a platform operator, I want complete audit trails for all financial transactions, so that I can ensure compliance and investigate issues.

#### Acceptance Criteria

1. WHEN any payment is processed THEN the System SHALL record timestamp, user, amount, type, and status
2. WHEN escrow status changes THEN the System SHALL record the previous status, new status, and trigger reason
3. WHEN wallet balance changes THEN the System SHALL record balance before, balance after, and transaction reference
4. WHEN Admin performs financial action THEN the System SHALL record Admin ID, action type, and affected records
5. WHEN Razorpay webhook is received THEN the System SHALL log the complete payload and processing result

### Requirement 12: Real-time Notifications

**User Story:** As a platform user, I want real-time notifications for payment events, so that I stay informed about my financial activities.

#### Acceptance Criteria

1. WHEN escrow is funded THEN the System SHALL notify both Client and Influencer immediately
2. WHEN work is submitted THEN the System SHALL notify the Client for review
3. WHEN work is approved THEN the System SHALL notify the Influencer with payout amount
4. WHEN dispute is raised THEN the System SHALL notify the other party and admins
5. WHEN dispute is resolved THEN the System SHALL notify both parties with resolution details
6. WHEN wallet balance changes THEN the System SHALL notify the user with transaction details
