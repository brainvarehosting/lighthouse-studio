/* ============================================================
   Lighthouse Studios By Brainvare — Main Application
   ============================================================ */

/* ── APP STATE ─────────────────────────────────────────────── */
const State = {
    currentStep: 1,
    selectedService: null,
    selectedPackage: null,
    selectedDate: null,
    selectedStartHour: null,
    selectedDuration: null,
    selectedAddons: {},
    calendarDate: new Date(),
    form: {},
    termsAccepted: false,
    allBookings: [], // Cache for cloud bookings
    paymentChoice: 'advance', // 'advance' or 'full'
    appliedCoupon: '',
    couponDiscount: 0,
    couponMsg: '',
};

const wa = () => `https://wa.me/${STUDIO_CONFIG.whatsappNumber}`;
const waMsg = (msg) => `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

/* ── DOM READY ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initWhatsApp();
    renderTrustBar();
    renderServices();
    renderPodcastPackages();
    renderHowItWorks();
    renderPricing();
    renderAddons();
    renderFAQ();
    initBookingTriggers();
    initBookingFlow();
    initRevealAnimations();
    initStickyBar();
});

/* ── NAVBAR ────────────────────────────────────────────────── */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('nav-toggle');
    const drawer = document.getElementById('nav-drawer');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        drawer.classList.toggle('open');
    });

    document.querySelectorAll('.nav-drawer-link').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('open');
            drawer.classList.remove('open');
        });
    });
}

/* ── WHATSAPP SETUP ────────────────────────────────────────── */
function initWhatsApp() {
    const greeting = `Hi! I'd like to know more about booking Lighthouse Studios By Brainvare.`;
    const url = waMsg(greeting);
    ['wa-float', 'wa-cta-btn', 'wa-footer-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = url;
    });
}

/* ── TRUST BAR ─────────────────────────────────────────────── */
function renderTrustBar() {
    const items = [
        'Hourly Studio Booking',
        '1 to 5 Camera Podcast Setup',
        'Product & Brand Shoots',
        'Live Switcher & Streaming',
        'Event Media Production',
        'Soundproofed Studio Floors',
        'By Brainvare',
        'Premium Creative Space',
    ];

    const html = items.map(t => `
        <div class="trust-item">
            <span class="trust-dot"></span>
            ${t}
        </div>
    `).join('');

    ['trust-items', 'trust-items-clone'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}

/* ── SERVICES ──────────────────────────────────────────────── */
function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    grid.innerHTML = SERVICES.map((svc, i) => `
        <div class="service-card reveal" style="animation-delay:${i * 0.1}s">
            <div class="service-icon">${svc.icon}</div>
            <h3 class="service-name">${svc.name}</h3>
            <p class="service-desc">${svc.description}</p>
            <div class="service-tags">
                ${svc.tags.map(t => `<span class="service-tag">${t}</span>`).join('')}
            </div>
            <div class="service-footer">
                <div class="service-price">${svc.startingLabel}</div>
                <button class="service-link" onclick="openBookingFor('${svc.id}')">
                    Book Now <span style="font-size: 1.2rem">→</span>
                </button>
            </div>
        </div>
    `).join('');
}

/* ── PODCAST PACKAGES ──────────────────────────────────────── */
function renderPodcastPackages() {
    const grid = document.getElementById('packages-grid');
    if (!grid) return;

    grid.innerHTML = PODCAST_PACKAGES.map((pkg, i) => `
        <div class="pkg-card reveal ${pkg.popular ? 'popular' : ''}" style="animation-delay:${i * 0.1}s">
            ${pkg.popular ? '<div class="pkg-popular-badge">Most Popular</div>' : ''}
            <div class="pkg-header">
                <div class="pkg-cameras">
                    ${Array.from({length: Math.max(pkg.cameras, 1)}, (_, j) =>
                        `<span class="cam-icon" style="opacity: ${0.4 + (j * 0.2)}">📷</span>`
                    ).join('')}
                </div>
                <h3 class="pkg-name">${pkg.name}</h3>
                <p class="pkg-best-for">${pkg.bestFor}</p>
            </div>
            <div class="pkg-price-grid">
                <div class="pkg-price-item">
                    <span class="pkg-price-label">1st Hour</span>
                    <span class="pkg-price-value">₹${pkg.firstHourPrice.toLocaleString('en-IN')}</span>
                </div>
                <div class="pkg-price-item">
                    <span class="pkg-price-label">Extra Hour</span>
                    <span class="pkg-price-value">+₹${pkg.additionalHourPrice.toLocaleString('en-IN')}</span>
                </div>
            </div>
            <ul class="pkg-features">
                ${pkg.includes.slice(0, 5).map(inc => `<li><span class="check">✓</span> ${inc}</li>`).join('')}
            </ul>
            <button class="btn ${pkg.popular ? 'btn-gold' : 'btn-outline'} btn-full" onclick="openBookingFor('podcast', '${pkg.id}')">
                Book ${pkg.name}
            </button>
        </div>
    `).join('');
}

/* ── HOW IT WORKS ──────────────────────────────────────────── */
function renderHowItWorks() {
    const grid = document.getElementById('steps-grid');
    if (!grid) return;

    grid.innerHTML = HOW_IT_WORKS.map((step, i) => `
        <div class="step-card reveal" style="animation-delay:${i * 0.1}s">
            <div class="step-num-wrap">
                <div class="step-num">${step.step}</div>
            </div>
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${step.desc}</div>
        </div>
    `).join('');
}

/* ── PRICING PREVIEW ───────────────────────────────────────── */
function renderPricing() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;

    grid.innerHTML = PODCAST_PACKAGES.map((pkg, i) => `
        <div class="pricing-card reveal" style="animation-delay:${i * 0.06}s">
            <div class="pricing-package">Podcast Studio</div>
            <div class="pricing-name">${pkg.name}</div>
            <div class="pricing-row"><span class="pricing-row-label">1st Hour</span><span class="pricing-row-val">₹${pkg.firstHourPrice.toLocaleString('en-IN')}</span></div>
            <div class="pricing-row"><span class="pricing-row-label">Each Extra Hour</span><span class="pricing-row-val">+₹${pkg.additionalHourPrice.toLocaleString('en-IN')}</span></div>
            <div class="pricing-row"><span class="pricing-row-label">2 Hours Total</span><span class="pricing-row-val">₹${(pkg.firstHourPrice + pkg.additionalHourPrice).toLocaleString('en-IN')}</span></div>
            <div class="pricing-row"><span class="pricing-row-label">4 Hours Total</span><span class="pricing-row-val">₹${(pkg.firstHourPrice + pkg.additionalHourPrice * 3).toLocaleString('en-IN')}</span></div>
            <div class="pricing-row"><span class="pricing-row-label">Setup Time</span><span class="pricing-row-val">${pkg.setupMinutes} min</span></div>
        </div>
    `).join('');
}

/* ── ADD-ONS SECTION ───────────────────────────────────────── */
function renderAddons() {
    const grid = document.getElementById('addons-grid');
    if (!grid) return;

    grid.innerHTML = ALL_POPULAR_ADDONS.map((name, i) => `
        <div class="addon-pill reveal" style="animation-delay:${i * 0.04}s">
            <div class="addon-pill-icon">${getAddonIcon(name)}</div>
            <div class="addon-pill-name">${name}</div>
            <div class="addon-pill-price">${getAddonPrice(name)}</div>
        </div>
    `).join('');
}

function getAddonIcon(name) {
    const map = {
        'Teleprompter': '📺', 'Extra Camera': '📷', 'Extra Lighting': '💡',
        'Extra Microphone': '🎤', 'Live Switcher': '🔀', 'Green Screen': '🟩',
        'Reel Editing': '🎞️', 'Podcast Editing': '✂️', 'Thumbnail Design': '🖼️',
        'Audio Cleanup': '🔊', 'Raw Footage Delivery': '💾', 'Makeup Artist': '💄',
        'Script Support': '📝', 'Product Styling': '✨', 'Same-Day Delivery': '⚡',
    };
    return map[name] || '➕';
}

function getAddonPrice(name) {
    const map = {
        'Teleprompter': '₹1,000', 'Extra Camera': '₹1,000/hr', 'Extra Lighting': '₹500',
        'Extra Microphone': '₹500', 'Live Switcher': '₹3,000+', 'Green Screen': '₹1,000',
        'Reel Editing': '₹1,000+', 'Podcast Editing': '₹2,500+', 'Thumbnail Design': '₹500',
        'Audio Cleanup': '₹1,000', 'Raw Footage Delivery': '₹500', 'Makeup Artist': '₹3,000',
        'Script Support': '₹1,500', 'Product Styling': '₹2,000', 'Same-Day Delivery': '₹2,000',
    };
    return map[name] || 'On request';
}

/* ── FAQ ───────────────────────────────────────────────────── */
function renderFAQ() {
    const list = document.getElementById('faq-list');
    if (!list) return;

    list.innerHTML = FAQS.map((faq, i) => `
        <div class="faq-item reveal" style="animation-delay:${i * 0.05}s">
            <div class="faq-q" onclick="toggleFAQ(this)">
                <span class="faq-q-text">${faq.q}</span>
                <div class="faq-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
            </div>
            <div class="faq-a"><div class="faq-a-inner">${faq.a}</div></div>
        </div>
    `).join('');
}

function toggleFAQ(el) {
    const item = el.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

/* ── REVEAL ANIMATIONS ─────────────────────────────────────── */
function initRevealAnimations() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Re-observe dynamically added elements after render
    setTimeout(() => {
        document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
    }, 200);
}

/* ── STICKY BAR ────────────────────────────────────────────── */
function initStickyBar() {
    const bar = document.getElementById('sticky-book-bar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
        const heroBottom = document.getElementById('hero')?.getBoundingClientRect().bottom || 0;
        bar.style.display = heroBottom < 0 ? 'block' : 'none';
    }, { passive: true });
}

/* ── BOOKING FLOW INIT ─────────────────────────────────────── */
function openBookingFor(serviceId, packageId) {
    if (serviceId) {
        State.selectedService = serviceId;
    }
    if (packageId) {
        State.selectedPackage = packageId;
    }
    openBooking();
}

function initBookingTriggers() {
    // All "Book Now" links open the booking overlay
    document.querySelectorAll('a[href="#booking"]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openBooking();
        });
    });
}

async function openBooking() {
    const overlay = document.getElementById('booking-overlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    State.currentStep = 1;
    
    // Fetch bookings from cloud
    State.allBookings = await DB.getBookings();
    
    renderBookingStep(State.currentStep);
    updateStepsBar();
    updatePriceTicker();
}

function closeBooking() {
    document.getElementById('booking-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

function initBookingFlow() {
    document.getElementById('booking-close').addEventListener('click', closeBooking);
    document.getElementById('booking-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('booking-overlay')) closeBooking();
    });

    // 4-step navigation
    document.getElementById('b1-next').addEventListener('click', () => goToStep(2));
    document.getElementById('b2-back').addEventListener('click', () => goToStep(1));
    document.getElementById('b2-next').addEventListener('click', () => goToStep(3));
    document.getElementById('b3-back').addEventListener('click', () => goToStep(2));
    document.getElementById('b3-next').addEventListener('click', () => { if (validateStep3()) goToStep(4); });
    document.getElementById('b4-back').addEventListener('click', () => goToStep(3));
    document.getElementById('b4-confirm').addEventListener('click', submitBooking);
    document.getElementById('bnew-booking')?.addEventListener('click', resetAndClose);

    document.getElementById('bterms-agree').addEventListener('change', function () {
        State.termsAccepted = this.checked;
        document.getElementById('b4-confirm').disabled = !this.checked;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBooking();
    });
}

function goToStep(step) {
    State.currentStep = step;
    renderBookingStep(step);
    updateStepsBar();
    updatePriceTicker();
    document.getElementById('booking-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepsBar() {
    document.querySelectorAll('.bstep').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === State.currentStep) el.classList.add('active');
        else if (s < State.currentStep) el.classList.add('done');
    });
}

function renderBookingStep(step) {
    document.querySelectorAll('.booking-step').forEach(el => {
        el.classList.remove('active');
        el.style.display = '';
    });
    document.getElementById('bstep-success').style.display = 'none';

    const stepEl = document.getElementById(`bstep-${step}`);
    if (stepEl) stepEl.classList.add('active');

    const ticker = document.getElementById('bprice-ticker');
    ticker.style.display = (step >= 1 && step <= 3) ? 'block' : 'none';

    switch (step) {
        case 1: renderStep1(); break;
        case 2: renderStep2(); break;
        case 3: renderStep3(); break;
        case 4: renderStep4(); break;
    }
}

/* ── STEP 1: SERVICE & PACKAGE (merged) ────────────────────── */
function renderStep1() {
    const grid = document.getElementById('bservice-grid');
    grid.innerHTML = SERVICES.map(svc => `
        <div class="bservice-card ${State.selectedService === svc.id ? 'selected' : ''}"
             data-id="${svc.id}" onclick="selectService('${svc.id}')">
            <div class="bservice-icon">${svc.icon}</div>
            <div>
                <div class="bservice-name">${svc.name}</div>
                <div class="bservice-price">${svc.startingLabel}</div>
            </div>
        </div>
    `).join('');
    renderPackageArea();
    updateStep1Button();
}

function selectService(id) {
    State.selectedService = id;
    if (State.selectedPackage && id !== 'podcast') State.selectedPackage = null;
    document.querySelectorAll('.bservice-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
    });
    renderPackageArea();
    updateStep1Button();
    updatePriceTicker();
}

function renderPackageArea() {
    const area = document.getElementById('bpackage-area');
    if (!area || !State.selectedService) { if (area) area.innerHTML = ''; return; }

    if (State.selectedService === 'podcast') {
        area.innerHTML = `
            <div class="bpkg-grid">
                ${PODCAST_PACKAGES.map(pkg => `
                    <div class="bpkg-card ${State.selectedPackage === pkg.id ? 'selected' : ''}"
                         data-id="${pkg.id}" onclick="selectPackage('${pkg.id}')">
                        <div class="bpkg-card-name">${pkg.name}</div>
                        <div class="bpkg-card-for">${pkg.bestFor}</div>
                        <div class="bpkg-prices">
                            <div class="bpkg-price-chip"><strong>₹${pkg.firstHourPrice.toLocaleString('en-IN')}</strong> 1st hr</div>
                            <div class="bpkg-price-chip"><strong>+₹${pkg.additionalHourPrice.toLocaleString('en-IN')}</strong> /extra hr</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    } else {
        const svc = SERVICES.find(s => s.id === State.selectedService);
        area.innerHTML = `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;text-align:center;">
                <div style="font-size:2rem;margin-bottom:12px">${svc?.icon || '🎬'}</div>
                <div style="font-family:var(--font-head);font-weight:700;font-size:1.1rem;color:var(--text);margin-bottom:8px">${svc?.name || ''}</div>
                <div style="font-size:0.85rem;color:var(--gold);font-weight:600">${svc?.startingLabel || 'Custom quote'}</div>
            </div>`;
        State.selectedPackage = 'custom';
    }
}

function selectPackage(id) {
    State.selectedPackage = id;
    document.querySelectorAll('.bpkg-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
    });
    updateStep1Button();
    updatePriceTicker();
}

function updateStep1Button() {
    const ready = State.selectedService && (State.selectedService !== 'podcast' || State.selectedPackage);
    document.getElementById('b1-next').disabled = !ready;
}

/* ── STEP 2: DATE, TIME & ADD-ONS ──────────────────────────── */
function renderStep2() {
    if (!State.calendarDate) State.calendarDate = new Date();
    renderCalendar();
    renderTimeSlots();
    renderDurationOptions();
    updateTimeSummary();
    renderBookingAddons();
    checkStep2Ready();
}

function renderCalendar() {
    const d = State.calendarDate;
    const year = d.getFullYear();
    const month = d.getMonth();

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('bcal-month-label').textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const container = document.getElementById('bcal-days');
    let html = '';

    for (let i = 0; i < firstDay; i++) {
        const prevDate = new Date(year, month, -firstDay + i + 1);
        html += `<div class="bcal-day other-month">${prevDate.getDate()}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isPast = date < today;
        const dateStr = formatDate(date);
        const isSelected = State.selectedDate === dateStr;
        const isToday = date.getTime() === today.getTime();
        const hasBookings = DB.getBookingsForDate(dateStr).length > 0;

        let cls = 'bcal-day';
        if (isPast) cls += ' disabled';
        if (isToday && !isPast) cls += ' today';
        if (isSelected) cls += ' selected';
        if (hasBookings && !isPast) cls += ' booked';

        const onclick = isPast ? '' : `onclick="selectDate('${dateStr}')"`;
        html += `<div class="${cls}" ${onclick}>${day}</div>`;
    }

    container.innerHTML = html;

    // Nav buttons
    document.getElementById('bcal-prev').onclick = () => {
        State.calendarDate = new Date(year, month - 1, 1);
        renderCalendar();
    };
    document.getElementById('bcal-next').onclick = () => {
        State.calendarDate = new Date(year, month + 1, 1);
        renderCalendar();
    };
}

function selectDate(dateStr) {
    State.selectedDate = dateStr;
    State.selectedStartHour = null;
    renderCalendar();
    renderTimeSlots();
    updateTimeSummary();
    checkStep2Ready();
}

function renderTimeSlots() {
    const container = document.getElementById('btime-slots');
    if (!container) return;

    const cfg = DB.getSettings();
    const slots = [];

    for (let h = 7; h <= 22; h++) {
        const label = formatHour(h);
        const isOutside = h < cfg.studioOpenHour || h >= cfg.studioCloseHour;
        const isSelected = State.selectedStartHour === h;
        const isBooked = State.selectedDate ? isHourBooked(State.selectedDate, h) : false;

        let cls = 'btime-slot';
        if (isSelected) cls += ' selected';
        if (isBooked) cls += ' booked';
        if (isOutside) cls += ' outside';

        const title = isOutside ? `${label} — after-hours surcharge applies` : label;
        slots.push(`<div class="${cls}" title="${title}" ${isBooked ? '' : `onclick="selectStartHour(${h})"`}>${label}${isOutside ? ' ✦' : ''}</div>`);
    }

    container.innerHTML = slots.join('');
}

function selectStartHour(h) {
    State.selectedStartHour = h;
    renderTimeSlots();
    renderDurationOptions();
    updateTimeSummary();
    checkStep2Ready();
}

function renderDurationOptions() {
    const container = document.getElementById('bdur-opts');
    if (!container) return;

    const svc = SERVICES.find(s => s.id === State.selectedService);
    const pkg = PODCAST_PACKAGES.find(p => p.id === State.selectedPackage);
    const minHrs = pkg ? pkg.minHours : (svc?.minHours || 1);

    const options = [1, 2, 3, 4, 5, 6, 7, 8].filter(h => h >= minHrs);

    container.innerHTML = options.map(h => {
        const isSelected = State.selectedDuration === h;
        let label = `${h} Hour${h !== 1 ? 's' : ''}`;

        // Show price hint using first-hour + additional-hour model
        let priceHint = '';
        if (pkg && pkg.firstHourPrice) {
            const price = pkg.firstHourPrice + pkg.additionalHourPrice * Math.max(0, h - 1);
            priceHint = `<span class="bdur-price-hint">₹${price.toLocaleString('en-IN')}</span>`;
        }

        return `<button class="bdur-btn ${isSelected ? 'selected' : ''}" onclick="selectDuration(${h})">${label}${priceHint}</button>`;
    }).join('');

    if (minHrs > 1) {
        const note = `<div style="font-size:0.75rem;color:var(--muted);margin-top:6px;width:100%">Minimum ${minHrs} hours for this package</div>`;
        container.insertAdjacentHTML('afterend', '');
    }
}

function selectDuration(h) {
    State.selectedDuration = h;
    renderDurationOptions();
    updateTimeSummary();
    checkStep2Ready();
    updatePriceTicker();
}

function updateTimeSummary() {
    const wrap = document.getElementById('btime-summary-wrap');
    const summary = document.getElementById('btime-summary');
    if (!wrap || !summary) return;

    if (!State.selectedDate || State.selectedStartHour === null || !State.selectedDuration) {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    const endHour = State.selectedStartHour + State.selectedDuration;
    const cfg = DB.getSettings();
    const pkg = PODCAST_PACKAGES.find(p => p.id === State.selectedPackage);
    const setupMin = pkg?.setupMinutes || 30;
    const bufferMin = pkg?.bufferMinutes || 30;

    const actualBlockStart = State.selectedStartHour - setupMin / 60;
    const actualBlockEnd = endHour + bufferMin / 60;

    const outsideHours = State.selectedStartHour < cfg.studioOpenHour || endHour > cfg.studioCloseHour;

    summary.innerHTML = `
        <div class="btime-summary-row"><span class="label">Date</span><span class="value">${formatDateDisplay(State.selectedDate)}</span></div>
        <div class="btime-summary-row"><span class="label">Your Session</span><span class="value">${formatHour(State.selectedStartHour)} → ${formatHour(endHour)}</span></div>
        <div class="btime-summary-row"><span class="label">Duration</span><span class="value">${State.selectedDuration} hour${State.selectedDuration !== 1 ? 's' : ''}</span></div>
        <div class="btime-summary-row"><span class="label">Setup Time</span><span class="value">${setupMin} min (included)</span></div>
        <div class="btime-summary-row"><span class="label">Calendar Blocked</span><span class="value">${formatHour(Math.floor(actualBlockStart))} → ${formatHour(Math.ceil(actualBlockEnd))}</span></div>
        ${outsideHours ? `<div class="btime-summary-row btime-surcharge"><span class="label">⚠ After-hours surcharge applies</span><span class="value">+25%–50%</span></div>` : ''}
    `;
}

function isHourBooked(dateStr, h) {
    const bookings = State.allBookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled');
    return bookings.some(b => {
        const start = b.actualBlockStart ?? b.start_hour ?? 0;
        const end = b.actualBlockEnd ?? b.end_hour ?? 0;
        return h >= start && h < end;
    });
}

function checkStep2Ready() {
    const ready = !!(State.selectedDate && State.selectedStartHour !== null && State.selectedDuration);
    document.getElementById('b2-next').disabled = !ready;
}

/* ── ADD-ONS (inline in Step 2) ─────────────────────────────── */
function renderBookingAddons() {
    const grid = document.getElementById('baddon-grid');
    if (!grid) return;
    const addons = ADDONS[State.selectedService] || [];
    if (addons.length === 0) {
        grid.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">No add-ons available for this service.</div>`;
        return;
    }
    grid.innerHTML = addons.map(addon => {
        const isSelected = !!State.selectedAddons[addon.id];
        const qty = State.selectedAddons[addon.id] || 1;
        const isCustom = addon.customQuote;
        return `
            <div class="baddon-item ${isSelected ? 'selected' : ''}" data-id="${addon.id}" onclick="toggleAddon('${addon.id}')">
                <div class="baddon-check"></div>
                <div class="baddon-icon-cell">${addon.icon || '➕'}</div>
                <div class="baddon-info">
                    <div class="baddon-name">${addon.name}</div>
                    <div class="baddon-unit">Per ${addon.unit}</div>
                </div>
                ${isCustom ? `<div class="baddon-price" style="color:var(--muted)">Custom</div>` :
                    `<div class="baddon-price">₹${addon.price.toLocaleString('en-IN')}</div>`}
                ${isSelected && (addon.unit === 'reel' || addon.unit === 'piece' || addon.unit === 'change' || addon.unit === 'set') ? `
                    <div class="baddon-qty" onclick="event.stopPropagation()">
                        <button onclick="changeAddonQty('${addon.id}',-1)">−</button>
                        <span>${qty}</span>
                        <button onclick="changeAddonQty('${addon.id}',1)">+</button>
                    </div>` : ''}
            </div>`;
    }).join('');
}

function toggleAddon(id) {
    if (State.selectedAddons[id]) { delete State.selectedAddons[id]; }
    else { State.selectedAddons[id] = 1; }
    renderBookingAddons();
    updatePriceTicker();
}

function changeAddonQty(id, delta) {
    const current = State.selectedAddons[id] || 1;
    State.selectedAddons[id] = Math.max(1, current + delta);
    renderBookingAddons();
    updatePriceTicker();
}

/* ── STEP 3: CUSTOMER DETAILS ──────────────────────────────── */
function renderStep3() {
    const podcastExtra = document.getElementById('bpodcast-extra');
    if (podcastExtra) podcastExtra.style.display = State.selectedService === 'podcast' ? 'block' : 'none';
    ['bf-name', 'bf-phone', 'bf-email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {}, { once: false });
    });
}

function validateStep3() {
    const name = document.getElementById('bf-name')?.value.trim();
    const phone = document.getElementById('bf-phone')?.value.trim();
    const email = document.getElementById('bf-email')?.value.trim();
    if (!name) { showToast('Please enter your full name', 'error'); return false; }
    if (!phone) { showToast('Please enter your phone number', 'error'); return false; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast('Please enter a valid email', 'error'); return false; }
    State.form = {
        name, phone, email,
        whatsapp: document.getElementById('bf-whatsapp')?.value.trim() || phone,
        company: document.getElementById('bf-company')?.value.trim(),
        gst: document.getElementById('bf-gst')?.value.trim(),
        notes: document.getElementById('bf-notes')?.value.trim(),
        podcastType: document.getElementById('bf-podcast-type')?.value,
        speakers: document.getElementById('bf-speakers')?.value,
    };
    return true;
}

/* ── STEP 4: REVIEW & PAY (with partial payment) ──────────── */
function renderStep4() {
    const summary = document.getElementById('bsummary');
    const termsScroll = document.getElementById('bterms-scroll');
    const pricing = calcPricing();
    const svc = SERVICES.find(s => s.id === State.selectedService);
    const pkg = PODCAST_PACKAGES.find(p => p.id === State.selectedPackage);
    const endHour = State.selectedStartHour + State.selectedDuration;
    const addonNames = Object.keys(State.selectedAddons).map(id => {
        const addon = (ADDONS[State.selectedService] || []).find(a => a.id === id);
        return addon ? `${addon.name} ×${State.selectedAddons[id]}` : id;
    }).join(', ');

    summary.innerHTML = `
        <div class="bsummary-section">
            <div class="bsummary-section-title">Booking Details</div>
            <div class="bsummary-row"><span class="bsummary-label">Service</span><span class="bsummary-value">${svc?.name || ''}</span></div>
            ${pkg ? `<div class="bsummary-row"><span class="bsummary-label">Package</span><span class="bsummary-value">${pkg.name}</span></div>` : ''}
            <div class="bsummary-row"><span class="bsummary-label">Date</span><span class="bsummary-value">${formatDateDisplay(State.selectedDate)}</span></div>
            <div class="bsummary-row"><span class="bsummary-label">Time</span><span class="bsummary-value">${formatHour(State.selectedStartHour)} – ${formatHour(endHour)}</span></div>
            <div class="bsummary-row"><span class="bsummary-label">Duration</span><span class="bsummary-value">${State.selectedDuration} hour${State.selectedDuration !== 1 ? 's' : ''}</span></div>
            ${addonNames ? `<div class="bsummary-row"><span class="bsummary-label">Add-Ons</span><span class="bsummary-value" style="font-size:0.8rem">${addonNames}</span></div>` : ''}
        </div>
        <div class="bsummary-section">
            <div class="bsummary-section-title">Customer</div>
            <div class="bsummary-row"><span class="bsummary-label">Name</span><span class="bsummary-value">${State.form.name}</span></div>
            <div class="bsummary-row"><span class="bsummary-label">Phone</span><span class="bsummary-value">${State.form.phone}</span></div>
            <div class="bsummary-row"><span class="bsummary-label">Email</span><span class="bsummary-value">${State.form.email}</span></div>
        </div>
        ${pricing ? `
        <div class="bsummary-section">
            <div class="bsummary-section-title">Price Breakdown</div>
            <div class="bsummary-row"><span class="bsummary-label">1st Hour</span><span class="bsummary-value">₹${(pricing.firstHourPrice || pricing.basePrice).toLocaleString('en-IN')}</span></div>
            ${State.selectedDuration > 1 ? `<div class="bsummary-row"><span class="bsummary-label">${State.selectedDuration - 1} extra hr${State.selectedDuration - 1 > 1 ? 's' : ''} × ₹${(pricing.additionalHourPrice || 0).toLocaleString('en-IN')}</span><span class="bsummary-value">₹${((pricing.additionalHourPrice || 0) * (State.selectedDuration - 1)).toLocaleString('en-IN')}</span></div>` : ''}
            <div class="bsummary-row" style="font-weight:600"><span class="bsummary-label">Base Total</span><span class="bsummary-value">₹${pricing.basePrice.toLocaleString('en-IN')}</span></div>
            ${pricing.outsideCharge > 0 ? `<div class="bsummary-row bsummary-surcharge"><span class="bsummary-label">⚠ After-hours surcharge</span><span class="bsummary-value">+₹${pricing.outsideCharge.toLocaleString('en-IN')}</span></div>` : ''}
            ${pricing.addonBreakdown.map(a => `<div class="bsummary-row"><span class="bsummary-label">${a.name}</span><span class="bsummary-value">₹${a.price.toLocaleString('en-IN')}</span></div>`).join('')}
            ${pricing.couponDiscount > 0 ? `<div class="bsummary-row" style="color:var(--gold)"><span class="bsummary-label">🏷 Coupon (${State.appliedCoupon})</span><span class="bsummary-value">-₹${pricing.couponDiscount.toLocaleString('en-IN')}</span></div>` : ''}
            <div class="bsummary-divider"></div>
            <div class="bsummary-total-row"><span class="bsummary-total-label">Total Amount</span><span class="bsummary-total-val">₹${(pricing.total||0).toLocaleString('en-IN')}</span></div>
        </div>` : `
        <div class="bsummary-note">This service requires a custom quote. Our team will contact you.</div>`}
    `;

    // Partial payment options
    renderPaymentOptions(pricing);

    // Coupon field
    const couponSection = document.getElementById('bsummary-coupon');
    if (couponSection) {
        couponSection.innerHTML = `
        <div class="bsummary-coupon-wrap">
            <div class="bsummary-coupon-row">
                <input class="bsummary-coupon-input" id="b4-coupon-code" type="text" placeholder="Coupon code (optional)" style="text-transform:uppercase" value="${State.appliedCoupon||''}" />
                <button class="bsummary-coupon-btn" id="b4-apply-coupon">Apply</button>
            </div>
            <p class="bsummary-coupon-msg" id="b4-coupon-msg" style="font-size:.78rem;margin-top:.3rem;min-height:1em">${State.couponMsg||''}</p>
        </div>`;
        document.getElementById('b4-apply-coupon')?.addEventListener('click', () => {
            const code = document.getElementById('b4-coupon-code').value.trim().toUpperCase();
            const p = calcPricing();
            const result = ADMIN_DB.validateCoupon ? ADMIN_DB.validateCoupon(code, p?.total || 0, State.selectedService) : { valid: false, error: 'Not supported' };
            const msgEl = document.getElementById('b4-coupon-msg');
            if (result.valid) {
                State.appliedCoupon = code;
                State.couponMsg = `✓ ${result.coupon.code} applied — saving ₹${result.discount.toLocaleString('en-IN')}`;
                if (msgEl) { msgEl.style.color = 'var(--gold)'; msgEl.textContent = State.couponMsg; }
            } else {
                State.appliedCoupon = '';
                State.couponMsg = result.error || 'Invalid coupon';
                if (msgEl) { msgEl.style.color = 'var(--danger,#E05252)'; msgEl.textContent = State.couponMsg; }
            }
            renderStep4();
        });
    }

    if (termsScroll) termsScroll.textContent = TERMS;
    document.getElementById('bterms-agree').checked = false;
    State.termsAccepted = false;
    document.getElementById('b4-confirm').disabled = true;
}

function renderPaymentOptions(pricing) {
    const container = document.getElementById('bpay-options');
    if (!container || !pricing) { if (container) container.innerHTML = ''; return; }
    const total = pricing.total || 0;
    const advPct = pricing.advancePct || 50;
    const advAmt = Math.ceil(total * advPct / 100);
    const balance = total - advAmt;
    const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

    container.innerHTML = `
        <div class="bpay-option ${State.paymentChoice === 'advance' ? 'selected' : ''}" onclick="selectPaymentChoice('advance')">
            <div class="bpay-option-radio"></div>
            <div class="bpay-option-info">
                <div class="bpay-option-title">Pay Advance (${advPct}%)</div>
                <div class="bpay-option-desc">Pay ${fmt(advAmt)} now · Balance ${fmt(balance)} before session</div>
            </div>
            <div class="bpay-option-amount">${fmt(advAmt)}</div>
        </div>
        <div class="bpay-option ${State.paymentChoice === 'full' ? 'selected' : ''}" onclick="selectPaymentChoice('full')">
            <div class="bpay-option-radio"></div>
            <div class="bpay-option-info">
                <div class="bpay-option-title">Pay Full Amount</div>
                <div class="bpay-option-desc">Complete payment upfront · No balance due</div>
            </div>
            <div class="bpay-option-amount">${fmt(total)}</div>
        </div>
    `;
}

function selectPaymentChoice(choice) {
    State.paymentChoice = choice;
    const pricing = calcPricing();
    renderPaymentOptions(pricing);
}

/* ── PRICE TICKER ──────────────────────────────────────────── */
function updatePriceTicker() {
    const ticker = document.getElementById('bprice-ticker');
    const amountEl = document.getElementById('bprice-amount');
    const advEl = document.getElementById('bprice-adv');

    if (!ticker || !amountEl) return;

    const pricing = calcPricing();

    if (!pricing) {
        amountEl.textContent = 'Custom Quote';
        advEl.textContent = '';
        return;
    }

    amountEl.textContent = `₹${pricing.total.toLocaleString('en-IN')}`;
    advEl.textContent = `Advance: ₹${pricing.advance.toLocaleString('en-IN')}`;
}

function calcPricing(couponCode, customDiscount) {
    if (!State.selectedService || !State.selectedStartHour || !State.selectedDuration) return null;
    if (State.selectedService !== 'podcast' || !State.selectedPackage || State.selectedPackage === 'custom') return null;

    const addonQtys = State.selectedAddons;
    const addons = Object.keys(addonQtys);

    return PriceCalc.calculate({
        serviceId: State.selectedService,
        packageId: State.selectedPackage,
        startHour: State.selectedStartHour,
        endHour: State.selectedStartHour + State.selectedDuration,
        addons,
        addonQtys,
        couponCode: couponCode || State.appliedCoupon || '',
        customDiscount: customDiscount || 0,
        date: State.selectedDate || null,
    });
}

/* ── BOOKING SUBMISSION ────────────────────────────────────── */
async function submitBooking() {
    if (!validateStep3()) return;
    
    const btn = document.getElementById('b4-confirm');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const pricing = calcPricing();
    const pkg = PODCAST_PACKAGES.find(p => p.id === State.selectedPackage);
    const svc = SERVICES.find(s => s.id === State.selectedService);
    const endHour = State.selectedStartHour + State.selectedDuration;

    const advAmt = State.paymentChoice === 'full' ? (pricing?.total || 0) : (pricing?.advance || 0);
    const balAmt = State.paymentChoice === 'full' ? 0 : (pricing?.balance || 0);

    const booking = {
        ...State.form,
        serviceId: State.selectedService,
        serviceName: svc?.name,
        packageId: State.selectedPackage,
        packageName: pkg?.name || 'Custom',
        date: State.selectedDate,
        startHour: State.selectedStartHour,
        endHour,
        actualBlockStart: State.selectedStartHour - (pkg?.setupMinutes || 0) / 60,
        actualBlockEnd: endHour + (pkg?.bufferMinutes || 30) / 60,
        duration: State.selectedDuration,
        setupMinutes: pkg?.setupMinutes || 0,
        bufferMinutes: pkg?.bufferMinutes || 30,
        addons: { ...State.selectedAddons },
        totalAmount: pricing?.total || 0,
        paymentChoice: State.paymentChoice,
        advanceAmount: advAmt,
        balanceAmount: balAmt,
        termsAccepted: true,
    };

    const saved = await DB.saveBooking(booking);

    // Show success step
    document.querySelectorAll('.booking-step').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    const successEl = document.getElementById('bstep-success');
    successEl.style.display = 'block';
    successEl.classList.add('active');
    document.getElementById('bprice-ticker').style.display = 'none';
    document.getElementById('booking-steps-bar').style.display = 'none';

    const payLabel = State.paymentChoice === 'full' ? 'Full Payment' : `Advance (${pricing?.advancePct||50}%)`;
    document.getElementById('bsuccess-details').innerHTML = `
        <div class="bsuccess-detail-row"><span class="dl">Booking ID</span><span class="dv">${saved.bookingId}</span></div>
        <div class="bsuccess-detail-row"><span class="dl">Service</span><span class="dv">${svc?.name || ''}</span></div>
        ${pkg ? `<div class="bsuccess-detail-row"><span class="dl">Package</span><span class="dv">${pkg.name}</span></div>` : ''}
        <div class="bsuccess-detail-row"><span class="dl">Date & Time</span><span class="dv">${formatDateDisplay(State.selectedDate)}, ${formatHour(State.selectedStartHour)}</span></div>
        ${pricing ? `<div class="bsuccess-detail-row"><span class="dl">Total</span><span class="dv" style="color:var(--gold)">₹${pricing.total.toLocaleString('en-IN')}</span></div>` : ''}
        <div class="bsuccess-detail-row"><span class="dl">Payment</span><span class="dv">${payLabel} — ₹${advAmt.toLocaleString('en-IN')}</span></div>
        ${balAmt > 0 ? `<div class="bsuccess-detail-row"><span class="dl">Balance Due</span><span class="dv">₹${balAmt.toLocaleString('en-IN')}</span></div>` : ''}
    `;

    // QR code for receipt
    const receiptUrl = `${location.origin}${location.pathname.replace('index.html','').replace(/\/$/,'')+'/'}receipt.html?id=${saved.id}`;
    const qrWrap = document.getElementById('bsuccess-qr');
    const qrCanvas = document.getElementById('bsuccess-qr-canvas');
    const receiptLink = document.getElementById('bsuccess-receipt-link');
    if (qrWrap && qrCanvas && window.QRCode) {
        qrCanvas.innerHTML = '';
        new QRCode(qrCanvas, { text: receiptUrl, width: 130, height: 130, colorDark: '#0B0F14', colorLight: '#ffffff' });
        if (receiptLink) receiptLink.href = receiptUrl;
        qrWrap.style.display = 'block';
    }

    // Mark coupon as used
    if (State.appliedCoupon) {
        try { ADMIN_DB.markCouponUsed(State.appliedCoupon); } catch(e) {}
    }

    const waText = `Hi! I just submitted a booking request at Lighthouse Studios By Brainvare.\n\nBooking ID: ${saved.bookingId}\nService: ${svc?.name || ''}\nDate: ${formatDateDisplay(State.selectedDate)}\nTime: ${formatHour(State.selectedStartHour)}\nName: ${State.form.name}\nPhone: ${State.form.phone}\n\nPlease confirm availability. Thank you!`;
    const waBtn = document.getElementById('wa-success-btn');
    if (waBtn) waBtn.href = waMsg(waText);

    // Update steps bar to show all done
    document.querySelectorAll('.bstep').forEach(el => el.classList.add('done'));
}

function resetAndClose() {
    State.currentStep = 1;
    State.selectedService = null;
    State.selectedPackage = null;
    State.selectedDate = null;
    State.selectedStartHour = null;
    State.selectedDuration = null;
    State.selectedAddons = {};
    State.form = {};
    State.termsAccepted = false;
    State.paymentChoice = 'advance';
    State.appliedCoupon = '';
    State.couponDiscount = 0;
    State.couponMsg = '';
    document.getElementById('booking-steps-bar').style.display = '';
    closeBooking();
}

/* ── UTILITY: DATE/TIME FORMATTING ────────────────────────── */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHour(h) {
    if (h === undefined || h === null) return '';
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 || 12;
    return `${displayH}${mins ? ':' + String(mins).padStart(2, '0') : ''} ${ampm}`;
}

/* ── TOAST NOTIFICATIONS ───────────────────────────────────── */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
