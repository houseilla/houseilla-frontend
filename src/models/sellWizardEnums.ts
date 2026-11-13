import { 
    AdvertisementPurpose, 
    AdvertisementPurposeLabels, 
    AdvertisementCategory, 
    AdvertisementCategoryLabels, 
    AdvertisementPropertyType, 
    AdvertisementPropertyTypeLabels 
} from './advertisementEnums'; 

export enum SessionKey {
  OTP_VERIFIED = 'otp_verified',
  AUTH_TOKEN = 'auth_token',
  ADVERTISER = 'advertiser',
  CURRENT_STEP = 'current_step',
  MAX_STEP = 'max_step',
  ADVERTISEMENT = 'advertisement',
  PROPERTY_TYPE = 'property_type',
  PROPERTY_DETAILS = 'property_details',
  ADVERTISEMENT_OPERATION = 'advertisement_operation'
}

export enum WizardStep {
  IDENTIFICATION = 1,
  PROFILE = 2,
  SELECT_ACTION = 3,
  PROPERTY_LOCATION = 4,
  PROPERTY_TYPE_PURPOSE = 5,
  PROPERTY_DETAILS = 6,
  PHOTOS_MEDIA = 7
}

export interface StepMetadata {
  id: WizardStep;
  label: string;
  colorClass: string;
}

// Unified step list config metadata array decoupled from naming collisions
export const WIZARD_STEP_LIST: StepMetadata[] = [
  { id: WizardStep.IDENTIFICATION,        label: 'Advertiser Identification', colorClass: 'dot-brand-blue' },
  { id: WizardStep.PROFILE,               label: 'Advertiser Profile',        colorClass: 'dot-brand-orange' },
  { id: WizardStep.SELECT_ACTION,         label: 'Add/Update Advertisements', colorClass: 'dot-brand-gold' },
  { id: WizardStep.PROPERTY_LOCATION,     label: 'Property Location',          colorClass: 'dot-brand-green' },
  { id: WizardStep.PROPERTY_TYPE_PURPOSE, label: 'Property Type & Purpose',   colorClass: 'dot-brand-purple' },
  { id: WizardStep.PROPERTY_DETAILS,      label: 'Property Details',          colorClass: 'dot-brand-teal' },
  { id: WizardStep.PHOTOS_MEDIA,          label: 'Photos & Media',            colorClass: 'dot-brand-red' }
];


export interface RadioOption {
    value: number;
    label: string;
}

// Static configuration arrays moved out of component memory loops
export const PURPOSE_OPTIONS: RadioOption[] = [
    { value: AdvertisementPurpose.SALE, label: AdvertisementPurposeLabels[AdvertisementPurpose.SALE] },
    { value: AdvertisementPurpose.RENT, label: AdvertisementPurposeLabels[AdvertisementPurpose.RENT] },
    { value: AdvertisementPurpose.LEASE, label: AdvertisementPurposeLabels[AdvertisementPurpose.LEASE] }
];

export const CATEGORY_OPTIONS: RadioOption[] = [
    { value: AdvertisementCategory.PRIVATE, label: AdvertisementCategoryLabels[AdvertisementCategory.PRIVATE] },
    { value: AdvertisementCategory.COMMERCIAL, label: AdvertisementCategoryLabels[AdvertisementCategory.COMMERCIAL] }
];

export const PRIVATE_SUBTYPE_OPTIONS: RadioOption[] = [
    { value: AdvertisementPropertyType.PRIVATE_LAND, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.PRIVATE_LAND] },
    { value: AdvertisementPropertyType.FLAT, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.FLAT] },
    { value: AdvertisementPropertyType.HOUSE, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.HOUSE] }
];

export const COMMERCIAL_SUBTYPE_OPTIONS: RadioOption[] = [
    { value: AdvertisementPropertyType.OFFICE, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.OFFICE] },
    { value: AdvertisementPropertyType.SHOP, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.SHOP] },
    { value: AdvertisementPropertyType.COMMERCIAL_LAND, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.COMMERCIAL_LAND] },
    { value: AdvertisementPropertyType.WAREHOUSE, label: AdvertisementPropertyTypeLabels[AdvertisementPropertyType.WAREHOUSE] }
];

export const PRICING_UNIT_OPTIONS = [
    { label: 'Thousand', multiplier: 1000 },
    { label: 'Lakh', multiplier: 100000 },
    { label: 'Crore', multiplier: 10000000 }
];

export const LAND_AREA_UNIT_OPTIONS = [
    { label: 'Sq. Ft.', multiplier: 1 },
    { label: 'Katha', multiplier: 720 },
    { label: 'Bigha', multiplier: 14400 },
    { label: 'Acres', multiplier: 43560 }
];


/**
 * Maps numeric enums dynamically to Jackson polymorphic backend string labels
 */
export const getPolymorphicTypeIndicator = (propertyTypeIndex: number): string => {
    const typeMap: Record<number, string> = {
        [AdvertisementPropertyType.PRIVATE_LAND]: 'land',
        [AdvertisementPropertyType.COMMERCIAL_LAND]: 'land',
        [AdvertisementPropertyType.HOUSE]: 'house',
        [AdvertisementPropertyType.FLAT]: 'flat',
        [AdvertisementPropertyType.SHOP]: 'shop',
        [AdvertisementPropertyType.OFFICE]: 'office',
        [AdvertisementPropertyType.WAREHOUSE]: 'warehouse'
    };
    return typeMap[propertyTypeIndex] || 'unknown_property_type';
};

export const BUILDING_AREA_UNIT_OPTIONS = [
    { label: 'Sq. Ft.', multiplier: 1 },
    { label: 'Sq. Meter', multiplier: 10.7639 },
    { label: 'Sq. Yard', multiplier: 9 }
];

export const FLAT_BHK_OPTIONS: string[] = [
    '1 RK',
    '1 BHK',
    '2 BHK',
    '3 BHK',
    '4 BHK',
    '4+ BHK'
];

export const FLAT_AMENITY_OPTIONS: string[] = [
    'Power Backup',
    '24x7 Security',
    'Gymnasium',
    'Swimming Pool',
    'Clubhouse',
    'Visitor Parking',
    'Water Storage',
    'Intercom',
    'Children Play Area',
    'Fire Safety'
];
