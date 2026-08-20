/**
 * Native Sponsored Video Ads Configuration & Fallback Pool
 *
 * Specifications:
 * - skipAfterSeconds: Number (e.g. 10) for skippable ads after N seconds.
 * - skipAfterSeconds: null for unskippable full-length video ads.
 */

// Stranger Chat Backend API Base URL (Comment/Uncomment for Local vs Production)
// const BACKEND_API_BASE = "http://localhost:5000/api/v1/strangerchat"; // Local Development
const BACKEND_API_BASE = "https://api.hashgang.com/api/v1/strangerchat"; // Production

const SPONSORED_ADS_POOL = [
  {
    id: "ad-vpn-01",
    adId: "ad-vpn-01",
    title: "CyberShield High-Speed VPN",
    desc: "Encrypt your online video calls and protect your privacy worldwide with 100% no-logs policy.",
    videoUrl: "assets/ads/vpn_ad.mp4",
    linkUrl: "https://google.com",
    badgeText: "FEATURED SPONSOR",
    skipAfterSeconds: 10,
  },
  {
    id: "ad-fiber-02",
    adId: "ad-fiber-02",
    title: "FiberSpeed Ultra Broadband",
    desc: "Stream 4K HD video chat calls with 1 Gbps ultra-low latency & zero lag.",
    videoUrl: "assets/ads/broadband_ad.mp4",
    linkUrl: "https://google.com",
    badgeText: "SPONSORED MATCH",
    skipAfterSeconds: null,
  },
];
