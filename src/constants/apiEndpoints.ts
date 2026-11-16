const API_BASE_URL = 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  SEND_OTP: `${API_BASE_URL}/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  SAVE_ADVERTISER: `${API_BASE_URL}/advertisers`,
  BASE_ADVERTISEMENTS: `${API_BASE_URL}/advertisements`,
  ADVERTISEMENTS_BY_ADVERTISER: (advertiserId: number) => `${API_BASE_URL}/advertisements/advertiser/${advertiserId}`,
  PROPERTY_DETAILS_LAND: `${API_BASE_URL}/advertisements/land`,
  PROPERTY_DETAILS_FLAT: `${API_BASE_URL}/advertisements/flat`,
  PROPERTY_DETAILS_HOUSE: `${API_BASE_URL}/advertisements/house`,
  PROPERTY_DETAILS_OFFICE: `${API_BASE_URL}/advertisements/office`,
  PROPERTY_DETAILS_SHOP: `${API_BASE_URL}/advertisements/shop`,
  PROPERTY_DETAILS_WAREHOUSE: `${API_BASE_URL}/advertisements/warehouse`
};
