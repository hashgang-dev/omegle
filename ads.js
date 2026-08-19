/**
 * Native Sponsored Video Ads Pool Configuration
 * 
 * Specifications:
 * - skipAfterSeconds: Number (e.g. 10) for skippable ads after N seconds.
 * - skipAfterSeconds: null for unskippable full-length video ads.
 */

const SPONSORED_ADS_POOL = [
  {
    id: "ad-vpn-01",
    title: "CyberShield High-Speed VPN",
    desc: "Encrypt your online video calls and protect your privacy worldwide with 100% no-logs policy.",
    videoUrl: "assets/ads/vpn_ad.mp4",
    linkUrl: "https://google.com",
    badgeText: "FEATURED SPONSOR",
    skipAfterSeconds: 10
  },
  {
    id: "ad-fiber-02",
    title: "FiberSpeed Ultra Broadband",
    desc: "Stream 4K HD video chat calls with 1 Gbps ultra-low latency & zero lag.",
    videoUrl: "assets/ads/broadband_ad.mp4",
    linkUrl: "https://google.com",
    badgeText: "SPONSORED MATCH",
    skipAfterSeconds: null
  }
];
