/* Helpdesk Mobile — prototype
   Vanilla JS, no build step. All data is mock data kept in memory; the
   render/action layer is written so a real API can replace the data helpers. */
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
  const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const attrs = (o) => Object.entries(o).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');

  const ICON = {
    inbox: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 13h5l1.5 2h5l1.5-2h5"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6.5 6.5 0 0 1 3.5 6.5"/>',
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
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    userPlus: '<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0M19 8v6M16 11h6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    reply: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v5"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/>',
    volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  };
  const ic = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
  const av = (o, size = '') => `<span class="av ${size}" style="--h:${o.hue}" aria-hidden="true">${esc(initials(o.name))}</span>`;

  /* ───────────────────────── mock data ───────────────────────── */
  const USERS = [
    { id: 'u-ayo', name: 'Ayo Bello', role: 'admin', hue: 18 },
    { id: 'u-sara', name: 'Sara Lindqvist', role: 'agent', hue: 270 },
    { id: 'u-kofi', name: 'Kofi Mensah', role: 'agent', hue: 150 },
    { id: 'u-imani', name: 'Imani Obi', role: 'agent', hue: 330 },
  ];
  const VERTICALS = { ecommerce: 'E-commerce', bfsi: 'BFSI', other: 'Business' };
  let LABELS = ['VIP', 'Shipping', 'Billing', 'Refund risk', 'Churn risk', 'Fraud watch', 'KYC pending', 'Wholesale', 'Priority partner'];

  const CONTACTS = [
    { id: 'c1', name: 'Amara Okafor', phone: '+234 803 555 0142', email: 'amara.o@example.com', city: 'Lagos', vertical: 'ecommerce', tags: ['VIP', 'Shipping'], since: 'Apr 2023', ltv: '$2,140', hue: 24, attrs: { 'Preferred channel': 'WhatsApp', 'Orders': '14' } },
    { id: 'c2', name: 'Lukas Brandt', phone: '+49 170 555 0198', email: 'lukas@brandt.de', city: 'Berlin', vertical: 'bfsi', tags: ['KYC pending'], since: 'Jan 2025', ltv: '€6,310', hue: 200, attrs: { 'Account': 'Current · 4417', 'Preferred channel': 'Web chat' } },
    { id: 'c3', name: 'Priya Raman', phone: '+44 7700 900421', email: 'priya.r@example.co.uk', city: 'London', vertical: 'bfsi', tags: ['Fraud watch', 'Priority partner'], since: 'Aug 2022', ltv: '£9,880', hue: 300, attrs: { 'Account': 'Premium', 'Preferred channel': 'Messenger' } },
    { id: 'c4', name: 'Noah Chen', phone: '+1 415 555 0177', email: 'noah.chen@example.com', city: 'San Francisco', vertical: 'ecommerce', tags: ['Billing'], since: 'Mar 2024', ltv: '$710', hue: 200, attrs: { 'Preferred channel': 'Web chat', 'Orders': '5' } },
    { id: 'c5', name: 'Mariana Costa', phone: '+351 912 555 310', email: 'mariana@costa-studio.pt', city: 'Lisbon', vertical: 'other', tags: ['Wholesale'], since: 'Jun 2025', ltv: '€3,400', hue: 120, attrs: { 'Company': 'Costa Studio', 'Preferred channel': 'Messenger' } },
    { id: 'c6', name: 'Daniel Ruiz', phone: '+34 611 555 208', email: 'daniel.ruiz@example.es', city: 'Madrid', vertical: 'ecommerce', tags: ['Churn risk', 'Refund risk'], since: 'Oct 2021', ltv: '$1,020', hue: 10, attrs: { 'Preferred channel': 'WhatsApp', 'Orders': '22' } },
    { id: 'c7', name: 'Hana Sato', phone: '+81 90 5555 0134', email: 'hana.sato@example.jp', city: 'Osaka', vertical: 'bfsi', tags: ['VIP'], since: 'Feb 2020', ltv: '¥1.2M', hue: 335, attrs: { 'Account': 'Private banking' } },
    { id: 'c8', name: 'Tomas Novak', phone: '+420 603 555 019', email: 'tomas@novak.cz', city: 'Prague', vertical: 'other', tags: [], since: 'Nov 2026', ltv: '—', hue: 260, attrs: { 'Preferred channel': 'Web chat' } },
  ];

  const ORDERS = [
    { title: 'Linen throw', sub: '#88194 · Out for delivery', meta: '$64.00', tone: '#E7C9A5', actions: ['Track', 'Get help'] },
    { title: 'Ceramic vase', sub: '#88102 · Delivered 2 Nov', meta: '$48.00', tone: '#C9B6D9', actions: ['Return', 'Reorder'] },
    { title: 'Woven tote', sub: '#87940 · Delivered 28 Oct', meta: '$32.00', tone: '#B9D2C4', actions: ['Return', 'Reorder'] },
  ];

  let CONVS = [
    { id: 'v1', contact: 'c1', channel: 'WhatsApp', status: 'open', assignee: 'u-sara', priority: 'high', mode: 'human', unread: 2, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Hi, my order shows as delivered but it never reached me 😞' }, 46),
      M('customer', 'image', { name: 'doorstep.jpg', tone: '#C9A27E' }, 45),
      M('bot', 'text', { text: 'Thanks for the photo. I have flagged this for a delivery investigation.' }, 44),
      M('system', 'event', { text: 'Escalated to Sara Lindqvist' }, 40),
      M('agent', 'text', { text: 'Hi Amara, I am so sorry. I am checking the courier scan right now.', author: 'u-sara' }, 30),
      M('customer', 'voice', { dur: 12 }, 6),
      M('customer', 'text', { text: 'Thank you. Please let me know as soon as you can.' }, 3),
    ] },
    { id: 'v2', contact: 'c2', channel: 'Web chat', status: 'open', assignee: null, priority: 'high', mode: 'bot', unread: 1, snoozeUntil: null,
      pendingDraft: { text: 'I have opened a dispute for €480.00 on your card ending 4417. A specialist will confirm within 2 business days.', buttons: ['Track dispute', 'Talk to a human'], reason: 'Financial action over €250 needs human approval', confidence: 0.64 },
      messages: [
        M('bot', 'text', { text: 'Hi Lukas, welcome back. How can I help today?', buttons: ['Check balance', 'Block my card', 'Dispute a charge', 'Talk to a human'] }, 22),
        M('customer', 'text', { text: 'I want to dispute a charge of €480 from February' }, 5),
        M('bot', 'text', { text: 'Understood. I have prepared the details for a specialist to check before anything changes.' }, 4),
      ] },
    { id: 'v3', contact: 'c3', channel: 'Messenger', status: 'snoozed', assignee: null, priority: 'normal', mode: 'human', unread: 0, snoozeUntil: isoIn(180), pendingDraft: null, messages: [
      M('customer', 'text', { text: 'There is a payment I do not recognise: £79.99 to MERCHANT*X' }, 95),
      M('agent', 'text', { text: 'Thanks Priya. I have placed a temporary hold on the card while we check.', author: 'u-ayo' }, 90),
      M('system', 'event', { text: 'Snoozed by Ayo Bello' }, 60),
    ] },
    { id: 'v4', contact: 'c4', channel: 'Web chat', status: 'open', assignee: null, priority: 'normal', mode: 'bot', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('bot', 'text', { text: 'Hi Noah! I can track orders, start returns or answer product questions.', buttons: ['Track an order', 'Start a return', 'Talk to a human'] }, 40),
      M('customer', 'text', { text: 'Track my orders' }, 39),
      M('bot', 'carousel', { text: 'Here are your three most recent orders.', items: ORDERS }, 38),
      M('customer', 'text', { text: 'Start a return' }, 21),
      M('bot', 'text', { text: 'Returns are free within 30 days. Which item would you like to send back?', buttons: ['Linen throw', 'Ceramic vase', 'Talk to a human'] }, 20),
    ] },
    { id: 'v5', contact: 'c5', channel: 'Messenger', status: 'open', assignee: 'u-kofi', priority: 'normal', mode: 'human', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Do you offer bulk pricing for 200+ units?' }, 130),
      M('agent', 'text', { text: 'Yes, we do. I will send the wholesale sheet today.', author: 'u-kofi' }, 120),
      M('agent', 'file', { name: 'Wholesale-pricing-2026.pdf', size: 412000, author: 'u-kofi' }, 119),
      M('customer', 'text', { text: 'Perfect, thanks!' }, 30),
    ] },
    { id: 'v6', contact: 'c6', channel: 'WhatsApp', status: 'open', assignee: 'u-ayo', priority: 'urgent', mode: 'human', unread: 3, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'This is the second time my refund is late. Cancel everything.' }, 15),
      M('customer', 'text', { text: 'Refund reference RF-20931' }, 14),
      M('customer', 'image', { name: 'receipt.png', tone: '#B9A6D6' }, 13),
    ] },
    { id: 'v7', contact: 'c7', channel: 'Web chat', status: 'closed', assignee: 'u-imani', priority: 'normal', mode: 'human', unread: 0, snoozeUntil: null, pendingDraft: null, messages: [
      M('customer', 'text', { text: 'Card unlocked, thanks!' }, 1440),
      M('agent', 'text', { text: 'Glad it is sorted. Anything else I can help with?', author: 'u-imani' }, 1430),
      M('system', 'event', { text: 'Closed by Imani Obi' }, 1400),
    ] },
    { id: 'v8', contact: 'c8', channel: 'Web chat', status: 'open', assignee: null, priority: 'normal', mode: 'bot', unread: 1, snoozeUntil: null, pendingDraft: null, messages: [
      M('bot', 'text', { text: 'Hi Tomas! I can book a call, share pricing or connect you to a specialist.', buttons: ['Book a call', 'Pricing', 'Talk to a human'] }, 6),
      M('customer', 'text', { text: 'Book a call for Thursday' }, 4),
      M('bot', 'text', { text: 'Great. Which slot works best for a 20-minute call?', buttons: ['Thu 10:00', 'Thu 14:30', 'Thu 16:00'] }, 3),
    ] },
  ];

  let TICKETS = [
    { id: 'TT482015', subject: 'Delivery not received · order #88213', contact: 'c1', status: 'Open', priority: 'high', assignee: 'u-sara', createdAt: isoAgo(1200), conv: 'v1' },
    { id: 'TT482377', subject: 'Dispute · €480 card charge (Feb)', contact: 'c2', status: 'InProgress', priority: 'urgent', assignee: null, createdAt: isoAgo(300), conv: 'v2' },
    { id: 'TT481902', subject: 'Refund RF-20931 late (2nd time)', contact: 'c6', status: 'Open', priority: 'urgent', assignee: 'u-ayo', createdAt: isoAgo(40), conv: 'v6' },
    { id: 'TT480117', subject: 'Card unlock request', contact: 'c7', status: 'Closed', priority: 'normal', assignee: 'u-imani', createdAt: isoAgo(1560), conv: 'v7' },
    { id: 'TT483340', subject: 'Bulk pricing request · 200+ units', contact: 'c5', status: 'Resolved', priority: 'normal', assignee: 'u-kofi', createdAt: isoAgo(1800), conv: 'v5' },
  ];

  /* Actions an agent may take. Everything else is admin-only. */
  const AGENT_OK = new Set(['selfAssign', 'reply', 'close', 'snooze', 'ticket', 'status', 'labels', 'addContact', 'takeOver']);
  const DENY_MSG = {
    assignOthers: 'assign chats or tickets to other agents',
    deleteContact: 'delete contacts',
    deleteTicket: 'delete tickets',
    createLabel: 'create new labels',
    botRules: 'change bot rules',
  };

  /* ───────────────────────── state ───────────────────────── */
  const state = {
    me: 'u-ayo',
    tab: 'inbox',
    filter: 'open',
    q: '',
    cq: '',
    tfilter: 'all',
    botTab: 'chats',
    rules: { holdFinance: true, carousel: true, anger: true, aiHints: true },
    selecting: false,
    selected: [],
    convId: null,
    drafts: {},
    draft: '',
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
  };

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
  const contactOf = (c) => contactById(c.contact);
  const current = () => (state.convId ? convById(state.convId) : null);
  const firstName = (o) => o.name.split(' ')[0];
  const lastMsg = (c) => c.messages[c.messages.length - 1];
  const lastTime = (c) => new Date(lastMsg(c).time).getTime();

  function deny(perm) {
    if (can(perm)) return false;
    toast(`Only admins can ${DENY_MSG[perm]}.`);
    return true;
  }

  function sys(c, text) {
    c.messages.push(M('system', 'event', { text }));
  }

  function preview(m) {
    switch (m.type) {
      case 'image': return '📷 Photo';
      case 'file': return '📎 ' + m.name;
      case 'voice': return '🎙 Voice note · ' + fmtDur(m.dur);
      case 'carousel': return '✦ Product carousel';
      case 'call': return '📞 Voice call';
      default:
        if (m.from === 'agent') return 'You: ' + m.text;
        if (m.from === 'bot') return '✦ ' + m.text;
        if (m.from === 'system') return m.text;
        return m.text;
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
      .filter((c) => !q || (contactOf(c).name + ' ' + preview(lastMsg(c))).toLowerCase().includes(q))
      .sort((a, b) => lastTime(b) - lastTime(a));
  }

  function snoozeUntilFor(k) {
    if (k === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); }
    if (k === 'monday') { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); return d.toISOString(); }
    return isoIn(Number(k));
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

  /* Visitor sends something (typed, quick reply or carousel button). */
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
        if (out.handoff) {
          cc.mode = 'human';
          sys(cc, 'Handed to a human agent · next in queue');
        }
        state.scrollBottom = true;
      }
      render();
    }, 900);
  }

  /* ───────────────────────── toast ───────────────────────── */
  let toastTimer = null;
  function toast(msg, undo) {
    state.toast = { msg, undo };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = null; render(); }, 4200);
  }

  /* ───────────────────────── view: shell ───────────────────────── */
  function render() {
    const ae = document.activeElement;
    const focusKey = ae && ae.dataset ? ae.dataset.key : null;
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
        if (caret != null && el.setSelectionRange) { try { el.setSelectionRange(caret, caret); } catch (_) { /* input type without selection */ } }
      }
    }
  }

  function shell() {
    const c = current();
    const body = state.tab === 'bot' ? renderBot()
      : state.tab === 'tickets' ? renderTickets()
      : state.tab === 'contacts' ? renderContacts()
      : renderInbox();
    return `<div class="phone">
      ${body}
      ${renderTabbar()}
      ${state.selecting && state.tab === 'inbox' ? renderBulk() : ''}
      ${c ? renderConv(c) : ''}
      ${state.call ? renderCall() : ''}
      ${state.sheet ? renderSheet() : ''}
      ${state.toast ? renderToast() : ''}
    </div>`;
  }

  const roleSeg = () => `<div class="seg mini" role="group" aria-label="View as">${['admin', 'agent'].map((r) => `<button class="${me().role === r ? 'on' : ''}" data-act="role" data-role="${r}" aria-pressed="${me().role === r}">${r === 'admin' ? 'Admin' : 'Agent'}</button>`).join('')}</div>`;
  const themeBtn = () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    return `<button class="theme" data-act="theme" aria-label="Switch to ${next} theme" title="Switch to ${next} theme">${ic(state.theme === 'dark' ? 'sun' : 'moon')}</button>`;
  };
  const topbar = (title, sub) => `<header class="topbar"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="tb-right">${themeBtn()}${roleSeg()}</div></header>`;

  /* Theme: remembered per browser; falls back to the system setting. */
  function initialTheme() {
    let saved = null;
    try { saved = localStorage.getItem('helpdesk-theme'); } catch (_) { /* storage blocked */ }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function saveTheme(t) {
    try { localStorage.setItem('helpdesk-theme', t); } catch (_) { /* storage blocked */ }
  }
  const emptyState = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${title}</b><span>${text}</span></div>`;

  function renderTabbar() {
    const unread = CONVS.filter((c) => c.status === 'open' && c.unread).length;
    const review = CONVS.filter((c) => c.pendingDraft).length;
    const urgent = TICKETS.filter((t) => t.priority === 'urgent' && t.status !== 'Closed' && t.status !== 'Resolved').length;
    const tabs = [
      ['inbox', 'Inbox', 'inbox', unread, ''],
      ['bot', 'AI', 'spark', review, 'ai'],
      ['tickets', 'Tickets', 'ticket', urgent, ''],
      ['contacts', 'Contacts', 'users', 0, ''],
    ];
    return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, l, i, b, cls]) => `<button class="tab ${cls} ${state.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}" ${state.tab === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${b ? `<span class="badge ${cls === 'ai' ? 'purple' : ''}" aria-label="${b} pending">${b}</span>` : ''}</button>`).join('')}</nav>`;
  }

  /* ───────────────────────── view: inbox ───────────────────────── */
  function renderInbox() {
    const counts = {};
    ['open', 'mine', 'unassigned', 'snoozed', 'closed'].forEach((f) => { counts[f] = CONVS.filter((c) => matchesFilter(c, f)).length; });
    const needYou = CONVS.filter((c) => c.status === 'open' && (c.unread > 0 || c.pendingDraft)).length;
    const inAI = CONVS.filter((c) => c.status === 'open' && c.mode === 'bot').length;
    const filters = [['open', 'Open'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['snoozed', 'Snoozed'], ['closed', 'Closed']];
    const list = visibleConvs();

    return `${topbar('Inbox', `${needYou} need you · ${inAI} with AI`)}
      <div class="content">
        <label class="searchbar">${ic('search')}<input data-key="q" data-model="q" data-live type="search" placeholder="Search chats or messages" value="${esc(state.q)}" aria-label="Search chats"></label>
        <div class="filters-row">
          <div class="filters" role="group" aria-label="Filter chats">${filters.map(([k, l]) => `<button class="pill ${state.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}" aria-pressed="${state.filter === k}">${l} <b>${counts[k]}</b></button>`).join('')}</div>
          <button class="pill" data-act="select-mode">${ic('check')}Select</button>
        </div>
        <div class="list">${list.length ? list.map(convCard).join('') : emptyState('inbox', 'Nothing here', 'Try another filter or search term.')}</div>
      </div>`;
  }

  function convCard(c) {
    const ct = contactOf(c);
    const last = lastMsg(c);
    const sel = state.selected.includes(c.id);
    const a = userById(c.assignee);
    const tags = [];
    if (c.priority === 'urgent') tags.push('<span class="chip urgent">Urgent</span>');
    else if (c.priority === 'high') tags.push('<span class="chip hot">High</span>');
    if (c.pendingDraft) tags.push(`<span class="chip ai">${ic('spark')}Review</span>`);
    else if (c.mode === 'bot' && c.status === 'open') tags.push(`<span class="chip ai">${ic('spark')}AI</span>`);
    if (c.status === 'snoozed') tags.push(`<span class="chip">${ic('clock')}${clock(c.snoozeUntil)}</span>`);
    ct.tags.slice(0, 2).forEach((t) => tags.push(`<span class="chip">${esc(t)}</span>`));
    return `<article class="conv ${c.unread ? 'unread' : ''} ${sel ? 'sel' : ''}" data-act="conv" data-id="${c.id}" tabindex="0" aria-label="${esc(ct.name)}, ${c.unread} unread">
      ${state.selecting ? `<span class="check ${sel ? 'on' : ''}" aria-hidden="true">${sel ? ic('check') : ''}</span>` : ''}
      ${av(ct)}
      <div class="conv-body">
        <div class="row1"><b>${esc(ct.name)}</b><time>${rel(last.time)}</time></div>
        <p class="prev">${esc(preview(last))}</p>
        <div class="tags">${tags.join('')}</div>
      </div>
      <div class="conv-end">${c.unread ? `<span class="badge" aria-hidden="true">${c.unread}</span>` : ''}${a ? av(a, 'xs') : ''}<span class="chan">${esc(c.channel)}</span></div>
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

  /* ───────────────────────── view: AI assistant ───────────────────────── */
  function renderBot() {
    const review = CONVS.filter((c) => c.pendingDraft);
    const botChats = CONVS.filter((c) => c.mode === 'bot' && c.status !== 'closed');
    const seg = [['chats', 'Live chats'], ['review', `Review${review.length ? ` (${review.length})` : ''}`], ['rules', 'Rules']];
    let body = '';
    if (state.botTab === 'chats') body = botChats.length ? `<div class="list">${botChats.map(convCard).join('')}</div>` : emptyState('spark', 'No bot chats', 'Every chat is with a human right now.');
    if (state.botTab === 'review') body = review.length ? `<div class="list">${review.map(reviewCard).join('')}</div>` : emptyState('check', 'All caught up', 'No AI drafts are waiting for review.');
    if (state.botTab === 'rules') body = renderRules();

    return `${topbar('AI Assistant', `${botChats.length} live · ${review.length} to review`)}
      <div class="content">
        <section class="hero">
          <div class="hero-top">${ic('spark')}<span>AI desk</span><span class="live"><i></i>Live</span></div>
          <h2>Answers first, humans on the big calls</h2>
          <p>E-commerce, BFSI and business chats. Anything that moves money waits for a person.</p>
          <div class="stats">
            <div class="stat"><b>68%</b><span>resolved by AI</span></div>
            <div class="stat"><b>1.8s</b><span>first reply</span></div>
            <div class="stat"><b>${CONVS.filter((c) => c.status === 'open' && c.mode === 'human').length}</b><span>human-led</span></div>
          </div>
        </section>
        <div class="filters" role="group" aria-label="AI sections" style="margin-bottom:12px">${seg.map(([k, l]) => `<button class="pill ${state.botTab === k ? 'on' : ''}" data-act="bot-tab" data-t="${k}" aria-pressed="${state.botTab === k}">${l}</button>`).join('')}</div>
        ${body}
      </div>`;
  }

  function reviewCard(c) {
    const ct = contactOf(c);
    const d = c.pendingDraft;
    return `<article class="rev">
      <div class="rev-head">${av(ct)}<div><b>${esc(ct.name)}</b><span>${VERTICALS[ct.vertical]} · ${esc(c.channel)} · waiting ${rel(lastMsg(c).time)}</span></div><span class="chip ai">${Math.round(d.confidence * 100)}% sure</span></div>
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

  function renderRules() {
    const rules = [
      ['holdFinance', 'Hold financial actions for review', 'Refunds, disputes and card changes wait for a human.'],
      ['carousel', 'Rich carousels', 'Show product and order cards in bot replies.'],
      ['anger', 'Hand off on frustration', 'Escalate when a visitor sounds upset or repeats themselves.'],
      ['aiHints', 'Show AI hints to agents', 'Purple marks AI-written or AI-held messages.'],
    ];
    const note = admin()
      ? `<p class="locknote">${ic('shield')}Admin. Changes apply to all channels immediately.</p>`
      : `<p class="locknote">${ic('lock')}Only admins can change bot rules. You can see the current settings.</p>`;
    return `<section class="sec">${note}${rules.map(([k, t, s]) => `<div class="rule"><div><b>${t}</b><small>${s}</small></div><button class="switch ${state.rules[k] ? 'on' : ''}" role="switch" aria-checked="${!!state.rules[k]}" aria-label="${t}" data-act="rule" data-k="${k}"></button></div>`).join('')}</section>`;
  }

  /* ───────────────────────── view: tickets ───────────────────────── */
  const TICKET_FILTERS = [['all', 'All'], ['Open', 'Open'], ['InProgress', 'In progress'], ['Resolved', 'Resolved'], ['Closed', 'Closed']];
  function renderTickets() {
    const f = state.tfilter;
    const list = TICKETS.filter((t) => f === 'all' || t.status === f);
    const active = TICKETS.filter((t) => t.status === 'Open' || t.status === 'InProgress').length;
    const urgent = TICKETS.filter((t) => t.priority === 'urgent' && (t.status === 'Open' || t.status === 'InProgress')).length;
    return `${topbar('Tickets', `${active} active · ${urgent} urgent`)}
      <div class="content">
        <div class="filters" role="group" aria-label="Ticket status" style="margin-bottom:12px">${TICKET_FILTERS.map(([k, l]) => `<button class="pill ${f === k ? 'on' : ''}" data-act="tfilter" data-s="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
        <div class="list">${list.length ? list.map(ticketCard).join('') : emptyState('ticket', 'No tickets here', 'Create one from a chat or with the button below.')}</div>
      </div>
      <button class="fab" data-act="new-ticket">${ic('plus')}New ticket</button>`;
  }

  const statusChip = (s) => {
    const map = { Open: ['chip hot', 'Open'], InProgress: ['chip', 'In progress'], Resolved: ['chip ok', 'Resolved'], Closed: ['chip', 'Closed'] };
    const [cls, label] = map[s] || ['chip', s];
    return `<span class="${cls}">${label}</span>`;
  };
  const priorityChip = (p) => (p === 'urgent' ? '<span class="chip urgent">Urgent</span>' : p === 'high' ? '<span class="chip hot">High</span>' : '');

  function ticketCard(t) {
    const ct = contactById(t.contact);
    const a = userById(t.assignee);
    return `<button class="tk" data-act="open-ticket" data-id="${t.id}">
      <div class="tk-top"><span>${t.id}</span><span>${new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
      <h3>${esc(t.subject)}</h3>
      <div class="tk-foot">${statusChip(t.status)}${priorityChip(t.priority)}<span class="chip">${esc(ct ? ct.name : '—')}</span><span class="chip">${a ? ic('user') + esc(firstName(a)) : 'Unassigned'}</span></div>
    </button>`;
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
      rows += `<button class="crow" data-act="info" data-id="${c.id}">${av(c)}<span class="crow-body"><b>${esc(c.name)}</b><small>${VERTICALS[c.vertical]}${c.city ? ' · ' + esc(c.city) : ''}</small></span>${ic('chevron')}</button>`;
    }
    const bfsi = CONTACTS.filter((c) => c.vertical === 'bfsi').length;
    return `${topbar('Contacts', `${CONTACTS.length} people · ${bfsi} BFSI`)}
      <div class="content">
        <label class="searchbar">${ic('search')}<input data-key="cq" data-model="cq" data-live type="search" placeholder="Search name, email or phone" value="${esc(state.cq)}" aria-label="Search contacts"></label>
        <div class="list">${rows || emptyState('users', 'No matches', 'Try a different name.')}</div>
      </div>
      <button class="fab" data-act="new-contact">${ic('userPlus')}New contact</button>`;
  }

  /* ───────────────────────── view: conversation layer ───────────────────────── */
  function renderConv(c) {
    const ct = contactOf(c);
    const a = userById(c.assignee);
    const sub = c.mode === 'bot' ? '✦ AI assistant' : a ? `Assigned to ${firstName(a)}` : 'Unassigned';
    const bar = c.status === 'closed'
      ? `<div class="bar closed">${ic('check')}<span>Closed</span><button class="btn ghost sm" data-act="reopen">Reopen</button></div>`
      : c.status === 'snoozed'
        ? `<div class="bar snooze">${ic('clock')}<span>Snoozed until ${clockFull(c.snoozeUntil)}</span><button class="btn ghost sm" data-act="unsnooze">Wake now</button></div>`
        : c.mode === 'bot'
          ? `<div class="bar ai">${ic('spark')}<span>AI is handling this chat</span><button class="btn purple sm" data-act="take-over">Take over</button></div>`
          : '';
    const typing = state.typing === c.id ? '<div class="typing" role="status" aria-label="AI is typing"><i></i><i></i><i></i></div>' : '';
    return `<section class="layer" role="dialog" aria-label="Conversation with ${esc(ct.name)}">
      <header class="conv-head">
        <button class="icon-btn" data-act="close-conv" aria-label="Back to inbox">${ic('back')}</button>
        <button class="head-id" data-act="info" data-id="${ct.id}">${av(ct, 'sm')}<span><b>${esc(ct.name)}</b><small>${esc(c.channel)} · ${esc(sub)}</small></span></button>
        <button class="icon-btn accent" data-act="call-start" aria-label="Start voice call">${ic('phone')}</button>
        <button class="icon-btn" data-act="menu" aria-label="More actions">${ic('more')}</button>
      </header>
      ${bar}
      <div class="msgs" role="log" aria-live="polite">${c.messages.map((m) => renderMsg(m, c)).join('')}${typing}</div>
      ${c.pendingDraft ? reviewStrip(c) : ''}
      ${c.status === 'closed' ? '' : composer(c)}
    </section>`;
  }

  function renderMsg(m, c) {
    if (m.from === 'system') {
      return m.type === 'call'
        ? `<div class="sys">${ic('phone')}Voice call · ${fmtDur(m.dur)}</div>`
        : `<div class="sys">${esc(m.text)}</div>`;
    }
    const cls = m.from === 'agent' ? 'out' : m.from === 'bot' ? 'ai' : 'in';
    const who = m.from === 'agent' ? (userById(m.author)?.name || 'Agent') : m.from === 'bot' ? '✦ AI assistant' : contactOf(c).name;
    const buttons = m.buttons && m.buttons.length
      ? `<div class="qrs">${m.buttons.map((b) => `<button class="qr" data-act="qr" data-text="${esc(b)}">${esc(b)}</button>`).join('')}</div>`
      : '';
    const reviewed = m.reviewed ? `<span class="reviewed">${ic('check')}${esc(m.reviewed)}</span>` : '';
    return `<div class="msg ${cls} ${m.type === 'carousel' ? 'wide' : ''}">
      <span class="who">${esc(who)} · ${clock(m.time)}</span>${body(m)}${reviewed}${buttons}
    </div>`;
  }

  function body(m) {
    switch (m.type) {
      case 'image':
        return `<div class="bubble media"><figure class="img"><div class="img-frame" style="--tone:${m.tone || '#E7C9A5'}">${m.src ? `<img src="${m.src}" alt="${esc(m.name)}">` : ic('image')}</div><figcaption>${esc(m.name)}</figcaption></figure></div>`;
      case 'file':
        return `<div class="bubble"><div class="file">${ic('file')}<span><b>${esc(m.name)}</b><small>${fmtSize(m.size || 180000)}</small></span></div></div>`;
      case 'voice': {
        const bars = Array.from({ length: 24 }, (_, i) => `<i style="height:${30 + ((i * 37 + m.dur * 11) % 65)}%"></i>`).join('');
        return `<div class="bubble"><div class="voice"><button class="play" data-act="play" data-id="${m.id}" aria-label="${m.playing ? 'Pause' : 'Play'} voice note">${ic(m.playing ? 'pause' : 'play')}</button><div class="wave" aria-hidden="true">${bars}</div><small>${fmtDur(m.dur)}</small></div></div>`;
      }
      case 'carousel': {
        const intro = m.text ? `<div class="bubble"><p>${esc(m.text)}</p></div>` : '';
        const cards = m.items.map((it) => `<article class="car-card" role="listitem">
          <div class="car-img" style="--tone:${it.tone}">${ic('tag')}</div>
          <div class="body"><b>${esc(it.title)}</b><small>${esc(it.sub)}</small>
            <div class="car-meta"><strong>${esc(it.meta)}</strong></div>
            <div class="qrs">${it.actions.map((a) => `<button class="qr" data-act="qr" data-text="${esc(a)}">${esc(a)}</button>`).join('')}</div>
          </div></article>`).join('');
        return `${intro}${state.rules.carousel ? `<div class="carousel" role="list">${cards}</div>` : `<div class="bubble"><p>Product cards are turned off in bot rules.</p></div>`}`;
      }
      case 'call':
        return '';
      default:
        return `<div class="bubble"><p>${esc(m.text)}</p></div>`;
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
    return `<footer class="composer ${state.draft.trim() ? 'has-text' : ''}">${top}
      <div class="comp-row">
        <button class="icon-btn" data-act="attach" aria-label="Attach photo or file">${ic('clip')}</button>
        <textarea data-draft rows="1" aria-label="Message" placeholder="${c.mode === 'bot' ? 'Message as visitor…' : `Reply to ${esc(first)}…`}">${esc(state.draft)}</textarea>
        <button class="icon-btn mic" data-act="rec-start" aria-label="Record voice note">${ic('mic')}</button>
        <button class="icon-btn send" data-act="send" aria-label="Send">${ic('send')}</button>
      </div></footer>`;
  }

  function renderCall() {
    const c = convById(state.call.convId);
    const ct = contactOf(c);
    const elapsed = Math.floor((Date.now() - state.call.start) / 1000);
    return `<section class="call" role="dialog" aria-label="Voice call with ${esc(ct.name)}">
      <p class="eyebrow">Voice call · ${esc(c.channel)}</p>
      ${av(ct, 'lg')}
      <h2>${esc(ct.name)}</h2>
      <p class="timer" id="call-time">${fmtDur(elapsed)}</p>
      <div class="ctrls">
        <div><button class="ctrl ${state.call.muted ? 'on' : ''}" data-act="call-mute" aria-pressed="${state.call.muted}" aria-label="Mute">${ic('mic')}</button><span class="ctrl-label">${state.call.muted ? 'Muted' : 'Mute'}</span></div>
        <div><button class="ctrl ${state.call.speaker ? 'on' : ''}" data-act="call-speaker" aria-pressed="${state.call.speaker}" aria-label="Speaker">${ic('volume')}</button><span class="ctrl-label">Speaker</span></div>
        <div><button class="ctrl end" data-act="call-end" aria-label="End call">${ic('phone')}</button><span class="ctrl-label">End</span></div>
      </div>
    </section>`;
  }

  function renderToast() {
    const t = state.toast;
    return `<div class="toast" role="status"><span>${esc(t.msg)}</span>${t.undo ? '<button data-act="undo">Undo</button>' : ''}</div>`;
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
    state.form = f;
  }

  function rowBtn(act, icon, title, sub, data = {}) {
    return `<button class="row-btn" data-act="${act}" ${attrs(data)}>${ic(icon)}<span><b>${title}</b><small>${sub}</small></span>${ic('chevron')}</button>`;
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
              ${av(u)}<span><b>${esc(u.name)}${u.id === state.me ? ' (you)' : ''}</b><small>${u.role === 'admin' ? 'Admin · all privileges' : 'Agent'}</small></span>
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
        const ct = contactById(s.id);
        title = 'Visitor info';
        body = infoBody(ct);
        break;
      }
      case 'ticket': {
        const t = ticketById(s.id);
        title = t.id;
        body = ticketBody(t);
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
        const macros = [
          ['Patience', 'Thanks for your patience. We are on it.'],
          ['Refund', 'Your refund has been processed. Allow 3 to 5 working days.'],
          ['Order no.', 'Happy to help. Could you share your order number?'],
        ];
        title = `Reply to ${n} chat${n === 1 ? '' : 's'}`;
        body = `<div class="sheet-body">
          <p class="note">${ic('reply')}Each visitor sees this in their own thread.</p>
          <div class="sugg">${macros.map(([l, t]) => `<button class="chip pick" data-act="macro" data-text="${esc(t)}">${esc(l)}</button>`).join('')}</div>
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
          ${rowBtn('rec-start', 'mic', 'Voice note', 'Record and send a short message', {})}
        </div>`;
        break;
      }
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
    const armed = state.armed === ct.id;
    return `<div class="sheet-body">
      <div class="profile">${av(ct, 'lg')}<h2>${esc(ct.name)}</h2><span class="note">${VERTICALS[ct.vertical]}${ct.city ? ' · ' + esc(ct.city) : ''}</span></div>
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
        <div class="tk-top"><span>${t.id}</span>${priorityChip(t.priority)}</div>
        <h3 style="font:600 18px/1.3 var(--font-ui);margin:0 0 8px">${esc(t.subject)}</h3>
        <p class="note">${ic('user')}${esc(ct ? ct.name : 'No contact')}</p>
      </section>
      <p class="label">Status</p>
      <div class="filters">${statuses.map(([k, l]) => `<button class="pill ${t.status === k ? 'on' : ''}" data-act="ticket-status" data-id="${t.id}" data-v="${k}" aria-pressed="${t.status === k}">${l}</button>`).join('')}</div>
      <p class="label">Assignee</p>
      <div class="filters">${USERS.map((u) => {
        const locked = u.id !== state.me && !can('assignOthers');
        return `<button class="pill ${t.assignee === u.id ? 'on' : ''}" data-act="ticket-assign" data-id="${t.id}" data-user="${u.id}" aria-pressed="${t.assignee === u.id}" aria-disabled="${locked}">${locked ? ic('lock') : ''}${esc(firstName(u))}</button>`;
      }).join('')}</div>
      ${conv ? rowBtn('conv', 'inbox', 'Open linked chat', `${esc(contactOf(conv).name)} · ${esc(conv.channel)}`, { id: conv.id }) : ''}
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
    state.draft = state.drafts[id] || '';
    state.aiHint = false;
    state.scrollBottom = true;
  }

  function closeConv() {
    if (state.convId) state.drafts[state.convId] = state.draft;
    state.convId = null;
    state.draft = '';
    state.aiHint = false;
    state.rec = null;
  }

  function sendMessage() {
    const c = current();
    const text = state.draft.trim();
    if (!c || !text) return;
    state.draft = '';
    state.aiHint = false;
    state.scrollBottom = true;
    if (c.mode === 'bot') { visitorSend(c, text); return; }
    c.messages.push(M('agent', 'text', { text, author: state.me }));
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
    state.draft = `Hi ${first}, thanks for the details. ${body} Is there anything else I should look at?`;
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

  function assignTo(ids, uid) {
    if (uid !== state.me && deny('assignOthers')) return;
    const who = userById(uid);
    ids.forEach((id) => {
      const c = convById(id);
      c.assignee = uid;
      sys(c, `Assigned to ${who.name}`);
    });
    state.sheet = null;
    endSelection();
    toast(ids.length > 1 ? `Assigned ${ids.length} chats to ${firstName(who)}` : `Assigned to ${firstName(who)}`);
  }

  function snoozeChats(ids, key) {
    const until = snoozeUntilFor(key);
    ids.forEach((id) => {
      const c = convById(id);
      c.status = 'snoozed';
      c.snoozeUntil = until;
      sys(c, `Snoozed by ${firstName(me())}`);
    });
    state.sheet = null;
    endSelection();
    toast(`Snoozed until ${clockFull(until)}`);
  }

  function closeChats(ids) {
    const prev = ids.map((id) => [id, convById(id).status]);
    ids.forEach((id) => {
      const c = convById(id);
      c.status = 'closed';
      sys(c, `Closed by ${firstName(me())}`);
    });
    state.sheet = null;
    endSelection();
    toast(ids.length > 1 ? `Closed ${ids.length} chats` : 'Chat closed', () => {
      prev.forEach(([id, status]) => { const c = convById(id); if (c) c.status = status === 'closed' ? 'open' : status; });
    });
  }

  function endSelection() {
    state.selecting = false;
    state.selected = [];
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
    ids.forEach((id) => {
      const c = convById(id);
      takeOver(c);
      c.messages.push(M('agent', 'text', { text, author: state.me }));
      c.unread = 0;
    });
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
    const t = {
      id: 'TT' + String(100000 + Math.floor(Math.random() * 899999)),
      subject: f.subject.trim(),
      contact: f.contact,
      status: 'Open',
      priority: f.priority || 'normal',
      assignee: state.me,
      createdAt: new Date().toISOString(),
      conv: f.conv || null,
      desc: f.desc || '',
    };
    TICKETS.unshift(t);
    if (f.conv) sys(convById(f.conv), `Ticket ${t.id} created`);
    state.sheet = null;
    state.form = {};
    toast(`Ticket ${t.id} created`);
  }

  function createContact() {
    const f = state.form;
    if (!(f.name || '').trim()) { toast('Add a name for the contact'); return; }
    const ct = {
      id: 'c' + uid(),
      name: f.name.trim(),
      phone: (f.phone || '').trim() || '—',
      email: (f.email || '').trim() || '—',
      city: '',
      vertical: f.vertical || 'other',
      tags: [],
      since: new Date().toLocaleDateString([], { month: 'short', year: 'numeric' }),
      ltv: '—',
      hue: Math.floor(Math.random() * 360),
      attrs: {},
    };
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
    toast(`Voice note sent · ${fmtDur(dur)}`);
  }

  function act(name, el) {
    const d = el.dataset;
    const id = d.id;
    const c = current();
    switch (name) {
      case 'theme':
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        saveTheme(state.theme);
        break;
      case 'role':
        state.me = d.role === 'admin' ? 'u-ayo' : 'u-sara';
        state.sheet = null;
        toast(`Viewing as ${me().name} · ${me().role === 'admin' ? 'Admin' : 'Agent'}`);
        break;
      case 'tab':
        state.tab = d.tab;
        endSelection();
        break;
      case 'filter':
        state.filter = d.f;
        state.selected = [];
        break;
      case 'select-mode':
        state.selecting = true;
        state.selected = [];
        break;
      case 'select-exit':
        endSelection();
        break;
      case 'conv':
        if (state.selecting) {
          state.selected = state.selected.includes(id) ? state.selected.filter((x) => x !== id) : [...state.selected, id];
        } else {
          openConv(id);
        }
        break;
      case 'close-conv':
        closeConv();
        break;
      case 'bulk':
        bulk(d.do);
        break;
      case 'bot-tab':
        state.botTab = d.t;
        break;
      case 'rule':
        if (deny('botRules')) break;
        state.rules[d.k] = !state.rules[d.k];
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
        if (open) openConv(open.id);
        else toast('No open chat with this contact');
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
      case 'add-label':
        addLabel(d.label);
        break;
      case 'add-label-input':
        addLabel(state.labelIn);
        break;
      case 'remove-label': {
        const ct = contactById(state.sheet.id);
        ct.tags = ct.tags.filter((t) => t !== d.label);
        break;
      }
      case 'delete-contact':
        deleteContact();
        break;
      case 'qr':
        if (c) visitorSend(c, d.text);
        break;
      case 'send':
        sendMessage();
        break;
      case 'ai-draft':
        if (c) aiDraft();
        break;
      case 'attach':
        openSheet('attach');
        break;
      case 'pick':
        state.sheet = null;
        fileInput.accept = d.accept;
        fileInput.click();
        break;
      case 'rec-start':
        state.sheet = null;
        state.rec = { start: Date.now() };
        break;
      case 'rec-cancel':
        state.rec = null;
        break;
      case 'rec-send':
        if (c && state.rec) finishRecording();
        break;
      case 'call-start':
        if (c) state.call = { convId: c.id, start: Date.now(), muted: false, speaker: false };
        break;
      case 'call-mute':
        state.call.muted = !state.call.muted;
        break;
      case 'call-speaker':
        state.call.speaker = !state.call.speaker;
        break;
      case 'call-end':
        endCall();
        break;
      case 'play': {
        const m = c && c.messages.find((x) => x.id === id);
        if (m) m.playing = !m.playing;
        break;
      }
      case 'rev-approve':
        approve(id || state.convId);
        break;
      case 'rev-reject':
        reject(id || state.convId);
        break;
      case 'rev-edit':
        openSheet('edit-draft', id || state.convId);
        break;
      case 'draft-save':
        saveDraft(id);
        break;
      case 'macro':
        state.form.text = d.text;
        break;
      case 'bulk-send':
        bulkSend();
        break;
      case 'close-sheet':
        state.sheet = null;
        state.armed = null;
        break;
      case 'undo':
        if (state.toast && state.toast.undo) state.toast.undo();
        state.toast = null;
        break;
      default:
        break;
    }
  }

  /* ───────────────────────── event wiring ───────────────────────── */
  root.addEventListener('click', (e) => {
    if (state.longFired) { state.longFired = false; e.preventDefault(); return; }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return; // locked controls stay clickable so their handler can explain why
    act(el.dataset.act, el);
    render();
  });

  root.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.draft !== undefined) {
      state.draft = el.value;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      const comp = el.closest('.composer');
      if (comp) comp.classList.toggle('has-text', !!el.value.trim());
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
    if (el.dataset && el.dataset.form) state.form[el.dataset.form] = el.value;
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.target.dataset && e.target.dataset.key === 'labelIn') {
        e.preventDefault();
        addLabel(state.labelIn);
        render();
        return;
      }
      if (e.target.dataset && e.target.dataset.draft !== undefined) {
        e.preventDefault();
        sendMessage();
        render();
        return;
      }
      if (e.target.classList && e.target.classList.contains('conv')) {
        e.target.click();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.sheet) state.sheet = null;
    else if (state.call) return;
    else if (state.convId) closeConv();
    else if (state.selecting) endSelection();
    else return;
    state.armed = null;
    render();
  });

  /* Long-press a chat card to enter multi-select. */
  let pressTimer = null;
  root.addEventListener('pointerdown', (e) => {
    state.longFired = false;
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
      if (f.type.startsWith('image/')) c.messages.push(M(from, 'image', { name: f.name, src: URL.createObjectURL(f), tone: '#E7C9A5', author: state.me }));
      else c.messages.push(M(from, 'file', { name: f.name, size: f.size, author: state.me }));
    });
    state.scrollBottom = true;
    toast(`${files.length} file${files.length > 1 ? 's' : ''} sent`);
    render();
  });

  /* Live timers for the call and voice-note recorder. */
  setInterval(() => {
    const t = document.getElementById('call-time');
    if (t && state.call) t.textContent = fmtDur(Math.floor((Date.now() - state.call.start) / 1000));
    const r = document.getElementById('rec-time');
    if (r && state.rec) r.textContent = fmtDur(Math.floor((Date.now() - state.rec.start) / 1000));
  }, 500);

  render();
})();
