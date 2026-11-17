import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import type {
  Advertisement,
  LandDetail,
  FlatDetail,
  HouseDetail,
  OfficeDetail,
  ShopDetail,
  WarehouseDetail,
  AdvertisementImage
} from '../models/advertisement';

export const advertisementService = {
  async getAdvertisementsByAdvertiser(advertiserId: number): Promise<Advertisement[]> {
    const response = await apiClient.get<Advertisement[]>(
      API_ENDPOINTS.ADVERTISEMENTS_BY_ADVERTISER(advertiserId)
    );
    return response.data;
  },

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

  async deleteAdvertisement(advertisementId: number): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.BASE_ADVERTISEMENTS}/${advertisementId}`);
  },

  async saveLandDetail(payload: LandDetail): Promise<LandDetail> {
    const response = await apiClient.post<LandDetail>(API_ENDPOINTS.PROPERTY_DETAILS_LAND, payload);
    return response.data;
  },

  async saveFlatDetail(payload: FlatDetail): Promise<FlatDetail> {
    const response = await apiClient.post<FlatDetail>(API_ENDPOINTS.PROPERTY_DETAILS_FLAT, payload);
    return response.data;
  },

  async saveHouseDetail(payload: HouseDetail): Promise<HouseDetail> {
    const response = await apiClient.post<HouseDetail>(API_ENDPOINTS.PROPERTY_DETAILS_HOUSE, payload);
    return response.data;
  },

  async saveOfficeDetail(payload: OfficeDetail): Promise<OfficeDetail> {
    const response = await apiClient.post<OfficeDetail>(API_ENDPOINTS.PROPERTY_DETAILS_OFFICE, payload);
    return response.data;
  },

  async saveShopDetail(payload: ShopDetail): Promise<ShopDetail> {
    const response = await apiClient.post<ShopDetail>(API_ENDPOINTS.PROPERTY_DETAILS_SHOP, payload);
    return response.data;
  },

  async saveWarehouseDetail(payload: WarehouseDetail): Promise<WarehouseDetail> {
    const response = await apiClient.post<WarehouseDetail>(API_ENDPOINTS.PROPERTY_DETAILS_WAREHOUSE, payload);
    return response.data;
  },

  async getAdvertisementImages(advertisementId: number): Promise<AdvertisementImage[]> {
    const response = await apiClient.get<AdvertisementImage[]>(
      API_ENDPOINTS.ADVERTISEMENT_IMAGES(advertisementId)
    );
    return response.data;
  },

  async uploadAdvertisementImages(
    advertisementId: number,
    images: AdvertisementImage[]
  ): Promise<AdvertisementImage[]> {
    const response = await apiClient.post<AdvertisementImage[]>(
      API_ENDPOINTS.ADVERTISEMENT_IMAGES(advertisementId),
      images
    );
    return response.data;
  },

  async deleteAdvertisementImage(fileId: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DELETE_ADVERTISEMENT_IMAGE(fileId));
  },

  async updateAdvertisementImageLabel(fileId: number, name: string): Promise<AdvertisementImage> {
    const response = await apiClient.patch<AdvertisementImage>(
      API_ENDPOINTS.DELETE_ADVERTISEMENT_IMAGE(fileId),
      { name }
    );
    return response.data;
  },

};
