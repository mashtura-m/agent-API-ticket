/* Helpdesk Mobile — high-fidelity prototype
   Vanilla JS, no build step. Data is mocked in memory; the render/action layer
   is shaped so a real API can replace the data helpers. */
(() => {
  'use strict';

  /* ───────────────────────── helpers ───────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const isoAgo = (min) => new Date(Date.now() - min * 60000).toISOString();
  const isoIn = (min) => new Date(Date.now() + min * 60000).toISOString();
  const M = (from, type, props = {}, ago = 0) => ({ id: uid(), from, type, time: isoAgo(ago), ...props });
  const rel = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 1) return 'now';
    if (m < 60) return m + 'm';
    const h = Math.round(m / 60);
    return h < 24 ? h + 'h' : Math.round(h / 24) + 'd';
  };
  const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const clockFull = (iso) => new Date(iso).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtSize = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.round(b / 1e3) + ' KB');
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const fmtMs = (ms) => fmtDur(Math.max(0, Math.ceil(ms / 1000)));
  const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const attrs = (o) => Object.entries(o).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');

  const ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    inbox: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 13h5l1.5 2h5l1.5-2h5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6.5 6.5 0 0 1 3.5 6.5"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M18 8a5 5 0 0 1 0 8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 2v3M12 2v3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    select: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    smartphone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    checks: '<path d="M2 12.5l4 4L14 8"/><path d="M10 16.5l1 1 9-10"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    aa: '<path d="M3 19l5-14 5 14M5.5 14h6M15 19l3-8 3 8M16 16h4"/>',
    bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/>',
    italic: '<path d="M19 4h-9M14 20H5M15 4L9 20"/>',
    underline: '<path d="M6 4v7a6 6 0 0 0 12 0V4M4 21h16"/>',
    strike: '<path d="M4 12h16M16 6.5C15 5 13.5 4 12 4c-2.5 0-4 1.3-4 3 0 4 8 2.5 8 7 0 1.7-1.5 3-4 3-2 0-3.5-1-4.5-2.5"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    send: '<path d="M4 12l16-8-6 16-2-7z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    clip: '<path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7L13 4.5a3.5 3.5 0 0 1 5 5L10.3 17a2 2 0 0 1-3-3L15 6.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    userPlus: '<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0M19 8v6M16 11h6"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    reply: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v5"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  };
  const ic = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;

  /* Channels: every conversation carries one; shown as a badge on the avatar. */
  const CHANNELS = {
    whatsapp: { label: 'WhatsApp', icon: 'message', color: '#2E9A5C' },
    messenger: { label: 'Messenger', icon: 'zap', color: '#2F6FD6' },
    web: { label: 'Web chat', icon: 'globe', color: '#5B6B7D' },
    sms: { label: 'SMS', icon: 'smartphone', color: '#B7791F' },
    email: { label: 'Email', icon: 'mail', color: '#0F7C8C' },
  };
  const chBadge = (key) => {
    const c = CHANNELS[key];
    return c ? `<span class="ch-badge" style="--c:${c.color}" title="${c.label}">${ic(c.icon)}</span>` : '';
  };
  const av = (o, size = '', channel = null, statusKey = null) => {
    const dot = statusKey ? `<span class="status-dot" style="--s:${STATUS[statusKey].color}"></span>` : '';
    return `<span class="av-wrap"><span class="av ${size}" style="--h:${o.hue}" aria-hidden="true">${esc(initials(o.name))}</span>${channel ? chBadge(channel) : ''}${dot}</span>`;
  };
  const STATUS = {
    available: { label: 'Available', color: '#2E8B5E' },
    busy: { label: 'Busy', color: '#B7791F' },
    away: { label: 'Away', color: '#C07A2C' },
    break: { label: 'On break', color: '#6A3FB0' },
    offline: { label: 'Offline', color: '#8796A8' },
  };

  /* ───────────────────────── mock data ───────────────────────── */
  const USERS = [
    { id: 'u-ayo', name: 'Ayo Bello', role: 'admin', hue: 18, status: 'available', breakEnd: null, breakType: null, used: { short: 0, lunch: 0 } },
    { id: 'u-sara', name: 'Sara Lindqvist', role: 'agent', hue: 270, status: 'available', breakEnd: null, breakType: null, used: { short: 1, lunch: 0 } },
    { id: 'u-kofi', name: 'Kofi Mensah', role: 'agent', hue: 150, status: 'break', breakEnd: Date.now() + 9 * 60000, breakType: 'short', used: { short: 1, lunch: 0 } },
    { id: 'u-imani', name: 'Imani Obi', role: 'agent', hue: 330, status: 'offline', breakEnd: null, breakType: null, used: { short: 0, lunch: 0 } },
  ];
  const VERTICALS = { ecommerce: 'E-commerce', bfsi: 'BFSI', other: 'Business' };
  let LABELS = ['VIP', 'Shipping', 'Billing', 'Refund risk', 'Churn risk', 'Fraud watch', 'KYC pending', 'Wholesale', 'Priority partner'];

  let BREAK_POLICY = {
    short: { label: 'Short break', mins: 15, max: 2 },
    lunch: { label: 'Lunch', mins: 30, max: 1 },
  };

  const CONTACTS = [
    { id: 'c1', name: 'Amara Okafor', phone: '+234 803 555 0142', email: 'amara.o@example.com', city: 'Lagos', vertical: 'ecommerce', tags: ['VIP', 'Shipping'], since: 'Apr 2023', ltv: '$2,140', hue: 24, attrs: { 'Preferred channel': 'WhatsApp', Orders: '14' } },
    { id: 'c2', name: 'Lukas Brandt', phone: '+49 170 555 0198', email: 'lukas@brandt.de', city: 'Berlin', vertical: 'bfsi', tags: ['KYC pending'], since: 'Jan 2025', ltv: '€6,310', hue: 200, attrs: { Account: 'Current · 4417' } },
    { id: 'c3', name: 'Priya Raman', phone: '+44 7700 900421', email: 'priya.r@example.co.uk', city: 'London', vertical: 'bfsi', tags: ['Fraud watch', 'Priority partner'], since: 'Aug 2022', ltv: '£9,880', hue: 300, attrs: { Account: 'Premium' } },
    { id: 'c4', name: 'Noah Chen', phone: '+1 415 555 0177', email: 'noah.chen@example.com', city: 'San Francisco', vertical: 'ecommerce', tags: ['Billing'], since: 'Mar 2024', ltv: '$710', hue: 200, attrs: { Orders: '5' } },
    { id: 'c5', name: 'Mariana Costa', phone: '+351 912 555 310', email: 'mariana@costa-studio.pt', city: 'Lisbon', vertical: 'other', tags: ['Wholesale'], since: 'Jun 2025', ltv: '€3,400', hue: 120, attrs: { Company: 'Costa Studio' } },
    { id: 'c6', name: 'Daniel Ruiz', phone: '+34 611 555 208', email: 'daniel.ruiz@example.es', city: 'Madrid', vertical: 'ecommerce', tags: ['Churn risk', 'Refund risk'], since: 'Oct 2021', ltv: '$1,020', hue: 10, attrs: { Orders: '22' } },
    { id: 'c7', name: 'Hana Sato', phone: '+81 90 5555 0134', email: 'hana.sato@example.jp', city: 'Osaka', vertical: 'bfsi', tags: ['VIP'], since: 'Feb 2020', ltv: '¥1.2M', hue: 335, attrs: { Account: 'Private banking' } },
    { id: 'c8', name: 'Tomas Novak', phone: '+420 603 555 019', email: 'tomas@novak.cz', city: 'Prague', vertical: 'other', tags: [], since: 'Nov 2026', ltv: '—', hue: 260, attrs: {} },
  ];

  const ORDERS = [
    { title: 'Linen throw', sub: '#88194 · Out for delivery', meta: '$64.00', tone: '#E7C9A5', actions: ['Track', 'Get help'] },
    { title: 'Ceramic vase', sub: '#88102 · Delivered 2 Nov', meta: '$48.00', tone: '#C9B6D9', actions: ['Return', 'Reorder'] },
    { title: 'Woven tote', sub: '#87940 · Delivered 28 Oct', meta: '$32.00', tone: '#B9D2C4', actions: ['Return', 'Reorder'] },
  ];

  let CONVS = [
    { id: 'v1', contact: 'c1', channel: 'whatsapp', status: 'open', assignee: 'u-sara', priority: 'high', mode: 'human', unread: 2, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Hi, my order shows as delivered but it never reached me 😞' }, 46),
      M('customer', 'image', { name: 'doorstep.jpg', tone: '#C9A27E' }, 45),
      M('bot', 'text', { text: 'Thanks for the photo. I have flagged this for a delivery investigation.' }, 44),
      M('system', 'event', { text: 'Escalated to Sara Lindqvist' }, 40),
      M('agent', 'text', { html: 'Hi Amara, I am <b>so sorry</b>. I am checking the courier scan right now.', author: 'u-sara' }, 30),
      M('customer', 'voice', { dur: 12 }, 6),
      M('customer', 'text', { text: 'Thank you. Please let me know as soon as you can.' }, 3),
    ] },
    { id: 'v2', contact: 'c2', channel: 'web', status: 'open', assignee: null, priority: 'high', mode: 'bot', unread: 1, snoozeUntil: null,
      pendingDraft: { text: 'I have opened a dispute for €480.00 on your card ending 4417. A specialist will confirm within 2 business days.', buttons: ['Track dispute', 'Talk to a human'], reason: 'Financial action over €250 needs human approval', confidence: 0.64 },
      messages: [
        M('bot', 'text', { text: 'Hi Lukas, welcome back. How can I help today?', buttons: ['Check balance', 'Block my card', 'Dispute a charge', 'Talk to a human'] }, 22),
        M('customer', 'text', { text: 'I want to dispute a charge of €480 from February' }, 5),
        M('bot', 'text', { text: 'Understood. I have prepared the details for a specialist to check before anything changes.' }, 4),
      ] },
    { id: 'v3', contact: 'c3', channel: 'messenger', status: 'snoozed', assignee: null, priority: 'normal', mode: 'human', unread: 0, snoozeUntil: isoIn(180), pendingDraft: null, messages: [
      M('customer', 'text', { text: 'There is a payment I do not recognise: £79.99 to MERCHANT*X' }, 95),
      M('agent', 'text', { text: 'Thanks Priya. I have placed a temporary hold on the card while we check.', author: 'u-ayo' }, 90),
      M('system', 'event', { text: 'Snoozed by Ayo Bello' }, 60),
    ] },
    { id: 'v4', contact: 'c4', channel: 'web', status: 'open', assignee: null, priority: 'normal', mode: 'bot', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('bot', 'text', { text: 'Hi Noah! I can track orders, start returns or answer product questions.', buttons: ['Track an order', 'Start a return', 'Talk to a human'] }, 40),
      M('customer', 'text', { text: 'Track my orders' }, 39),
      M('bot', 'carousel', { text: 'Here are your three most recent orders.', items: ORDERS }, 38),
      M('customer', 'text', { text: 'Start a return' }, 21),
      M('bot', 'text', { text: 'Returns are free within 30 days. Which item would you like to send back?', buttons: ['Linen throw', 'Ceramic vase', 'Talk to a human'] }, 20),
    ] },
    { id: 'v5', contact: 'c5', channel: 'messenger', status: 'open', assignee: 'u-kofi', priority: 'normal', mode: 'human', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Do you offer bulk pricing for 200+ units?' }, 130),
      M('agent', 'text', { text: 'Yes, we do. I will send the wholesale sheet today.', author: 'u-kofi' }, 120),
      M('agent', 'file', { name: 'Wholesale-pricing-2026.pdf', size: 412000, author: 'u-kofi' }, 119),
      M('customer', 'text', { text: 'Perfect, thanks!' }, 30),
    ] },
    { id: 'v6', contact: 'c6', channel: 'whatsapp', status: 'open', assignee: 'u-ayo', priority: 'urgent', mode: 'human', unread: 3, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'This is the second time my refund is late. Cancel everything.' }, 15),
      M('customer', 'text', { text: 'Refund reference RF-20931' }, 14),
      M('customer', 'image', { name: 'receipt.png', tone: '#B9A6D6' }, 13),
    ] },
    { id: 'v7', contact: 'c7', channel: 'web', status: 'closed', assignee: 'u-imani', priority: 'normal', mode: 'human', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Card unlocked, thanks!' }, 1440),
      M('agent', 'text', { text: 'Glad it is sorted. Anything else I can help with?', author: 'u-imani' }, 1430),
      M('system', 'event', { text: 'Closed by Imani Obi' }, 1400),
    ] },
    { id: 'v8', contact: 'c8', channel: 'web', status: 'open', assignee: null, priority: 'normal', mode: 'bot', unread: 1, snoozeUntil: null, pendingDraft: null, messages: [
      M('bot', 'text', { text: 'Hi Tomas! I can book a call, share pricing or connect you to a specialist.', buttons: ['Book a call', 'Pricing', 'Talk to a human'] }, 6),
      M('customer', 'text', { text: 'Book a call for Thursday' }, 4),
      M('bot', 'text', { text: 'Great. Which slot works best for a 20-minute call?', buttons: ['Thu 10:00', 'Thu 14:30', 'Thu 16:00'] }, 3),
    ] },
    { id: 'v9', contact: 'c4', channel: 'email', status: 'open', assignee: null, priority: 'high', mode: 'human', unread: 1, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Subject: Chipped vase. The ceramic vase arrived with a chip on the rim. Photos attached.' }, 75),
      M('customer', 'image', { name: 'vase-chip.jpg', tone: '#D8C3B5' }, 74),
    ] },
    { id: 'v10', contact: 'c3', channel: 'sms', status: 'open', assignee: 'u-sara', priority: 'normal', mode: 'human', unread: 1, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Did the card unlock go through?' }, 9),
    ] },
  ];

  let TICKETS = [
    { id: 'TT482015', subject: 'Delivery not received · order #88213', contact: 'c1', status: 'Open', priority: 'high', assignee: 'u-sara', createdAt: isoAgo(1200), conv: 'v1' },
    { id: 'TT482377', subject: 'Dispute · €480 card charge (Feb)', contact: 'c2', status: 'InProgress', priority: 'urgent', assignee: null, createdAt: isoAgo(300), conv: 'v2' },
    { id: 'TT481902', subject: 'Refund RF-20931 late (2nd time)', contact: 'c6', status: 'Open', priority: 'urgent', assignee: 'u-ayo', createdAt: isoAgo(40), conv: 'v6' },
    { id: 'TT480117', subject: 'Card unlock request', contact: 'c7', status: 'Closed', priority: 'normal', assignee: 'u-imani', createdAt: isoAgo(1560), conv: 'v7' },
    { id: 'TT483340', subject: 'Bulk pricing request · 200+ units', contact: 'c5', status: 'Resolved', priority: 'normal', assignee: 'u-kofi', createdAt: isoAgo(1800), conv: 'v5' },
  ];

  let CAMPAIGNS = [
    { id: 'k1', name: 'Holiday shipping update', channel: 'whatsapp', status: 'Sent', audience: { label: 'All customers', count: 1240 }, when: isoAgo(60 * 26), stats: { sent: 1240, delivered: 1198, read: 842, clicked: 213 }, html: 'Hi {{name}}, our holiday shipping cut-off is <b>16 Dec</b>. <a href="https://example.com/shipping">See delivery dates</a>.', by: 'u-ayo' },
    { id: 'k2', name: 'New savings account', channel: 'email', status: 'Sent', audience: { label: 'BFSI', count: 3 }, when: isoAgo(60 * 80), stats: { sent: 3, delivered: 3, read: 2, clicked: 1 }, html: 'Hi {{name}}, a new <b>high-yield savings</b> account is open to you.', by: 'u-ayo' },
    { id: 'k3', name: 'Refund follow-up (VIP)', channel: 'messenger', status: 'Scheduled', audience: { label: 'VIP', count: 2 }, when: isoIn(60 * 20), stats: null, html: 'Hi {{name}}, your refund has been processed. Thank you for your patience.', by: 'u-ayo' },
    { id: 'k4', name: 'Win-back: churn risk', channel: 'sms', status: 'Draft', audience: { label: 'Churn risk', count: 1 }, when: null, stats: null, html: 'Hi {{name}}, we miss you. Here is <b>15% off</b> your next order.', by: 'u-ayo' },
  ];

  let CANNED = [
    { id: 'r1', shortcut: 'refund', title: 'Refund processed', text: 'Hi {{name}}, your refund has been processed. Allow 3 to 5 working days to appear.', scope: 'global', owner: 'u-ayo' },
    { id: 'r2', shortcut: 'hold', title: 'Please hold', text: "Thanks {{name}}, I'm checking this now. Could you hold for a moment?", scope: 'global', owner: 'u-ayo' },
    { id: 'r3', shortcut: 'order', title: 'Ask for order number', text: 'Could you share your order number so I can look it up?', scope: 'global', owner: 'u-ayo' },
    { id: 'r4', shortcut: 'bye', title: 'Closing', text: 'Glad I could help, {{name}}. Have a great day! — {{agent}}', scope: 'global', owner: 'u-ayo' },
    { id: 'r5', shortcut: 'thanks', title: 'My thanks', text: 'Thanks so much for your patience, {{name}}.', scope: 'mine', owner: 'u-sara' },
  ];

  const CHANNEL_ON = { whatsapp: true, messenger: true, web: true, sms: true, email: false };
  const RULES = { holdFinance: true, carousel: true, anger: true, aiHints: true };
  const RULE_TEXT = {
    holdFinance: ['Hold financial actions for review', 'Refunds, disputes and card changes wait for a human.'],
    carousel: ['Rich carousels', 'Show product and order cards in bot replies.'],
    anger: ['Hand off on frustration', 'Escalate when a visitor sounds upset or repeats themselves.'],
    aiHints: ['Show AI hints to agents', 'Purple marks AI-written or AI-held messages.'],
  };

  /* Permissions. Agents get the operational tools; anything that changes the
     team, money, the bot, channels or campaigns is admin-only. */
  const AGENT_OK = new Set(['selfAssign', 'reply', 'close', 'snooze', 'ticket', 'status', 'labels', 'addContact', 'takeOver', 'breakSelf', 'notifSelf', 'cannedPersonal', 'viewCampaigns']);
  const DENY_MSG = {
    assignOthers: 'assign chats or tickets to other agents',
    deleteContact: 'delete contacts',
    deleteTicket: 'delete tickets',
    createLabel: 'create new labels',
    botRules: 'change AI rules',
    breakPolicy: 'change the team break policy',
    teamBreaks: 'end other people’s breaks',
    createCampaign: 'create or send campaigns',
    cannedGlobal: 'edit shared canned replies',
    channels: 'change connected channels',
    manageTeam: 'change team roles',
  };

  /* ───────────────────────── state ───────────────────────── */
  const state = {
    me: 'u-ayo',
    tab: 'home',
    inboxSeg: 'chats',
    filter: 'open',
    channel: 'all',
    q: '',
    cq: '',
    tfilter: 'all',
    campFilter: 'all',
    settingsView: null,
    selecting: false,
    selected: [],
    convId: null,
    drafts: {},
    draftHtml: '',
    fmtOpen: false,
    cannedQ: null,
    cannedIdx: 0,
    aiHint: false,
    typing: null,
    call: null,
    rec: null,
    sheet: null,
    form: {},
    labelIn: '',
    toast: null,
    armed: null,
    longFired: false,
    scrollBottom: false,
    theme: initialTheme(),
    returnStatus: 'available',
    autoAway: 10,
    lastActive: Date.now(),
    delivery: { push: true, email: false, sound: true },
    notif: { assigned: true, reply: true, mention: true, slaRisk: true, aiReview: true, ticket: true, campaign: false },
    dndBreak: true,
    quiet: false,
  };

  function initialTheme() {
    let saved = null;
    try { saved = localStorage.getItem('helpdesk-theme'); } catch (_) { /* storage blocked */ }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function saveTheme(t) {
    try { localStorage.setItem('helpdesk-theme', t); } catch (_) { /* storage blocked */ }
  }

  const root = document.getElementById('root');
  const fileInput = document.getElementById('file-input');

  /* ───────────────────────── lookups & rules ───────────────────────── */
  const userById = (id) => USERS.find((u) => u.id === id);
  const me = () => userById(state.me);
  const admin = () => me().role === 'admin';
  const can = (perm) => admin() || AGENT_OK.has(perm);
  const contactById = (id) => CONTACTS.find((c) => c.id === id);
  const convById = (id) => CONVS.find((c) => c.id === id);
  const ticketById = (id) => TICKETS.find((t) => t.id === id);
  const campaignById = (id) => CAMPAIGNS.find((c) => c.id === id);
  const cannedById = (id) => CANNED.find((c) => c.id === id);
  const contactOf = (c) => contactById(c.contact);
  const current = () => (state.convId ? convById(state.convId) : null);
  const firstName = (o) => o.name.split(' ')[0];
  const lastMsg = (c) => c.messages[c.messages.length - 1];
  const lastTime = (c) => new Date(lastMsg(c).time).getTime();
  const isOpenish = (c) => c.status === 'open';

  function deny(perm) {
    if (can(perm)) return false;
    toast(`Only admins can ${DENY_MSG[perm]}.`);
    return true;
  }

  function sys(c, text) { c.messages.push(M('system', 'event', { text })); }

  /* Visible text of a message, used for previews and search. */
  const plain = (m) => (m.html ? m.html.replace(/<[^>]+>/g, '') : m.text || '');
  function preview(m) {
    switch (m.type) {
      case 'image': return '📷 Photo';
      case 'file': return '📎 ' + m.name;
      case 'voice': return '🎙 Voice message · ' + fmtDur(m.dur);
      case 'carousel': return '✦ Product carousel';
      case 'call': return '📞 Voice call';
      default:
        if (m.from === 'system') return m.text;
        if (m.from === 'agent') return 'You: ' + plain(m);
        if (m.from === 'bot') return '✦ ' + plain(m);
        return plain(m);
    }
  }

  function matchesFilter(c, f) {
    if (f === 'open') return c.status === 'open';
    if (f === 'mine') return c.status === 'open' && c.assignee === state.me;
    if (f === 'unassigned') return c.status === 'open' && !c.assignee;
    if (f === 'snoozed') return c.status === 'snoozed';
    if (f === 'closed') return c.status === 'closed';
    return true;
  }

  function visibleConvs() {
    const q = state.q.trim().toLowerCase();
    return CONVS
      .filter((c) => matchesFilter(c, state.filter))
      .filter((c) => state.channel === 'all' || c.channel === state.channel)
      .filter((c) => !q || (contactOf(c).name + ' ' + preview(lastMsg(c))).toLowerCase().includes(q))
      .sort((a, b) => lastTime(b) - lastTime(a));
  }

  function snoozeUntilFor(k) {
    if (k === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); }
    if (k === 'monday') { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); return d.toISOString(); }
    return isoIn(Number(k));
  }

  /* ───────────────────────── sanitizer (rich text) ───────────────────────── */
  const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'DEL', 'CODE', 'A', 'BR', 'UL', 'OL', 'LI', 'P', 'DIV', 'SPAN']);
  function sanitize(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    const clean = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) continue;
        if (child.nodeType !== 1) { child.remove(); continue; }
        clean(child);
        const tag = child.tagName;
        if (!ALLOWED_TAGS.has(tag)) { child.replaceWith(...Array.from(child.childNodes)); continue; }
        const href = tag === 'A' ? child.getAttribute('href') || '' : '';
        Array.from(child.attributes).forEach((a) => child.removeAttribute(a.name));
        if (tag === 'A') {
          if (/^(https?:|mailto:)/i.test(href.trim())) {
            child.setAttribute('href', href.trim());
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          } else {
            child.replaceWith(...Array.from(child.childNodes));
          }
        }
      }
    };
    clean(tpl.content);
    const wrap = document.createElement('div');
    wrap.appendChild(tpl.content.cloneNode(true));
    return wrap.innerHTML;
  }
  const richOf = (m) => sanitize(m.html != null ? m.html : esc(m.text));

  /* Canned replies: {{name}} and {{agent}} are filled in when inserted. */
  function fillVars(text, c) {
    const ct = c ? contactOf(c) : null;
    return text
      .replace(/\{\{name\}\}/g, ct ? firstName(ct) : 'there')
      .replace(/\{\{agent\}\}/g, firstName(me()));
  }
  function cannedMatches() {
    if (state.cannedQ == null) return [];
    const q = state.cannedQ.toLowerCase();
    return CANNED
      .filter((r) => r.scope === 'global' || r.owner === state.me)
      .filter((r) => !q || r.shortcut.includes(q) || r.title.toLowerCase().includes(q))
      .slice(0, 6);
  }

  /* ───────────────────────── AI bot (mock) ───────────────────────── */
  function botReply(c, text) {
    const t = text.toLowerCase();
    const v = contactOf(c).vertical;
    const say = (txt, buttons) => M('bot', 'text', { text: txt, buttons });
    if (/human|agent|person|someone/.test(t)) {
      return { handoff: true, messages: [say('Of course. I am connecting you with a specialist now. Average wait is under two minutes.')] };
    }
    if (v === 'bfsi') {
      if (/refund|dispute|chargeback|reverse/.test(t)) return {
        messages: [say('Understood. I have prepared the details for a specialist to check before anything is changed.')],
        draft: { text: 'I have opened a dispute for your recent card charge. A specialist will confirm the details within 2 business days.', buttons: ['Track dispute', 'Talk to a human'], reason: 'Financial action needs human approval', confidence: 0.64 },
      };
      if (/balance|statement/.test(t)) return { messages: [say('Your available balance is €2,418.55. Would you like a statement?', ['Last 5 transactions', 'Download statement', 'Talk to a human'])] };
      if (/block|lock|stolen|lost/.test(t)) return { messages: [say('For your security I can block the card ending 4417 right away. Shall I go ahead?', ['Yes, block it', 'Cancel'])] };
      return { messages: [say('I can help with balances, card blocks and disputes. What do you need?', ['Check balance', 'Block my card', 'Dispute a charge'])] };
    }
    if (v === 'ecommerce') {
      if (/order|track|deliver|parcel/.test(t)) return { messages: [M('bot', 'carousel', { text: 'Here are your three most recent orders.', items: ORDERS })] };
      if (/linen|vase|tote/.test(t)) return { messages: [say('Return started. Your prepaid label is on its way to your email, and the refund follows within 3 days of delivery.')] };
      if (/return|refund/.test(t)) return { messages: [say('Returns are free within 30 days. Which item would you like to send back?', ['Linen throw', 'Ceramic vase', 'Talk to a human'])] };
      return { messages: [say('I can track orders, start returns or answer product questions.', ['Track an order', 'Start a return', 'Talk to a human'])] };
    }
    if (/\d{1,2}:\d{2}/.test(t)) return { messages: [say('Booked. A calendar invite is on its way to your inbox.')] };
    if (/book|appoint|slot|call/.test(t)) return { messages: [say('Great. Which slot works best for a 20-minute call?', ['Thu 10:00', 'Thu 14:30', 'Thu 16:00'])] };
    return { messages: [say('Happy to help. Would you like to book a call or see pricing?', ['Book a call', 'Pricing', 'Talk to a human'])] };
  }

  function visitorSend(c, text) {
    c.messages.push(M('customer', 'text', { text }));
    state.scrollBottom = true;
    if (c.mode !== 'bot') return;
    state.typing = c.id;
    setTimeout(() => {
      state.typing = null;
      const cc = convById(c.id);
      if (cc && cc.mode === 'bot') {
        const out = botReply(cc, text);
        cc.messages.push(...out.messages);
        if (out.draft) cc.pendingDraft = out.draft;
        if (out.handoff) { cc.mode = 'human'; sys(cc, 'Handed to a human agent · next in queue'); }
        state.scrollBottom = true;
      }
      render();
    }, 900);
  }

  /* ───────────────────────── breaks & availability ───────────────────────── */
  function startBreak(type) {
    const u = me();
    const pol = BREAK_POLICY[type];
    if (u.used[type] >= pol.max) { toast(`No ${pol.label.toLowerCase()} left today`); return; }
    u.used[type] += 1;
    u.status = 'break';
    u.breakType = type;
    u.breakEnd = Date.now() + pol.mins * 60000;
    state.sheet = null;
    toast(`${pol.label} started · ${pol.mins} min`);
  }
  function endBreak(uid) {
    const u = userById(uid);
    if (!u || u.status !== 'break') return;
    u.status = uid === state.me ? state.returnStatus : 'available';
    u.breakEnd = null;
    u.breakType = null;
    toast(uid === state.me ? 'Welcome back. You are available.' : `${firstName(u)} is back from break`);
  }
  function setStatus(key) {
    const u = me();
    if (u.status === 'break') { toast('End your break first'); return; }
    u.status = key;
    if (key === 'available' || key === 'busy') state.returnStatus = key;
    state.lastActive = Date.now();
    toast(`You are ${STATUS[key].label.toLowerCase()}`);
  }
  function tickClock() {
    let changed = false;
    USERS.forEach((u) => {
      if (u.status === 'break' && u.breakEnd && Date.now() >= u.breakEnd) {
        u.status = u.id === state.me ? state.returnStatus : 'available';
        u.breakEnd = null;
        u.breakType = null;
        changed = true;
        if (u.id === state.me) toast('Break over. You are back online.');
      }
    });
    const idleMins = (Date.now() - state.lastActive) / 60000;
    if (state.autoAway && me().status === 'available' && idleMins >= state.autoAway) {
      me().status = 'away';
      changed = true;
      toast('You were away for a while, so your status changed to Away.');
    }
    if (changed) render();
    else updateCountdowns();
  }
  function updateCountdowns() {
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const u = userById(el.dataset.countdown);
      if (u && u.breakEnd) el.textContent = fmtMs(u.breakEnd - Date.now());
    });
  }

  /* ───────────────────────── toast ───────────────────────── */
  let toastTimer = null;
  function toast(msg, undo) {
    state.toast = { msg, undo };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = null; render(); }, 4200);
  }

  /* ───────────────────────── render ───────────────────────── */
  function render() {
    const ae = document.activeElement;
    const focusKey = ae && ae.dataset ? ae.dataset.key : null;
    const wasEditor = !!(ae && ae.hasAttribute && ae.hasAttribute('data-editor'));
    const caret = focusKey && ae.selectionStart != null ? ae.selectionStart : null;
    const prevContent = $('.content', root);
    const prevMsgs = $('.msgs', root);
    const sc = prevContent ? prevContent.scrollTop : 0;
    const ms = prevMsgs ? prevMsgs.scrollTop : 0;

    document.documentElement.dataset.theme = state.theme;
    if (state.convId && !current()) state.convId = null;
    root.innerHTML = shell();

    const content = $('.content', root);
    if (content) content.scrollTop = sc;
    const msgs = $('.msgs', root);
    if (msgs) msgs.scrollTop = state.scrollBottom ? msgs.scrollHeight : ms;
    state.scrollBottom = false;

    if (focusKey) {
      const el = $(`[data-key="${focusKey}"]`, root);
      if (el) {
        el.focus({ preventScroll: true });
        if (caret != null && el.setSelectionRange) { try { el.setSelectionRange(caret, caret); } catch (_) { /* no selection API */ } }
      }
    }
    if (wasEditor) {
      const ed = $('[data-editor]', root);
      if (ed) focusEnd(ed);
    }
  }

  function focusEnd(el) {
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function shell() {
    const c = current();
    const views = { home: renderHome, inbox: renderInbox, contacts: renderContacts, campaigns: renderCampaigns, settings: renderSettings };
    return `<div class="phone">
      ${views[state.tab]()}
      ${renderTabbar()}
      ${state.selecting && state.tab === 'inbox' ? renderBulk() : ''}
      ${c ? renderConv(c) : ''}
      ${state.call ? renderCall() : ''}
      ${state.sheet ? renderSheet() : ''}
      ${state.toast ? `<div class="toast" role="status"><span>${esc(state.toast.msg)}</span>${state.toast.undo ? '<button data-act="undo">Undo</button>' : ''}</div>` : ''}
    </div>`;
  }

  const roleSeg = () => `<div class="seg mini" role="group" aria-label="View as">${['admin', 'agent'].map((r) => `<button class="${me().role === r ? 'on' : ''}" data-act="role" data-role="${r}" aria-pressed="${me().role === r}">${r === 'admin' ? 'Admin' : 'Agent'}</button>`).join('')}</div>`;
  const topbar = (title, sub, right = '') => `<header class="topbar"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="tb-right">${right}</div></header>`;
  const emptyState = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${title}</b><span>${text}</span></div>`;

  function renderTabbar() {
    const unread = CONVS.filter((c) => c.status === 'open' && c.unread).length;
    const tabs = [
      ['home', 'Home', 'home', 0],
      ['inbox', 'Inbox', 'inbox', unread],
      ['contacts', 'Contacts', 'users', 0],
      ['campaigns', 'Campaigns', 'megaphone', 0],
      ['settings', 'Settings', 'settings', 0],
    ];
    return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, l, i, b]) => `<button class="tab ${state.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}" ${state.tab === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${b ? `<span class="badge" aria-label="${b} unread">${b}</span>` : ''}</button>`).join('')}</nav>`;
  }

  /* ───────────────────────── view: home (dashboards) ───────────────────────── */
  function renderHome() {
    return admin() ? renderAdminHome() : renderAgentHome();
  }

  function statusSeg() {
    const keys = ['available', 'busy', 'away', 'offline'];
    return `<div class="status-seg">${keys.map((k) => `<button class="${me().status === k ? 'on' : ''}" data-act="set-status" data-s="${k}" style="--s:${STATUS[k].color}" aria-pressed="${me().status === k}"><i></i>${STATUS[k].label}</button>`).join('')}</div>`;
  }

  function breakCard(u) {
    const rows = Object.entries(BREAK_POLICY).map(([k, p]) => {
      const left = Math.max(0, p.max - u.used[k]);
      return `<div class="break-row">${ic(k === 'lunch' ? 'coffee' : 'clock')}<div><b>${p.label} · ${p.mins} min</b><small>${left} of ${p.max} left today</small></div><span class="chip ${left ? 'blue' : ''}">${left ? 'Available' : 'Used'}</span></div>`;
    }).join('');
    return `<section class="card"><h3>${ic('coffee')}Breaks</h3>${rows}
      <button class="btn ghost block" data-act="break-sheet" style="margin-top:8px">${ic('coffee')}Take a break</button></section>`;
  }

  function renderAgentHome() {
    const u = me();
    const mine = CONVS.filter((c) => c.status === 'open' && c.assignee === u.id);
    const waiting = CONVS.filter((c) => c.status === 'open' && !c.assignee).length;
    const slaRisk = CONVS.filter((c) => c.status === 'open' && (c.priority === 'urgent' || c.priority === 'high') && (c.assignee === u.id || !c.assignee));
    const review = CONVS.filter((c) => c.pendingDraft && (c.assignee === u.id || !c.assignee)).length;
    const hours = [3, 5, 4, 7, 6, 9, 8, 5, 4, 6, 7, 3];
    const hourLabels = ['9', '', '11', '', '1', '', '3', '', '5', '', '7', ''];
    const onBreak = u.status === 'break';
    const statusBlock = onBreak
      ? `<div class="card" style="background:var(--purple-soft)"><div class="greet-status" style="--s:${STATUS.break.color};background:transparent;padding:0"><i></i>On break · ${BREAK_POLICY[u.breakType].label}</div>
          <div class="countdown" data-countdown="${u.id}" style="margin:6px 0 10px">${fmtMs(u.breakEnd - Date.now())}</div>
          <button class="btn purple block" data-act="end-break" data-id="${u.id}">${ic('check')}End break now</button></div>`
      : `<div class="card">${statusSeg()}</div>`;

    return `${topbar(`Hi, ${firstName(u)}`, `${mine.length} chats assigned · ${waiting} waiting`, roleSeg())}
      <div class="content">
        ${statusBlock}
        <div class="kpis">
          <div class="kpi"><span>Assigned to you</span><b>${mine.length}</b><small>open now</small></div>
          <div class="kpi ${slaRisk.length ? 'alert' : ''}"><span>SLA at risk</span><b>${slaRisk.length}</b><small>urgent or high</small></div>
          <div class="kpi"><span>Resolved today</span><b>9</b><small>+2 vs yesterday</small></div>
          <div class="kpi"><span>Your CSAT</span><b>4.8</b><small>from 14 ratings</small></div>
        </div>
        <section class="card"><h3>${ic('chart')}Your chats per hour</h3>
          <div class="bars">${hours.map((h, i) => `<div><i style="height:${Math.round((h / 9) * 100)}%"></i><span>${hourLabels[i]}</span></div>`).join('')}</div></section>
        ${breakCard(u)}
        <section class="card"><h3>${ic('spark')}AI drafts for you${review ? ` <span class="chip ai">${review}</span>` : ''}<button class="link" data-act="tab" data-tab="inbox" data-seg="ai">Review</button></h3>
          <p class="muted" style="margin:0;font-size:13px">${review ? 'Drafts that need a human before they reach the visitor.' : 'Nothing waiting. The bot is handling the rest.'}</p></section>
        <p class="label">Needs you next</p>
        <div class="list">${slaRisk.slice(0, 3).map(convCard).join('') || emptyState('check', 'All clear', 'No urgent chats for you right now.')}</div>
      </div>`;
  }

  function renderAdminHome() {
    const open = CONVS.filter((c) => c.status === 'open');
    const byChannel = Object.keys(CHANNELS).map((k) => ({ k, n: open.filter((c) => c.channel === k).length })).filter((x) => x.n);
    const total = byChannel.reduce((s, x) => s + x.n, 0) || 1;
    const review = CONVS.filter((c) => c.pendingDraft).length;
    const hours = [4, 6, 9, 11, 8, 12, 14, 10, 7, 9, 11, 5];
    const hourLabels = ['9', '', '11', '', '1', '', '3', '', '5', '', '7', ''];
    const onBreak = USERS.filter((u) => u.status === 'break');
    const sla = open.filter((c) => c.priority === 'urgent' || c.priority === 'high');
    const lastSent = CAMPAIGNS.find((c) => c.status === 'Sent');
    const readRate = lastSent ? Math.round((lastSent.stats.read / lastSent.stats.delivered) * 100) : 0;
    return `${topbar('Team overview', `${open.length} open · ${onBreak.length} on break`, roleSeg())}
      <div class="content">
        <div class="kpis">
          <div class="kpi"><span>Open chats</span><b>${open.length}</b><small>${open.filter((c) => !c.assignee).length} unassigned</small></div>
          <div class="kpi"><span>First response</span><b>1m 52s</b><small>target 2m</small></div>
          <div class="kpi"><span>AI resolved</span><b>68%</b><small>${review} draft${review === 1 ? '' : 's'} to review</small></div>
          <div class="kpi"><span>CSAT</span><b>4.7</b><small>last 7 days</small></div>
        </div>
        <section class="card"><h3>${ic('inbox')}Channel mix</h3>
          <div class="stack">${byChannel.map((x) => `<i style="--c:${CHANNELS[x.k].color};width:${(x.n / total) * 100}%"></i>`).join('')}</div>
          <div class="legend">${byChannel.map((x) => `<span style="--c:${CHANNELS[x.k].color}"><i></i>${CHANNELS[x.k].label}<b>${x.n}</b></span>`).join('')}</div></section>
        <section class="card"><h3>${ic('chart')}Chats per hour</h3>
          <div class="bars">${hours.map((h, i) => `<div><i style="height:${Math.round((h / 14) * 100)}%"></i><span>${hourLabels[i]}</span></div>`).join('')}</div></section>
        <section class="card"><h3>${ic('users')}Team board<button class="link" data-act="settings-go" data-v="breaks">Break policy</button></h3>
          ${USERS.map((u) => `<div class="team-row">${av(u, 'sm', null, u.status)}<div><b>${esc(u.name)}</b><small>${u.role === 'admin' ? 'Admin' : 'Agent'} · ${STATUS[u.status].label}${u.status === 'break' ? ` · ${BREAK_POLICY[u.breakType].label}` : ''}</small></div>
            ${u.status === 'break'
              ? `<span class="countdown" style="font-size:16px" data-countdown="${u.id}">${fmtMs(u.breakEnd - Date.now())}</span><button class="chip pick" data-act="end-break" data-id="${u.id}">End</button>`
              : `<span class="chip" style="--s:${STATUS[u.status].color}">${STATUS[u.status].label}</span>`}</div>`).join('')}
        </section>
        <section class="card"><h3>${ic('shield')}SLA risk <span class="chip urgent">${sla.length}</span></h3>
          ${sla.slice(0, 3).map((c) => `<div class="team-row" data-act="conv" data-id="${c.id}" style="cursor:pointer">${av(contactOf(c), 'sm', c.channel)}<div><b>${esc(contactOf(c).name)}</b><small>${esc(preview(lastMsg(c))).slice(0, 44)}</small></div><span class="chip ${c.priority === 'urgent' ? 'urgent' : 'hot'}">${c.priority}</span></div>`).join('') || '<p class="muted" style="margin:0">No SLA risks right now.</p>'}
        </section>
        <section class="card"><h3>${ic('megaphone')}Latest campaign<button class="link" data-act="tab" data-tab="campaigns">All campaigns</button></h3>
          ${lastSent ? `<p style="margin:0 0 4px;font-weight:600">${esc(lastSent.name)}</p><p class="muted" style="margin:0;font-size:13px">${lastSent.stats.read.toLocaleString()} read of ${lastSent.stats.delivered.toLocaleString()} delivered · ${readRate}% read rate</p>` : '<p class="muted" style="margin:0">No campaigns sent yet.</p>'}
        </section>
      </div>`;
  }

  /* ───────────────────────── view: inbox ───────────────────────── */
  function renderInbox() {
    const seg = [['chats', 'Chats'], ['ai', 'AI'], ['tickets', 'Tickets']];
    const selectBtn = state.inboxSeg === 'chats'
      ? `<button class="icon-btn ${state.selecting ? 'on' : ''}" data-act="select-mode" aria-label="${state.selecting ? 'Exit selection' : 'Select chats'}" title="Select">${ic('select')}</button>`
      : '';
    const body = state.inboxSeg === 'tickets' ? renderTicketList() : state.inboxSeg === 'ai' ? renderAiList() : renderChatList();
    const unread = CONVS.filter((c) => c.status === 'open' && c.unread).length;
    return `${topbar('Inbox', `${unread} unread · ${CONVS.filter((c) => c.mode === 'bot' && c.status === 'open').length} with AI`, selectBtn)}
      <div class="content">
        <div class="seg" role="tablist" aria-label="Inbox sections" style="margin-bottom:6px">${seg.map(([k, l]) => `<button class="${state.inboxSeg === k ? 'on' : ''}" data-act="inbox-seg" data-seg="${k}" role="tab" aria-selected="${state.inboxSeg === k}">${l}${k === 'ai' && CONVS.some((c) => c.pendingDraft) ? ` <b style="color:var(--purple)">·${CONVS.filter((c) => c.pendingDraft).length}</b>` : ''}</button>`).join('')}</div>
        ${body}
      </div>`;
  }

  function channelRow() {
    const chips = [['all', 'All', null]].concat(Object.keys(CHANNELS).map((k) => [k, CHANNELS[k].label, k]));
    return `<div class="row-scroll" role="group" aria-label="Channel">${chips.map(([k, l, ch]) => `<button class="pill ${state.channel === k ? 'on' : ''}" data-act="channel" data-ch="${k}" aria-pressed="${state.channel === k}">${ch ? `<span class="ch-mini" style="--c:${CHANNELS[ch].color}">${ic(CHANNELS[ch].icon)}</span>` : ''}${l}</button>`).join('')}</div>`;
  }

  function renderChatList() {
    const filters = [['open', 'Open'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['snoozed', 'Snoozed'], ['closed', 'Closed']];
    const counts = {};
    filters.forEach(([f]) => { counts[f] = CONVS.filter((c) => matchesFilter(c, f)).length; });
    const list = visibleConvs();
    return `<div class="searchbar">${ic('search')}<input data-key="q" data-model="q" data-live type="search" placeholder="Search chats or messages" value="${esc(state.q)}" aria-label="Search chats"></div>
      ${channelRow()}
      <div class="row-scroll" role="group" aria-label="Filter chats">${filters.map(([k, l]) => `<button class="pill ${state.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}" aria-pressed="${state.filter === k}">${l} <b>${counts[k]}</b></button>`).join('')}</div>
      <div class="list" style="margin-top:6px">${list.length ? list.map(convCard).join('') : emptyState('inbox', 'Nothing here', 'Try another filter, channel or search term.')}</div>`;
  }

  function renderAiList() {
    const review = CONVS.filter((c) => c.pendingDraft);
    const bots = CONVS.filter((c) => c.mode === 'bot' && c.status !== 'closed');
    return `<section style="margin-top:8px"><p class="label" style="margin-top:4px">Waiting for review · ${review.length}</p>
        ${review.length ? review.map(reviewCard).join('') : emptyState('check', 'All caught up', 'No AI drafts are waiting for review.')}</section>
      <p class="label">Live bot chats · ${bots.length}</p>
      <div class="list">${bots.map(convCard).join('') || emptyState('spark', 'No bot chats', 'Every chat is with a human right now.')}</div>
      <p class="note" style="margin-top:12px">${ic('shield')}Rules for the AI assistant live in Settings → AI assistant.</p>`;
  }

  function renderTicketList() {
    const filters = [['all', 'All'], ['Open', 'Open'], ['InProgress', 'In progress'], ['Resolved', 'Resolved'], ['Closed', 'Closed']];
    const list = TICKETS.filter((t) => state.tfilter === 'all' || t.status === state.tfilter);
    return `<div class="row-scroll" role="group" aria-label="Ticket status" style="margin-top:8px">${filters.map(([k, l]) => `<button class="pill ${state.tfilter === k ? 'on' : ''}" data-act="tfilter" data-s="${k}" aria-pressed="${state.tfilter === k}">${l}</button>`).join('')}</div>
      <div class="list" style="margin-top:6px">${list.length ? list.map(ticketCard).join('') : emptyState('ticket', 'No tickets here', 'Create one from a chat or with the button below.')}</div>
      <button class="fab" data-act="new-ticket">${ic('plus')}New ticket</button>`;
  }

  const statusChip = (s) => {
    const map = { Open: ['chip hot', 'Open'], InProgress: ['chip blue', 'In progress'], Resolved: ['chip ok', 'Resolved'], Closed: ['chip', 'Closed'] };
    const [cls, label] = map[s] || ['chip', s];
    return `<span class="${cls}">${label}</span>`;
  };
  const priorityChip = (p) => (p === 'urgent' ? '<span class="chip urgent">Urgent</span>' : p === 'high' ? '<span class="chip hot">High</span>' : '');

  function ticketCard(t) {
    const ct = contactById(t.contact);
    const a = userById(t.assignee);
    return `<button class="row-btn" data-act="open-ticket" data-id="${t.id}" style="display:block">
      <div class="tk-top" style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-3);font-weight:600;margin-bottom:6px"><span>${t.id}</span><span>${new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
      <b style="margin-bottom:8px">${esc(t.subject)}</b>
      <div class="tags">${statusChip(t.status)}${priorityChip(t.priority)}<span class="chip">${esc(ct ? ct.name : '—')}</span><span class="chip">${a ? ic('user') + esc(firstName(a)) : 'Unassigned'}</span></div>
    </button>`;
  }

  function convCard(c) {
    const ct = contactOf(c);
    const last = lastMsg(c);
    const sel = state.selected.includes(c.id);
    const tags = [];
    if (c.priority === 'urgent') tags.push('<span class="chip urgent">Urgent</span>');
    else if (c.priority === 'high') tags.push('<span class="chip hot">High</span>');
    if (c.pendingDraft) tags.push(`<span class="chip ai">${ic('spark')}Review</span>`);
    else if (c.mode === 'bot' && c.status === 'open') tags.push(`<span class="chip ai">${ic('spark')}AI</span>`);
    if (c.status === 'snoozed') tags.push(`<span class="chip">${ic('clock')}${clock(c.snoozeUntil)}</span>`);
    const a = userById(c.assignee);
    const tick = last.from === 'agent' ? `<span class="check-ticks" style="color:var(--blue);display:inline-flex">${ic('checks')}</span>` : '';
    return `<article class="conv ${c.unread ? 'unread' : ''} ${sel ? 'sel' : ''}" data-act="conv" data-id="${c.id}" tabindex="0" aria-label="${esc(ct.name)} via ${CHANNELS[c.channel].label}, ${c.unread} unread">
      ${state.selecting ? `<span class="check ${sel ? 'on' : ''}" aria-hidden="true">${sel ? ic('check') : ''}</span>` : ''}
      ${av(ct, '', c.channel)}
      <div class="conv-body">
        <div class="row1"><b>${esc(ct.name)}</b><time>${rel(last.time)}</time></div>
        <p class="prev">${tick}<span style="overflow:hidden;text-overflow:ellipsis">${esc(preview(last))}</span></p>
        <div class="tags">${tags.join('')}${a ? `<span class="chip">${esc(firstName(a))}</span>` : ''}</div>
      </div>
      <div class="conv-end">${c.unread ? `<span class="badge" aria-hidden="true">${c.unread}</span>` : ''}</div>
    </article>`;
  }

  function reviewCard(c) {
    const ct = contactOf(c);
    const d = c.pendingDraft;
    return `<article class="rev">
      <div class="rev-head">${av(ct, 'sm', c.channel)}<div><b>${esc(ct.name)}</b><span>${VERTICALS[ct.vertical]} · ${CHANNELS[c.channel].label} · waiting ${rel(lastMsg(c).time)}</span></div><span class="chip ai">${Math.round(d.confidence * 100)}% sure</span></div>
      <p class="why">${ic('shield')}<span>${esc(d.reason)}</span></p>
      <div class="draft">${esc(d.text)}</div>
      <div class="row-actions">
        <button class="btn ghost sm" data-act="rev-reject" data-id="${c.id}">Reject</button>
        <button class="btn ghost sm" data-act="rev-edit" data-id="${c.id}">Edit</button>
        <button class="btn purple sm" data-act="rev-approve" data-id="${c.id}">${ic('check')}Approve &amp; send</button>
      </div>
      <button class="link" data-act="conv" data-id="${c.id}">Open conversation →</button>
    </article>`;
  }

  function renderBulk() {
    const n = state.selected.length;
    return `<div class="bulkbar" role="toolbar" aria-label="Bulk actions">
      <span class="count">${n} selected</span>
      <button data-act="bulk" data-do="reply" ${n ? '' : 'disabled'}>${ic('reply')}Reply</button>
      <button data-act="bulk" data-do="assign" ${n ? '' : 'disabled'}>${ic('userPlus')}Assign</button>
      <button data-act="bulk" data-do="snooze" ${n ? '' : 'disabled'}>${ic('clock')}Snooze</button>
      <button data-act="bulk" data-do="close" ${n ? '' : 'disabled'}>${ic('check')}Close</button>
      <button class="x" data-act="select-exit" aria-label="Cancel selection">${ic('x')}</button>
    </div>`;
  }

  /* ───────────────────────── view: contacts ───────────────────────── */
  function renderContacts() {
    const q = state.cq.trim().toLowerCase();
    const list = CONTACTS
      .filter((c) => !q || (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
    let rows = '';
    let letter = '';
    for (const c of list) {
      const L = c.name[0].toUpperCase();
      if (L !== letter) { letter = L; rows += `<p class="group-label">${L}</p>`; }
      const chans = CONVS.filter((x) => x.contact === c.id).map((x) => x.channel);
      rows += `<button class="row-btn" data-act="info" data-id="${c.id}">${av(c)}<span><b>${esc(c.name)}</b><small>${VERTICALS[c.vertical]}${c.city ? ' · ' + esc(c.city) : ''}</small></span>${[...new Set(chans)].map((k) => `<span class="ch-mini" style="--c:${CHANNELS[k].color};width:18px;height:18px;border-radius:50%;display:inline-grid;place-items:center;color:#fff">${ic(CHANNELS[k].icon)}</span>`).join('')}${ic('chevron')}</button>`;
    }
    const bfsi = CONTACTS.filter((c) => c.vertical === 'bfsi').length;
    return `${topbar('Contacts', `${CONTACTS.length} people · ${bfsi} BFSI`)}
      <div class="content">
        <div class="searchbar">${ic('search')}<input data-key="cq" data-model="cq" data-live type="search" placeholder="Search name, email or phone" value="${esc(state.cq)}" aria-label="Search contacts"></div>
        <div class="list">${rows || emptyState('users', 'No matches', 'Try a different name.')}</div>
      </div>
      <button class="fab" data-act="new-contact">${ic('userPlus')}New contact</button>`;
  }

  /* ───────────────────────── view: campaigns ───────────────────────── */
  function renderCampaigns() {
    const sent = CAMPAIGNS.filter((c) => c.status === 'Sent');
    const reach = sent.reduce((s, c) => s + c.stats.delivered, 0);
    const read = sent.reduce((s, c) => s + c.stats.read, 0);
    const delivered = sent.reduce((s, c) => s + c.stats.delivered, 0) || 1;
    const clicked = sent.reduce((s, c) => s + c.stats.clicked, 0);
    const scheduled = CAMPAIGNS.filter((c) => c.status === 'Scheduled').length;
    const filters = [['all', 'All'], ['Draft', 'Drafts'], ['Scheduled', 'Scheduled'], ['Sent', 'Sent']];
    const list = CAMPAIGNS.filter((c) => state.campFilter === 'all' || c.status === state.campFilter);
    const statusCls = { Sent: 'ok', Scheduled: 'blue', Draft: '' };
    return `${topbar('Campaigns', `${sent.length} sent · ${scheduled} scheduled`)}
      <div class="content">
        <div class="kpi-strip">
          <div><span>Delivered</span><b>${reach.toLocaleString()}</b></div>
          <div><span>Read rate</span><b>${Math.round((read / delivered) * 100)}%</b></div>
          <div><span>Click rate</span><b>${Math.round((clicked / delivered) * 100)}%</b></div>
        </div>
        ${admin() ? '' : `<p class="locknote">${ic('lock')}Agents can view campaigns. Only admins can create or send them.</p>`}
        <div class="row-scroll" role="group" aria-label="Campaign status" style="margin-top:8px">${filters.map(([k, l]) => `<button class="pill ${state.campFilter === k ? 'on' : ''}" data-act="campfilter" data-s="${k}" aria-pressed="${state.campFilter === k}">${l}</button>`).join('')}</div>
        <div class="list" style="margin-top:6px">${list.length ? list.map((c) => {
          const ch = CHANNELS[c.channel];
          const pct = c.stats ? Math.round((c.stats.read / c.stats.delivered) * 100) : 0;
          return `<button class="camp" data-act="campaign" data-id="${c.id}">
            <div class="camp-top"><span class="av-wrap"><span class="av sm" style="--h:${(ch.color.charCodeAt(1) * 3) % 360}">${ic(ch.icon)}</span></span><div><b>${esc(c.name)}</b><small>${ch.label} · ${esc(c.audience.label)} · ${c.audience.count.toLocaleString()} ${c.audience.count === 1 ? 'person' : 'people'}</small></div><span class="chip ${statusCls[c.status]}">${c.status}</span></div>
            ${c.stats ? `<div class="meter"><i style="width:${pct}%"></i></div><div class="meter-line meta-line"><span>${pct}% read</span><span>${c.stats.delivered.toLocaleString()} delivered</span></div>`
              : `<div class="meta-line"><span>${c.when ? (c.status === 'Scheduled' ? 'Sends ' + clockFull(c.when) : '') : 'Not scheduled'}</span><span>${c.status === 'Draft' ? 'Draft' : ''}</span></div>`}
          </button>`;
        }).join('') : emptyState('megaphone', 'No campaigns', 'Nothing matches this filter.')}</div>
      </div>
      ${admin() ? '<button class="fab" data-act="new-campaign">' + ic('plus') + 'New campaign</button>' : ''}`;
  }

  function campaignBody(c) {
    const ch = CHANNELS[c.channel];
    const s = c.stats;
    const pct = (n) => (s ? Math.round((n / s.sent) * 100) : 0);
    const funnel = s
      ? `<div class="funnel">${[['Sent', s.sent], ['Delivered', s.delivered], ['Read', s.read], ['Clicked', s.clicked]].map(([l, n]) => `<div><span>${l}</span><span class="track"><i style="width:${pct(n)}%"></i></span><b>${n.toLocaleString()}</b></div>`).join('')}</div>`
      : '<p class="note">Stats appear after the campaign is sent.</p>';
    const actions = c.status === 'Sent' ? '' : admin()
      ? `<div class="row-actions" style="justify-content:stretch">${c.status === 'Draft' ? `<button class="btn ghost" data-act="campaign-send" data-id="${c.id}" data-when="later" style="flex:1">Schedule</button>` : ''}<button class="btn primary" data-act="campaign-send" data-id="${c.id}" data-when="now" style="flex:1">${ic('send')}Send now</button></div>`
      : `<p class="locknote">${ic('lock')}Only admins can send campaigns.</p>`;
    return `<div class="sheet-body">
      <section class="sec"><div class="camp-top"><span class="av-wrap"><span class="av" style="--h:200">${ic(ch.icon)}</span></span><div><b style="font:600 16px var(--font-ui)">${esc(c.name)}</b><small class="muted">${ch.label} · ${esc(c.audience.label)} · ${c.audience.count.toLocaleString()} ${c.audience.count === 1 ? 'person' : 'people'}</small></div></div></section>
      <section class="sec"><h4>Results</h4>${funnel}</section>
      <section class="sec"><h4>Message preview</h4><div class="bubble" style="max-width:100%;background:#FCE6D7">${sanitize(c.html.replace(/\{\{name\}\}/g, 'Amara'))}</div></section>
      ${actions}
    </div>`;
  }

  /* ───────────────────────── view: settings ───────────────────────── */
  const SETTINGS_TITLES = { breaks: 'Breaks & availability', notifications: 'Notifications', canned: 'Canned replies', channels: 'Channels', team: 'Team & roles', ai: 'AI assistant', appearance: 'Appearance', shortcuts: 'Shortcuts & help' };

  function renderSettings() {
    const u = me();
    if (state.settingsView) return settingsSub(state.settingsView);
    const row = (v, icon, title, sub, lock = false) => `<button class="setrow ${lock ? 'locked' : ''}" data-act="settings-go" data-v="${v}">${ic(icon)}<span><b>${title}</b><small>${sub}</small></span>${lock ? ic('lock') : ic('chevron')}</button>`;
    return `${topbar('Settings', `${esc(u.name)} · ${u.role === 'admin' ? 'Admin' : 'Agent'}`)}
      <div class="content">
        <section class="card" style="display:flex;align-items:center;gap:12px">${av(u, 'lg', null, u.status).replace('av lg', 'av lg')}<div style="flex:1"><b style="font:600 17px var(--font-ui)">${esc(u.name)}</b><div class="muted" style="font-size:13px">${u.role === 'admin' ? 'Administrator' : 'Support agent'} · ${STATUS[u.status].label}</div></div></section>
        <p class="label">My work</p>
        <div class="group">
          ${row('breaks', 'coffee', 'Breaks & availability', `${STATUS[u.status].label}${u.status === 'break' ? ' · ' + fmtMs(u.breakEnd - Date.now()) + ' left' : ''}`)}
          ${row('notifications', 'bell', 'Notifications', 'Alerts, sounds and quiet hours')}
          ${row('canned', 'hash', 'Canned replies', `${CANNED.filter((r) => r.scope === 'global' || r.owner === u.id).length} shortcuts · type # in a chat`)}
        </div>
        <p class="label">Workspace</p>
        <div class="group">
          ${row('channels', 'globe', 'Channels', `${Object.values(CHANNEL_ON).filter(Boolean).length} connected`, !admin())}
          ${row('team', 'users', 'Team & roles', admin() ? `${USERS.length} people` : 'Admins only', !admin())}
          ${row('ai', 'spark', 'AI assistant', admin() ? 'Edit bot rules' : 'View bot rules', false)}
          ${row('appearance', 'sun', 'Appearance', state.theme === 'dark' ? 'Dark' : 'Light')}
          ${row('shortcuts', 'hash', 'Shortcuts & help', 'Keyboard, # and formatting')}
        </div>
        <button class="btn ghost block" data-act="signout">${ic('logout')}Sign out (demo)</button>
        <p class="note" style="justify-content:center;margin-top:12px">Prototype · notifications are simulated</p>
      </div>`;
  }

  function settingsSub(v) {
    const back = `<button class="icon-btn plain" data-act="settings-back" aria-label="Back to settings">${ic('back')}</button>`;
    return `${topbar(SETTINGS_TITLES[v], '', back)}<div class="content">${subBody(v)}</div>`;
  }

  function switchRow(key, title, sub, on, locked = false, action = 'toggle-notif') {
    return `<div class="rule"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div><button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${!!on}" aria-label="${esc(title)}" aria-disabled="${locked}" data-act="${action}" data-k="${key}"></button></div>`;
  }

  function subBody(v) {
    const u = me();
    switch (v) {
      case 'breaks': {
        const pol = BREAK_POLICY;
        const policyRows = Object.entries(pol).map(([k, p]) => `<div class="rule"><div><b>${p.label}</b><small>Length and daily allowance</small></div>
          <select class="select" data-act="policy" data-k="${k}" data-f="mins" ${admin() ? '' : 'disabled'} aria-label="${p.label} length">${[5, 10, 15, 20, 30, 45, 60].map((n) => `<option value="${n}" ${p.mins === n ? 'selected' : ''}>${n} min</option>`).join('')}</select>
          <select class="select" data-act="policy" data-k="${k}" data-f="max" ${admin() ? '' : 'disabled'} aria-label="${p.label} per day">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${p.max === n ? 'selected' : ''}>${n}/day</option>`).join('')}</select></div>`).join('');
        return `<section class="card"><h3>${ic('coffee')}My status</h3>
            ${u.status === 'break'
              ? `<div class="greet-status" style="margin-bottom:8px"><i style="--s:${STATUS.break.color}"></i>On break · <span data-countdown="${u.id}">${fmtMs(u.breakEnd - Date.now())}</span></div><button class="btn purple block" data-act="end-break" data-id="${u.id}">${ic('check')}End break now</button>`
              : `${statusSeg()}<button class="btn ghost block" style="margin-top:10px" data-act="break-sheet">${ic('coffee')}Take a break</button>`}
          </section>
          <section class="card"><h3>${ic('clock')}My allowance today</h3>
            ${Object.entries(pol).map(([k, p]) => { const left = Math.max(0, p.max - u.used[k]); return `<div class="break-row"><div><b>${p.label}</b><small>${p.mins} min · ${left} of ${p.max} left</small></div><span class="chip ${left ? 'blue' : ''}">${left ? 'Available' : 'Used up'}</span></div>`; }).join('')}
          </section>
          <div class="group" style="margin-top:0">
            ${switchRow('dndBreak', 'Pause notifications on break', 'Chats still arrive; you will not be pinged.', state.dndBreak, false, 'dnd')}
            <div class="rule"><div><b>Auto-away when idle</b><small>Set your status to Away after this long</small></div>
              <select class="select" data-act="autoaway" aria-label="Auto-away">${[0, 5, 10, 15, 30].map((n) => `<option value="${n}" ${state.autoAway === n ? 'selected' : ''}>${n ? n + ' min' : 'Off'}</option>`).join('')}</select></div>
            <div class="rule"><div><b>Status after a break</b><small>Where you return to</small></div>
              <select class="select" data-act="returnstatus" aria-label="Status after break">${['available', 'busy'].map((k) => `<option value="${k}" ${state.returnStatus === k ? 'selected' : ''}>${STATUS[k].label}</option>`).join('')}</select></div>
          </div>
          <section class="card"><h3>${ic('shield')}Team break policy${admin() ? '' : ' · read only'}</h3>
            ${admin() ? '' : `<p class="locknote" style="margin-top:0">${ic('lock')}Only admins can change the team policy.</p>`}
            <div class="group" style="margin:0;box-shadow:none;background:var(--surface-2)">${policyRows}</div>
          </section>
          ${admin() ? `<section class="card"><h3>${ic('users')}On break now</h3>${USERS.filter((x) => x.status === 'break').map((x) => `<div class="team-row">${av(x, 'sm', null, 'break')}<div><b>${esc(x.name)}</b><small>${BREAK_POLICY[x.breakType].label}</small></div><span class="countdown" style="font-size:16px" data-countdown="${x.id}">${fmtMs(x.breakEnd - Date.now())}</span><button class="chip pick" data-act="end-break" data-id="${x.id}">End</button></div>`).join('') || '<p class="muted" style="margin:0">Nobody is on break.</p>'}</section>` : ''}`;
      }
      case 'notifications': {
        const n = state.notif;
        return `<p class="label" style="margin-top:4px">Notify me when</p>
          <div class="group" style="margin:0">
            ${switchRow('assigned', 'A chat is assigned to me', '', n.assigned)}
            ${switchRow('reply', 'A customer replies', 'In chats I am handling', n.reply)}
            ${switchRow('mention', 'I am mentioned in a note', '', n.mention)}
            ${switchRow('slaRisk', 'SLA is at risk', 'Urgent or high chats near their deadline', n.slaRisk)}
            ${switchRow('aiReview', 'AI draft needs review', '', n.aiReview)}
            ${switchRow('ticket', 'Ticket assigned to me', '', n.ticket)}
            ${switchRow('campaign', 'Campaign sent or failed', admin() ? '' : 'Admins receive these', n.campaign, !admin())}
          </div>
          <p class="label">How to alert me</p>
          <div class="group" style="margin:0">
            ${switchRow('push', 'Push notifications', 'On this device', state.delivery.push, false, 'toggle-delivery')}
            ${switchRow('email', 'Email digest', 'Daily summary at 8:00', state.delivery.email, false, 'toggle-delivery')}
            ${switchRow('sound', 'Sound', 'Short chime for new chats', state.delivery.sound, false, 'toggle-delivery')}
          </div>
          <p class="label">Quiet hours</p>
          <div class="group" style="margin:0">${switchRow('quiet', 'Quiet hours 20:00 to 08:00', 'Only SLA risk and urgent chats break through', state.quiet, false, 'toggle-quiet')}</div>
          <p class="note">${ic('shield')}Prototype: alerts are simulated. These settings are saved in this session.</p>`;
      }
      case 'canned': {
        const mine = CANNED.filter((r) => r.scope === 'global' || r.owner === u.id);
        return `<p class="muted" style="font-size:13px;margin:4px 2px 10px">Type <b>#</b> followed by a shortcut in any chat to insert a reply. <b>{{name}}</b> and <b>{{agent}}</b> fill in automatically.</p>
          <div class="list">${mine.map((r) => `<button class="row-btn" data-act="canned-edit" data-id="${r.id}"><span><b><span style="color:var(--blue)">#${esc(r.shortcut)}</span> · ${esc(r.title)}</b><small>${esc(r.text).slice(0, 70)}</small></span>${r.scope === 'global' ? `<span class="chip">Shared</span>` : ''}${ic('chevron')}</button>`).join('')}</div>
          <button class="btn primary block" style="margin-top:12px" data-act="canned-new">${ic('plus')}New canned reply</button>
          ${admin() ? '' : `<p class="note">${ic('lock')}Shared replies are managed by admins. Your own replies are private to you.</p>`}`;
      }
      case 'channels': {
        return `<p class="muted" style="font-size:13px;margin:4px 2px 10px">Every conversation shows its channel as a badge on the customer’s avatar.</p>
          <div class="group" style="margin:0">${Object.keys(CHANNELS).map((k) => `<div class="rule"><span class="av-wrap" style="width:32px;height:32px"><span class="av sm" style="--h:0;background:${CHANNELS[k].color};width:32px;height:32px">${ic(CHANNELS[k].icon)}</span></span><div><b>${CHANNELS[k].label}</b><small>${CHANNEL_ON[k] ? 'Connected' : 'Not connected'}</small></div><button class="switch ${CHANNEL_ON[k] ? 'on' : ''}" role="switch" aria-checked="${!!CHANNEL_ON[k]}" aria-label="${CHANNELS[k].label}" aria-disabled="${!admin()}" data-act="channel-toggle" data-k="${k}"></button></div>`).join('')}</div>
          ${admin() ? '' : `<p class="note">${ic('lock')}Only admins can connect or disconnect channels.</p>`}`;
      }
      case 'team': {
        return `<div class="group" style="margin:0">${USERS.map((x) => `<div class="team-row" style="padding:12px 0">${av(x, 'sm', null, x.status)}<div><b>${esc(x.name)}${x.id === state.me ? ' (you)' : ''}</b><small>${STATUS[x.status].label}</small></div>
            <select class="select" data-act="role-set" data-id="${x.id}" ${admin() && x.id !== state.me ? '' : 'disabled'} aria-label="Role for ${esc(x.name)}"><option value="admin" ${x.role === 'admin' ? 'selected' : ''}>Admin</option><option value="agent" ${x.role === 'agent' ? 'selected' : ''}>Agent</option></select></div>`).join('')}</div>
          ${admin() ? `<button class="btn ghost block" style="margin-top:12px" data-act="invite">${ic('userPlus')}Invite a teammate</button>` : `<p class="note">${ic('lock')}Only admins can change roles or invite people.</p>`}`;
      }
      case 'ai': {
        const note = admin() ? `<p class="locknote" style="margin-top:0">${ic('shield')}Admin. Changes apply to all channels immediately.</p>` : `<p class="locknote" style="margin-top:0">${ic('lock')}Only admins can change AI rules. You can see the current settings.</p>`;
        return `<div class="group" style="margin:0"><div style="padding-top:12px">${note}</div>${Object.keys(RULE_TEXT).map((k) => switchRow(k, RULE_TEXT[k][0], RULE_TEXT[k][1], RULES[k], !admin(), 'rule')).join('')}</div>`;
      }
      case 'appearance':
        return `<div class="group" style="margin:0;padding:14px"><div class="seg">${['light', 'dark'].map((t) => `<button class="${state.theme === t ? 'on' : ''}" data-act="theme" data-t="${t}" aria-pressed="${state.theme === t}">${ic(t === 'light' ? 'sun' : 'moon')} ${t === 'light' ? 'Light' : 'Dark'}</button>`).join('')}</div></div>
          <p class="note">Light uses white and blue-grey surfaces. Dark uses deep blue-grey surfaces. Your choice is remembered on this device.</p>`;
      case 'shortcuts':
        return `<section class="sec"><h4>In the composer</h4>
            <dl class="kv"><dt>#shortcut</dt><dd>Insert a canned reply</dd><dt>Bold / italic</dt><dd>Select text, then the toolbar or Ctrl/⌘ + B / I</dd><dt>Send</dt><dd>Enter (Shift + Enter for a new line)</dd><dt>Attach</dt><dd>Paperclip</dd></dl></section>
          <section class="sec" style="margin-top:12px"><h4>In the inbox</h4>
            <dl class="kv"><dt>Select chats</dt><dd>Checkbox icon, or long-press a chat</dd><dt>Filter by channel</dt><dd>Tap a channel chip</dd><dt>Take a break</dt><dd>Home → Breaks</dd></dl></section>`;
      default:
        return '';
    }
  }

  /* ───────────────────────── view: conversation (Telegram-style) ───────────────────────── */
  function renderConv(c) {
    const ct = contactOf(c);
    const a = userById(c.assignee);
    const ch = CHANNELS[c.channel];
    const sub = c.mode === 'bot' ? `AI assistant · ${ch.label}` : `${ch.label}${a ? ' · ' + firstName(a) : ' · unassigned'}`;
    const bar = c.status === 'closed'
      ? `<div class="bar closed">${ic('check')}<span>Closed</span><button class="btn ghost sm" data-act="reopen">Reopen</button></div>`
      : c.status === 'snoozed'
        ? `<div class="bar snooze">${ic('clock')}<span>Snoozed until ${clockFull(c.snoozeUntil)}</span><button class="btn ghost sm" data-act="unsnooze">Wake now</button></div>`
        : c.mode === 'bot'
          ? `<div class="bar ai">${ic('spark')}<span>AI is handling this chat</span><button class="btn purple sm" data-act="take-over">Take over</button></div>`
          : '';
    const typing = state.typing === c.id ? '<div class="typing" role="status" aria-label="AI is typing"><i></i><i></i><i></i></div>' : '';
    return `<section class="layer" role="dialog" aria-label="Conversation with ${esc(ct.name)}">
      <header class="chat-head">
        <button class="icon-btn plain" data-act="close-conv" aria-label="Back to inbox">${ic('back')}</button>
        <button class="head-id" data-act="info" data-id="${ct.id}">${av(ct, 'sm', c.channel)}<span><b>${esc(ct.name)}</b><small>${esc(sub)}</small></span></button>
        <button class="icon-btn plain accent" data-act="call-start" aria-label="Start voice call">${ic('phone')}</button>
        <button class="icon-btn plain" data-act="menu" aria-label="More actions">${ic('more')}</button>
      </header>
      ${bar}
      <div class="msgs" role="log" aria-live="polite">${renderMessages(c)}${typing}</div>
      ${c.pendingDraft ? reviewStrip(c) : ''}
      ${c.status === 'closed' ? '' : composer(c)}
    </section>`;
  }

  function renderMessages(c) {
    let lastDay = '';
    let prevFrom = null;
    let out = '';
    const today = new Date().toDateString();
    for (const m of c.messages) {
      const day = new Date(m.time).toDateString();
      if (day !== lastDay) {
        lastDay = day;
        out += `<div class="day-chip">${day === today ? 'Today' : new Date(m.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>`;
        prevFrom = null;
      }
      out += renderMsg(m, c, prevFrom === m.from);
      prevFrom = m.from;
    }
    return out;
  }

  function renderMsg(m, c, grouped) {
    if (m.from === 'system') {
      return m.type === 'call'
        ? `<div class="sys">${ic('phone')}Voice call · ${fmtDur(m.dur)}</div>`
        : `<div class="sys">${esc(m.text)}</div>`;
    }
    const cls = m.from === 'agent' ? 'out' : m.from === 'bot' ? 'ai' : 'in';
    const who = m.from === 'agent' ? (userById(m.author)?.name || 'Agent') : m.from === 'bot' ? 'AI assistant' : contactOf(c).name;
    const buttons = m.buttons && m.buttons.length
      ? `<div class="qrs">${m.buttons.map((b) => `<button class="qr" data-act="qr" data-text="${esc(b)}">${esc(b)}</button>`).join('')}</div>`
      : '';
    const reviewed = m.reviewed ? `<span class="reviewed">${ic('check')}${esc(m.reviewed)}</span>` : '';
    const tick = m.from === 'agent' ? `<span class="meta">${clock(m.time)} ${ic('checks')}</span>` : `<span class="meta">${clock(m.time)}</span>`;
    const head = grouped ? '' : `<span class="who">${esc(who)}</span>`;
    return `<div class="msg ${cls} ${m.type === 'carousel' ? 'wide' : ''} ${grouped ? 'grouped' : ''}">${head}${body(m, tick)}${reviewed}${buttons}</div>`;
  }

  function body(m, tick) {
    switch (m.type) {
      case 'image':
        return `<div class="bubble media"><figure class="img" style="margin:0"><div class="img-frame" style="--tone:${m.tone || '#E7C9A5'}">${m.src ? `<img src="${m.src}" alt="${esc(m.name)}">` : ic('image')}</div><figcaption>${esc(m.name)}</figcaption></figure>${tick}</div>`;
      case 'file':
        return `<div class="bubble"><div class="file">${ic('file')}<span><b>${esc(m.name)}</b><small>${fmtSize(m.size || 180000)}</small></span></div>${tick}</div>`;
      case 'voice': {
        const bars = Array.from({ length: 24 }, (_, i) => `<i style="height:${30 + ((i * 37 + m.dur * 11) % 65)}%"></i>`).join('');
        return `<div class="bubble"><div class="voice"><button class="play" data-act="play" data-id="${m.id}" aria-label="${m.playing ? 'Pause' : 'Play'} voice message">${ic(m.playing ? 'pause' : 'play')}</button><div class="wave" aria-hidden="true">${bars}</div><small>${fmtDur(m.dur)}</small></div>${tick}</div>`;
      }
      case 'carousel': {
        const intro = m.text ? `<div class="bubble"><p>${esc(m.text)}</p>${tick}</div>` : '';
        const cards = m.items.map((it) => `<article class="car-card" role="listitem">
          <div class="car-img" style="--tone:${it.tone}">${ic('tag')}</div>
          <div class="body"><b>${esc(it.title)}</b><small>${esc(it.sub)}</small>
            <div class="car-meta"><strong>${esc(it.meta)}</strong></div>
            <div class="qrs">${it.actions.map((a) => `<button class="qr" data-act="qr" data-text="${esc(a)}">${esc(a)}</button>`).join('')}</div>
          </div></article>`).join('');
        return `${intro}${RULES.carousel ? `<div class="carousel" role="list">${cards}</div>` : `<div class="bubble"><p>Product cards are turned off in AI rules.</p></div>`}`;
      }
      default:
        return `<div class="bubble">${m.html != null || m.from === 'agent' ? `<div>${richOf(m)}</div>` : `<p>${esc(m.text)}</p>`}${tick}</div>`;
    }
  }

  function reviewStrip(c) {
    const d = c.pendingDraft;
    return `<div class="rstrip" role="region" aria-label="AI draft awaiting review">
      <div class="rs-head">${ic('spark')}<span>Held for human review</span><span class="chip ai">${Math.round(d.confidence * 100)}% sure</span></div>
      <p class="why">${ic('shield')}<span>${esc(d.reason)}</span></p>
      <div class="draft">${esc(d.text)}</div>
      <div class="row-actions">
        <button class="btn ghost sm" data-act="rev-reject">Reject</button>
        <button class="btn ghost sm" data-act="rev-edit">Edit</button>
        <button class="btn purple sm" data-act="rev-approve">${ic('check')}Approve &amp; send</button>
      </div>
    </div>`;
  }

  const fmtBar = (dataKey = '') => `<div class="fmt-bar" role="toolbar" aria-label="Formatting">
      ${[['bold', 'bold', 'Bold'], ['italic', 'italic', 'Italic'], ['underline', 'underline', 'Underline'], ['strikeThrough', 'strike', 'Strikethrough'], ['code', 'code', 'Code'], ['link', 'link', 'Link'], ['insertUnorderedList', 'list', 'Bulleted list']]
        .map(([cmd, icon, label]) => `<button data-act="fmt" data-cmd="${cmd}" data-key="${dataKey}" aria-label="${label}" title="${label}">${ic(icon)}</button>`).join('')}
    </div>`;

  function cannedPicker() {
    if (state.cannedQ == null) return '';
    const items = cannedMatches();
    if (!items.length) return `<div class="canned"><div class="canned-head">No canned reply for #${esc(state.cannedQ)}</div></div>`;
    return `<div class="canned" role="listbox" aria-label="Canned replies"><div class="canned-head">Canned replies</div>${items.map((r, i) => `<button role="option" aria-selected="${i === state.cannedIdx}" class="${i === state.cannedIdx ? 'on' : ''}" data-act="canned-pick" data-id="${r.id}">
      <b>#${esc(r.shortcut)}</b><span style="min-width:0;flex:1"><span style="font-weight:600;font-size:13px">${esc(r.title)}</span><small>${esc(fillVars(r.text, current()))}</small></span></button>`).join('')}</div>`;
  }

  function composer(c) {
    if (state.rec) {
      const bars = Array.from({ length: 18 }, (_, i) => `<i style="height:${20 + ((i * 53) % 70)}%"></i>`).join('');
      return `<footer class="composer"><div class="rec">
        <span class="dot" aria-hidden="true"></span>
        <time id="rec-time">${fmtDur(Math.floor((Date.now() - state.rec.start) / 1000))}</time>
        <div class="wave" aria-hidden="true">${bars}</div>
        <button class="btn ghost sm" data-act="rec-cancel">Cancel</button>
        <button class="btn primary sm" data-act="rec-send">${ic('send')}Send</button>
      </div></footer>`;
    }
    const first = firstName(contactOf(c));
    const top = c.mode === 'human'
      ? `<div class="ai-row">${state.aiHint ? `<span class="ai-hint">${ic('spark')}AI draft · review before sending</span>` : ''}<button class="chip-btn" data-act="ai-draft">${ic('spark')}Draft with AI</button></div>`
      : `<div class="ai-row"><span class="ai-hint">${ic('spark')}Testing as the visitor · take over to reply as an agent</span></div>`;
    const plainText = (state.draftHtml || '').replace(/<[^>]+>/g, '').trim();
    return `<footer class="composer ${plainText ? 'has-text' : ''}">${top}
      ${state.fmtOpen ? `<div class="fmt-row">${fmtBar('draft')}</div>` : ''}
      <div id="canned-slot">${cannedPicker()}</div>
      <div class="comp-row">
        <button class="icon-btn plain" data-act="fmt-toggle" aria-label="Formatting" aria-pressed="${state.fmtOpen}">${ic('aa')}</button>
        <div class="editor-wrap"><div class="editor" contenteditable="true" role="textbox" aria-multiline="true" data-editor="draft" data-placeholder="${c.mode === 'bot' ? 'Message as visitor' : `Message ${esc(first)}`}" aria-label="Message">${state.draftHtml}</div></div>
        <button class="icon-btn plain" data-act="attach" aria-label="Attach photo or file">${ic('clip')}</button>
        <button class="icon-btn mic" data-act="rec-start" aria-label="Record voice message">${ic('mic')}</button>
        <button class="icon-btn send" data-act="send" aria-label="Send">${ic('send')}</button>
      </div></footer>`;
  }

  function renderCall() {
    const c = convById(state.call.convId);
    const ct = contactOf(c);
    const elapsed = Math.floor((Date.now() - state.call.start) / 1000);
    return `<section class="call" role="dialog" aria-label="Voice call with ${esc(ct.name)}">
      <p class="eyebrow">Voice call · ${esc(CHANNELS[c.channel].label)}</p>
      ${av(ct, 'lg', c.channel)}
      <h2>${esc(ct.name)}</h2>
      <p class="timer" id="call-time">${fmtDur(elapsed)}</p>
      <div class="ctrls">
        <div><button class="ctrl ${state.call.muted ? 'on' : ''}" data-act="call-mute" aria-pressed="${state.call.muted}" aria-label="Mute">${ic('mic')}</button><span class="ctrl-label">${state.call.muted ? 'Muted' : 'Mute'}</span></div>
        <div><button class="ctrl ${state.call.speaker ? 'on' : ''}" data-act="call-speaker" aria-pressed="${state.call.speaker}" aria-label="Speaker">${ic('volume')}</button><span class="ctrl-label">Speaker</span></div>
        <div><button class="ctrl end" data-act="call-end" aria-label="End call">${ic('phone')}</button><span class="ctrl-label">End</span></div>
      </div>
    </section>`;
  }

  /* ───────────────────────── sheets ───────────────────────── */
  function openSheet(type, id = null) {
    state.sheet = { type, id };
    state.labelIn = '';
    const f = {};
    if (type === 'ticket-new') {
      const c = id ? convById(id) : null;
      f.contact = c ? c.contact : CONTACTS[0].id;
      f.priority = 'normal';
      f.subject = c ? 'Follow-up: ' + ((c.messages.find((m) => m.from === 'customer' && m.type === 'text') || {}).text || 'chat').slice(0, 60) : '';
      f.conv = c ? c.id : null;
    }
    if (type === 'edit-draft') f.text = convById(id).pendingDraft.text;
    if (type === 'bulk-reply') f.text = '';
    if (type === 'canned-edit') {
      const r = id ? cannedById(id) : null;
      f.shortcut = r ? r.shortcut : '';
      f.title = r ? r.title : '';
      f.text = r ? r.text : '';
      f.scope = r ? r.scope : 'mine';
      f.id = r ? r.id : null;
    }
    if (type === 'campaign-new') {
      f.name = ''; f.channel = 'whatsapp'; f.audience = 'all'; f.when = 'now'; f.html = '';
    }
    state.form = f;
  }

  function rowBtn(act, icon, title, sub, data = {}, extra = '') {
    return `<button class="row-btn" data-act="${act}" ${attrs(data)} ${extra}>${ic(icon)}<span><b>${title}</b><small>${sub}</small></span>${ic('chevron')}</button>`;
  }

  function renderSheet() {
    const s = state.sheet;
    const f = state.form;
    let title = '';
    let body = '';
    switch (s.type) {
      case 'menu': {
        const c = convById(s.id);
        const ct = contactOf(c);
        const a = userById(c.assignee);
        title = 'Chat actions';
        body = `<div class="sheet-body">
          ${rowBtn('info', 'user', 'Visitor info', 'Labels, details and tickets', { id: ct.id })}
          ${rowBtn('assign', 'userPlus', 'Assign', 'Currently: ' + (a ? a.name : 'Unassigned'), { id: c.id })}
          ${rowBtn('snooze', 'clock', 'Snooze', 'Hide until later', { id: c.id })}
          ${rowBtn('ticket-from-conv', 'ticket', 'Create ticket', 'Track this chat in Tickets', { id: c.id })}
          ${c.mode === 'bot'
            ? rowBtn('take-over', 'spark', 'Take over from AI', 'You reply as the agent from now on', { id: c.id })
            : rowBtn('hand-to-ai', 'spark', 'Hand back to AI', 'The bot resumes replying to the visitor', { id: c.id })}
          ${c.status === 'closed'
            ? rowBtn('reopen', 'inbox', 'Reopen chat', 'Move back to Open', { id: c.id })
            : rowBtn('close-chat', 'check', 'Close chat', 'Resolve and remove from Open', { id: c.id })}
        </div>`;
        break;
      }
      case 'assign': {
        const c = s.id === 'bulk' ? null : convById(s.id);
        title = s.id === 'bulk' ? `Assign ${state.selected.length} chats` : 'Assign to';
        body = `<div class="sheet-body">
          ${USERS.map((u) => {
            const locked = u.id !== state.me && !can('assignOthers');
            const on = !!c && c.assignee === u.id;
            return `<button class="row-btn ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="assign-to" data-id="${s.id}" data-user="${u.id}" aria-disabled="${locked}">
              ${av(u, 'sm')}<span><b>${esc(u.name)}${u.id === state.me ? ' (you)' : ''}</b><small>${u.role === 'admin' ? 'Admin · all privileges' : 'Agent'}</small></span>
              ${locked ? ic('lock') : on ? ic('check') : ''}</button>`;
          }).join('')}
          <p class="note">${ic('shield')}Agents can take chats for themselves. Admins can reassign anyone.</p>
        </div>`;
        break;
      }
      case 'snooze': {
        title = s.id === 'bulk' ? `Snooze ${state.selected.length} chats` : 'Snooze until';
        const opts = [['1 hour', '60', 'Back in one hour'], ['4 hours', '240', 'Back this afternoon'], ['Tomorrow, 9:00', 'tomorrow', 'Back at the start of your day'], ['Next Monday, 9:00', 'monday', 'Back at the start of next week']];
        body = `<div class="sheet-body">${opts.map(([l, v, sub]) => rowBtn('snooze-to', 'clock', l, sub, { id: s.id, m: v })).join('')}</div>`;
        break;
      }
      case 'break': {
        title = 'Take a break';
        const u = me();
        body = `<div class="sheet-body">
          ${Object.entries(BREAK_POLICY).map(([k, p]) => {
            const left = Math.max(0, p.max - u.used[k]);
            return `<button class="row-btn" data-act="start-break" data-k="${k}" ${left ? '' : 'aria-disabled="true"'}>${ic(k === 'lunch' ? 'coffee' : 'clock')}<span><b>${p.label} · ${p.mins} min</b><small>${left ? `${left} of ${p.max} left today` : 'Used up for today'}</small></span>${left ? ic('chevron') : ic('lock')}</button>`;
          }).join('')}
          <p class="note">${ic('shield')}Chats stay assigned to you during a break. New chats are routed to available teammates.</p>
        </div>`;
        break;
      }
      case 'ticket-new': {
        title = 'New ticket';
        body = `<div class="sheet-body">
          <div class="field"><label for="f-subject">Subject</label><input id="f-subject" data-form="subject" value="${esc(f.subject || '')}" placeholder="What is the issue?"></div>
          <div class="field"><label for="f-contact">Contact</label><select id="f-contact" data-form="contact">${CONTACTS.map((c) => `<option value="${c.id}" ${f.contact === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="f-priority">Priority</label><select id="f-priority" data-form="priority">${[['normal', 'Normal'], ['high', 'High'], ['urgent', 'Urgent']].map(([v, l]) => `<option value="${v}" ${f.priority === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label for="f-desc">Details</label><textarea id="f-desc" data-form="desc" rows="3" placeholder="Context for the next agent">${esc(f.desc || '')}</textarea></div>
          <button class="btn primary block" data-act="submit-ticket">${ic('plus')}Create ticket</button>
        </div>`;
        break;
      }
      case 'contact-new': {
        title = 'New contact';
        body = `<div class="sheet-body">
          <div class="field"><label for="f-name">Full name</label><input id="f-name" data-form="name" value="${esc(f.name || '')}" placeholder="e.g. Jordan Lee"></div>
          <div class="field"><label for="f-phone">Phone</label><input id="f-phone" data-form="phone" value="${esc(f.phone || '')}" placeholder="+1 555 000 0000" inputmode="tel"></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" data-form="email" value="${esc(f.email || '')}" placeholder="name@company.com" inputmode="email"></div>
          <div class="field"><label for="f-vert">Industry</label><select id="f-vert" data-form="vertical">${Object.entries(VERTICALS).map(([v, l]) => `<option value="${v}" ${f.vertical === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <button class="btn primary block" data-act="submit-contact">${ic('userPlus')}Add contact</button>
        </div>`;
        break;
      }
      case 'info': {
        title = 'Visitor info';
        body = infoBody(contactById(s.id));
        break;
      }
      case 'ticket': {
        title = ticketById(s.id).id;
        body = ticketBody(ticketById(s.id));
        break;
      }
      case 'edit-draft': {
        title = 'Edit AI draft';
        body = `<div class="sheet-body">
          <div class="field"><label for="f-text">Draft reply</label><textarea id="f-text" data-form="text" rows="6">${esc(f.text || '')}</textarea></div>
          <p class="note">${ic('shield')}Your edit is logged with your name. The visitor sees the approved text.</p>
          <div class="row-actions"><button class="btn ghost" data-act="close-sheet">Cancel</button><button class="btn purple" data-act="draft-save" data-id="${s.id}">${ic('check')}Approve &amp; send</button></div>
        </div>`;
        break;
      }
      case 'bulk-reply': {
        const n = state.selected.length;
        title = `Reply to ${n} chat${n === 1 ? '' : 's'}`;
        body = `<div class="sheet-body">
          <p class="note">${ic('reply')}Each visitor sees this in their own thread.</p>
          <div class="sugg">${CANNED.filter((r) => r.scope === 'global' || r.owner === state.me).slice(0, 4).map((r) => `<button class="chip pick" data-act="macro" data-id="${r.id}">#${esc(r.shortcut)}</button>`).join('')}</div>
          <div class="field"><label for="f-bulk">Message</label><textarea id="f-bulk" data-form="text" rows="5" placeholder="Write one reply for all selected chats">${esc(f.text || '')}</textarea></div>
          <button class="btn primary block" data-act="bulk-send" ${n ? '' : 'disabled'}>${ic('send')}Send to ${n} chat${n === 1 ? '' : 's'}</button>
        </div>`;
        break;
      }
      case 'attach': {
        title = 'Add to chat';
        body = `<div class="sheet-body">
          ${rowBtn('pick', 'image', 'Photo or video', 'Send an image from this device', { accept: 'image/*' })}
          ${rowBtn('pick', 'file', 'Document', 'PDF, Word, Excel or CSV', { accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt' })}
          ${rowBtn('rec-start', 'mic', 'Voice message', 'Record and send a short message', {})}
        </div>`;
        break;
      }
      case 'canned-edit': {
        const existing = f.id ? cannedById(f.id) : null;
        const canEdit = !existing || existing.owner === state.me || (existing.scope === 'global' && admin());
        title = existing ? `#${existing.shortcut}` : 'New canned reply';
        body = `<div class="sheet-body">
          <div class="field"><label for="f-short">Shortcut</label><input id="f-short" data-form="shortcut" value="${esc(f.shortcut || '')}" placeholder="refund" ${canEdit ? '' : 'disabled'}></div>
          <div class="field"><label for="f-title">Title</label><input id="f-title" data-form="title" value="${esc(f.title || '')}" placeholder="Refund processed" ${canEdit ? '' : 'disabled'}></div>
          <div class="field"><label for="f-text">Message</label><textarea id="f-text" data-form="text" rows="4" ${canEdit ? '' : 'disabled'}>${esc(f.text || '')}</textarea></div>
          <p class="note">${ic('hash')}Use {{name}} for the customer’s first name and {{agent}} for yours.</p>
          ${admin() ? `<div class="field"><label for="f-scope">Visible to</label><select id="f-scope" data-form="scope" ${canEdit ? '' : 'disabled'}><option value="mine" ${f.scope === 'mine' ? 'selected' : ''}>Only me</option><option value="global" ${f.scope === 'global' ? 'selected' : ''}>Everyone on the team</option></select></div>` : ''}
          ${canEdit
            ? `<button class="btn primary block" data-act="canned-save">${ic('check')}Save reply</button>`
            : `<p class="locknote">${ic('lock')}Only admins can edit shared replies.</p>`}
          ${existing && canEdit ? `<button class="btn danger block" data-act="canned-delete" data-id="${existing.id}">${ic('trash')}Delete reply</button>` : ''}
        </div>`;
        break;
      }
      case 'campaign': {
        const c = campaignById(s.id);
        title = c.name;
        body = campaignBody(c);
        break;
      }
      case 'campaign-new': {
        title = 'New campaign';
        const audiences = [['all', 'All customers', CONTACTS.length], ['vip', 'VIP label', CONTACTS.filter((c) => c.tags.includes('VIP')).length], ['bfsi', 'BFSI', CONTACTS.filter((c) => c.vertical === 'bfsi').length], ['churn', 'Churn risk', CONTACTS.filter((c) => c.tags.includes('Churn risk')).length]];
        body = `<div class="sheet-body">
          <div class="field"><label for="c-name">Campaign name</label><input id="c-name" data-form="name" value="${esc(f.name)}" placeholder="e.g. Spring sale"></div>
          <div class="field"><label for="c-ch">Channel</label><select id="c-ch" data-form="channel">${Object.keys(CHANNELS).map((k) => `<option value="${k}" ${f.channel === k ? 'selected' : ''}>${CHANNELS[k].label}</option>`).join('')}</select></div>
          <div class="field"><label for="c-aud">Audience</label><select id="c-aud" data-form="audience">${audiences.map(([v, l, n]) => `<option value="${v}" ${f.audience === v ? 'selected' : ''}>${l} · ${n}</option>`).join('')}</select></div>
          <div class="field"><label>Message</label><div class="rich">${fmtBar('campaign')}<div class="editor" contenteditable="true" role="textbox" aria-multiline="true" data-rich="html" data-editor="rich" data-placeholder="Hi {{name}}, …" aria-label="Campaign message">${f.html}</div></div></div>
          <div class="field"><label for="c-when">Send</label><select id="c-when" data-form="when">${[['now', 'Now'], ['tomorrow', 'Tomorrow, 9:00'], ['monday', 'Next Monday, 9:00']].map(([v, l]) => `<option value="${v}" ${f.when === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="row-actions" style="justify-content:stretch">
            <button class="btn ghost" data-act="campaign-save" data-to="draft" style="flex:1">Save draft</button>
            <button class="btn primary" data-act="campaign-save" data-to="send" style="flex:1">${ic('send')}${f.when === 'now' ? 'Send now' : 'Schedule'}</button>
          </div>
        </div>`;
        break;
      }
      case 'settings-sheet':
        title = '';
        body = '';
        break;
      default:
        title = '';
    }
    return `<div class="scrim" data-act="close-sheet"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="grab" aria-hidden="true"></div>
        <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ic('x')}</button></div>
        ${body}
      </section>`;
  }

  function infoBody(ct) {
    const tickets = TICKETS.filter((t) => t.contact === ct.id);
    const typed = state.labelIn.trim();
    const suggestions = LABELS.filter((l) => !ct.tags.includes(l) && (!typed || l.toLowerCase().includes(typed.toLowerCase())));
    const exists = LABELS.some((l) => l.toLowerCase() === typed.toLowerCase());
    const canCreate = typed && !exists && !ct.tags.includes(typed);
    const hasOpen = CONVS.some((c) => c.contact === ct.id && c.status !== 'closed');
    const chans = [...new Set(CONVS.filter((c) => c.contact === ct.id).map((c) => c.channel))];
    const armed = state.armed === ct.id;
    return `<div class="sheet-body">
      <div class="profile">${av(ct, 'lg')}<h2>${esc(ct.name)}</h2><span class="note">${VERTICALS[ct.vertical]}${ct.city ? ' · ' + esc(ct.city) : ''}</span>
        <div class="tags" style="justify-content:center">${chans.map((k) => `<span class="chan-chip chip">${ic(CHANNELS[k].icon)}${CHANNELS[k].label}</span>`).join('') || '<span class="note">No channels yet</span>'}</div></div>
      <div class="quick">
        <button data-act="chat-contact" data-id="${ct.id}" ${hasOpen ? '' : 'aria-disabled="true"'}>${ic('inbox')}Chat</button>
        <a class="qa" href="mailto:${esc(ct.email)}">${ic('mail')}Email</a>
        <button data-act="new-ticket-for" data-id="${ct.id}">${ic('ticket')}Ticket</button>
      </div>
      <section class="sec"><h4>Labels</h4>
        <div class="tags">${ct.tags.map((t) => `<span class="chip tagchip">${esc(t)}<button data-act="remove-label" data-label="${esc(t)}" aria-label="Remove ${esc(t)}">${ic('x')}</button></span>`).join('') || '<span class="note">No labels yet</span>'}</div>
        <div class="lbl-input"><input data-key="labelIn" data-model="labelIn" data-live placeholder="Add a label" aria-label="Add a label" value="${esc(state.labelIn)}"><button class="btn ghost sm" data-act="add-label-input">Add</button></div>
        <div class="sugg">
          ${suggestions.slice(0, 8).map((l) => `<button class="chip pick" data-act="add-label" data-label="${esc(l)}">+ ${esc(l)}</button>`).join('')}
          ${canCreate
            ? (admin()
              ? `<button class="chip ai pick" data-act="add-label" data-label="${esc(typed)}">+ Create “${esc(typed)}”</button>`
              : `<span class="note">${ic('lock')}Only admins can create new labels</span>`)
            : ''}
        </div>
      </section>
      <section class="sec"><h4>Details</h4>
        <dl class="kv">
          <dt>Phone</dt><dd>${esc(ct.phone)}</dd>
          <dt>Email</dt><dd>${esc(ct.email)}</dd>
          <dt>Customer since</dt><dd>${esc(ct.since)}</dd>
          <dt>Lifetime value</dt><dd>${esc(ct.ltv)}</dd>
          ${Object.entries(ct.attrs || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
        </dl>
      </section>
      <section class="sec"><h4>Tickets · ${tickets.length}</h4>
        ${tickets.length ? tickets.map((t) => rowBtn('open-ticket', 'ticket', esc(t.subject), `${t.id} · ${t.status}`, { id: t.id })).join('') : '<p class="note">No tickets yet</p>'}
      </section>
      <button class="btn ${admin() ? 'danger' : 'ghost'} block" data-act="delete-contact">${admin()
        ? (armed ? 'Tap again to delete contact' : 'Delete contact')
        : `${ic('lock')}Delete contact · admins only`}</button>
    </div>`;
  }

  function ticketBody(t) {
    const ct = contactById(t.contact);
    const conv = t.conv ? convById(t.conv) : null;
    const statuses = [['Open', 'Open'], ['InProgress', 'In progress'], ['Resolved', 'Resolved'], ['Closed', 'Closed']];
    const armed = state.armed === t.id;
    return `<div class="sheet-body">
      <section class="sec">
        <div class="tk-top" style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-3);font-weight:600"><span>${t.id}</span>${priorityChip(t.priority)}</div>
        <h3 style="font:600 18px/1.3 var(--font-ui);margin:6px 0 8px">${esc(t.subject)}</h3>
        <p class="note">${ic('user')}${esc(ct ? ct.name : 'No contact')}</p>
      </section>
      <p class="label">Status</p>
      <div class="row-scroll">${statuses.map(([k, l]) => `<button class="pill ${t.status === k ? 'on' : ''}" data-act="ticket-status" data-id="${t.id}" data-v="${k}" aria-pressed="${t.status === k}">${l}</button>`).join('')}</div>
      <p class="label">Assignee</p>
      <div class="row-scroll">${USERS.map((u) => {
        const locked = u.id !== state.me && !can('assignOthers');
        return `<button class="pill ${t.assignee === u.id ? 'on' : ''}" data-act="ticket-assign" data-id="${t.id}" data-user="${u.id}" aria-pressed="${t.assignee === u.id}" aria-disabled="${locked}">${locked ? ic('lock') : ''}${esc(firstName(u))}</button>`;
      }).join('')}</div>
      ${conv ? rowBtn('conv', 'inbox', 'Open linked chat', `${esc(contactOf(conv).name)} · ${CHANNELS[conv.channel].label}`, { id: conv.id }) : ''}
      <button class="btn ${admin() ? 'danger' : 'ghost'} block" data-act="ticket-delete" data-id="${t.id}">${admin()
        ? (armed ? 'Tap again to delete ticket' : 'Delete ticket')
        : `${ic('lock')}Delete ticket · admins only`}</button>
    </div>`;
  }

  /* ───────────────────────── actions ───────────────────────── */
  function openConv(id) {
    state.convId = id;
    state.sheet = null;
    state.selecting = false;
    state.selected = [];
    const c = convById(id);
    c.unread = 0;
    state.draftHtml = state.drafts[id] || '';
    state.fmtOpen = false;
    state.cannedQ = null;
    state.aiHint = false;
    state.scrollBottom = true;
  }

  function closeConv() {
    if (state.convId) state.drafts[state.convId] = state.draftHtml;
    state.convId = null;
    state.draftHtml = '';
    state.fmtOpen = false;
    state.cannedQ = null;
    state.aiHint = false;
    state.rec = null;
  }

  function currentDraftPlain() {
    return (state.draftHtml || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  function sendMessage() {
    const c = current();
    if (!c || !currentDraftPlain()) return;
    const html = sanitize(state.draftHtml);
    state.draftHtml = '';
    state.cannedQ = null;
    state.aiHint = false;
    state.scrollBottom = true;
    if (c.mode === 'bot') { visitorSend(c, currentDraftPlain()); return; }
    c.messages.push(M('agent', 'text', { html, author: state.me }));
    c.unread = 0;
  }

  function takeOver(c) {
    if (c.mode !== 'bot') return;
    c.mode = 'human';
    sys(c, `${firstName(me())} took over from AI`);
  }

  function aiDraft() {
    const c = current();
    const first = firstName(contactOf(c));
    const lastCust = [...c.messages].reverse().find((m) => m.from === 'customer' && m.type === 'text');
    const body = lastCust && /order|deliver|parcel|refund/i.test(lastCust.text)
      ? 'I can see the delivery issue. I have requested a courier trace and will confirm the location within the hour.'
      : 'I have checked this and I am on it. I will come back to you within the hour.';
    state.draftHtml = esc(`Hi ${first}, thanks for the details. ${body} Is there anything else I should look at?`);
    state.aiHint = true;
  }

  function approve(id) {
    const c = convById(id);
    const d = c.pendingDraft;
    if (!d) return;
    c.messages.push(M('bot', 'text', { text: d.text, buttons: d.buttons, reviewed: `Approved by ${me().name}` }));
    c.pendingDraft = null;
    state.scrollBottom = true;
    toast('Approved and sent to the visitor');
  }
  function reject(id) {
    const c = convById(id);
    c.pendingDraft = null;
    c.mode = 'human';
    sys(c, `Draft rejected by ${firstName(me())} · handed to a human`);
    toast('Draft rejected. You are in control.');
  }
  function saveDraft(id) {
    const c = convById(id);
    const text = (state.form.text || '').trim();
    if (!text) { toast('The draft cannot be empty'); return; }
    c.messages.push(M('bot', 'text', { text, buttons: c.pendingDraft && c.pendingDraft.buttons, reviewed: `Edited and approved by ${me().name}` }));
    c.pendingDraft = null;
    state.sheet = null;
    state.scrollBottom = true;
    toast('Edited draft sent');
  }

  function endSelection() { state.selecting = false; state.selected = []; }

  function assignTo(ids, uid) {
    if (uid !== state.me && deny('assignOthers')) return;
    const who = userById(uid);
    ids.forEach((id) => { const c = convById(id); c.assignee = uid; sys(c, `Assigned to ${who.name}`); });
    state.sheet = null;
    endSelection();
    toast(ids.length > 1 ? `Assigned ${ids.length} chats to ${firstName(who)}` : `Assigned to ${firstName(who)}`);
  }
  function snoozeChats(ids, key) {
    const until = snoozeUntilFor(key);
    ids.forEach((id) => { const c = convById(id); c.status = 'snoozed'; c.snoozeUntil = until; sys(c, `Snoozed by ${firstName(me())}`); });
    state.sheet = null;
    endSelection();
    toast(`Snoozed until ${clockFull(until)}`);
  }
  function closeChats(ids) {
    const prev = ids.map((id) => [id, convById(id).status]);
    ids.forEach((id) => { const c = convById(id); c.status = 'closed'; sys(c, `Closed by ${firstName(me())}`); });
    state.sheet = null;
    endSelection();
    toast(ids.length > 1 ? `Closed ${ids.length} chats` : 'Chat closed', () => {
      prev.forEach(([id, status]) => { const c = convById(id); if (c) c.status = status === 'closed' ? 'open' : status; });
    });
  }
  function bulk(kind) {
    const ids = [...state.selected];
    if (!ids.length) { toast('Select at least one chat'); return; }
    if (kind === 'reply') openSheet('bulk-reply', 'bulk');
    if (kind === 'assign') openSheet('assign', 'bulk');
    if (kind === 'snooze') openSheet('snooze', 'bulk');
    if (kind === 'close') closeChats(ids);
  }
  function bulkSend() {
    const text = (state.form.text || '').trim();
    if (!text) { toast('Write a message first'); return; }
    const ids = [...state.selected];
    ids.forEach((id) => { const c = convById(id); takeOver(c); c.messages.push(M('agent', 'text', { text, author: state.me })); c.unread = 0; });
    state.sheet = null;
    endSelection();
    toast(`Sent to ${ids.length} chat${ids.length === 1 ? '' : 's'}`);
  }

  function addLabel(raw) {
    const name = (raw || '').trim();
    const ct = state.sheet && contactById(state.sheet.id);
    if (!name || !ct) return;
    if (ct.tags.includes(name)) { toast(`${name} is already applied`); return; }
    if (!LABELS.includes(name)) {
      if (deny('createLabel')) return;
      LABELS.push(name);
    }
    ct.tags.push(name);
    state.labelIn = '';
    toast(`Labelled ${firstName(ct)} · ${name}`);
  }

  function createTicket() {
    const f = state.form;
    if (!(f.subject || '').trim()) { toast('Add a subject for the ticket'); return; }
    if (!f.contact) { toast('Choose a contact'); return; }
    const t = { id: 'TT' + String(100000 + Math.floor(Math.random() * 899999)), subject: f.subject.trim(), contact: f.contact, status: 'Open', priority: f.priority || 'normal', assignee: state.me, createdAt: new Date().toISOString(), conv: f.conv || null, desc: f.desc || '' };
    TICKETS.unshift(t);
    if (f.conv) sys(convById(f.conv), `Ticket ${t.id} created`);
    state.sheet = null;
    state.form = {};
    toast(`Ticket ${t.id} created`);
  }

  function createContact() {
    const f = state.form;
    if (!(f.name || '').trim()) { toast('Add a name for the contact'); return; }
    const ct = { id: 'c' + uid(), name: f.name.trim(), phone: (f.phone || '').trim() || '—', email: (f.email || '').trim() || '—', city: '', vertical: f.vertical || 'other', tags: [], since: new Date().toLocaleDateString([], { month: 'short', year: 'numeric' }), ltv: '—', hue: Math.floor(Math.random() * 360), attrs: {} };
    CONTACTS.push(ct);
    state.form = {};
    openSheet('info', ct.id);
    toast(`${ct.name} added`);
  }

  function deleteContact() {
    if (deny('deleteContact')) return;
    const id = state.sheet.id;
    if (state.armed !== id) { state.armed = id; toast('Tap delete again to confirm'); return; }
    const idx = CONTACTS.findIndex((c) => c.id === id);
    if (idx >= 0) CONTACTS.splice(idx, 1);
    CONVS = CONVS.filter((c) => c.contact !== id);
    TICKETS = TICKETS.filter((t) => t.contact !== id);
    state.sheet = null;
    state.armed = null;
    toast('Contact and their chats deleted');
  }
  function deleteTicket(id) {
    if (deny('deleteTicket')) return;
    if (state.armed !== id) { state.armed = id; toast('Tap delete again to confirm'); return; }
    TICKETS = TICKETS.filter((t) => t.id !== id);
    state.sheet = null;
    state.armed = null;
    toast('Ticket deleted');
  }

  function saveCanned() {
    const f = state.form;
    const shortcut = (f.shortcut || '').trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
    if (!shortcut) { toast('Add a shortcut, for example refund'); return; }
    if (!(f.text || '').trim()) { toast('Write the reply text'); return; }
    const clash = CANNED.find((r) => r.shortcut === shortcut && r.id !== f.id && (r.scope === 'global' || r.owner === state.me));
    if (clash) { toast(`#${shortcut} is already in use`); return; }
    const scope = admin() ? (f.scope || 'mine') : 'mine';
    if (f.id) {
      const r = cannedById(f.id);
      Object.assign(r, { shortcut, title: (f.title || shortcut).trim(), text: f.text.trim(), scope });
    } else {
      CANNED.push({ id: 'r' + uid(), shortcut, title: (f.title || shortcut).trim(), text: f.text.trim(), scope, owner: state.me });
    }
    state.sheet = null;
    state.form = {};
    toast(`Saved #${shortcut}`);
  }

  function sendCampaign(c, when) {
    if (deny('createCampaign')) return;
    if (when === 'now') {
      const n = c.audience.count;
      const delivered = Math.round(n * 0.97);
      const read = Math.round(delivered * 0.7);
      const clicked = Math.round(read * 0.25);
      c.stats = { sent: n, delivered, read, clicked };
      c.status = 'Sent';
      c.when = new Date().toISOString();
      toast(`${c.name} sent to ${n.toLocaleString()} people`);
    } else {
      c.status = 'Scheduled';
      c.when = isoIn(60 * 24);
      toast(`${c.name} scheduled`);
    }
    state.sheet = null;
  }

  function saveCampaignFromForm(to) {
    if (deny('createCampaign')) return;
    const f = state.form;
    if (!(f.name || '').trim()) { toast('Give the campaign a name'); return; }
    const plain = (f.html || '').replace(/<[^>]+>/g, '').trim();
    if (!plain) { toast('Write a message for the audience'); return; }
    const audLabel = { all: 'All customers', vip: 'VIP label', bfsi: 'BFSI', churn: 'Churn risk' }[f.audience];
    const count = { all: CONTACTS.length, vip: CONTACTS.filter((c) => c.tags.includes('VIP')).length, bfsi: CONTACTS.filter((c) => c.vertical === 'bfsi').length, churn: CONTACTS.filter((c) => c.tags.includes('Churn risk')).length }[f.audience];
    const camp = { id: 'k' + uid(), name: f.name.trim(), channel: f.channel, status: 'Draft', audience: { label: audLabel, count }, when: null, stats: null, html: sanitize(f.html), by: state.me };
    CAMPAIGNS.unshift(camp);
    state.form = {};
    if (to === 'send') sendCampaign(camp, f.when === 'now' ? 'now' : 'later');
    else { state.sheet = null; toast('Draft saved'); }
  }

  function endCall() {
    const c = convById(state.call.convId);
    const dur = Math.floor((Date.now() - state.call.start) / 1000);
    if (c) c.messages.push(M('system', 'call', { dur }));
    state.call = null;
    state.scrollBottom = true;
    toast(`Call ended · ${fmtDur(dur)}`);
  }
  function finishRecording() {
    const c = current();
    const dur = Math.max(1, Math.floor((Date.now() - state.rec.start) / 1000));
    const from = c.mode === 'bot' ? 'customer' : 'agent';
    c.messages.push(M(from, 'voice', { dur, author: state.me }));
    state.rec = null;
    state.scrollBottom = true;
    toast(`Voice message sent · ${fmtDur(dur)}`);
  }

  /* Insert a canned reply in place of the trailing #token. */
  function insertCanned(r) {
    const c = current();
    const text = fillVars(r.text, c);
    const base = (state.draftHtml || '').replace(/#[\w-]*(?=(<\/[^>]+>)*$)/, '');
    state.draftHtml = base + esc(text);
    state.cannedQ = null;
    state.cannedIdx = 0;
  }

  /* Ctrl/⌘ + B/I work natively in contenteditable; this just syncs state. */
  function syncEditor(el) {
    if (!el) return;
    if (el.dataset.editor === 'draft') state.draftHtml = el.innerHTML;
    else if (el.dataset.rich) state.form[el.dataset.rich] = el.innerHTML;
  }

  function act(name, el) {
    const d = el.dataset;
    const id = d.id;
    const c = current();
    state.lastActive = Date.now();
    switch (name) {
      case 'role':
        state.me = d.role === 'admin' ? 'u-ayo' : 'u-sara';
        state.sheet = null;
        toast(`Viewing as ${me().name} · ${me().role === 'admin' ? 'Admin' : 'Agent'}`);
        break;
      case 'tab':
        state.tab = d.tab;
        if (d.seg) state.inboxSeg = d.seg;
        state.settingsView = null;
        endSelection();
        break;
      case 'inbox-seg':
        state.inboxSeg = d.seg;
        endSelection();
        break;
      case 'channel':
        state.channel = d.ch;
        break;
      case 'filter':
        state.filter = d.f;
        state.selected = [];
        break;
      case 'select-mode':
        if (state.selecting) endSelection(); else { state.selecting = true; state.selected = []; }
        break;
      case 'select-exit':
        endSelection();
        break;
      case 'conv':
        if (state.selecting) state.selected = state.selected.includes(id) ? state.selected.filter((x) => x !== id) : [...state.selected, id];
        else openConv(id);
        break;
      case 'close-conv':
        closeConv();
        break;
      case 'bulk':
        bulk(d.do);
        break;
      case 'tfilter':
        state.tfilter = d.s;
        break;
      case 'open-ticket':
        state.sheet = { type: 'ticket', id };
        break;
      case 'ticket-status': {
        const t = ticketById(id);
        t.status = d.v;
        toast(`${t.id} set to ${d.v === 'InProgress' ? 'In progress' : d.v}`);
        break;
      }
      case 'ticket-assign': {
        if (d.user !== state.me && deny('assignOthers')) break;
        const t = ticketById(id);
        t.assignee = d.user;
        toast(`${t.id} assigned to ${firstName(userById(d.user))}`);
        break;
      }
      case 'ticket-delete':
        deleteTicket(id);
        break;
      case 'new-ticket':
        openSheet('ticket-new', null);
        break;
      case 'new-ticket-for':
        openSheet('ticket-new', null);
        state.form.contact = id;
        break;
      case 'new-contact':
        openSheet('contact-new');
        break;
      case 'submit-ticket':
        createTicket();
        break;
      case 'submit-contact':
        createContact();
        break;
      case 'info':
        openSheet('info', id);
        break;
      case 'chat-contact': {
        const open = CONVS.find((x) => x.contact === id && x.status !== 'closed');
        if (open) openConv(open.id); else toast('No open chat with this contact');
        break;
      }
      case 'menu':
        openSheet('menu', state.convId);
        break;
      case 'assign':
        openSheet('assign', id || state.convId);
        break;
      case 'assign-to':
        assignTo(id === 'bulk' ? [...state.selected] : [id], d.user);
        break;
      case 'snooze':
        openSheet('snooze', id || state.convId);
        break;
      case 'snooze-to':
        snoozeChats(id === 'bulk' ? [...state.selected] : [id], d.m);
        break;
      case 'unsnooze':
        if (c) { c.status = 'open'; c.snoozeUntil = null; sys(c, `Woken by ${firstName(me())}`); toast('Back in Open'); }
        break;
      case 'close-chat':
        closeChats([id || state.convId]);
        break;
      case 'reopen':
        if (c) { c.status = 'open'; sys(c, `Reopened by ${firstName(me())}`); }
        state.sheet = null;
        break;
      case 'take-over':
        if (c) takeOver(c);
        state.sheet = null;
        break;
      case 'hand-to-ai':
        if (c) { c.mode = 'bot'; sys(c, 'Handed back to AI'); }
        state.sheet = null;
        break;
      case 'ticket-from-conv':
        openSheet('ticket-new', state.convId);
        break;
      case 'add-label': addLabel(d.label); break;
      case 'add-label-input': addLabel(state.labelIn); break;
      case 'remove-label': {
        const ct = contactById(state.sheet.id);
        ct.tags = ct.tags.filter((t) => t !== d.label);
        break;
      }
      case 'delete-contact': deleteContact(); break;
      case 'qr': if (c) visitorSend(c, d.text); break;
      case 'send': sendMessage(); break;
      case 'ai-draft': if (c) aiDraft(); break;
      case 'attach': openSheet('attach'); break;
      case 'pick':
        state.sheet = null;
        fileInput.accept = d.accept;
        fileInput.click();
        break;
      case 'rec-start':
        state.sheet = null;
        state.rec = { start: Date.now() };
        break;
      case 'rec-cancel': state.rec = null; break;
      case 'rec-send': if (c && state.rec) finishRecording(); break;
      case 'call-start': if (c) state.call = { convId: c.id, start: Date.now(), muted: false, speaker: false }; break;
      case 'call-mute': state.call.muted = !state.call.muted; break;
      case 'call-speaker': state.call.speaker = !state.call.speaker; break;
      case 'call-end': endCall(); break;
      case 'play': {
        const m = c && c.messages.find((x) => x.id === id);
        if (m) m.playing = !m.playing;
        break;
      }
      case 'fmt-toggle':
        state.fmtOpen = !state.fmtOpen;
        return false;
      case 'fmt': {
        const ed = document.querySelector('[data-editor]:focus, [data-rich]:focus') || document.querySelector(d.key === 'campaign' ? '[data-rich]' : '[data-editor="draft"]');
        if (!ed) return false;
        if (d.cmd === 'link') {
          const url = window.prompt('Link address (https://…)');
          if (url && /^(https?:|mailto:)/i.test(url.trim())) document.execCommand('createLink', false, url.trim());
        } else if (d.cmd === 'code') {
          const sel = window.getSelection();
          const text = sel && sel.toString();
          if (text) document.execCommand('insertHTML', false, `<code>${esc(text)}</code>`);
        } else {
          document.execCommand(d.cmd, false, null);
        }
        ed.focus();
        syncEditor(ed);
        return false;
      }
      case 'canned-pick': {
        const r = cannedById(id);
        if (r) insertCanned(r);
        break;
      }
      case 'rev-approve': approve(id || state.convId); break;
      case 'rev-reject': reject(id || state.convId); break;
      case 'rev-edit': openSheet('edit-draft', id || state.convId); break;
      case 'draft-save': saveDraft(id); break;
      case 'macro': {
        const r = cannedById(id);
        if (r) state.form.text = fillVars(r.text, null);
        break;
      }
      case 'bulk-send': bulkSend(); break;
      case 'close-sheet':
        state.sheet = null;
        state.armed = null;
        break;
      case 'undo':
        if (state.toast && state.toast.undo) state.toast.undo();
        state.toast = null;
        break;

      /* Home & breaks */
      case 'set-status': setStatus(d.s); break;
      case 'break-sheet': openSheet('break'); break;
      case 'start-break':
        if (d.k) startBreak(d.k);
        break;
      case 'end-break':
        if (id !== state.me && deny('teamBreaks')) break;
        endBreak(id);
        break;
      case 'policy': {
        if (deny('breakPolicy')) break;
        const p = BREAK_POLICY[d.k];
        p[d.f] = Number(el.value);
        toast(`${p.label} is now ${p.mins} min, ${p.max} per day`);
        break;
      }
      case 'autoaway':
        state.autoAway = Number(el.value);
        toast(state.autoAway ? `Auto-away after ${state.autoAway} min idle` : 'Auto-away is off');
        break;
      case 'returnstatus':
        state.returnStatus = el.value;
        toast(`After a break you return as ${STATUS[el.value].label.toLowerCase()}`);
        break;
      case 'toggle-notif':
        state.notif[d.k] = !state.notif[d.k];
        break;
      case 'toggle-delivery':
        state.delivery[d.k] = !state.delivery[d.k];
        break;
      case 'toggle-quiet':
        state.quiet = !state.quiet;
        break;
      case 'dnd':
        state.dndBreak = !state.dndBreak;
        break;

      /* Settings */
      case 'settings-go':
        state.settingsView = d.v;
        break;
      case 'settings-back':
        state.settingsView = null;
        break;
      case 'theme':
        state.theme = d.t || (state.theme === 'dark' ? 'light' : 'dark');
        saveTheme(state.theme);
        break;
      case 'rule':
        if (deny('botRules')) break;
        RULES[d.k] = !RULES[d.k];
        break;
      case 'channel-toggle':
        if (deny('channels')) break;
        CHANNEL_ON[d.k] = !CHANNEL_ON[d.k];
        toast(`${CHANNELS[d.k].label} ${CHANNEL_ON[d.k] ? 'connected' : 'disconnected'}`);
        break;
      case 'role-set': {
        if (deny('manageTeam')) break;
        const u = userById(d.id);
        const next = el.value;
        u.role = next;
        toast(`${u.name} is now ${next === 'admin' ? 'an admin' : 'an agent'}`);
        break;
      }
      case 'invite':
        if (deny('manageTeam')) break;
        toast('Invite sent (demo)');
        break;
      case 'signout':
        toast('Signed out (demo only)');
        break;

      /* Canned replies */
      case 'canned-new': openSheet('canned-edit', null); break;
      case 'canned-edit': openSheet('canned-edit', id); break;
      case 'canned-save': saveCanned(); break;
      case 'canned-delete': {
        const r = cannedById(id);
        if (!r) break;
        if (r.scope === 'global' && deny('cannedGlobal')) break;
        CANNED = CANNED.filter((x) => x.id !== id);
        state.sheet = null;
        toast(`Deleted #${r.shortcut}`);
        break;
      }

      /* Campaigns */
      case 'campfilter': state.campFilter = d.s; break;
      case 'campaign': openSheet('campaign', id); break;
      case 'new-campaign':
        if (deny('createCampaign')) break;
        openSheet('campaign-new');
        break;
      case 'campaign-save': saveCampaignFromForm(d.to); break;
      case 'campaign-send': {
        const camp = campaignById(id);
        if (camp) sendCampaign(camp, d.when);
        break;
      }
      default:
        break;
    }
    return true;
  }

  /* ───────────────────────── events ───────────────────────── */
  root.addEventListener('click', (e) => {
    if (state.longFired) { state.longFired = false; e.preventDefault(); return; }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const rerender = act(el.dataset.act, el);
    if (rerender !== false) render();
  });

  root.addEventListener('input', (e) => {
    const el = e.target;
    state.lastActive = Date.now();
    if (el.dataset.editor || el.dataset.rich) {
      syncEditor(el);
      if (el.dataset.editor === 'draft') {
        const comp = el.closest('.composer');
        if (comp) comp.classList.toggle('has-text', !!currentDraftPlain());
        updateCanned(el);
      }
      return;
    }
    if (el.dataset.form) { state.form[el.dataset.form] = el.value; return; }
    if (el.dataset.model) {
      state[el.dataset.model] = el.value;
      if (el.dataset.live !== undefined) render();
    }
  });

  root.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset) return;
    if (el.dataset.form) { state.form[el.dataset.form] = el.value; return; }
    if (el.dataset.act) {
      if (act(el.dataset.act, el) !== false) render();
    }
  });

  /* Keep the formatting toolbar from stealing focus (and the text selection) from the editor. */
  root.addEventListener('mousedown', (e) => {
    if (e.target.closest('.fmt-bar')) e.preventDefault();
  });

  /* '#' opens canned replies; updates the picker in place so typing keeps focus. */
  function updateCanned(ed) {
    const m = (ed.textContent || '').match(/(?:^|\s)#([\w-]*)$/);
    const next = m ? m[1] : null;
    if (next !== state.cannedQ) { state.cannedQ = next; state.cannedIdx = 0; }
    const slot = $('#canned-slot', root);
    if (slot) slot.innerHTML = cannedPicker();
  }

  root.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.key === 'Enter' && !e.shiftKey && t.dataset && t.dataset.key === 'labelIn') {
      e.preventDefault();
      addLabel(state.labelIn);
      render();
      return;
    }
    if (t.dataset && t.dataset.editor === 'draft') {
      const picker = cannedMatches();
      if (state.cannedQ != null && picker.length) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          state.cannedIdx = (state.cannedIdx + (e.key === 'ArrowDown' ? 1 : -1) + picker.length) % picker.length;
          updateCanned(t);
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          insertCanned(picker[state.cannedIdx] || picker[0]);
          render();
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); state.cannedQ = null; updateCanned(t); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
        render();
      }
      return;
    }
    if (e.key === 'Enter' && t.classList && t.classList.contains('conv')) t.click();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.sheet) state.sheet = null;
    else if (state.call) return;
    else if (state.convId) closeConv();
    else if (state.selecting) endSelection();
    else if (state.settingsView) state.settingsView = null;
    else return;
    state.armed = null;
    render();
  });

  /* Long-press a chat card to enter multi-select. */
  let pressTimer = null;
  root.addEventListener('pointerdown', (e) => {
    state.longFired = false;
    state.lastActive = Date.now();
    const card = e.target.closest('.conv[data-id]');
    if (!card || state.selecting || state.convId) return;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      state.longFired = true;
      state.selecting = true;
      state.selected = [card.dataset.id];
      render();
    }, 480);
  });
  const cancelPress = () => clearTimeout(pressTimer);
  root.addEventListener('pointerup', cancelPress);
  root.addEventListener('pointercancel', cancelPress);

  fileInput.addEventListener('change', (e) => {
    const c = current();
    const files = [...e.target.files];
    e.target.value = '';
    if (!c || !files.length) return;
    const from = c.mode === 'bot' ? 'customer' : 'agent';
    files.forEach((f) => {
      if (f.type.startsWith('image/')) c.messages.push(M(from, 'image', { name: f.name, src: URL.createObjectURL(f), tone: '#C9D6E4', author: state.me }));
      else c.messages.push(M(from, 'file', { name: f.name, size: f.size, author: state.me }));
    });
    state.scrollBottom = true;
    toast(`${files.length} file${files.length > 1 ? 's' : ''} sent`);
    render();
  });

  /* Clocks: break countdowns, auto-away, call and recording timers. */
  setInterval(() => {
    tickClock();
    const t = document.getElementById('call-time');
    if (t && state.call) t.textContent = fmtDur(Math.floor((Date.now() - state.call.start) / 1000));
    const r = document.getElementById('rec-time');
    if (r && state.rec) r.textContent = fmtDur(Math.floor((Date.now() - state.rec.start) / 1000));
  }, 1000);

  render();
})();
