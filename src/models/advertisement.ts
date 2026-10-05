import { 
  AdvertisementCategory, 
  AdvertisementPropertyType, 
  AdvertisementPurpose 
} from './enums';

// Mirrors AdvertisementImage.java
export interface AdvertisementImage {
  fileId: number;
  advertisementId: number;
  name: string;
  type: string;
  byte11: string; // Stored as Base64 string from backend
  base64Data?: string; // Generated helper for <img> src tags: `data:${type};base64,${byte11}`
}

// Mirrors Advertiser.java
export interface Advertiser {
  advertiserId: number;
  advertiserName: string;
  isPremium: number;
  advertiserType: number;
  advertiserPhone: string;
  advertiserEmail: string;
}

// Mirrors Advertisement.java (The Base Model Hub)
export interface Advertisement {
  advertisementId: number;
  advertiserId: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  type: number; // Mapping value reference
  contractual: number;

  // Address Details
  propertyNumber: string;
  areaName: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  pincode: string;

  // Geolocation Matrix
  latitude: number;
  longitude: number;

  // Categorization & Metadata
  category: AdvertisementCategory;
  propertyType: AdvertisementPropertyType;
  purpose: AdvertisementPurpose;
  price: number;
  description: string;
  updateDate: string; // ISO Timestamp string
  createDate: string; // ISO Timestamp string

  // Relationships
  images?: AdvertisementImage[];
}
