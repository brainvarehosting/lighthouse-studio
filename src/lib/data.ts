// src/lib/data.ts

export interface StudioConfig {
    brandName: string;
    shortName: string;
    tagline: string;
    whatsappNumber: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    studioOpenHour: number;
    studioCloseHour: number;
    bookingSlotMinutes: number;
    defaultBufferMinutes: number;
    gstEnabled: boolean;
    gstPercent: number;
    invoicePrefix: string;
    outsideHours: { before9am: number; after6pm: number; after9pm: number };
    cancellationPolicy: string;
}

export const STUDIO_CONFIG: StudioConfig = {
    brandName: 'Lighthouse Studios By Brainvare',
    shortName: 'Lighthouse Studios',
    tagline: 'By Brainvare',
    whatsappNumber: '919876543210',
    email: 'hello@lighthousestudios.in',
    phone: '+91 98765 43210',
    address: 'Lighthouse Studios, Creative District',
    currency: '₹',
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

export interface Service {
    id: string;
    name: string;
    icon: string;
    description: string;
    startingPrice: number;
    startingLabel: string;
    hasPackages: boolean;
    minHours: number;
    advancePercent: number;
    bufferMinutes: number;
    active: boolean;
    tags: string[];
}

export const SERVICES: Service[] = [
    { id: 'podcast', name: 'Podcast Studio', icon: 'Mic', description: 'Book our podcast floor hourly or choose complete production packages with 1 to 5 camera setups.', startingPrice: 1500, startingLabel: 'Studio floor from ₹1,500/hr', hasPackages: true, minHours: 1, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['Hourly Booking', 'Multi-Camera', 'Soundproofed'] },
    { id: 'product-photoshoot', name: 'Product Photoshoot', icon: 'Camera', description: 'Clean e-commerce product photos, premium creative campaigns, and social media-ready visuals.', startingPrice: 3000, startingLabel: 'From ₹3,000/hr', hasPackages: false, minHours: 2, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['E-Commerce', 'Brand Shoots', 'Social Media'] },
    { id: 'photoshoot', name: 'Photoshoots', icon: 'Aperture', description: 'Personal branding, corporate profiles, fashion, founder shoots, team shoots, and campaign photography.', startingPrice: 3500, startingLabel: 'From ₹3,500/hr', hasPackages: false, minHours: 2, advancePercent: 50, bufferMinutes: 30, active: true, tags: ['Personal Brand', 'Fashion', 'Corporate'] },
    { id: 'video-production', name: 'Video Production', icon: 'Video', description: 'Corporate videos, reels, interviews, brand films, founder stories, testimonials, and documentaries.', startingPrice: 5000, startingLabel: 'Custom quote', hasPackages: false, minHours: 4, advancePercent: 60, bufferMinutes: 45, active: true, tags: ['Corporate Films', 'Reels', 'Documentaries'] },
    { id: 'event-media', name: 'Event Media Production', icon: 'Users', description: 'Photography, videography, highlight videos, multi-camera event coverage, conferences, launches, seminars.', startingPrice: 0, startingLabel: 'Custom quote', hasPackages: false, minHours: 4, advancePercent: 60, bufferMinutes: 60, active: true, tags: ['Conferences', 'Launches', 'Seminars'] },
    { id: 'live-streaming', name: 'Live Events & Streaming', icon: 'Radio', description: 'Multi-camera live production, switcher setup, YouTube/Facebook/private live streaming, LED screen output.', startingPrice: 3000, startingLabel: 'From ₹3,000/session', hasPackages: false, minHours: 4, advancePercent: 70, bufferMinutes: 120, active: true, tags: ['YouTube Live', 'Multi-Camera', 'Event Recording'] },
];

export interface PodcastPackage {
    id: string;
    name: string;
    cameras: number;
    operators: number;
    firstHourPrice: number;
    additionalHourPrice: number;
    setupMinutes: number;
    bufferMinutes: number;
    minHours: number;
    advancePercent: number;
    active: boolean;
    popular: boolean;
    bestFor: string;
    includes: string[];
    excludes: string[];
}

export const PODCAST_PACKAGES: PodcastPackage[] = [
    { id: 'floor-only', name: 'Studio Floor Only', cameras: 0, operators: 0, firstHourPrice: 1500, additionalHourPrice: 500, setupMinutes: 15, bufferMinutes: 15, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Self-recording with your own crew & gear', includes: ['Studio floor access', 'Basic lighting rig', 'Standard audio monitors', 'Air-conditioned space', '15 min free setup'], excludes: ['Camera equipment', 'Camera operators', 'Mics', 'Editing'] },
    { id: '1-camera', name: '1 Camera Podcast', cameras: 1, operators: 1, firstHourPrice: 4500, additionalHourPrice: 1200, setupMinutes: 30, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Solo podcasters and 1-on-1 interviews', includes: ['1 professional camera', '1 camera operator', 'Professional lighting', 'Condenser mic', 'Studio floor', '30 min setup'], excludes: ['Multiple angles', 'Editing', 'Teleprompter (add-on)'] },
    { id: '2-camera', name: '2 Camera Podcast', cameras: 2, operators: 1, firstHourPrice: 6850, additionalHourPrice: 1800, setupMinutes: 45, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: true, bestFor: 'Interviews and conversation-style shows', includes: ['2 professional cameras', '1 camera operator', 'Pro lighting setup', '2 mics', 'Studio floor', '45 min setup'], excludes: ['Third angle', 'Editing', 'Teleprompter (add-on)'] },
    { id: '3-camera', name: '3 Camera Podcast', cameras: 3, operators: 2, firstHourPrice: 9500, additionalHourPrice: 2500, setupMinutes: 60, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: true, bestFor: 'Panel discussions and group podcasts', includes: ['3 professional cameras', '2 operators', 'Broadcast lighting', '3+ mics', 'Director monitor', '60 min setup'], excludes: ['Live switching (add-on)', 'Editing (add-on)'] },
    { id: '4-camera', name: '4 Camera Podcast', cameras: 4, operators: 2, firstHourPrice: 12000, additionalHourPrice: 3200, setupMinutes: 75, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Professional multi-cam productions', includes: ['4 professional cameras', '2 operators', 'Full lighting grid', 'Multi-mic setup', 'Preview monitors', '75 min setup'], excludes: ['Live switching (add-on)', 'Editing (add-on)'] },
    { id: '5-camera', name: '5 Camera Podcast', cameras: 5, operators: 2, firstHourPrice: 15000, additionalHourPrice: 4000, setupMinutes: 90, bufferMinutes: 30, minHours: 1, advancePercent: 50, active: true, popular: false, bestFor: 'Broadcast-grade shows & premium productions', includes: ['5 professional cameras', '2 operators', 'Broadcast lighting', 'Full audio rig', 'Live switcher-ready', '90 min setup'], excludes: ['Live streaming (add-on)', 'Editing (add-on)'] },
];

export const FAQS = [
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
