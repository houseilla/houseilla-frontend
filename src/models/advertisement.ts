import { AdvertisementPropertyType, AdvertisementPurpose, AdvertisementStatus } from './advertisementEnums';

export interface Advertiser {
  id: number;              
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  advertiserType: number;   
  contractualStatus: number; 
}

export interface AdvertisementImage {
  fileId?: number;
  advertisementId: number;
  name: string;
  type: string;
  file?: string;
  base64Data?: string;
}

export interface FlatDetail {
  id: number;
  advertisementId: number;
  isCommunity: boolean;
  buildingRising: string;
  floorNumber: number;
  carpetArea: number;
  flatType: string;
  liftAvailable: boolean;
  parkings: number;
  possessionBy: string;
  propertyAge: number;
  amenities: string;
}

export interface LandDetail {
  id: number;
  advertisementId: number;
  landArea: number;
  description: string;
}

export interface HouseDetail {
  id: number;
  advertisementId: number;
  landArea: number;
  carpetArea: number;
  floors: number;
  noOfParking: number;
  roadFacing: string;
  roadWidth: number;
}

export interface OfficeDetail {
  id: number;
  advertisementId: number;
  floorNo: number;
  area: number;
  furnishedType: string;
}

export interface ShopDetail {
  id: number;
  advertisementId: number;
  floorNo: number;
  area: number;
}

export interface WarehouseDetail {
  id: number;
  advertisementId: number;
  area: number;
}

export interface Advertisement {
  id: number;
  advertiserId: number;
  propertyType: AdvertisementPropertyType; 
  purpose: AdvertisementPurpose;
  listingStatus: AdvertisementStatus;
  price: number;
  description: string;
  propertyNumber?: string;
  areaName: string;
  addressLine1: string;
  addressLine2?: string;
  district?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isPremium: number;
  updateDate?: string; 
  createDate?: string; 
}
