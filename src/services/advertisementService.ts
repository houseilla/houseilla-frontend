import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type { Advertisement, LandDetail } from '../models/advertisement';

export const advertisementService = {
  /**
   * Step 2 Wizard Phase: Saves core listing data row as a clean flat DRAFT baseline row.
   */
  async saveAdvertisementListing(
    advertisementId: number | null,
    payload: Advertisement
  ): Promise<Advertisement> {

    const endpoint = advertisementId
      ? `${API_ENDPOINTS.BASE_ADVERTISEMENTS}/${advertisementId}`
      : `${API_ENDPOINTS.BASE_ADVERTISEMENTS}`;

    // Handled cleanly via centralized apiClient interceptor loop
    const response = await apiClient({
      method: advertisementId ? 'put' : 'post',
      url: endpoint,
      data: payload
    });

    return response.data;
  },

  /**
   * Step 3 Wizard Phase: Hydrates Land physical specifications mapping advertisementId.
   */
  async saveLandDetail(payload: LandDetail): Promise<LandDetail> {
    const endpoint = `${API_ENDPOINTS.PROPERTY_DETAILS_LAND}`;
    const response = await apiClient.post<LandDetail>(endpoint, payload);
    return response.data;
  }
};
