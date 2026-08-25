/**
 * HashGANG StrangerChat - Dynamic Ad Waterfall Mediation Configuration
 * File Location: omegle/ad_mediation_config.js
 */
window.AD_MEDIATION_CONFIG = {
  settings: {
    universalBannerWidth: 300,
    universalBannerHeight: 250,
    skipOnLocalhost: true, // Automatically skip paid third-party ads on localhost/dev mode
    viewabilityThresholdSeconds: 5.0, // IAB 5-second viewability threshold
  },

  /**
   * Adsterra 300x250 Medium Rectangle Banner
   */
  providers: [
    {
      id: "adsterra_300x250",
      name: "Adsterra",
      enabled: true,
      dailyCapPerUser: 5,
      type: "script",
      scriptUrl:
        "https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js",
      invokeKey: "ede40fc4ab13bf9c6140311ae9860f4f",
      rawHtml: `<script type="text/javascript">
        atOptions = {
          'key' : 'ede40fc4ab13bf9c6140311ae9860f4f',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js" onerror="window.parent.postMessage('adsterra_load_failed', '*')"></script>`,
      width: 300,
      height: 250,
    },
  ],

  /**
   * Fallback Self-Brand Promotion Banner
   * Displays automatically when third-party ad provider reaches daily cap or when AdBlocker is detected.
   */
  selfBrandFallback: {
    enabled: true,
    title: "MyLeader AI Platform",
    desc: "Streamline leadership workflows & team collaboration with AI.",
    linkUrl: "https://hashgang.com",
    ctaText: "Explore MyLeader 🚀",
    badgeText: "FEATURED PROMOTION",
  },
};
