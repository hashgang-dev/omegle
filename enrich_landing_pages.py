import glob
import os
import re

landing_pages = [
    "telugu-stranger-video-call.html",
    "kannada-random-video-chat.html",
    "tamil-stranger-video-chat.html",
    "malayalam-stranger-voice-chat.html",
    "marathi-random-video-chat.html",
    "punjabi-random-video-chat.html",
    "arabic-stranger-video-chat.html",
    "indonesia-random-video-chat.html",
    "bangla-stranger-chat-app.html",
    "camsurf-alternative.html",
    "chatroulette-alternative.html",
    "coomeet-alternative.html",
    "desi-random-video-chat.html",
    "monkey-app-alternative.html",
    "random-video-chat-pakistan.html",
    "stranger-chat-india.html",
    "stranger-se-baat-karne-wala-app.html",
    "stranger-video-chat-bangladesh.html"
]

page_details = {
    "telugu-stranger-video-call.html": {
        "title": "Telugu Stranger Video Call & Free Random Chat Platform",
        "lang": "Telugu",
        "desc": "Connect instantly with Telugu-speaking strangers across Andhra Pradesh, Telangana, India, and worldwide. Enjoy free 1-on-1 random video calls, voice chat, and text messaging without any registration, coin paywalls, or app installation.",
        "faqs": [
            {"q": "Is Telugu Stranger Video Call free on HashGANG Chat?", "a": "Yes! HashGANG Chat is 100% free with no coins, recharges, or subscription required for Telugu video calls."},
            {"q": "Do I need to sign up or create an account?", "a": "No registration or login is needed. You can start chatting instantly with 1-click."},
            {"q": "How is user privacy protected during video calls?", "a": "All video and audio streams are P2P encrypted. Plus, our proprietary anti-screen recording trace watermarks protect user privacy."},
            {"q": "Can I use HashGANG Chat on mobile browser?", "a": "Yes, it works smoothly on Chrome, Safari, Android, and iOS browsers with PWA support."}
        ]
    },
    "kannada-random-video-chat.html": {
        "title": "Kannada Random Video Chat — Talk to Strangers Free",
        "lang": "Kannada",
        "desc": "Meet and chat with Kannada-speaking strangers in Bengaluru, Karnataka, and around the globe. Instant 1-on-1 random video calls and voice chat with zero login or payment required.",
        "faqs": [
            {"q": "Is Kannada random video chat completely free?", "a": "Yes, HashGANG Chat offers unlimited free random video and voice calls without any hidden fees."},
            {"q": "How fast is stranger matching for Kannada chat?", "a": "Our P2P matchmaking connects you to available online strangers in less than 1 second."},
            {"q": "Are video calls safe on HashGANG Chat?", "a": "Yes, we enforce strict IT Rules compliance, anti-harassment reporting, and live session trace codes for user safety."}
        ]
    },
    "tamil-stranger-video-chat.html": {
        "title": "Tamil Stranger Video Chat App — Free Random Online Call",
        "lang": "Tamil",
        "desc": "Connect with Tamil strangers in Chennai, Tamil Nadu, Sri Lanka, and worldwide. Free random video chat, live voice call, and instant messaging without account creation.",
        "faqs": [
            {"q": "Can I talk to Tamil strangers without signing up?", "a": "Yes! No phone number, email, or registration is required to start Tamil video chat."},
            {"q": "Does HashGANG Chat support mobile browsers?", "a": "Yes, it works seamlessly on all Android, iPhone, and desktop browsers."}
        ]
    },
    "malayalam-stranger-voice-chat.html": {
        "title": "Malayalam Stranger Voice & Video Chat — Free Omegle Alternative",
        "lang": "Malayalam",
        "desc": "Talk to Kerala strangers online with free Malayalam voice chat, video calls, and instant text messaging. High-quality WebRTC streaming with no sign-up.",
        "faqs": [
            {"q": "Is Malayalam voice and video chat free?", "a": "Yes, 100% free with zero coin paywalls or mandatory downloads."},
            {"q": "Is my identity anonymous?", "a": "Yes, no personal information is collected or stored during chat sessions."}
        ]
    },
    "marathi-random-video-chat.html": {
        "title": "Marathi Random Video Chat App — Talk to Strangers Free",
        "lang": "Marathi",
        "desc": "Connect with Marathi strangers across Mumbai, Pune, Maharashtra, and globally. Free instant video calls, voice chat, and text chat with zero sign-up.",
        "faqs": [
            {"q": "How to join Marathi video call online?", "a": "Simply click the 'Start Chat' button on HashGANG Chat to connect with strangers immediately."},
            {"q": "Is it safe for women and students?", "a": "Yes, HashGANG Chat features 1-click reporting, AI background blur, and trace watermarks for safety."}
        ]
    },
    "punjabi-random-video-chat.html": {
        "title": "Punjabi Random Video Chat — Free Stranger Call Online",
        "lang": "Punjabi",
        "desc": "Talk to Punjabi strangers in Punjab, Canada, UK, and worldwide. Free 1-on-1 random video call and voice chat with no registration required.",
        "faqs": [
            {"q": "Is Punjabi random video chat free?", "a": "Yes, completely free with unlimited chatting duration."},
            {"q": "Do I need to download an app?", "a": "No app download needed; it works directly in your web browser."}
        ]
    },
    "arabic-stranger-video-chat.html": {
        "title": "Arabic Stranger Video Chat — Free Random Chat No Login",
        "lang": "Arabic",
        "desc": "Connect with Arabic-speaking strangers across the Middle East, North Africa, and globally. Instant video, voice, and text chat with zero registration.",
        "faqs": [
            {"q": "Is Arabic video chat free on HashGANG?", "a": "Yes, 100% free video and text chat without coin limits."},
            {"q": "Is WebRTC encrypted?", "a": "Yes, all video streams use end-to-end P2P encryption."}
        ]
    },
    "indonesia-random-video-chat.html": {
        "title": "Indonesia Random Video Chat — Free Stranger Call App",
        "lang": "Indonesian",
        "desc": "Meet Indonesian strangers online for free video and voice chat. High-speed WebRTC connection, AI filters, and 100% anonymous matching.",
        "faqs": [
            {"q": "Apakah video chat ini gratis?", "a": "Ya, HashGANG Chat 100% gratis tanpa pendaftaran atau koin."},
            {"q": "Apakah aman digunakan?", "a": "Sangat aman dengan fitur P2P enkripsi dan pelaporan 1-klik."}
        ]
    },
    "bangla-stranger-chat-app.html": {
        "title": "Bangla Stranger Chat App — Free Video Call & Voice Chat",
        "lang": "Bangla",
        "desc": "Connect with Bangla-speaking strangers in West Bengal, Bangladesh, and worldwide. Free 1-on-1 video call, voice chat, and instant messaging.",
        "faqs": [
            {"q": "Is Bangla stranger chat free?", "a": "Yes, completely free with no registration or fees."},
            {"q": "Can I use it on mobile?", "a": "Yes, works on mobile web browsers with PWA support."}
        ]
    },
    "camsurf-alternative.html": {
        "title": "Camsurf Alternative Free — Anonymous Random Video Chat",
        "lang": "English",
        "desc": "Looking for the best Camsurf alternative? HashGANG Chat offers free 1-on-1 random video, voice, and text chat with AI backgrounds, zero paywalls, and instant matching.",
        "faqs": [
            {"q": "Why is HashGANG Chat better than Camsurf?", "a": "Unlike Camsurf, HashGANG Chat offers 100% free video chat without coin limits, plus voice-only mode and anti-screen recording trace watermarks."},
            {"q": "Do I need an account to use this alternative?", "a": "No, zero login or registration is required."}
        ]
    },
    "chatroulette-alternative.html": {
        "title": "Chatroulette Alternative Free — Instant Random Cam Chat",
        "lang": "English",
        "desc": "Discover the ultimate Chatroulette alternative. Free random video chat with strangers worldwide, WebRTC 60 FPS quality, AI beauty filters, and full privacy.",
        "faqs": [
            {"q": "How does this compare to Chatroulette?", "a": "HashGANG Chat provides zero lag P2P video, background blur filters, instant 1-second matching, and robust moderation."}
        ]
    },
    "coomeet-alternative.html": {
        "title": "CooMeet Alternative Free — Free Video Chat with Strangers",
        "lang": "English",
        "desc": "The top free CooMeet alternative without expensive minute subscriptions. Enjoy unlimited 1-on-1 video and text chat with online strangers worldwide.",
        "faqs": [
            {"q": "Is HashGANG Chat free unlike CooMeet?", "a": "Yes! CooMeet requires paid credits, whereas HashGANG Chat is 100% free with unlimited chat time."}
        ]
    },
    "desi-random-video-chat.html": {
        "title": "Desi Random Video Chat — Free Stranger Chat India & South Asia",
        "lang": "Hindi/Desi",
        "desc": "Talk to Desi strangers online across India, Pakistan, Bangladesh, and South Asia. Free video calls, voice chat, and instant messaging without registration.",
        "faqs": [
            {"q": "Is Desi random video chat free?", "a": "Yes, 100% free with no coins or sign up."}
        ]
    },
    "monkey-app-alternative.html": {
        "title": "Monkey App Alternative — Free Random Video Call App",
        "lang": "English",
        "desc": "Looking for a safe Monkey App alternative? HashGANG Chat provides free random video chat, AI aura glow, and instant stranger matching on web & mobile.",
        "faqs": [
            {"q": "Is HashGANG Chat a good Monkey App alternative?", "a": "Yes, it works directly in browser without app store downloads, featuring 100% free video and text chat."}
        ]
    },
    "random-video-chat-pakistan.html": {
        "title": "Random Video Chat Pakistan — Free Stranger Call Online",
        "lang": "English/Urdu",
        "desc": "Connect with online strangers in Pakistan and globally. Free random video chat, voice calls, and instant text matching with zero sign up.",
        "faqs": [
            {"q": "Is video chat free in Pakistan?", "a": "Yes, completely free with no registration."}
        ]
    },
    "stranger-chat-india.html": {
        "title": "Stranger Chat India — Free Indian Random Video & Voice Chat",
        "lang": "English/Hindi",
        "desc": "Talk to Indian strangers online across Mumbai, Delhi, Bengaluru, Hyderabad, and all states. 100% free 1-on-1 video call, voice chat, and text chat.",
        "faqs": [
            {"q": "Is Stranger Chat India free?", "a": "Yes, 100% free with zero coins or login."}
        ]
    },
    "stranger-se-baat-karne-wala-app.html": {
        "title": "Stranger Se Baat Karne Wala App Free — Video Call Chat",
        "lang": "Hindi",
        "desc": "Strangers se baat karne wala best free online video call app. Bina kisi login, sign up ya paise ke online strangers se ladki aur ladko se baat karein.",
        "faqs": [
            {"q": "Kya yeh app bilkul free hai?", "a": "Haan, HashGANG Chat 100% free hai bina kisi recharge ke."},
            {"q": "Kya login karna zaroori hai?", "a": "Nahi, bina kisi registration ke 1-click me chat start kar sakte hain."}
        ]
    },
    "stranger-video-chat-bangladesh.html": {
        "title": "Stranger Video Chat Bangladesh — Free Random Online Call",
        "lang": "English/Bangla",
        "desc": "Talk to strangers in Dhaka, Chittagong, and across Bangladesh. Free WebRTC video chat, voice call, and instant messaging without account creation.",
        "faqs": [
            {"q": "Is Bangladesh video chat free?", "a": "Yes, 100% free with unlimited time."}
        ]
    }
}

enriched_count = 0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

for filename, details in page_details.items():
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Create FAQ Schema JSON-LD
    schema_entities = []
    for faq in details["faqs"]:
        schema_entities.append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })
    
    schema_json = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": schema_entities
    }
    import json
    schema_script = f'<script type="application/ld+json">\n{json.dumps(schema_json, indent=2)}\n</script>'
    
    # Inject Schema into <head> if not already present
    if "application/ld+json" not in content:
        content = content.replace("</head>", f"{schema_script}\n</head>")

    # Build Content HTML Section
    faq_html_list = ""
    for faq in details["faqs"]:
        faq_html_list += f"""
        <div class="faq-item" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.2rem;">
          <h4 style="font-size: 1.15rem; color: #00f2fe; margin-top: 0; margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-question" style="margin-right: 0.5rem;"></i>{faq['q']}</h4>
          <p style="color: #a0aec0; margin: 0; font-size: 0.98rem; line-height: 1.6;">{faq['a']}</p>
        </div>
        """

    extra_section = f"""
      <!-- Enriched SEO & Content Section -->
      <section class="seo-content-section" style="max-width: 1000px; margin: 4rem auto; padding: 0 1.5rem;">
        <div style="background: rgba(13, 5, 21, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(10px);">
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 1.2rem; background: linear-gradient(135deg, #ffffff, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">About {details['title']}</h2>
          <p style="color: #cbd5e0; font-size: 1.05rem; line-height: 1.8; margin-bottom: 1.8rem;">{details['desc']}</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
            <div style="background: rgba(255, 255, 255, 0.03); border-left: 4px solid #00f2fe; padding: 1.2rem; border-radius: 12px;">
              <h3 style="font-size: 1.1rem; color: #ffffff; margin-top: 0; margin-bottom: 0.4rem;"><i class="fa-solid fa-user-shield" style="color: #00f2fe; margin-right: 0.5rem;"></i>100% Anonymous & Private</h3>
              <p style="color: #a0aec0; font-size: 0.92rem; margin: 0;">No login, email, or phone number required. Enjoy true P2P WebRTC privacy with proprietary trace watermarks.</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); border-left: 4px solid #9911ee; padding: 1.2rem; border-radius: 12px;">
              <h3 style="font-size: 1.1rem; color: #ffffff; margin-top: 0; margin-bottom: 0.4rem;"><i class="fa-solid fa-bolt" style="color: #9911ee; margin-right: 0.5rem;"></i>Instant Worldwide Matching</h3>
              <p style="color: #a0aec0; font-size: 0.92rem; margin: 0;">Connect with random online strangers in under 1 second using text, voice, or video modes.</p>
            </div>
          </div>

          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #ffffff; margin-top: 2rem; margin-bottom: 1.2rem;">Frequently Asked Questions (FAQs)</h3>
          <div class="faq-container">
            {faq_html_list}
          </div>
        </div>
      </section>
    """

    # Insert section before </main> or before <footer>
    if "seo-content-section" not in content:
        if "</main>" in content:
            content = content.replace("</main>", f"{extra_section}\n</main>")
        else:
            content = content.replace("<footer>", f"{extra_section}\n<footer>")

    # Update Footer to include Dofollow link to hashgang.com
    old_footer = '<footer>'
    new_footer = '<footer>'
    if 'A Product of <a href="https://hashgang.com"' not in content:
        content = re.sub(
            r'<footer>\s*<p>© 2026 HashGANG Chat\. All Rights Reserved\.',
            r'<footer>\n      <p>© 2026 HashGANG. A Product of <a href="https://hashgang.com" target="_blank" rel="noopener" style="color: #00f2fe; font-weight: 700; text-decoration: none;">HashGANG</a>. All Rights Reserved.',
            content
        )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    enriched_count += 1

print(f"Successfully enriched {enriched_count} landing pages!")
