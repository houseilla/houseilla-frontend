// src/services/authService.ts
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type { OtpRequest, AuthVerificationResponse } from '../models/auth';

export const authService = {
  /**
   * Triggers the backend execution loop to issue a fresh mail validation token
   */
  async sendOtp(payload: OtpRequest): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(API_ENDPOINTS.SEND_OTP, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  /**
   * Dispatches the populated verification parameters to validate the transaction session.
   * Side-effects removed: Local storage management has been shifted up to the view component.
   */
  async verifyOtp(payload: OtpRequest): Promise<AuthVerificationResponse> {
    const response = await axios.post(API_ENDPOINTS.VERIFY_OTP, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Returns the clean response payload directly up to Step1Auth.vue
    return response.data;
  }
};
