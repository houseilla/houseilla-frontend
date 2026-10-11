import type { Advertiser } from './advertisement';

/**
 * Payload sent to backend to trigger the free email OTP delivery pipeline.
 */
export interface SendOtpRequest {
  email: string;
  phone: string;
}

/**
 * Payload sent to backend to verify the code and resolve account status.
 */
export interface VerifyOtpRequest {
  email: string;
  phone: string;
  otpCode: string;
}

/**
 * Unified response payload sent back by the Spring Boot backend validation controller.
 */
export interface AuthVerificationResponse {
  isPreExisting: boolean;
  advertiser: Advertiser | null; // Populated only if isPreExisting is true
  jwtToken?: string;              // Session credential used for submitting property objects later
}
