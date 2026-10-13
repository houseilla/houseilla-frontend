// src/services/authService.ts
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type { OtpRequest, AuthVerificationResponse } from '../models/auth';

export const authService = {
  /**
   * Triggers the backend execution loop to issue a fresh mail validation token
   */
  async sendOtp(payload: OtpRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(API_ENDPOINTS.SEND_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  },

  /**
   * Dispatches the populated verification parameters to validate the transaction session
   */
  async verifyOtp(payload: OtpRequest): Promise<AuthVerificationResponse> {
    const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  }
};
