// 1. Advertisement Category
export enum AdvertisementCategory {
  PRIVATE = 0,
  COMMERCIAL = 1
}

export const AdvertisementCategoryLabels: Record<AdvertisementCategory, string> = {
  [AdvertisementCategory.PRIVATE]: 'Private',
  [AdvertisementCategory.COMMERCIAL]: 'Commercial'
};

// 2. Advertiser Type
export enum AdvertiserType {
  BROKER = 0,
  BUILDER = 1,
  INDIVIDUAL = 2
}

export const AdvertiserTypeLabels: Record<AdvertiserType, string> = {
  [AdvertiserType.BROKER]: 'Broker',
  [AdvertiserType.BUILDER]: 'Builder',
  [AdvertiserType.INDIVIDUAL]: 'Individual'
};

// 3. Advertisement Property Type (Master Discriminator)
export enum AdvertisementPropertyType {
  PRIVATE_LAND = 0,
  HOUSE = 1,
  FLAT = 2,
  COMMERCIAL_LAND = 3,
  SHOP = 4,
  OFFICE = 5,
  WAREHOUSE = 6
}

export const AdvertisementPropertyTypeLabels: Record<AdvertisementPropertyType, string> = {
  [AdvertisementPropertyType.PRIVATE_LAND]: 'Private Land',
  [AdvertisementPropertyType.HOUSE]: 'House',
  [AdvertisementPropertyType.FLAT]: 'Flat',
  [AdvertisementPropertyType.COMMERCIAL_LAND]: 'Commercial Land',
  [AdvertisementPropertyType.SHOP]: 'Shop',
  [AdvertisementPropertyType.OFFICE]: 'Office',
  [AdvertisementPropertyType.WAREHOUSE]: 'Warehouse'
};

// Mirrors the backend's static getkeyFromValue(int value) method
export function getPropertyTypeLabel(value: number): string {
  return AdvertisementPropertyTypeLabels[value as AdvertisementPropertyType] || 'UNKNOWN';
}

// 4. Advertisement Purpose
export enum AdvertisementPurpose {
  SALE = 0,
  RENT = 1,
  LEASE = 2
}

export const AdvertisementPurposeLabels: Record<AdvertisementPurpose, string> = {
  [AdvertisementPurpose.SALE]: 'For Sale',
  [AdvertisementPurpose.RENT]: 'For Rent',
  [AdvertisementPurpose.LEASE]: 'For Lease'
};

// 5. Advertiser Contractual
export enum AdvertiserContractual {
  FREE = 0,
  PREMIUM = 1
}
