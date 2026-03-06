export interface TenantWebsiteImageAsset {
  src: string;
  alt: string;
}

export interface TenantWebsiteLogoAssets {
  primary: TenantWebsiteImageAsset;
  brokerage: TenantWebsiteImageAsset;
  headshot: TenantWebsiteImageAsset;
}

export interface TenantWebsiteTownLink {
  name: string;
  slug: string;
}

export interface TenantWebsiteServiceArea {
  regionLabel: string;
  stateCode: string;
  cityNames: string[];
  featuredTowns: TenantWebsiteTownLink[];
}

export interface TenantWebsiteAddress {
  streetAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface TenantWebsiteContact {
  phoneDisplay: string;
  phoneE164: string;
  email: string;
}

export interface TenantWebsiteBrokerage {
  name: string;
  websiteUrl: string;
  address: TenantWebsiteAddress;
  contactPhoneE164: string;
}

export interface TenantWebsiteSeo {
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  metadataBaseUrl: string;
  siteName: string;
  openGraphImage: TenantWebsiteImageAsset;
  keywords: string[];
}

export interface TenantWebsiteThemeTokens {
  colorPrimary: string;
  colorPrimaryHover: string;
  colorSurface: string;
  colorText: string;
  colorMutedText: string;
  headingFontVar: string;
  bodyFontVar: string;
}

export interface TenantWebsiteHeroCopy {
  eyebrow: string;
  headline: string;
  subheadline: string;
}

export interface TenantWebsiteAgentIntroCopy {
  eyebrow: string;
  summaryPrimary: string;
  summarySecondary: string;
  aboutCtaLabel: string;
}

export interface TenantWebsiteFooterCtaCopy {
  heading: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
}

export interface TenantWebsiteSearchCopy {
  pageTitle: string;
  pageDescription: string;
  listingInquiryTitle: string;
  listingInquirySuccessTemplate: string;
}

export interface TenantWebsiteLegalCopy {
  footerDescription: string;
  licensedWithLabel: string;
  equalHousingLabel: string;
  designerLabel: string;
  designerUrl: string;
  rightsReservedLabel: string;
}

export interface TenantWebsiteCtaCopy {
  contactAgentLabel: string;
  callAgentLabel: string;
  homeValueLabel: string;
  homeSearchLabel: string;
}

export interface TenantWebsiteContent {
  hero: TenantWebsiteHeroCopy;
  agentIntro: TenantWebsiteAgentIntroCopy;
  footerCta: TenantWebsiteFooterCtaCopy;
  search: TenantWebsiteSearchCopy;
}

export interface TenantWebsiteConfig {
  tenantId: string;
  tenantSlug: string;
  brandName: string;
  agentName: string;
  agentFirstName: string;
  logos: TenantWebsiteLogoAssets;
  contact: TenantWebsiteContact;
  brokerage: TenantWebsiteBrokerage;
  serviceArea: TenantWebsiteServiceArea;
  seo: TenantWebsiteSeo;
  theme: TenantWebsiteThemeTokens;
  legal: TenantWebsiteLegalCopy;
  cta: TenantWebsiteCtaCopy;
  content: TenantWebsiteContent;
}
