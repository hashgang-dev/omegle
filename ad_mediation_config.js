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
    skipOnLocalhost: true, // Automatically skip paid third-party ads on localhost/dev mode
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
      dailyCapPerUser: 5,
      rawHtml: `<script type="text/javascript">
        atOptions = {
          'key' : 'ede40fc4ab13bf9c6140311ae9860f4f',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://www.highrevenueformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js" onerror="window.parent.postMessage('adsterra_load_failed', '*')"></script>`,
      width: 300,
      height: 250,
    },

    {
      id: "hilltopads_300x250",
      name: "HilltopAds",
      enabled: true,
      dailyCapPerUser: 5,
      rawHtml: `<script type="text/javascript">
      (function(dqivx){
      var d = document,
          s = d.createElement('script'),
          l = d.getElementsByTagName('script')[0] || d.body;
      s.settings = dqivx || {};
      s.src = "https://wise-belt.com/b.XAVQsodJGrlL0/YWWuci/Genmg9kuHZbUElqkiPsT/cszgN-TLEHxRMvj/krthN/zJMJ1KMTTYEiztM/wi";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      if (l.parentNode) { l.parentNode.insertBefore(s, l); } else { (d.head || d.body).appendChild(s); }
      })({})
      </script>`,
      width: 300,
      height: 250,
    },

    {
      id: "monetag_vignette_11650177",
      name: "Monetag",
      enabled: false,
      dailyCapPerUser: 5,
      rawHtml: `<script type="text/javascript">(function(s){s.dataset.zone='11650177',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`,
      width: 300,
      height: 250,
    },
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
    badgeText: "FEATURED PROMOTION",
  },
};
