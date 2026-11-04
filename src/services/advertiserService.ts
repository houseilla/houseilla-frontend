import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type { Advertiser } from '../models/advertisement';

export const advertiserService = {
  /**
   * Dispatches the profile payload data securely utilizing centralized apiClient interceptors
   */
  async saveAdvertiserProfile(profilePayload: Advertiser): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.SAVE_ADVERTISER, profilePayload);
    return response.data;
  }
};
