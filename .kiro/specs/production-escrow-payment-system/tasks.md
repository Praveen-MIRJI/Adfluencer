# Implementation Plan

## Phase 1: Database Schema & Core Infrastructure

- [x] 1. Set up database schema extensions
  - [x] 1.1 Create PaymentMethodVerification table for ₹1 verification tracking
    - Add columns: id, userId, paymentMethodId, verificationAmount, razorpayOrderId, razorpayPaymentId, status, failureReason, timestamps
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 1.2 Create WithdrawalRequest table for payout tracking
    - Add columns: id, userId, paymentMethodId, amount, status, razorpayPayoutId, failureReason, timestamps
    - _Requirements: 2.5_
  - [x] 1.3 Create DisputeEvidence table for dispute attachments
    - Add columns: id, disputeId, uploadedBy, fileUrl, fileType, description, timestamp
    - _Requirements: 7.1_
  - [x] 1.4 Create RevenueSummary table for admin dashboard
    - Add columns: id, date, totalEscrowCreated, totalEscrowReleased, totalPlatformFees, totalCreditPurchases, totalWithdrawals
    - _Requirements: 9.1_
  - [x] 1.5 Add missing indexes for performance optimization
    - _Requirements: 11.1_

- [x] 2. Set up Supabase Storage buckets
  - [x] 2.1 Create kyc-documents bucket (private) with RLS policies
    - Path pattern: `{userId}/{documentType}/{filename}`
    - _Requirements: 3.7, 10.1_
  - [x] 2.2 Create deliverables bucket (private) with RLS policies
    - Path pattern: `{contractId}/{filename}`
    - _Requirements: 5.2, 10.2_
  - [x] 2.3 Create dispute-evidence bucket (private) with RLS policies
    - Path pattern: `{disputeId}/{filename}`
    - _Requirements: 7.1_
  - [ ]* 2.4 Write property test for file storage path patterns
    - **Property 9: File Storage Path Pattern**
    - **Validates: Requirements 3.7, 5.2, 10.1, 10.2, 10.3**

- [x] 3. Checkpoint - Phase 1 Complete
  - All database tables created
  - All storage buckets configured with proper privacy settings

## Phase 2: Credit System Implementation

- [x] 4. Implement Credit System Backend
  - [x] 4.1 Update credits.controller.ts with real Razorpay integration
    - Implement purchaseCredits with Razorpay order creation
    - Implement verifyCreditPayment with signature verification
    - Implement useCredit with balance check and deduction
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ]* 4.2 Write property test for credit purchase order amount
    - **Property 1: Credit Purchase Order Amount Calculation**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 4.3 Write property test for credit balance update
    - **Property 2: Credit Balance Update on Purchase**
    - **Validates: Requirements 1.3**
  - [ ]* 4.4 Write property test for credit deduction
    - **Property 3: Credit Deduction on Action**
    - **Validates: Requirements 1.4, 1.5**
  - [x] 4.5 Implement admin credit controls in admin/credits.controller.ts
    - Toggle credit system on/off
    - Adjust credit prices
    - Manual credit adjustments with audit logging
    - _Requirements: 1.7, 9.3, 9.5_
  - [ ]* 4.6 Write property test for free actions when disabled
    - **Property 4: Free Actions When Credit System Disabled**
    - **Validates: Requirements 1.7**

- [ ] 5. Implement Credit System Frontend
  - [ ] 5.1 Update CreditPurchaseModal.tsx with Razorpay checkout
    - Display credit prices (₹5/bid, ₹10/post)
    - Integrate Razorpay checkout flow
    - Handle payment success/failure
    - _Requirements: 1.1, 1.2_
  - [ ] 5.2 Update CreditBalance.tsx to show real-time balance
    - Fetch balance from API
    - Show bid and post credits separately
    - _Requirements: 1.3_
  - [ ] 5.3 Create admin CreditSettings.tsx component
    - Toggle credit system
    - Edit credit prices
    - View credit statistics
    - _Requirements: 9.3_

- [x] 6. Checkpoint - Phase 2 Backend Complete
  - Credit system backend fully implemented with Razorpay
  - Admin controls implemented

## Phase 3: Wallet System Implementation

- [x] 7. Implement Wallet Backend
  - [x] 7.1 Update billing.controller.ts with real Razorpay wallet top-up
    - Create Razorpay order for top-up (min ₹100)
    - Verify payment and credit wallet
    - Record wallet transaction
    - _Requirements: 2.1, 2.2_
  - [ ]* 7.2 Write property test for wallet balance updates
    - **Property 5: Wallet Balance Update on Payment**
    - **Validates: Requirements 2.2, 2.3, 6.2, 7.5, 7.6, 8.2**
  - [x] 7.3 Implement wallet lock/unlock for disputes
    - Lock funds when dispute raised
    - Unlock on dispute resolution
    - _Requirements: 2.6_
  - [ ]* 7.4 Write property test for dispute fund locking
    - **Property 6: Dispute Fund Locking**
    - **Validates: Requirements 2.6**
  - [x] 7.5 Implement withdrawal request endpoint
    - Verify user has verified payment method
    - Create withdrawal request record
    - _Requirements: 2.4, 2.5_

- [ ] 8. Implement Wallet Frontend
  - [ ] 8.1 Update WalletManagement.tsx with Razorpay integration
    - Top-up form with amount input (min ₹100)
    - Razorpay checkout integration
    - Display available and locked balance
    - _Requirements: 2.1, 2.7_
  - [ ] 8.2 Create WithdrawalRequest.tsx component
    - Select verified payment method
    - Enter withdrawal amount
    - Show withdrawal history
    - _Requirements: 2.4, 2.5_

- [x] 9. Checkpoint - Phase 3 Backend Complete
  - Wallet top-up with Razorpay implemented
  - Withdrawal requests implemented

## Phase 4: Payment Method & KYC Verification

- [x] 10. Implement Payment Method Verification Backend
  - [x] 10.1 Create payment-method.controller.ts
    - Add bank account endpoint
    - Add UPI ID endpoint with format validation
    - _Requirements: 3.1, 3.2_
  - [ ]* 10.2 Write property test for UPI ID validation
    - **Property 7: UPI ID Format Validation**
    - **Validates: Requirements 3.2**
  - [x] 10.3 Implement ₹1 verification charge flow
    - Create Razorpay order for ₹1
    - Verify payment and mark method verified
    - Credit ₹1 to user wallet
    - _Requirements: 3.3, 3.4, 3.5_
  - [ ]* 10.4 Write property test for verification wallet credit
    - **Property 8: Payment Method Verification Wallet Credit**
    - **Validates: Requirements 3.4**

- [ ] 11. Update KYC System
  - [ ] 11.1 Update kyc.controller.ts for Supabase Storage integration
    - Upload documents to kyc/{userId}/{documentType}/ path
    - Generate signed URLs for document access
    - _Requirements: 3.7, 10.1_
  - [ ] 11.2 Implement admin KYC review endpoints
    - List pending KYC requests
    - Approve/reject with reason
    - _Requirements: 9.6, 9.7_

- [ ] 12. Implement Payment Method Frontend
  - [ ] 12.1 Create PaymentMethodForm.tsx component
    - Bank account form (name, account number, IFSC, bank name)
    - UPI ID form with validation
    - _Requirements: 3.1, 3.2_
  - [ ] 12.2 Create PaymentMethodVerification.tsx component
    - Show ₹1 verification flow
    - Razorpay checkout for ₹1
    - Display verification status
    - _Requirements: 3.3, 3.4, 3.5_
  - [ ] 12.3 Update KYC submission UI for file uploads
    - Document upload with preview
    - Progress indicator
    - _Requirements: 3.7_

- [x] 13. Checkpoint - Phase 4 Backend Complete
  - Payment method CRUD with ₹1 verification implemented
  - Routes registered in main app

## Phase 5: Escrow System Implementation

- [x] 14. Implement Escrow Fee Calculation
  - [x] 14.1 Create escrow fee calculation utility
    - Calculate Razorpay fee (2.36%)
    - Calculate platform fee (10%)
    - Calculate provider payout
    - _Requirements: 4.1, 4.2, 6.1_
  - [ ]* 14.2 Write property test for fee calculation
    - **Property 10: Escrow Fee Calculation Consistency**
    - **Validates: Requirements 4.1, 4.2, 6.1**

- [x] 15. Implement Escrow Creation & Funding
  - [x] 15.1 Update escrow.controller.ts createEscrow
    - Create escrow record with fee breakdown
    - Create Razorpay order for gross amount
    - _Requirements: 4.1, 4.3_
  - [ ]* 15.2 Write property test for escrow order amount
    - **Property 11: Escrow Order Amount Consistency**
    - **Validates: Requirements 4.3**
  - [x] 15.3 Implement verifyEscrowPayment
    - Verify Razorpay signature
    - Update escrow status to HELD_IN_ESCROW
    - Notify influencer
    - _Requirements: 4.4, 4.6_
  - [ ]* 15.4 Write property test for escrow status transitions
    - **Property 12: Escrow Status Transitions**
    - **Validates: Requirements 4.4, 5.3, 5.6, 6.4, 7.2, 8.3**

- [x] 16. Implement Work Submission & Approval
  - [x] 16.1 Update deliverable.controller.ts for Supabase Storage
    - Upload deliverables to deliverables/{contractId}/ path
    - Support multiple file types (screenshot, video, link, analytics)
    - _Requirements: 5.1, 5.2_
  - [x] 16.2 Implement submitWork endpoint
    - Validate at least one deliverable exists
    - Update escrow status to WORK_SUBMITTED
    - Notify client
    - _Requirements: 5.1, 5.3_
  - [x] 16.3 Implement requestRevision endpoint
    - Keep escrow status unchanged
    - Store feedback
    - Notify influencer
    - _Requirements: 5.4, 5.5_
  - [ ]* 16.4 Write property test for revision status preservation
    - **Property 13: Revision Request Status Preservation**
    - **Validates: Requirements 5.5**
  - [x] 16.5 Implement approveAndRelease endpoint
    - Update escrow status to APPROVED then PAID_OUT
    - Credit influencer wallet
    - Record platform revenue
    - Update contract status to COMPLETED
    - _Requirements: 5.6, 6.1, 6.2, 6.3, 6.4, 6.6_
  - [ ]* 16.6 Write property test for wallet transaction records
    - **Property 14: Wallet Transaction Record Creation**
    - **Validates: Requirements 6.3, 11.1, 11.3**
  - [ ]* 16.7 Write property test for platform revenue recording
    - **Property 15: Platform Revenue Recording**
    - **Validates: Requirements 6.6**

- [x] 17. Checkpoint - Phase 5 Backend Complete
  - Escrow system fully implemented with fee calculations
  - Work submission and approval flow complete

## Phase 6: Dispute & Refund System

- [ ] 18. Implement Dispute System
  - [ ] 18.1 Update dispute.controller.ts
    - Raise dispute with reason, description, evidence
    - Update escrow status to DISPUTED
    - Lock funds in wallet
    - Notify parties and admins
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 18.2 Implement admin dispute resolution
    - Resolve for client (refund)
    - Resolve for influencer (payout)
    - Resolve as split (percentage distribution)
    - _Requirements: 7.4, 7.5, 7.6, 7.7_
  - [ ]* 18.3 Write property test for dispute split distribution
    - **Property 16: Dispute Split Distribution**
    - **Validates: Requirements 7.7**

- [ ] 19. Implement Refund System
  - [ ] 19.1 Update escrow.controller.ts requestRefund
    - Validate escrow status is HELD_IN_ESCROW
    - Calculate refund amount (gross - razorpayFee)
    - Credit client wallet
    - Update escrow status to REFUNDED
    - Update contract status to CANCELLED
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 19.2 Write property test for refund status restriction
    - **Property 17: Refund Status Restriction**
    - **Validates: Requirements 8.1, 8.5**

- [ ] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Escrow Frontend Components

- [ ] 21. Implement Escrow UI Components
  - [ ] 21.1 Create EscrowPaymentFlow.tsx component
    - Display fee breakdown (gross, gateway fee, platform fee, payout)
    - Razorpay checkout integration
    - Payment status display
    - _Requirements: 4.2, 4.3_
  - [ ] 21.2 Create DeliverableUpload.tsx component
    - Multi-file upload with drag-and-drop
    - File type selection (screenshot, video, link, analytics)
    - Upload progress indicator
    - _Requirements: 5.1, 5.2_
  - [ ] 21.3 Create WorkReview.tsx component for clients
    - Display submitted deliverables
    - Approve, reject, or request revision buttons
    - Feedback input for revisions
    - _Requirements: 5.4_
  - [ ] 21.4 Create DisputeForm.tsx component
    - Reason selection
    - Description input
    - Evidence upload
    - _Requirements: 7.1_
  - [ ] 21.5 Update ContractDetails.tsx with escrow status display
    - Show current escrow status
    - Display fee breakdown
    - Action buttons based on status
    - _Requirements: 4.2, 5.3, 5.6_

- [ ] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Admin Dashboard

- [ ] 23. Implement Admin Payment Dashboard Backend
  - [ ] 23.1 Create admin/payment.controller.ts
    - Get payment statistics (total escrow, payouts, revenue)
    - List all escrow transactions with filters
    - List all disputes
    - _Requirements: 9.1, 9.2, 9.4_
  - [ ] 23.2 Implement revenue summary aggregation
    - Daily revenue calculation
    - Update RevenueSummary table
    - _Requirements: 9.1_

- [ ] 24. Implement Admin Dashboard Frontend
  - [ ] 24.1 Create admin/PaymentDashboard.tsx
    - Revenue statistics cards
    - Escrow transaction table with filters
    - Charts for revenue trends
    - _Requirements: 9.1, 9.2_
  - [ ] 24.2 Create admin/DisputeManagement.tsx
    - List open disputes
    - View dispute details and evidence
    - Resolution actions (client/influencer/split)
    - _Requirements: 9.4_
  - [ ] 24.3 Update admin/KYCManagement.tsx
    - List pending KYC requests
    - View submitted documents
    - Approve/reject actions
    - _Requirements: 9.6, 9.7_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Security & Audit

- [ ] 26. Implement File Access Security
  - [ ] 26.1 Create storage access middleware
    - Verify user permission for file access
    - Generate signed URLs with expiration
    - _Requirements: 10.4, 10.5_
  - [ ]* 26.2 Write property test for file access authorization
    - **Property 18: File Access Authorization**
    - **Validates: Requirements 10.4**
  - [ ]* 26.3 Write property test for signed URL expiration
    - **Property 19: Signed URL Expiration**
    - **Validates: Requirements 10.5**

- [ ] 27. Implement Audit Trail System
  - [ ] 27.1 Create audit logging middleware
    - Log all financial transactions
    - Log escrow status changes
    - Log wallet balance changes
    - Log admin actions
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ] 27.2 Update webhook handler with complete logging
    - Log all Razorpay webhook events
    - Store processing results
    - _Requirements: 11.5_
  - [ ]* 27.3 Write property test for audit trail completeness
    - **Property 20: Audit Trail Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 28. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Notifications & Final Integration

- [ ] 29. Implement Real-time Notifications
  - [ ] 29.1 Update notification service for payment events
    - Escrow funded notification
    - Work submitted notification
    - Work approved notification
    - Dispute notifications
    - Wallet balance change notifications
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 30. Final Integration & Testing
  - [ ] 30.1 Integration test: Complete escrow lifecycle
    - Client posts ad → Influencer bids → Client accepts → Escrow funded → Work submitted → Approved → Payout
  - [ ] 30.2 Integration test: Dispute flow
    - Escrow funded → Dispute raised → Admin resolves → Funds distributed
  - [ ] 30.3 Integration test: Refund flow
    - Escrow funded → Client requests refund → Funds returned
  - [ ] 30.4 End-to-end test with Razorpay test mode
    - Verify all payment flows work with test credentials

- [ ] 31. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
