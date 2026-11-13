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

// 🌟 1. DECOUPLED MEDIA SCHEMA DRIVEN BY SCALAR FOREIGN KEY
export interface AdvertisementImage {
  id?: number;
  advertisementId: number; // Linked unidirectionally to parent advertisement
  filePayload: string;     // Transmitted/Received as raw binary string or Base64
  base64Data?: string;     // Transient field for local browser preview hydration
}

// 🌟 2. INDEPENDENT PHYSICAL SPECIFICATION SUB-TYPES (NO NESTING/INHERITANCE)
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
  possessionBy: string;   // ISO Date format string (YYYY-MM-DD)
  propertyAge: number;
  amenities: string;
}

export interface LandDetail {
  id: number;
  advertisementId: number; // Unique constraint enforced programmatic link
  landArea: number;        // Standardized name matching refactored backend field
  description: string;
}

export interface HouseDetail {
  id: number;
  advertisementId: number;
  landArea: number;
  carpetArea: number;
  floors: number;
  parkings: number;
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

// 🌟 3. LEAN CENTER TRANSACTIONAL listing SCHEMA CONTRACT
export interface Advertisement {
  id: number; // Changed from advertisementId to match backend entity 'id'
  advertiserId: number; // Scalar structural reference key tracking Step 1 profile

  // Enums configuration mapped precisely to backend ORDINAL variables
  propertyType: AdvertisementPropertyType; 
  purpose: AdvertisementPurpose;
  listingStatus: AdvertisementStatus; // Tracks DRAFT / ACTIVE states seamlessly

  // Financial and Geospatial metrics mapped to matching precision numbers
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
  isPremium: number; // 0 = Standard, 1 = Premium Feature Listing

  // Audit Logs Timestamps
  updateDate?: string; 
  createDate?: string; 
}
