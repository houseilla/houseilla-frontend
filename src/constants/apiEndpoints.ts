const API_BASE_URL = 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  SEND_OTP: `${API_BASE_URL}/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  
  SAVE_ADVERTISER: `${API_BASE_URL}/advertisers`

};

