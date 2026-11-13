import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type { Advertisement, LandDetail, FlatDetail } from '../models/advertisement';

export const advertisementService = {
  /**
   * Fetches all existing advertisements owned by the given advertiser ID.
   */
  async getAdvertisementsByAdvertiser(advertiserId: number): Promise<Advertisement[]> {
    const response = await apiClient.get<Advertisement[]>(
      API_ENDPOINTS.ADVERTISEMENTS_BY_ADVERTISER(advertiserId)
    );
    return response.data;
  },

  /**
   * Step 5 Wizard Phase: Saves or updates core listing data row.
   */
  async saveAdvertisementListing(
    advertisementId: number | null,
    payload: Advertisement
  ): Promise<Advertisement> {
    const endpoint = advertisementId
      ? `${API_ENDPOINTS.BASE_ADVERTISEMENTS}/${advertisementId}`
      : `${API_ENDPOINTS.BASE_ADVERTISEMENTS}`;

    const response = await apiClient({
      method: advertisementId ? 'put' : 'post',
      url: endpoint,
      data: payload
    });

    return response.data;
  },


  /**
   * Deletes an advertisement and its associated property details row.
   */
  async deleteAdvertisement(advertisementId: number): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.BASE_ADVERTISEMENTS}/${advertisementId}`);
  },

  /**
   * Step 6 Wizard Phase: Hydrates Land physical specifications mapping advertisementId.
   */
  async saveLandDetail(payload: LandDetail): Promise<LandDetail> {
    const endpoint = `${API_ENDPOINTS.PROPERTY_DETAILS_LAND}`;
    const response = await apiClient.post<LandDetail>(endpoint, payload);
    return response.data;
  },

  /**
   * Step 6 Wizard Phase: Hydrates Flat physical specifications mapping advertisementId.
   */
  async saveFlatDetail(payload: FlatDetail): Promise<FlatDetail> {
    const endpoint = `${API_ENDPOINTS.PROPERTY_DETAILS_FLAT}`;
    const response = await apiClient.post<FlatDetail>(endpoint, payload);
    return response.data;
  }

};
