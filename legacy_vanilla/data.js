/* ============================================================
   Lighthouse Studios By Brainvare — Master Data Layer v2
   ============================================================ */

const STUDIO_CONFIG = {
    brandName: 'Lighthouse Studios By Brainvare',
    shortName: 'Lighthouse Studios',
    tagline: 'By Brainvare',
    whatsappNumber: '919876543210',
    email: 'hello@lighthousestudios.in',
    phone: '+91 98765 43210',
    address: 'Lighthouse Studios, Creative District',
    currency: '₹',
    adminPassword: 'lighthouse2026',
    studioOpenHour: 9,
    studioCloseHour: 18,
    bookingSlotMinutes: 60,
    defaultBufferMinutes: 30,
    gstEnabled: false,
    gstPercent: 18,
    invoicePrefix: 'LSB',
    outsideHours: { before9am: 25, after6pm: 25, after9pm: 50 },
    cancellationPolicy: `Free cancellation up to 48 hours before the booked slot.\n25% fee for cancellations within 24–48 hours.\nNo refund for cancellations within 24 hours or no-shows.\nRescheduling is free if done 24+ hours in advance, subject to availability.`,
};

/* ── DEFAULT SERVICES ─────────────────────────────────────── */
const SERVICES = [
    { id: 'podcast', name: 'Podcast Studio', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="10" r="4"/><path d="M8 10a4 4 0 0 0 8 0M12 14v6M9 20h6"/></svg>`, description: 'Book our podcast floor hourly or choose complete production packages with 1 to 5 camera setups.', startingPrice: 1500, startingLabel: 'Studio floor from ₹1,500/hr', hasPackages: true, minHours: 1, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['Hourly Booking', 'Multi-Camera', 'Soundproofed'] },
    { id: 'product-photoshoot', name: 'Product Photoshoot', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M9 6V4M15 6V4"/></svg>`, description: 'Clean e-commerce product photos, premium creative campaigns, and social media-ready visuals.', startingPrice: 3000, startingLabel: 'From ₹3,000/hr', hasPackages: false, minHours: 2, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['E-Commerce', 'Brand Shoots', 'Social Media'] },
    { id: 'photoshoot', name: 'Photoshoots', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`, description: 'Personal branding, corporate profiles, fashion, founder shoots, team shoots, and campaign photography.', startingPrice: 3500, startingLabel: 'From ₹3,500/hr', hasPackages: false, minHours: 2, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['Personal Brand', 'Fashion', 'Corporate'] },
    { id: 'video-production', name: 'Video Production', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`, description: 'Corporate videos, reels, interviews, brand films, founder stories, testimonials, and documentaries.', startingPrice: 5000, startingLabel: 'Custom quote', hasPackages: false, minHours: 4, advancePercent: 60, bufferMinutes: 45, active: true, tags: ['Corporate Films', 'Reels', 'Documentaries'] },
    { id: 'event-media', name: 'Event Media Production', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, description: 'Photography, videography, highlight videos, multi-camera event coverage, conferences, launches, seminars.', startingPrice: 0, startingLabel: 'Custom quote', hasPackages: false, minHours: 4, advancePercent: 60, bufferMinutes: 60, active: true, tags: ['Conferences', 'Launches', 'Seminars'] },
    { id: 'live-streaming', name: 'Live Events & Streaming', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M20.49 3.51a12 12 0 0 1 0 16.97M3.51 20.49a12 12 0 0 1 0-16.97"/></svg>`, description: 'Multi-camera live production, switcher setup, YouTube/Facebook/private live streaming, LED screen output.', startingPrice: 3000, startingLabel: 'From ₹3,000/session', hasPackages: false, minHours: 4, advancePercent: 70, bufferMinutes: 120, active: true, tags: ['YouTube Live', 'Multi-Camera', 'Event Recording'] },
];

/* ── DEFAULT PODCAST PACKAGES ─────────────────────────────── */
/* Pricing model: firstHourPrice + additionalHourPrice × (hours - 1)
   Example (2-Camera): ₹6,850 for 1st hour, +₹1,800 for each extra hour */
const PODCAST_PACKAGES = [
    { id: 'floor-only', name: 'Studio Floor Only', cameras: 0, operators: 0, firstHourPrice: 1500, additionalHourPrice: 500, setupMinutes: 15, bufferMinutes: 15, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Self-recording with your own crew & gear', includes: ['Studio floor access', 'Basic lighting rig', 'Standard audio monitors', 'Air-conditioned space', '15 min free setup'], excludes: ['Camera equipment', 'Camera operators', 'Mics', 'Editing'] },
    { id: '1-camera', name: '1 Camera Podcast', cameras: 1, operators: 1, firstHourPrice: 4500, additionalHourPrice: 1200, setupMinutes: 30, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Solo podcasters and 1-on-1 interviews', includes: ['1 professional camera', '1 camera operator', 'Professional lighting', 'Condenser mic', 'Studio floor', '30 min setup'], excludes: ['Multiple angles', 'Editing', 'Teleprompter (add-on)'] },
    { id: '2-camera', name: '2 Camera Podcast', cameras: 2, operators: 1, firstHourPrice: 6850, additionalHourPrice: 1800, setupMinutes: 45, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: true, bestFor: 'Interviews and conversation-style shows', includes: ['2 professional cameras', '1 camera operator', 'Pro lighting setup', '2 mics', 'Studio floor', '45 min setup'], excludes: ['Third angle', 'Editing', 'Teleprompter (add-on)'] },
    { id: '3-camera', name: '3 Camera Podcast', cameras: 3, operators: 2, firstHourPrice: 9500, additionalHourPrice: 2500, setupMinutes: 60, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: true, bestFor: 'Panel discussions and group podcasts', includes: ['3 professional cameras', '2 operators', 'Broadcast lighting', '3+ mics', 'Director monitor', '60 min setup'], excludes: ['Live switching (add-on)', 'Editing (add-on)'] },
    { id: '4-camera', name: '4 Camera Podcast', cameras: 4, operators: 2, firstHourPrice: 12000, additionalHourPrice: 3200, setupMinutes: 75, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Professional multi-cam productions', includes: ['4 professional cameras', '2 operators', 'Full lighting grid', 'Multi-mic setup', 'Preview monitors', '75 min setup'], excludes: ['Live switching (add-on)', 'Editing (add-on)'] },
    { id: '5-camera', name: '5 Camera Podcast', cameras: 5, operators: 2, firstHourPrice: 15000, additionalHourPrice: 4000, setupMinutes: 90, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Broadcast-grade shows & premium productions', includes: ['5 professional cameras', '2 operators', 'Broadcast lighting', 'Full audio rig', 'Live switcher-ready', '90 min setup'], excludes: ['Live streaming (add-on)', 'Editing (add-on)'] },
];

/* ── DEFAULT ADD-ONS ──────────────────────────────────────── */
const ADDONS = {
    podcast: [
        { id: 'teleprompter', name: 'Teleprompter', price: 1000, unit: 'session', icon: '📺', active: true },
        { id: 'extra-camera', name: 'Extra Camera', price: 1000, unit: 'hour', icon: '📷', active: true },
        { id: 'extra-light', name: 'Extra Light', price: 500, unit: 'session', icon: '💡', active: true },
        { id: 'extra-mic', name: 'Extra Wireless Mic', price: 500, unit: 'session', icon: '🎤', active: true },
        { id: 'green-screen', name: 'Green Screen', price: 1000, unit: 'session', icon: '🟩', active: true },
        { id: 'audio-mixer', name: 'Audio Mixer', price: 1000, unit: 'session', icon: '🎛️', active: true },
        { id: 'preview-monitor', name: 'Preview Monitor', price: 1000, unit: 'session', icon: '🖥️', active: true },
        { id: 'live-switcher', name: 'Live Switcher', price: 3000, unit: 'session', icon: '🔀', active: true },
        { id: 'raw-footage', name: 'Raw Footage Delivery', price: 500, unit: 'session', icon: '💾', active: true },
        { id: 'reel-basic', name: 'Reel Edit (Basic)', price: 1000, unit: 'reel', icon: '🎞️', active: true },
        { id: 'reel-premium', name: 'Reel Edit (Premium + SFX)', price: 2000, unit: 'reel', icon: '✨', active: true },
        { id: 'thumbnail', name: 'Thumbnail Design', price: 500, unit: 'piece', icon: '🖼️', active: true },
        { id: 'audio-cleanup', name: 'Audio Cleanup', price: 1000, unit: 'session', icon: '🔊', active: true },
        { id: 'script-support', name: 'Script Support', price: 1500, unit: 'session', icon: '📝', active: true },
    ],
    'product-photoshoot': [
        { id: 'extra-light', name: 'Extra Light', price: 500, unit: 'session', icon: '💡', active: true },
        { id: 'backdrop-change', name: 'Backdrop Change', price: 500, unit: 'setup', icon: '🎨', active: true },
        { id: 'product-table', name: 'Product Table Setup', price: 500, unit: 'session', icon: '🗄️', active: true },
        { id: 'product-styling', name: 'Product Stylist', price: 2000, unit: 'session', icon: '✏️', active: true },
        { id: 'extra-edited', name: 'Extra Edited Images (+10)', price: 1500, unit: 'set', icon: '🖼️', active: true },
        { id: 'raw-footage', name: 'Raw Files Delivery', price: 500, unit: 'session', icon: '💾', active: true },
        { id: 'same-day', name: 'Same-Day Delivery', price: 2000, unit: 'session', icon: '⚡', active: true },
    ],
    photoshoot: [
        { id: 'makeup-artist', name: 'Makeup Artist', price: 3000, unit: 'session', icon: '💄', active: true },
        { id: 'styling', name: 'Wardrobe Styling', price: 2000, unit: 'session', icon: '👗', active: true },
        { id: 'extra-outfit', name: 'Extra Outfit Change', price: 500, unit: 'change', icon: '👔', active: true },
        { id: 'backdrop-change', name: 'Backdrop Change', price: 500, unit: 'setup', icon: '🎨', active: true },
        { id: 'extra-edited', name: 'Extra Edited Photos (+10)', price: 1500, unit: 'set', icon: '🖼️', active: true },
        { id: 'raw-footage', name: 'Raw Files Delivery', price: 500, unit: 'session', icon: '💾', active: true },
        { id: 'same-day', name: 'Same-Day Delivery', price: 2000, unit: 'session', icon: '⚡', active: true },
    ],
    'video-production': [
        { id: 'extra-camera', name: 'Extra Camera', price: 1000, unit: 'hour', icon: '📷', active: true },
        { id: 'drone', name: 'Drone Footage', price: 0, unit: 'custom', icon: '🚁', customQuote: true, active: true },
        { id: 'gimbal', name: 'Gimbal Operator', price: 1000, unit: 'session', icon: '🎥', active: true },
        { id: 'teleprompter', name: 'Teleprompter', price: 1000, unit: 'session', icon: '📺', active: true },
        { id: 'color-grading', name: 'Color Grading', price: 2000, unit: 'session', icon: '🎨', active: true },
        { id: 'reel-basic', name: 'Reel Cutdown (Basic)', price: 1000, unit: 'reel', icon: '🎞️', active: true },
        { id: 'subtitle', name: 'Subtitle / Caption Burn-in', price: 500, unit: 'reel', icon: '📄', active: true },
        { id: 'raw-footage', name: 'Raw Footage Delivery', price: 500, unit: 'session', icon: '💾', active: true },
    ],
    'event-media': [
        { id: 'extra-camera', name: 'Extra Camera', price: 1000, unit: 'hour', icon: '📷', active: true },
        { id: 'drone', name: 'Drone Coverage', price: 0, unit: 'custom', icon: '🚁', customQuote: true, active: true },
        { id: 'photography', name: 'Photography Crew', price: 5000, unit: 'session', icon: '📸', active: true },
        { id: 'same-day', name: 'Same-Day Highlight Reel', price: 5000, unit: 'session', icon: '⚡', active: true },
        { id: 'full-edit', name: 'Full Event Edit', price: 8000, unit: 'session', icon: '✂️', active: true },
        { id: 'raw-footage', name: 'Raw Footage Delivery', price: 500, unit: 'session', icon: '💾', active: true },
    ],
    'live-streaming': [
        { id: 'extra-camera', name: 'Extra Camera', price: 1000, unit: 'hour', icon: '📷', active: true },
        { id: 'live-switcher', name: 'Live Switcher', price: 3000, unit: 'session', icon: '🔀', active: true },
        { id: 'audio-integration', name: 'Audio Feed Integration', price: 1500, unit: 'session', icon: '🎛️', active: true },
        { id: 'led-output', name: 'LED Screen Output', price: 0, unit: 'custom', icon: '📺', customQuote: true, active: true },
        { id: 'recording', name: 'Full Recording Backup', price: 1000, unit: 'session', icon: '⏺️', active: true },
        { id: 'internet-backup', name: 'Internet Backup (4G)', price: 1000, unit: 'session', icon: '📶', active: true },
        { id: 'technical-crew', name: 'On-Site Technical Crew', price: 3000, unit: 'session', icon: '👷', active: true },
    ],
};

/* ── DEFAULT WHATSAPP TEMPLATES ───────────────────────────── */
const DEFAULT_WHATSAPP_TEMPLATES = [
    {
        id: 'tpl-received', name: 'Booking Received', trigger: 'on_booking',
        body: `Hi {{name}},\n\nThank you for choosing Lighthouse Studios By Brainvare!\n\nWe have received your booking request:\n📋 Booking ID: {{bookingId}}\n🎬 Service: {{service}}\n📅 Date: {{date}}\n⏰ Time: {{time}}\n\nOur team will verify availability and contact you shortly to confirm your slot.\n\n— Lighthouse Studios By Brainvare`,
    },
    {
        id: 'tpl-confirmed', name: 'Booking Confirmed', trigger: 'on_confirm',
        body: `Hi {{name}},\n\nYour booking at Lighthouse Studios By Brainvare is confirmed! ✅\n\n📋 Booking ID: {{bookingId}}\n🎬 Service: {{service}}\n📦 Package: {{package}}\n📅 Date: {{date}}\n⏰ Time: {{startTime}} to {{endTime}}\n💰 Total: ₹{{total}}\n💳 Advance Paid: ₹{{advance}}\n🔖 Balance Due: ₹{{balance}}\n\nPlease arrive on time. Extra usage beyond your booked slot will be charged.\n\n— Lighthouse Studios By Brainvare`,
    },
    {
        id: 'tpl-payment', name: 'Payment Reminder', trigger: 'manual',
        body: `Hi {{name}},\n\n⏰ Reminder: Your session at Lighthouse Studios is coming up!\n\n📋 Booking ID: {{bookingId}}\n📅 Date: {{date}}\n⏰ Time: {{time}}\n\n💰 Balance Amount: ₹{{balance}}\n\nKindly complete payment before your session.\n\n— Lighthouse Studios By Brainvare`,
    },
    {
        id: 'tpl-reminder', name: 'Session Reminder (24h)', trigger: 'manual',
        body: `Hi {{name}},\n\n🔔 Your studio session is tomorrow!\n\n📅 Date: {{date}}\n⏰ Time: {{time}} at Lighthouse Studios By Brainvare\n\nPlease ensure:\n✅ Advance payment is complete\n✅ You arrive 5 mins before your slot\n✅ All scripts/references are ready\n\nSee you soon!\n— Lighthouse Studios By Brainvare`,
    },
];

/* ── HOW IT WORKS ─────────────────────────────────────────── */
const HOW_IT_WORKS = [
    { step: 1, title: 'Choose Service', desc: 'Pick from podcast studio, photoshoot, video production, event, or live streaming.', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>` },
    { step: 2, title: 'Select Package & Add-ons', desc: 'Choose your camera setup, duration, and extras like teleprompter, editing, or live switching.', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` },
    { step: 3, title: 'Pick Date, Time & Duration', desc: 'Select your preferred date and time slot. The system shows live availability.', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>` },
    { step: 4, title: 'Accept Terms & Confirm', desc: 'Review your booking summary, accept the terms, and submit. Our team confirms within 2 hours.', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 6L9 17l-5-5"/></svg>` },
];

/* ── FAQs ─────────────────────────────────────────────────── */
const FAQS = [
    { q: 'Can I book the studio hourly?', a: 'Yes! All podcast packages can be booked starting from 1 hour. You pay the first-hour rate, plus a discounted rate for each additional hour you add.' },
    { q: 'Is setup time included in the booking?', a: 'Setup time is included at no extra charge for most packages and is blocked in our calendar before your session starts.' },
    { q: 'Can I book after 6 PM?', a: 'Yes, after-hours bookings are available on request. Sessions after 6 PM attract a 25% surcharge, and after 9 PM attract 50%.' },
    { q: 'Can I add a teleprompter?', a: 'Absolutely. The teleprompter is available as an add-on at ₹1,000 per session. Select it during the booking process.' },
    { q: 'Do you provide editing?', a: 'Editing is not included in base packages but can be added. Options include basic reel edits from ₹1,000, podcast edits from ₹2,500, and full packages.' },
    { q: 'Can I book for live streaming?', a: 'Yes. We offer live switcher and streaming setups for YouTube, Facebook, Instagram, Zoom, and custom RTMP destinations.' },
    { q: 'Can I use my own crew?', a: 'Yes, you can bring your own crew. Please inform us in advance so we can coordinate space and setup requirements.' },
    { q: 'Is advance payment required?', a: 'Yes. Most bookings require 50% advance to confirm the slot. Event production may require 60–70% advance.' },
    { q: 'Can I reschedule?', a: 'Rescheduling is free if done 24+ hours before your booked slot, subject to availability. Contact us on WhatsApp.' },
    { q: 'Will I get raw footage?', a: 'Raw footage delivery is not included by default but can be added as an optional add-on at ₹500 per session.' },
];

/* ── ALL POPULAR ADD-ONS (for landing page display) ───────── */
const ALL_POPULAR_ADDONS = [
    { name: 'Teleprompter', icon: '📺', price: '₹1,000' },
    { name: 'Extra Camera', icon: '📷', price: '₹1,000/hr' },
    { name: 'Extra Lighting', icon: '💡', price: '₹500' },
    { name: 'Extra Microphone', icon: '🎤', price: '₹500' },
    { name: 'Live Switcher', icon: '🔀', price: '₹3,000+' },
    { name: 'Green Screen', icon: '🟩', price: '₹1,000' },
    { name: 'Reel Editing', icon: '🎞️', price: '₹1,000+' },
    { name: 'Podcast Editing', icon: '✂️', price: '₹2,500+' },
    { name: 'Thumbnail Design', icon: '🖼️', price: '₹500' },
    { name: 'Audio Cleanup', icon: '🔊', price: '₹1,000' },
    { name: 'Raw Footage', icon: '💾', price: '₹500' },
    { name: 'Makeup Artist', icon: '💄', price: '₹3,000' },
    { name: 'Script Support', icon: '📝', price: '₹1,500' },
    { name: 'Product Styling', icon: '✨', price: '₹2,000' },
    { name: 'Same-Day Delivery', icon: '⚡', price: '₹2,000' },
];

/* ── DEFAULT TERMS ────────────────────────────────────────── */
const TERMS = `BOOKING TERMS — Lighthouse Studios By Brainvare

1. BOOKING & PAYMENT
• Bookings are confirmed only after advance payment or admin approval.
• Studio bookings are calculated hourly. Minimum duration applies per service.
• Extra time usage beyond the booked slot will be charged at the applicable hourly rate.
• Prices shown are base prices and may vary based on duration, camera setup, crew, equipment, editing, live requirements, and custom production needs.
• GST will be applicable if enabled.

2. ARRIVAL & USAGE
• Customers must arrive on time. Sessions start and end at the booked time regardless of late arrival.
• Setup and pack-up time is managed by the studio. Extra usage beyond the booked time will be charged additionally.
• Any damage to studio property or equipment will be charged to the client.
• Food and beverages are allowed only in designated areas. Smoking, alcohol, and illegal substances are strictly prohibited.

3. CANCELLATION POLICY
• Free cancellation up to 48 hours before the booked slot.
• Cancellations within 24–48 hours: 25% cancellation fee.
• Cancellations within 24 hours or no-show: No refund on advance.
• Rescheduling is free if done 24+ hours in advance, subject to availability.

4. EQUIPMENT & CREW
• Additional equipment must be selected during booking or requested 48 hours in advance.
• Outside crew usage must be informed in advance.
• Food, decoration, or props require prior approval.

5. CONTENT & DELIVERABLES
• Raw footage delivery is not included unless selected as an add-on.
• Editing is not included unless mentioned in the selected package or added as an add-on.
• Final deliverables and timelines depend on the package and add-ons selected.
• All content recorded belongs to the client.

6. LIVE EVENTS & STREAMING
• Live events require technical confirmation before final pricing.
• Internet bandwidth is provided but uptime is not guaranteed for streaming.
• Client must provide streaming credentials before the session.

7. GENERAL
• Lighthouse Studios By Brainvare reserves the right to refuse service.
• These terms apply at the time of booking. For disputes, jurisdiction is local courts.

By submitting this booking, you confirm that you have read, understood, and agree to all terms and conditions above.`;

/* ── BOOKING STATUSES ─────────────────────────────────────── */
const BOOKING_STATUSES = [
    { id: 'new-request', label: 'New Request', color: '#818CF8' },
    { id: 'awaiting-availability', label: 'Awaiting Availability', color: '#FCD34D' },
    { id: 'awaiting-payment', label: 'Awaiting Payment', color: '#FCA5A5' },
    { id: 'confirmed', label: 'Confirmed', color: '#6EE7B7' },
    { id: 'advance-paid', label: 'Advance Paid', color: '#93C5FD' },
    { id: 'fully-paid', label: 'Fully Paid', color: '#C4B5FD' },
    { id: 'in-session', label: 'In Session', color: '#D6A84F' },
    { id: 'completed', label: 'Completed', color: '#6EE7B7' },
    { id: 'cancelled', label: 'Cancelled', color: '#9CA3AF' },
    { id: 'rescheduled', label: 'Rescheduled', color: '#67E8F9' },
];

const PAYMENT_STATUSES = [
    { id: 'not-paid', label: 'Not Paid', color: '#FCA5A5' },
    { id: 'advance-paid', label: 'Advance Paid', color: '#FCD34D' },
    { id: 'fully-paid', label: 'Fully Paid', color: '#6EE7B7' },
    { id: 'refund-pending', label: 'Refund Pending', color: '#FCA5A5' },
    { id: 'refunded', label: 'Refunded', color: '#9CA3AF' },
];

const DELIVERY_STATUSES = [
    { id: 'not-started', label: 'Not Started', color: '#9CA3AF' },
    { id: 'editing', label: 'In Editing', color: '#FCD34D' },
    { id: 'review', label: 'Client Review', color: '#93C5FD' },
    { id: 'delivered', label: 'Delivered', color: '#6EE7B7' },
];

/* ═══════════════════════════════════════════════════════════
   CORE DB — Bookings, Blocked Slots, Settings
══════════════════════════════════════════════════════════ */
const DB = {
    async getBookings() { 
        try {
            const res = await fetch('/api/bookings');
            return await res.json();
        } catch (err) {
            console.error('Fetch error:', err);
            return JSON.parse(localStorage.getItem('lhs_bookings') || '[]'); 
        }
    },
    async saveBooking(booking) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const cfg = this.getSettings();
        const prefix = cfg.invoicePrefix || 'LSB';
        
        // This count logic would ideally be server-side for accuracy, 
        // but keeping it here for simplicity in this transition
        const bookings = await this.getBookings();
        const todayBookings = bookings.filter(b => b.bookingId && b.bookingId.includes(dateStr));
        const count = todayBookings.length + 1;
        
        booking.bookingId = `${prefix}-${dateStr}-${String(count).padStart(3, '0')}`;
        booking.id = 'bk_' + Date.now().toString(36);
        booking.createdAt = now.toISOString();

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(booking)
            });
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Save error:', err);
            // Fallback to local storage if API fails
            bookings.push(booking);
            localStorage.setItem('lhs_bookings', JSON.stringify(bookings));
            return booking;
        }
    },
    async isSlotBlocked(dateStr, startHour, endHour) {
        const bookings = await this.getBookings();
        return bookings.some(b => {
            if (b.date !== dateStr || b.status === 'cancelled') return false;
            const bStart = b.actualBlockStart ?? b.startHour ?? 0;
            const bEnd = b.actualBlockEnd ?? b.endHour ?? 0;
            return startHour < bEnd && endHour > bStart;
        });
    },
    getSettings() { try { return JSON.parse(localStorage.getItem('lhs_settings') || 'null') || { ...STUDIO_CONFIG }; } catch { return { ...STUDIO_CONFIG }; } },
    saveSettings(settings) { localStorage.setItem('lhs_settings', JSON.stringify(settings)); },
};

/* ═══════════════════════════════════════════════════════════
   ADMIN DB — All Admin-Configurable Data
══════════════════════════════════════════════════════════ */
const ADMIN_DB = {
    /* ── PACKAGES ─────────────────────────────────────────── */
    getPackages() { return JSON.parse(localStorage.getItem('lhs_packages') || 'null') || [...PODCAST_PACKAGES]; },
    savePackage(pkg) {
        const packages = this.getPackages();
        const idx = packages.findIndex(p => p.id === pkg.id);
        if (idx !== -1) { packages[idx] = { ...packages[idx], ...pkg }; }
        else { if (!pkg.id) pkg.id = 'pkg_' + Date.now().toString(36); packages.push(pkg); }
        localStorage.setItem('lhs_packages', JSON.stringify(packages));
        return pkg;
    },
    deletePackage(id) { localStorage.setItem('lhs_packages', JSON.stringify(this.getPackages().filter(p => p.id !== id))); },

    /* ── SERVICES ─────────────────────────────────────────── */
    getServices() { return JSON.parse(localStorage.getItem('lhs_services') || 'null') || [...SERVICES]; },
    saveService(svc) {
        const services = this.getServices();
        const idx = services.findIndex(s => s.id === svc.id);
        if (idx !== -1) { services[idx] = { ...services[idx], ...svc }; }
        else { if (!svc.id) svc.id = 'svc_' + Date.now().toString(36); services.push(svc); }
        localStorage.setItem('lhs_services', JSON.stringify(services));
        return svc;
    },

    /* ── ADD-ONS ──────────────────────────────────────────── */
    getAddons(serviceId) {
        const all = JSON.parse(localStorage.getItem('lhs_addons') || 'null') || { ...ADDONS };
        return serviceId ? (all[serviceId] || []) : all;
    },
    saveAddon(serviceId, addon) {
        const all = JSON.parse(localStorage.getItem('lhs_addons') || 'null') || { ...ADDONS };
        if (!all[serviceId]) all[serviceId] = [];
        const idx = all[serviceId].findIndex(a => a.id === addon.id);
        if (idx !== -1) { all[serviceId][idx] = { ...all[serviceId][idx], ...addon }; }
        else { if (!addon.id) addon.id = 'ao_' + Date.now().toString(36); all[serviceId].push(addon); }
        localStorage.setItem('lhs_addons', JSON.stringify(all));
    },
    deleteAddon(serviceId, id) {
        const all = JSON.parse(localStorage.getItem('lhs_addons') || 'null') || { ...ADDONS };
        if (all[serviceId]) { all[serviceId] = all[serviceId].filter(a => a.id !== id); localStorage.setItem('lhs_addons', JSON.stringify(all)); }
    },

    /* ── COUPONS ──────────────────────────────────────────── */
    getCoupons() { return JSON.parse(localStorage.getItem('lhs_coupons') || '[]'); },
    saveCoupon(coupon) {
        const coupons = this.getCoupons();
        const idx = coupons.findIndex(c => c.id === coupon.id);
        if (idx !== -1) { coupons[idx] = { ...coupons[idx], ...coupon }; }
        else { coupon.id = coupon.id || 'cp_' + Date.now().toString(36); coupon.createdAt = new Date().toISOString(); coupon.usedCount = 0; coupons.push(coupon); }
        localStorage.setItem('lhs_coupons', JSON.stringify(coupons));
        return coupon;
    },
    deleteCoupon(id) { localStorage.setItem('lhs_coupons', JSON.stringify(this.getCoupons().filter(c => c.id !== id))); },
    validateCoupon(code, amount, serviceId) {
        if (!code || !code.trim()) return { valid: false, error: 'Enter a coupon code' };
        const coupon = this.getCoupons().find(c => c.code?.toUpperCase() === code.trim().toUpperCase() && c.active);
        if (!coupon) return { valid: false, error: 'Invalid or expired coupon code' };
        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return { valid: false, error: 'This coupon has expired' };
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) return { valid: false, error: 'Coupon usage limit reached' };
        if (coupon.minAmount && amount < coupon.minAmount) return { valid: false, error: `Minimum booking of ₹${coupon.minAmount.toLocaleString('en-IN')} required` };
        if (coupon.applicableServices && !coupon.applicableServices.includes('all') && serviceId && !coupon.applicableServices.includes(serviceId)) return { valid: false, error: 'Coupon not valid for this service' };
        let discount = coupon.type === 'percent' ? Math.round(amount * coupon.value / 100) : coupon.value;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        discount = Math.min(discount, amount);
        return { valid: true, coupon, discount };
    },
    markCouponUsed(code) {
        const coupons = this.getCoupons();
        const idx = coupons.findIndex(c => c.code?.toUpperCase() === code?.toUpperCase());
        if (idx !== -1) { coupons[idx].usedCount = (coupons[idx].usedCount || 0) + 1; localStorage.setItem('lhs_coupons', JSON.stringify(coupons)); }
    },

    /* ── TARIFFS (time-range pricing) ─────────────────────── */
    getTariffs() { return JSON.parse(localStorage.getItem('lhs_tariffs') || '[]'); },
    saveTariff(tariff) {
        const tariffs = this.getTariffs();
        const idx = tariffs.findIndex(t => t.id === tariff.id);
        if (idx !== -1) { tariffs[idx] = { ...tariffs[idx], ...tariff }; }
        else { tariff.id = tariff.id || 'tf_' + Date.now().toString(36); tariff.createdAt = new Date().toISOString(); tariffs.push(tariff); }
        localStorage.setItem('lhs_tariffs', JSON.stringify(tariffs));
        return tariff;
    },
    deleteTariff(id) { localStorage.setItem('lhs_tariffs', JSON.stringify(this.getTariffs().filter(t => t.id !== id))); },
    getTariffSurcharge(startHour, endHour, dateStr, baseAmount) {
        const tariffs = this.getTariffs().filter(t => t.active);
        if (!tariffs.length) return 0;
        const dow = dateStr ? new Date(dateStr + 'T00:00:00').getDay() : -1;
        let total = 0;
        tariffs.forEach(t => {
            let applies = true;
            if (t.days?.length) applies = applies && t.days.includes(dow);
            if (t.timeFrom !== undefined && t.timeTo !== undefined && t.timeFrom !== '' && t.timeTo !== '') {
                applies = applies && (startHour < Number(t.timeTo) && endHour > Number(t.timeFrom));
            }
            if (t.dateFrom) applies = applies && dateStr >= t.dateFrom;
            if (t.dateTo) applies = applies && dateStr <= t.dateTo;
            if (applies) {
                const s = t.type === 'percent' ? Math.round(baseAmount * Number(t.value) / 100) : Number(t.value);
                total += s;
            }
        });
        return total;
    },

    /* ── TERMS ────────────────────────────────────────────── */
    getTerms() { return localStorage.getItem('lhs_terms') || TERMS; },
    saveTerms(text) { localStorage.setItem('lhs_terms', text); },

    /* ── NOTES (per booking) ──────────────────────────────── */
    getNotes(bookingId) {
        const all = JSON.parse(localStorage.getItem('lhs_notes') || '{}');
        return (all[bookingId] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    addNote(bookingId, text, type = 'note', author = 'Admin') {
        if (!bookingId || !text) return null;
        const all = JSON.parse(localStorage.getItem('lhs_notes') || '{}');
        if (!all[bookingId]) all[bookingId] = [];
        const note = { id: 'nt_' + Date.now().toString(36), bookingId, text, type, author, createdAt: new Date().toISOString() };
        all[bookingId].unshift(note);
        localStorage.setItem('lhs_notes', JSON.stringify(all));
        return note;
    },
    deleteNote(bookingId, noteId) {
        const all = JSON.parse(localStorage.getItem('lhs_notes') || '{}');
        if (all[bookingId]) { all[bookingId] = all[bookingId].filter(n => n.id !== noteId); localStorage.setItem('lhs_notes', JSON.stringify(all)); }
    },

    /* ── DRIVE / DELIVERY LINKS (per booking) ─────────────── */
    getDriveLinks(bookingId) { const all = JSON.parse(localStorage.getItem('lhs_drive') || '{}'); return all[bookingId] || []; },
    addDriveLink(bookingId, label, url, type = 'other') {
        const all = JSON.parse(localStorage.getItem('lhs_drive') || '{}');
        if (!all[bookingId]) all[bookingId] = [];
        const link = { id: 'dl_' + Date.now().toString(36), label, url, type, addedAt: new Date().toISOString() };
        all[bookingId].push(link);
        localStorage.setItem('lhs_drive', JSON.stringify(all));
        ADMIN_DB.addNote(bookingId, `Drive link added: ${label}`, 'delivery');
        return link;
    },
    deleteDriveLink(bookingId, id) {
        const all = JSON.parse(localStorage.getItem('lhs_drive') || '{}');
        if (all[bookingId]) { all[bookingId] = all[bookingId].filter(l => l.id !== id); localStorage.setItem('lhs_drive', JSON.stringify(all)); }
    },

    /* ── LINE ITEMS (custom additions per booking) ────────── */
    addLineItem(bookingId, item) {
        const b = DB.getBookings().find(b => b.id === bookingId);
        if (!b) return;
        item.id = 'li_' + Date.now().toString(36);
        const lineItems = b.lineItems || [];
        lineItems.push(item);
        DB.updateBooking(bookingId, { lineItems, totalAmount: (b.totalAmount || 0) + item.price });
        ADMIN_DB.addNote(bookingId, `Line item added: ${item.name} — ₹${item.price.toLocaleString('en-IN')}`, 'payment');
    },
    removeLineItem(bookingId, itemId) {
        const b = DB.getBookings().find(b => b.id === bookingId);
        if (!b) return;
        const item = (b.lineItems || []).find(i => i.id === itemId);
        if (!item) return;
        const lineItems = (b.lineItems || []).filter(i => i.id !== itemId);
        DB.updateBooking(bookingId, { lineItems, totalAmount: Math.max(0, (b.totalAmount || 0) - item.price) });
        ADMIN_DB.addNote(bookingId, `Line item removed: ${item.name} — ₹${item.price.toLocaleString('en-IN')}`, 'payment');
    },

    /* ── USERS / ROLES ────────────────────────────────────── */
    getUsers() { return JSON.parse(localStorage.getItem('lhs_users') || '[]'); },
    saveUser(user) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) { users[idx] = { ...users[idx], ...user }; }
        else { user.id = user.id || 'usr_' + Date.now().toString(36); user.createdAt = new Date().toISOString(); users.push(user); }
        localStorage.setItem('lhs_users', JSON.stringify(users));
        return user;
    },
    deleteUser(id) { localStorage.setItem('lhs_users', JSON.stringify(this.getUsers().filter(u => u.id !== id))); },

    /* ── WHATSAPP TEMPLATES ───────────────────────────────── */
    getTemplates() { return JSON.parse(localStorage.getItem('lhs_templates') || 'null') || [...DEFAULT_WHATSAPP_TEMPLATES]; },
    saveTemplate(template) {
        const templates = this.getTemplates();
        const idx = templates.findIndex(t => t.id === template.id);
        if (idx !== -1) { templates[idx] = template; } else { templates.push(template); }
        localStorage.setItem('lhs_templates', JSON.stringify(templates));
    },

    /* ── COUPON SHORTHAND ─────────────────────────────────── */
    getCoupon(code) { return this.getCoupons().find(c => c.code?.toUpperCase() === code?.toUpperCase()); },

    /* ── CUSTOMERS ────────────────────────────────────────── */
    getCustomers() { return JSON.parse(localStorage.getItem('lhs_customers') || '[]'); },
    saveCustomer(customer) {
        const list = this.getCustomers();
        const idx = list.findIndex(c => c.id === customer.id);
        if (idx !== -1) { list[idx] = { ...list[idx], ...customer }; }
        else { if (!customer.id) customer.id = 'cst_' + Date.now().toString(36); customer.createdAt = customer.createdAt || new Date().toISOString(); list.push(customer); }
        localStorage.setItem('lhs_customers', JSON.stringify(list));
        return customer;
    },
    deleteCustomer(id) { localStorage.setItem('lhs_customers', JSON.stringify(this.getCustomers().filter(c => c.id !== id))); },

    /* ── LINE ITEMS (getter) ──────────────────────────────── */
    getLineItems(bookingId) {
        const b = DB.getBookings().find(b => b.id === bookingId);
        return b?.lineItems || [];
    },

    /* ── DRIVE LINK (alias) ───────────────────────────────── */
    removeDriveLink(bookingId, id) { this.deleteDriveLink(bookingId, id); },

    /* ── SERVICE DELETE ───────────────────────────────────── */
    deleteService(id) { localStorage.setItem('lhs_services', JSON.stringify(this.getServices().filter(s => s.id !== id))); },

    /* ── ADDONS (flat array, no serviceId required) ───────── */
    getAllAddonsList() {
        const all = JSON.parse(localStorage.getItem('lhs_addons') || 'null') || { ...ADDONS };
        if (Array.isArray(all)) return all;
        return Object.values(all).flat();
    },

    /* ── TERMS (structured) ───────────────────────────────── */
    getTermsStructured() {
        try {
            const raw = localStorage.getItem('lhs_terms');
            if (!raw) return [{ id: 'terms-main', title: 'Booking Terms & Conditions', body: TERMS }];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            return [{ id: 'terms-main', title: 'Booking Terms & Conditions', body: raw }];
        } catch { return [{ id: 'terms-main', title: 'Booking Terms & Conditions', body: TERMS }]; }
    },
};

/* ═══════════════════════════════════════════════════════════
   PRICE CALCULATOR
══════════════════════════════════════════════════════════ */
const PriceCalc = {
    /* Calculate base price: firstHourPrice + additionalHourPrice × (hours - 1) */
    getBasePrice(pkg, hours) {
        if (!pkg) return 0;
        const first = pkg.firstHourPrice || 0;
        const extra = pkg.additionalHourPrice || 0;
        return first + extra * Math.max(0, hours - 1);
    },

    calculate({ serviceId, packageId, startHour, endHour, addons = [], addonQtys = {}, couponCode = '', customDiscount = 0, date = null }) {
        const cfg = DB.getSettings();
        const services = ADMIN_DB.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) return null;

        const packages = ADMIN_DB.getPackages();
        const pkg = serviceId === 'podcast' ? packages.find(p => p.id === packageId) : null;
        const hours = endHour - startHour;
        const openHour = cfg.studioOpenHour || 9;
        const closeHour = cfg.studioCloseHour || 18;

        let basePrice = 0;
        let outsideCharge = 0;

        if (pkg) {
            basePrice = this.getBasePrice(pkg, hours);

            // After-hours surcharge (based on additionalHourPrice per outside hour)
            const earlyHours = Math.max(0, Math.min(endHour, openHour) - startHour);
            const allAfterClose = Math.max(0, endHour - Math.max(startHour, closeHour));
            const nightHours = Math.max(0, endHour - Math.max(startHour, 21));
            const eveningHours = Math.max(0, allAfterClose - nightHours);

            const hr = pkg.additionalHourPrice || pkg.firstHourPrice;
            outsideCharge = earlyHours * hr * (cfg.outsideHours?.before9am || 25) / 100
                + eveningHours * hr * (cfg.outsideHours?.after6pm || 25) / 100
                + nightHours * hr * (cfg.outsideHours?.after9pm || 50) / 100;
        } else {
            basePrice = (service.startingPrice || 0) * hours;
        }

        // Tariff surcharge
        const tariffSurcharge = ADMIN_DB.getTariffSurcharge(startHour, endHour, date, basePrice);

        // Add-ons
        let addonTotal = 0;
        const addonBreakdown = [];
        const allAddons = ADMIN_DB.getAddons(serviceId);
        addons.forEach(addonId => {
            const addon = allAddons.find(a => a.id === addonId);
            if (!addon || addon.customQuote) return;
            const qty = addonQtys[addonId] || 1;
            const addonHours = addon.unit === 'hour' ? hours : 1;
            const linePrice = addon.price * qty * addonHours;
            addonTotal += linePrice;
            addonBreakdown.push({ name: addon.name, unit: addon.unit, qty, price: linePrice });
        });

        const subtotalBeforeDiscount = basePrice + outsideCharge + tariffSurcharge + addonTotal;

        // Coupon
        let couponDiscount = 0;
        let couponLabel = '';
        if (couponCode) {
            const result = ADMIN_DB.validateCoupon(couponCode, subtotalBeforeDiscount, serviceId);
            if (result.valid) { couponDiscount = result.discount; couponLabel = `${result.coupon.code} (${result.coupon.type === 'percent' ? result.coupon.value + '%' : '₹' + result.coupon.value} off)`; }
        }

        const totalDiscount = couponDiscount + (customDiscount || 0);
        const subtotal = Math.max(0, subtotalBeforeDiscount - totalDiscount);
        const gstAmount = cfg.gstEnabled ? Math.round(subtotal * (cfg.gstPercent || 18) / 100) : 0;
        const total = subtotal + gstAmount;

        const advancePct = (pkg ? pkg.advancePercent : service.advancePercent) || 50;
        const advance = Math.ceil(total * advancePct / 100);
        const balance = total - advance;

        return { label: pkg ? pkg.name : service.name, hours, basePrice, outsideCharge, tariffSurcharge, addonTotal, addonBreakdown, couponDiscount, couponLabel, customDiscount, totalDiscount, subtotalBeforeDiscount, subtotal, gstAmount, total, advancePct, advance, balance, firstHourPrice: pkg?.firstHourPrice || 0, additionalHourPrice: pkg?.additionalHourPrice || 0 };
    },
    fmt: n => '₹' + Number(n).toLocaleString('en-IN'),
};
