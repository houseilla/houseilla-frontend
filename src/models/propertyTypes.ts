// Mirrors Land.java
export interface LandProperty {
  landId: number;
  advertisementId: number;
  type: number;
  area: number;
  description: string;
}

// Mirrors House.java
export interface HouseProperty {
  houseId: number;
  advertisementId: number;
  landArea: number;
  carpetArea: number;
  floors: number;
  parkings: number;
  noOfParking: number;
  roadFacing: string;
  roadWidth: number;
}

// Mirrors Flat.java
export interface FlatProperty {
  flatId: number;
  advertisementId: number;
  inResale: number;
  isCommunity: number;
  buildingRising: number;
  floorNumber: number;
  carpetArea: number;
  flatType: string;
  liftAvailable: number;
  parkings: number;
  possessionBy: string; // Target handover date
  propertyAge: number;
  amenities: string;
}

// Mirrors Warehouse.java
export interface WarehouseProperty {
  warehouseId: number;
  advertisementId: number;
  warehouse: number;
  area: number;
  areaName: string;
}

// Mirrors Shop.java
export interface ShopProperty {
  shopId: number;
  advertisementId: number;
  floorNo: string;
  area: number;
}

// Mirrors Office.java
export interface OfficeProperty {
  officeId: number;
  advertisementId: number;
  floorNo: string;
  area: string;
  furnishedType: number;
}
