/* ============================================================
   core.js — funções compartilhadas entre o site (script.js) e o painel (admin.js)
   Não precisa editar. Os textos e fotos do site ficam em dados.js e são
   alterados pelo painel admin.html.
   ============================================================ */

const DRAFT_KEY = 'sportrodas_rascunho_v1';

/* ---------- Utilitários básicos ---------- */
function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Junta os dados padrão (dados.js) com os dados editados. Listas são substituídas por inteiro.
function deepMerge(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? clone(base) : clone(over);
    const out = {};
    new Set([...Object.keys(base), ...Object.keys(over)]).forEach(k => {
        if (!(k in over)) out[k] = clone(base[k]);
        else if (isObj(base[k]) && isObj(over[k])) out[k] = deepMerge(base[k], over[k]);
        else out[k] = clone(over[k]);
    });
    return out;
}

function getPath(obj, path) {
    return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
    const keys = String(path).split('.');
    const last = keys.pop();
    let o = obj;
    keys.forEach(k => {
        if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(last) ? [] : {};
        o = o[k];
    });
    o[last] = value;
}

/* ---------- Carregar / salvar rascunho (somente neste navegador) ---------- */
function getBaseData() {
    if (typeof defaultSiteData !== 'undefined') return defaultSiteData;
    console.error('dados.js não foi carregado. Verifique se o arquivo dados.js está na mesma pasta do site.');
    return null;
}

function readDraft() {
    try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
        return d && d.data ? d : null;
    } catch (e) { return null; }
}

// O rascunho só vale enquanto o dados.js publicado for o mesmo em que ele foi baseado.
// Quando um novo dados.js é publicado, o rascunho antigo é descartado automaticamente.
function loadSiteData() {
    const base = getBaseData() || {};
    const draft = readDraft();
    if (draft && draft.basedOn === base._version) {
        return { data: deepMerge(base, draft.data), fromDraft: true };
    }
    return { data: clone(base), fromDraft: false };
}

function saveDraft(data) {
    try {
        const base = getBaseData() || {};
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ basedOn: base._version, savedAt: Date.now(), data }));
        return true;
    } catch (e) { return false; }
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignora */ } }

/* ---------- Links úteis ---------- */
function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
function waUrl(data, message) {
    const n = onlyDigits(data && data.contact && data.contact.whatsapp);
    if (!n) return '';
    return 'https://wa.me/' + (n.length <= 11 ? '55' + n : n) + (message ? '?text=' + encodeURIComponent(message) : '');
}
function telUrl(phone) {
    const n = onlyDigits(phone);
    if (!n) return '';
    return 'tel:+' + (n.length <= 11 ? '55' + n : n);
}
function mapEmbedUrl(loc) {
    if (!loc) return '';
    if (loc.mapEmbedUrl) return loc.mapEmbedUrl;
    const lat = String(loc.lat || '').trim(), lng = String(loc.lng || '').trim();
    const z = loc.zoom || 17;
    if (lat && lng) return `https://maps.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}&z=${z}&output=embed`;
    if (loc.address) return `https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}&z=${z}&output=embed`;
    return '';
}

/* ---------- Cores e tema ---------- */
const FONT_OPTIONS = [
    { name: 'Playfair Display', kind: 'serif', q: 'Playfair+Display:wght@500;600;700' },
    { name: 'Montserrat', kind: 'sans-serif', q: 'Montserrat:wght@400;500;600;700' },
    { name: 'Poppins', kind: 'sans-serif', q: 'Poppins:wght@400;500;600;700' },
    { name: 'Lora', kind: 'serif', q: 'Lora:wght@400;500;600;700' },
    { name: 'Merriweather', kind: 'serif', q: 'Merriweather:wght@400;700' },
    { name: 'Cormorant Garamond', kind: 'serif', q: 'Cormorant+Garamond:wght@500;600;700' },
    { name: 'DM Serif Display', kind: 'serif', q: 'DM+Serif+Display' },
    { name: 'Oswald', kind: 'sans-serif', q: 'Oswald:wght@400;500;600;700' },
    { name: 'Raleway', kind: 'sans-serif', q: 'Raleway:wght@400;500;600;700' },
    { name: 'Nunito', kind: 'sans-serif', q: 'Nunito:wght@400;500;600;700' },
    { name: 'Open Sans', kind: 'sans-serif', q: 'Open+Sans:wght@400;500;600;700' },
    { name: 'Lato', kind: 'sans-serif', q: 'Lato:wght@400;700' }
];

function parseHex(hex, fallback) {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback || [0, 0, 0];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex(rgb) { return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mixColors(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
function luminance(rgb) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}

function applyTheme(t) {
    t = t || {};
    const root = document.documentElement.style;
    const accent = parseHex(t.accent, [224, 160, 58]);
    const bg = parseHex(t.bg, [21, 16, 12]);
    const text = parseHex(t.text, [246, 239, 230]);
    const set = (k, v) => root.setProperty(k, v);
    set('--accent', toHex(accent));
    set('--accent-hover', toHex(mixColors(accent, [0, 0, 0], 0.18)));
    set('--accent-rgb', accent.join(','));
    set('--accent2', t.accent2 || '#c8553d');
    set('--bg-primary', toHex(bg));
    set('--bg-rgb', bg.join(','));
    set('--bg-secondary', t.bgAlt || '#1d1611');
    set('--bg-card', t.card || '#271d16');
    set('--text-main', toHex(text));
    set('--text-muted', t.muted || '#bba99a');
    set('--border-color', toHex(mixColors(bg, text, 0.16)));
    set('--on-accent', luminance(accent) > 0.45 ? '#1a120b' : '#ffffff');

    const find = n => FONT_OPTIONS.find(f => f.name === n);
    const hf = find(t.headingFont) || FONT_OPTIONS[0];
    const bf = find(t.bodyFont) || FONT_OPTIONS[1];
    set('--font-heading', `'${hf.name}', ${hf.kind}`);
    set('--font-body', `'${bf.name}', ${bf.kind}`);

    const fams = [...new Set([hf, bf])].map(f => 'family=' + f.q).join('&');
    const href = 'https://fonts.googleapis.com/css2?' + fams + '&display=swap';
    let link = document.getElementById('gfonts');
    if (!link) {
        link = document.createElement('link');
        link.id = 'gfonts';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
}

/* ---------- SHA-256 (usado só para proteger a senha do painel) ---------- */
function sha256(message) {
    const bytes = Array.from(new TextEncoder().encode(message));
    const K = [], H0 = [];
    const isPrime = n => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
    for (let c = 2, n = 0; n < 64; c++) {
        if (!isPrime(c)) continue;
        if (n < 8) H0[n] = (Math.pow(c, 1 / 2) % 1) * 4294967296 | 0;
        K[n++] = (Math.pow(c, 1 / 3) % 1) * 4294967296 | 0;
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    [hi, lo].forEach(v => bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255));
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    let H = H0.slice();
    for (let i = 0; i < bytes.length; i += 64) {
        const w = new Array(64);
        for (let t = 0; t < 16; t++) w[t] = (bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3];
        for (let t = 16; t < 64; t++) {
            const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
            const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
            w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let t = 0; t < 64; t++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

/* ---------- SEO: bloco <head> gravado no index.html ao publicar ---------- */
function buildSeoBlock(data) {
    const seo = data.seo || {};
    const siteUrl = String(seo.siteUrl || '').replace(/\/+$/, '');
    const abs = p => (!p ? '' : (/^(https?:)?\/\//i.test(p) || !siteUrl) ? p : siteUrl + '/' + p.replace(/^\.?\//, ''));
    const title = seo.title || ((data.brand && data.brand.name) || 'Sport Rodas');
    const desc = seo.description || '';
    const image = abs((data.hero && (data.hero.sideImage || data.hero.bgImage)) || '');
    const loc = data.location || {}, contact = data.contact || {};
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        name: (data.brand && data.brand.fullName) || title,
        description: desc,
        image: image || undefined,
        url: siteUrl || undefined,
        telephone: contact.landline || contact.phone || undefined,
        address: loc.address ? { '@type': 'PostalAddress', streetAddress: loc.address, addressCountry: 'BR' } : undefined,
        geo: (loc.lat && loc.lng) ? { '@type': 'GeoCoordinates', latitude: Number(loc.lat), longitude: Number(loc.lng) } : undefined,
        hasMap: contact.mapsUrl || undefined,
        sameAs: (contact.socials || []).map(s => s.url).filter(u => /^https?:/i.test(u || ''))
    };
    const lines = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(desc)}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${esc(title)}">`,
        `<meta property="og:description" content="${esc(desc)}">`,
        image ? `<meta property="og:image" content="${esc(image)}">` : '',
        siteUrl ? `<meta property="og:url" content="${esc(siteUrl)}/">` : '',
        siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}/">` : '',
        `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
    ].filter(Boolean);
    return '<!--SEO:START-->\n    ' + lines.join('\n    ') + '\n    <!--SEO:END-->';
}
