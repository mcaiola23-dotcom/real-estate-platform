import type { TenantWebsiteConfig } from "@real-estate/types";

export const FAIRFIELD_TENANT_WEBSITE_CONFIG: TenantWebsiteConfig = {
  tenantId: "tenant_fairfield",
  tenantSlug: "fairfield",
  brandName: "Matt Caiola Luxury Properties",
  agentName: "Matt Caiola",
  agentFirstName: "Matt",
  logos: {
    primary: {
      src: "/brand/matt-caiola-logo.png",
      alt: "Matt Caiola Luxury Properties",
    },
    brokerage: {
      src: "/brand/higgins-lockup.jpg",
      alt: "Higgins Group Private Brokerage",
    },
    headshot: {
      src: "/brand/matt-headshot.jpg",
      alt: "Matt Caiola",
    },
  },
  contact: {
    phoneDisplay: "203-658-8282",
    phoneE164: "+12036588282",
    email: "mattcaiola@higginsgp.com",
  },
  brokerage: {
    name: "Higgins Group Private Brokerage",
    websiteUrl: "https://higginsgroup.com/",
    address: {
      streetAddress: "1055 Washington Blvd.",
      city: "Stamford",
      region: "CT",
      postalCode: "06901",
      country: "US",
    },
    contactPhoneE164: "+12036588282",
  },
  serviceArea: {
    regionLabel: "Fairfield County",
    stateCode: "CT",
    cityNames: [
      "Greenwich",
      "Stamford",
      "Darien",
      "New Canaan",
      "Westport",
      "Fairfield",
      "Norwalk",
      "Wilton",
      "Ridgefield",
    ],
    featuredTowns: [
      { name: "Greenwich", slug: "greenwich" },
      { name: "Stamford", slug: "stamford" },
      { name: "Darien", slug: "darien" },
      { name: "New Canaan", slug: "new-canaan" },
      { name: "Westport", slug: "westport" },
    ],
  },
  seo: {
    defaultTitle: "Matt Caiola | Luxury Real Estate | Fairfield County CT",
    titleTemplate: "%s | Matt Caiola | Fairfield County Real Estate",
    description:
      "Matt Caiola offers expert luxury real estate guidance in Fairfield County, Connecticut. Serving Greenwich, Stamford, Darien, New Canaan, Westport, Fairfield, Norwalk, and surrounding towns. Licensed with Higgins Group Private Brokerage.",
    metadataBaseUrl: "https://example.com",
    siteName: "Matt Caiola Luxury Properties",
    openGraphImage: {
      src: "/visual/home/hero-1.jpg",
      alt: "Matt Caiola - Fairfield County Connecticut luxury real estate",
    },
    keywords: [
      "Luxury Real Estate",
      "Fairfield County Real Estate",
      "Connecticut Gold Coast",
      "Real Estate Investment",
      "Property Management",
    ],
  },
  theme: {
    colorPrimary: "#1c1917",
    colorPrimaryHover: "#292524",
    colorSurface: "#fafaf9",
    colorText: "#1c1917",
    colorMutedText: "#57534e",
    headingFontVar: "--font-cormorant",
    bodyFontVar: "--font-inter",
  },
  legal: {
    footerDescription:
      "Personalized luxury real estate services in Fairfield County, Connecticut. Your goals, my commitment.",
    licensedWithLabel: "Licensed with Higgins Group Private Brokerage",
    equalHousingLabel: "Equal Housing Opportunity",
    designerLabel: "Designed by Lunar Digital",
    designerUrl: "#",
    rightsReservedLabel: "All rights reserved.",
  },
  cta: {
    contactAgentLabel: "Contact Matt",
    callAgentLabel: "Call Matt",
    homeValueLabel: "Home Value",
    homeSearchLabel: "Search",
  },
  content: {
    hero: {
      eyebrow: "Matt Caiola Luxury Properties",
      headline: "Fairfield County Real Estate",
      subheadline:
        "White-glove representation for buying, selling, and investing across Connecticut's Gold Coast.",
    },
    agentIntro: {
      eyebrow: "Your Fairfield County Expert",
      summaryPrimary:
        "With a background in media and commodities at Fortune 500 companies and a portfolio of 25 rental units, I bring real transaction experience to every engagement. My approach pairs analytical rigor with the discretion and attentiveness that luxury clients require.",
      summarySecondary:
        "Whether you're buying on the Gold Coast or positioning a property for sale, I manage the details so you can focus on the decision that matters.",
      aboutCtaLabel: "Learn More About Matt",
    },
    footerCta: {
      heading: "Ready to make a move?",
      body:
        "Whether you're curious about your home's value or ready to start touring, I'm here to help you take the next step.",
      primaryLabel: "Get Home Estimate",
      secondaryLabel: "Contact Matt",
    },
    search: {
      pageTitle: "Home Search | Fairfield County Real Estate",
      pageDescription:
        "Explore a refined home search experience for Fairfield County listings, with map-based browsing and thoughtful filters.",
      listingInquiryTitle: "Contact Matt",
      listingInquirySuccessTemplate:
        "Thanks for your interest in {address}. Matt will reach out to you shortly.",
    },
  },
};
