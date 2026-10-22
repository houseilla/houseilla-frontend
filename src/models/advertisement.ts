export interface Advertiser {
  advertiserId: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  type: number;
  contractual: number;
}

export interface AdvertisementImage {
  fileId: number;
  advertisementId: number;
  name: string;
  type: string;
  file?: string; // Stored as Base64 string from backend payload channel
  base64Data?: string; // Calculated browser-readable preview template anchor
}

// 🌟 1. POLYMORPHIC CHILD DETAIL SUBSCHEMAS MATCHING SPRING BOOT SUBCLASSES
export interface FlatDetails {
  typeIndicator: 'flat';
  detailId?: number;
  isRent: number;
  isCommunity: number;
  buildingRising: number;
  floorNumber: number;
  carpetArea: string;
  flatType: number;
  liftAvailable: number;
  parkings: number;
  possessionBy: string;
  propertyAge: number;
  amenities: string;
}

export interface LandDetails {
  typeIndicator: 'land';
  detailId?: number;
  type: number; // 1 = Private Land, 2 = Commercial Land
  area: number;
  description: string;
}

export interface HouseDetails {
  typeIndicator: 'house';
  detailId?: number;
  landArea: string;
  carpetArea: string;
  floors: number;
  parkings: number;
  noOfParking: number;
  roadFacing: number;
  roadWidth: number;
}

export interface OfficeDetails {
  typeIndicator: 'office';
  detailId?: number;
  floorNo: string;
  area: string;
  furnishedType: number;
}

export interface ShopDetails {
  typeIndicator: 'shop';
  detailId?: number;
  floorNo: string;
  area: string;
}

export interface WarehouseDetails {
  typeIndicator: 'warehouse';
  detailId?: number;
  area: string;
}

// 🌟 2. UNIFIED UNION TYPE FOR WIZARD CONTEXT ROUTING
export type PropertyDetail = 
  | FlatDetails 
  | LandDetails 
  | HouseDetails 
  | OfficeDetails 
  | ShopDetails 
  | WarehouseDetails;

// 🌟 3. SYNCHRONIZED PARENT LISTING SCHEMA STRUCTURAL CONTRACT
export interface Advertisement {
  advertisementId: number;
  advertiserId: number;
  
  // Flattened Advertiser metadata within Advertisement record context
  advertiserName: string;
  isPremium: number; // Maps to private int isPremium in backend
  advertiserType: string;
  advertiserPhone: string;
  advertiserEmail: string;

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

  // Categorization & Metadata (Aligned to primitive int payloads)
  category: number;     // 1 = Private, 2 = Commercial
  propertyType: number; // Sub-type indicator index integer
  purpose: number;
  price: number;
  description: string;
  updateDate: string; // ISO Timestamp string representation
  createDate: string; // ISO Timestamp string representation

  // 🌟 THE MISSING LINKS INJECTED CLEANLY
  propertyDetail: PropertyDetail; 
  images?: AdvertisementImage[];
}
