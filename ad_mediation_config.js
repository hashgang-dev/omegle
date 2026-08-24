/**
 * HashGANG StrangerChat - Dynamic Ad Waterfall Mediation Configuration
 * File Location: omegle/ad_mediation_config.js
 * 
 * NOTE: This is a JavaScript file, so you can freely use comments (// or /* * /)
 * to disable/comment out specific providers or settings without syntax errors!
 */
window.AD_MEDIATION_CONFIG = {
  settings: {
    universalBannerWidth: 300,
    universalBannerHeight: 250,
    skipOnLocalhost: true,            // Automatically skip paid third-party ads on localhost/dev mode
    viewabilityThresholdSeconds: 5.0, // IAB 5-second viewability threshold
  },

  /**
   * Dynamic N-Providers Waterfall Array
   * Engine iterates from index 0 to N-1. Picks first enabled provider where user's
   * daily impression count < dailyCapPerUser.
   */
  providers: [
    {
      id: "adsterra_300x250",
      name: "Adsterra",
      enabled: true,
      dailyCapPerUser: 5,            // Max 5 high-CPM impressions per user/IP per day
      type: "script",
      scriptUrl: "https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js",
      invokeKey: "ede40fc4ab13bf9c6140311ae9860f4f",
      width: 300,
      height: 250
    },

    /* 
    // Example: PropellerAds Placement (Uncomment when zone keys are ready)
    {
      id: "propeller_multitag",
      name: "PropellerAds",
      enabled: true,
      dailyCapPerUser: 5,
      type: "script",
      scriptUrl: "https://example-propeller.com/invoke.js",
      invokeKey: "propeller_zone_12345",
      width: 300,
      height: 250
    },
    */

    /*
    // Example: Monetag / HilltopAds Placement (Uncomment when keys are ready)
    {
      id: "monetag_banner",
      name: "Monetag",
      enabled: true,
      dailyCapPerUser: 5,
      type: "script",
      scriptUrl: "https://example-monetag.com/invoke.js",
      invokeKey: "monetag_zone_67890",
      width: 300,
      height: 250
    }
    */
  ],

  /**
   * Fallback Self-Brand Promotion Banner
   * Displays automatically when ALL third-party ad providers reach their daily cap for a user.
   * Ensures ad space is never left empty or wasted!
   */
  selfBrandFallback: {
    enabled: true,
    title: "MyLeader AI Platform",
    desc: "Streamline leadership workflows & team collaboration with AI.",
    linkUrl: "https://hashgang.com",
    ctaText: "Explore MyLeader 🚀",
    badgeText: "FEATURED PROMOTION"
  }
};
