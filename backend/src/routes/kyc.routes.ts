import { Router } from 'express';
import { body } from 'express-validator';
import * as kycController from '../controllers/kyc.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// KYC submission validation - simplified for better UX
const kycSubmissionValidation = [
  body('documentType')
    .isIn(['AADHAAR', 'PAN', 'VOTER_ID', 'PASSPORT', 'DRIVING_LICENSE'])
    .withMessage('Invalid document type'),
  body('documentNumber')
    .notEmpty()
    .withMessage('Document number is required'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required'),
  body('address')
    .notEmpty()
    .withMessage('Address is required'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('documentFrontUrl')
    .notEmpty()
    .withMessage('Document front image is required'),
  body('documentBackUrl')
    .optional({ checkFalsy: true }),
  body('selfieUrl')
    .notEmpty()
    .withMessage('Selfie image is required')
];

// Phone verification validation
const phoneVerificationValidation = [
  body('phoneNumber')
    .isMobilePhone('en-IN')
    .withMessage('Invalid Indian phone number'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

// Email verification validation
const emailVerificationValidation = [
  body('token')
    .isLength({ min: 10 })
    .withMessage('Invalid verification token')
];

// KYC review validation (admin only)
const kycReviewValidation = [
  body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be APPROVED or REJECTED'),
  body('rejectionReason')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10-500 characters')
];

// User routes
router.post('/submit', authenticate, validate(kycSubmissionValidation), kycController.submitKycVerification);
router.get('/status', authenticate, kycController.getKycStatus);
router.post('/verify-phone', authenticate, validate(phoneVerificationValidation), kycController.verifyPhoneNumber);
router.post('/send-email-verification', authenticate, kycController.sendEmailVerification);
router.post('/verify-email', authenticate, validate(emailVerificationValidation), kycController.verifyEmail);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), kycController.getAllKycVerifications);
router.put('/admin/review/:id', authenticate, authorize('ADMIN'), validate(kycReviewValidation), kycController.reviewKycVerification);

export default router;