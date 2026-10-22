// src/models/auth.ts
import type { Advertiser } from './advertisement';

/**
 * Unified request payload used strictly for authentication phases
 */
export interface OtpRequest {
  phone: string;
  email: string;
  otpCode: string; // Sent as empty string initially, populated during verification step
}

/**
 * Structural backend validation check reply
 */
export interface AuthVerificationResponse {
  success: boolean;
  message: string;
  isProfileExisting: boolean; 
  advertiser: Advertiser | null; // Database profile row context if pre-existing
  jwtToken?: string;
}
 