/**
 * HashGANG StrangerChat - Dynamic Ad Waterfall Mediation Configuration
 * File Location: omegle/ad_mediation_config.js
 *
 * NOTE: This is a JavaScript file, so you can freely use comments
 * to disable/comment out specific providers or settings without syntax errors!
 */
window.AD_MEDIATION_CONFIG = {
  settings: {
    universalBannerWidth: 300,
    universalBannerHeight: 250,
    skipOnLocalhost: true, // Automatically skip paid third-party ads on localhost/dev mode
    viewabilityThresholdSeconds: 4.2, // Safety buffer for dwell time
    hourlyCapPerUser: 4, // Max 4 Adsterra impressions per rolling 60 minutes
    minAdIntervalMs: 40000, // 40 seconds minimum deduplication interval
  },

  /**
   * Google AdSense Switch
   * Set to true once Google approves the site!
   */
  adsenseEnabled: false,
  adsenseConfig: {
    client: "ca-pub-6927010746708408",
    slot: "6484121987",
    width: 300,
    height: 250,
  },

  /**
   * Dynamic N-Providers Waterfall Array
   * Engine checks providers sequentially.
   */
  providers: [
    {
      id: "adsterra_300x250",
      name: "Adsterra",
      enabled: true,
      dailyCapPerUser: 10,
      hourlyCapPerUser: 4, // Fixed 4 impressions per user/IP per hour
      type: "script",
      scriptUrl:
        "https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js",
      invokeKey: "ede40fc4ab13bf9c6140311ae9860f4f",
      width: 300,
      height: 250,
    },
  ],

  /**
   * Dynamic House Ads Rotation (Zero Wasted Space Fallback)
   * Rotates between MyLeader AI Platform and HashGANG Studio
   * (Kubera excluded for policy safety).
   */
  houseAds: [
    {
      title: "MyLeader.app",
      desc: "Automate team management, attendance, payroll & policies with AI.",
      linkUrl: "https://hashgang.com/myleader.html",
      ctaText: "Explore MyLeader 🚀",
      badgeText: "ENTERPRISE SAAS",
      typeClass: "myleader",
      iconClass: "fa-solid fa-users-gear",
    },
    {
      title: "HashGANG Solutions",
      desc: "Custom web development, mobile apps & business automation software.",
      linkUrl: "https://hashgang.com",
      ctaText: "Build With HashGANG ⚡",
      badgeText: "TECH SOLUTIONS",
      typeClass: "hashgang",
      iconClass: "fa-solid fa-laptop-code",
    },
  ],

  /**
   * Fallback Self-Brand Promotion Banner
   */
  selfBrandFallback: {
    enabled: true,
    title: "MyLeader AI Platform",
    desc: "Streamline leadership workflows & team collaboration with AI.",
    linkUrl: "https://hashgang.com/myleader.html",
    ctaText: "Explore MyLeader 🚀",
    badgeText: "FEATURED PROMOTION",
  },
};
