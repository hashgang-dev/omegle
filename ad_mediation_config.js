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
    }
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
