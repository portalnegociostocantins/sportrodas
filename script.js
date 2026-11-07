/* ============================================================
   script.js — monta o site público a partir dos dados (dados.js + rascunho do painel)
   Não precisa editar: use o painel admin.html.
   ============================================================ */
(function () {
    'use strict';

    const base = getBaseData();
    if (!base) {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.insertAdjacentHTML('afterbegin', '<div style="background:#b00020;color:#fff;padding:12px;text-align:center;font-family:sans-serif;">Erro: arquivo <strong>dados.js</strong> não encontrado. Envie o dados.js junto com os demais arquivos do site.</div>');
        });
        return;
    }

    const loaded = loadSiteData();
    let D = loaded.data;
    const IN_PREVIEW = window.parent !== window;           // dentro da prévia do painel
    const state = { svcTab: 0, lbIndex: 0 };
    const cache = {};

    const $ = (sel, root) => (root || document).querySelector(sel);
    const ANCHOR = { hero: 'inicio', stats: 'numeros', lines: 'linhas', services: 'servicos', process: 'como-funciona', why: 'diferenciais', gallery: 'galeria', about: 'sobre', reviews: 'avaliacoes', faq: 'duvidas', location: 'localizacao', cta: 'orcamento' };
    const lines = (txt) => String(txt || '').split('\n').map(s => s.trim()).filter(Boolean);
    const iconHtml = (cls, fallback) => `<i class="${esc(cls || fallback || 'fas fa-utensils')}" aria-hidden="true"></i>`;
    const bgStyle = (url) => url ? `style="background-image:url('${esc(url)}')"` : '';

    function sectionHead(o) {
        if (!o) return '';
        return `<div class="section-title">
            ${o.subtitle ? `<span class="section-subtitle">${esc(o.subtitle)}</span>` : ''}
            ${o.title ? `<h2>${esc(o.title)}</h2>` : ''}
            ${o.desc ? `<p>${esc(o.desc)}</p>` : ''}
        </div>`;
    }

    /* ---------------- Cabeçalho ---------------- */
    function renderHeader() {
        const b = D.brand || {};
        const secs = (D.sections || []).filter(s => s.visible && s.inNav && ANCHOR[s.id]);
        const wa = waUrl(D, D.contact.waMessage);
        const ctaHref = wa || D.contact.mapsUrl || '#contato';
        const logo = b.logoImage
            ? `<img class="logo-img" style="--logo-h:${Number(b.logoHeight) || 64}px" src="${esc(b.logoImage)}" alt="${esc(b.fullName || b.name)}">`
            : `<span class="logo-title">${esc(b.name)}</span>`;
        return `<div class="container nav-container">
            <a class="logo" href="#inicio" aria-label="${esc(b.fullName || b.name)}">
                ${logo}
                ${b.sub && !b.logoImage ? `<span class="logo-sub">${esc(b.sub)}</span>` : ''}
            </a>
            <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span></button>
            <nav class="nav-menu" id="nav-menu">
                ${secs.map(s => `<a href="#${ANCHOR[s.id]}">${esc(s.navLabel)}</a>`).join('')}
                ${D.nav && D.nav.ctaLabel ? `<a href="${esc(ctaHref)}" ${wa || /^https?:/.test(ctaHref) ? 'target="_blank" rel="noopener"' : ''} class="btn-nav">${esc(D.nav.ctaLabel)}</a>` : ''}
            </nav>
        </div>`;
    }

    /* ---------------- Seções ---------------- */
    function rHero() {
        const h = D.hero || {};
        const wa = waUrl(D, D.contact.waMessage);
        const maps = D.contact.mapsUrl;
        const btns = [
            wa && h.btnWa ? `<a href="${esc(wa)}" target="_blank" rel="noopener" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i><span>${esc(h.btnWa)}</span></a>` : '',
            maps && h.btnMaps ? `<a href="${esc(maps)}" target="_blank" rel="noopener" class="btn btn-outline"><i class="fas fa-location-dot"></i><span>${esc(h.btnMaps)}</span></a>` : '',
            h.btn3Label && h.btn3Url ? `<a href="${esc(h.btn3Url)}" ${/^https?:/.test(h.btn3Url) ? 'target="_blank" rel="noopener"' : ''} class="btn btn-outline"><i class="fas fa-utensils"></i><span>${esc(h.btn3Label)}</span></a>` : ''
        ].join('');
        const chips = (h.chips || []).filter(c => c.text).map(c => `<li>${iconHtml(c.icon)}<span>${esc(c.text)}</span></li>`).join('');
        return `<section id="inicio" class="hero" ${bgStyle(h.bgImage)}>
            <div class="overlay"></div>
            <div class="container hero-grid ${(h.sideImage || h.emblemValue) ? 'has-visual' : ''}">
                <div class="hero-content">
                    ${h.badge ? `<span class="badge">${esc(h.badge)}</span>` : ''}
                    <h1>${esc(h.title)}</h1>
                    ${h.desc ? `<p class="hero-desc">${esc(h.desc)}</p>` : ''}
                    ${btns ? `<div class="hero-btns">${btns}</div>` : ''}
                    ${chips ? `<ul class="hero-chips">${chips}</ul>` : ''}
                </div>
                ${h.sideImage ? `<div class="hero-visual"><img src="${esc(h.sideImage)}" alt="${esc(h.title)}"></div>` : (h.emblemValue ? `<div class="hero-emblem"><strong>${esc(h.emblemValue)}</strong><span>${esc(h.emblemLabel)}</span></div>` : '')}
            </div>
        </section>`;
    }

    function rStats() {
        const items = ((D.stats || {}).items || []).filter(i => i.value || i.label);
        return `<section id="numeros" class="stats"><div class="container stats-grid">
            ${items.map(i => `<div class="stat"><strong>${esc(i.value)}</strong><span>${esc(i.label)}</span></div>`).join('')}
        </div></section>`;
    }

    function rLines() {
        const o = D.lines || {};
        const wa = (t) => waUrl(D, `Olá! Gostaria de um orçamento para: ${t}.`);
        return `<section id="linhas" class="section lines"><div class="container">
            ${sectionHead(o)}
            <div class="lines-grid">${(o.items || []).map(it => {
                const w = wa(it.title);
                const bl = lines(it.bullets);
                return `<article class="line-card ${it.image ? 'has-photo' : ''}">
                    ${it.image ? `<div class="line-photo"><img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy"></div>` : ''}
                    <div class="line-body">
                        <div class="line-icon">${iconHtml(it.icon, 'fas fa-gear')}</div>
                        <h3>${esc(it.title)}</h3>
                        ${it.subtitle ? `<span class="line-sub">${esc(it.subtitle)}</span>` : ''}
                        ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
                        ${bl.length ? `<ul class="check-list">${bl.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
                        ${w && it.btnLabel ? `<a class="btn btn-whatsapp" href="${esc(w)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> ${esc(it.btnLabel)}</a>` : ''}
                    </div></article>`;
            }).join('')}</div></div></section>`;
    }

    function priceHtml(it) {
        const price = String(it.price || '').trim();
        if (!price) return '';
        if (/consulte|orçamento|orcamento/i.test(price)) {
            const wa = waUrl(D, `Olá! Gostaria de um orçamento para: ${it.name}.`);
            if (wa) return `<a class="price-tag price-link" href="${esc(wa)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> ${esc(price)}</a>`;
        }
        return `<span class="price-tag">${esc(price)}</span>`;
    }

    function rServices() {
        const m = D.services || {};
        const cats = (m.categories || []).filter(c => c.name || (c.items || []).length);
        if (state.svcTab >= cats.length) state.svcTab = 0;
        const tabs = cats.length > 1
            ? `<div class="tabs" role="tablist">${cats.map((c, i) => `<button type="button" role="tab" class="tab ${i === state.svcTab ? 'active' : ''}" data-svctab="${i}" aria-selected="${i === state.svcTab}">${esc(c.name)}</button>`).join('')}</div>` : '';
        const cat = cats[state.svcTab] || { items: [] };
        const cards = (cat.items || []).map(it => `<article class="menu-card ${it.photo ? 'has-photo' : ''}">
            ${it.photo ? `<div class="menu-photo"><img src="${esc(it.photo)}" alt="${esc(it.name)}" loading="lazy">${it.badge ? `<span class="menu-badge">${esc(it.badge)}</span>` : ''}</div>` : ''}
            <div class="menu-body">
                ${!it.photo && it.badge ? `<span class="menu-badge static">${esc(it.badge)}</span>` : ''}
                <h3>${esc(it.name)}</h3>
                ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
                ${priceHtml(it)}
            </div></article>`).join('');
        return `<section id="servicos" class="section menu"><div class="container">
            ${sectionHead(m)}${tabs}
            <div class="menu-grid">${cards || '<p class="today-empty">Nenhum item cadastrado nesta categoria.</p>'}</div>
            ${m.footnote ? `<p class="section-note">${esc(m.footnote)}</p>` : ''}
        </div></section>`;
    }

    function rProcess() {
        const o = D.process || {};
        const items = (o.items || []).filter(i => i.title);
        return `<section id="como-funciona" class="section process"><div class="container">
            ${sectionHead(o)}
            <div class="process-grid">${items.map((i, n) => `<div class="step"><span class="step-n">${n + 1}</span>
                <div class="step-icon">${iconHtml(i.icon, 'fas fa-check')}</div><h3>${esc(i.title)}</h3><p>${esc(i.desc)}</p></div>`).join('')}</div>
        </div></section>`;
    }

    function rWhy() {
        const h = D.why || {};
        const items = (h.items || []).filter(i => i.title || i.desc);
        return `<section id="diferenciais" class="section highlights"><div class="container">
            ${sectionHead(h)}
            <div class="highlight-grid">${items.map(i => `<div class="highlight-card">
                <div class="highlight-icon">${iconHtml(i.icon)}</div><h3>${esc(i.title)}</h3><p>${esc(i.desc)}</p></div>`).join('')}</div>
        </div></section>`;
    }

    function rFaq() {
        const o = D.faq || {};
        const items = (o.items || []).filter(i => i.q);
        if (!items.length) return '';
        return `<section id="duvidas" class="section faq"><div class="container narrow">
            ${sectionHead(o)}
            ${items.map(i => `<details class="faq-item"><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}
        </div></section>`;
    }

    function galleryPhotos() { return ((D.gallery && D.gallery.photos) || []).filter(p => p.src); }

    function rGallery() {
        const g = D.gallery || {};
        const photos = galleryPhotos();
        if (!photos.length) return '';
        return `<section id="galeria" class="section gallery">
            <div class="container">
                ${sectionHead(g)}
                <div class="gallery-grid">
                    ${photos.map((p, i) => `<button type="button" class="gallery-item" data-lb="${i}" aria-label="Ampliar foto: ${esc(p.caption || i + 1)}">
                        <img src="${esc(p.src)}" alt="${esc(p.caption || 'Foto do restaurante')}" loading="lazy">
                        ${p.caption ? `<span class="gallery-cap">${esc(p.caption)}</span>` : ''}
                    </button>`).join('')}
                </div>
            </div>
        </section>`;
    }

    function rAbout() {
        const a = D.about || {};
        const feats = (a.features || []).filter(f => f.text);
        return `<section id="sobre" class="section about">
            <div class="container about-grid ${a.image ? 'has-image' : ''}">
                ${a.image ? `<div class="about-image"><img src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy"></div>` : ''}
                <div class="about-text">
                    ${a.subtitle ? `<span class="section-subtitle">${esc(a.subtitle)}</span>` : ''}
                    <h2>${esc(a.title)}</h2>
                    ${a.p1 ? `<p>${esc(a.p1)}</p>` : ''}
                    ${a.p2 ? `<p>${esc(a.p2)}</p>` : ''}
                    ${feats.length ? `<div class="features">${feats.map(f => `<div class="feature-item">${iconHtml(f.icon)}<span>${esc(f.text)}</span></div>`).join('')}</div>` : ''}
                </div>
            </div>
        </section>`;
    }

    function rReviews() {
        const r = D.reviews || {};
        const items = (r.items || []).filter(i => i.text);
        const url = r.googleUrl || D.contact.mapsUrl;
        return `<section id="avaliacoes" class="section reviews">
            <div class="container">
                ${sectionHead(r)}
                ${items.length ? `<div class="review-grid">${items.map(i => {
                    const n = Math.max(0, Math.min(5, Number(i.stars) || 5));
                    return `<figure class="review-card">
                        <div class="stars" aria-label="${n} de 5 estrelas">${'<i class="fas fa-star"></i>'.repeat(n)}${'<i class="far fa-star"></i>'.repeat(5 - n)}</div>
                        <blockquote>${esc(i.text)}</blockquote>
                        <figcaption><strong>${esc(i.name)}</strong>${i.source ? ` <span>• ${esc(i.source)}</span>` : ''}</figcaption>
                    </figure>`;
                }).join('')}</div>` : ''}
                ${url && r.googleBtnLabel ? `<div class="center"><a class="btn btn-outline" href="${esc(url)}" target="_blank" rel="noopener"><i class="fab fa-google"></i> ${esc(r.googleBtnLabel)}</a></div>` : ''}
            </div>
        </section>`;
    }

    function rLocation() {
        const L = D.location || {};
        const c = D.contact || {};
        const hours = (L.hours || []).filter(h => h.days || h.time);
        const map = mapEmbedUrl(L);
        const tel = telUrl(c.phone);
        return `<section id="localizacao" class="section location">
            <div class="container">
                ${sectionHead(L)}
                <div class="location-grid">
                    <div class="location-info">
                        ${L.address ? `<div class="info-row"><i class="fas fa-location-dot"></i><div><strong>Endereço</strong><p>${esc(L.address)}</p></div></div>` : ''}
                        ${hours.length ? `<div class="info-row"><i class="fas fa-clock"></i><div><strong>Horário de funcionamento</strong>
                            <ul class="hours">${hours.map(h => `<li><span>${esc(h.days)}</span><b>${esc(h.time)}</b></li>`).join('')}</ul>
                            ${L.hoursNote ? `<p class="small">${esc(L.hoursNote)}</p>` : ''}</div></div>` : ''}
                        ${(c.phone || c.landline) ? `<div class="info-row"><i class="fas fa-phone"></i><div><strong>Telefones</strong>
                            ${c.landline ? `<p><a href="${esc(telUrl(c.landline))}">${esc(c.landline)}</a> <small>fixo</small></p>` : ''}
                            ${c.phone ? `<p><a href="${esc(tel)}">${esc(c.phone)}</a> <small>celular e WhatsApp</small></p>` : ''}</div></div>` : ''}
                        ${c.email ? `<div class="info-row"><i class="fas fa-envelope"></i><div><strong>E-mail</strong><p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p></div></div>` : ''}
                        <div class="info-actions">
                            ${c.mapsUrl && L.btnMaps ? `<a class="btn btn-whatsapp" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener"><i class="fas fa-diamond-turn-right"></i> ${esc(L.btnMaps)}</a>` : ''}
                            ${tel && L.btnCall ? `<a class="btn btn-outline" href="${esc(tel)}"><i class="fas fa-phone"></i> ${esc(L.btnCall)}</a>` : ''}
                        </div>
                    </div>
                    ${map ? `<div class="location-map"><iframe src="${esc(map)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa de localização do restaurante" allowfullscreen></iframe></div>` : ''}
                </div>
            </div>
        </section>`;
    }

    function rCta() {
        const c = D.cta || {};
        const wa = waUrl(D, D.contact.waMessage);
        const maps = D.contact.mapsUrl;
        return `<section id="orcamento" class="cta-banner" ${bgStyle(c.bgImage)}>
            <div class="container cta-container">
                <h2>${esc(c.title)}</h2>
                ${c.desc ? `<p>${esc(c.desc)}</p>` : ''}
                <div class="cta-btns">
                    ${wa && c.btnWa ? `<a href="${esc(wa)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-large"><i class="fab fa-whatsapp"></i> ${esc(c.btnWa)}</a>` : ''}
                    ${maps && c.btnMaps ? `<a href="${esc(maps)}" target="_blank" rel="noopener" class="btn btn-outline btn-large"><i class="fas fa-location-dot"></i> ${esc(c.btnMaps)}</a>` : ''}
                </div>
            </div>
        </section>`;
    }

    const RENDER = { hero: rHero, stats: rStats, lines: rLines, services: rServices, process: rProcess, why: rWhy, gallery: rGallery, about: rAbout, reviews: rReviews, faq: rFaq, location: rLocation, cta: rCta };

    /* ---------------- Rodapé e botão flutuante ---------------- */
    function renderFooter() {
        const b = D.brand || {}, c = D.contact || {}, L = D.location || {};
        const socials = (c.socials || []).filter(s => /^https?:/i.test(s.url || ''));
        if (c.mapsUrl && !socials.some(s => s.url === c.mapsUrl)) socials.push({ icon: 'fas fa-location-dot', label: 'Google Maps', url: c.mapsUrl });
        const wa = waUrl(D);
        if (wa) socials.push({ icon: 'fab fa-whatsapp', label: 'WhatsApp', url: wa });
        const tel = telUrl(c.phone);
        return `<div class="container footer-grid">
            <div class="footer-brand">
                ${(b.footerLogoImage || b.logoImage) ? `<img class="footer-logo" src="${esc(b.footerLogoImage || b.logoImage)}" alt="${esc(b.fullName || b.name)}">` : `<h3>${esc(b.name)}</h3>`}
                ${c.footerSub ? `<p>${esc(c.footerSub)}</p>` : ''}
                <div class="social-links">${socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.label)}" aria-label="${esc(s.label)}"><i class="${esc(s.icon || 'fas fa-link')}"></i></a>`).join('')}</div>
                <p class="copyright">&copy; ${new Date().getFullYear()} ${esc(c.copyright)}</p>
            </div>
            <div class="footer-contact">
                <h4>Contato</h4>
                ${c.phone ? `<p><i class="fab fa-whatsapp"></i> ${tel ? `<a href="${esc(tel)}">${esc(c.phone)}</a>` : esc(c.phone)} <small>(celular e WhatsApp)</small></p>` : ''}
                ${c.landline ? `<p><i class="fas fa-phone"></i> <a href="${esc(telUrl(c.landline))}">${esc(c.landline)}</a> <small>(fixo)</small></p>` : ''}
                ${c.email ? `<p><i class="fas fa-envelope"></i> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : ''}
                ${L.address ? `<p><i class="fas fa-location-dot"></i> <span>${esc(L.address)}</span></p>` : ''}
                ${(L.hours || []).filter(h => h.days || h.time).slice(0, 3).map(h => `<p><i class="fas fa-clock"></i> <span>${esc(h.days)} ${esc(h.time)}</span></p>`).join('')}
                ${c.showAdminLink ? `<p class="admin-trigger-container"><a href="admin.html" id="btn-admin-page" title="Painel Admin"><i class="fas fa-lock"></i> Área do administrador</a></p>` : ''}
            </div>
        </div>`;
    }

    function renderFloat() {
        const wa = waUrl(D, D.contact.waMessage);
        return (D.contact.floatingWhatsapp && wa)
            ? `<a class="float-wa" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="Chamar no WhatsApp"><i class="fab fa-whatsapp"></i></a>`
            : '';
    }

    /* ---------------- Render geral (só troca o que mudou) ---------------- */
    function setHtml(el, key, html) {
        if (!el || cache[key] === html) return;
        cache[key] = html;
        el.innerHTML = html;
    }

    function renderMain() {
        const app = $('#app');
        const htmls = {};
        const order = (D.sections || []).filter(s => s.visible && RENDER[s.id]).map(s => s.id).filter(id => (htmls[id] = RENDER[id]()));
        const sig = order.join(',');
        if (cache.sig !== sig) {
            app.innerHTML = order.map(id => `<div class="sec-slot" data-sec="${id}"></div>`).join('');
            Object.keys(cache).filter(k => k.indexOf('sec:') === 0).forEach(k => delete cache[k]);
            cache.sig = sig;
        }
        order.forEach(id => setHtml(app.querySelector(`[data-sec="${id}"]`), 'sec:' + id, htmls[id]));
    }

    function renderHead() {
        const seo = D.seo || {};
        if (seo.title) document.title = seo.title;
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
        if (seo.description) meta.setAttribute('content', seo.description);
    }

    function renderAll() {
        applyTheme(D.theme);
        renderHead();
        setHtml($('#site-header'), 'header', renderHeader());
        renderMain();
        setHtml($('#contato'), 'footer', renderFooter());
        setHtml($('#float-wa'), 'float', renderFloat());
        if (lightboxOpen()) updateLightbox();
    }

    /* ---------------- Lightbox da galeria ---------------- */
    const lb = () => $('#lightbox');
    const lightboxOpen = () => !lb().hidden;
    function updateLightbox() {
        const photos = galleryPhotos();
        if (!photos.length) { closeLightbox(); return; }
        state.lbIndex = (state.lbIndex + photos.length) % photos.length;
        const p = photos[state.lbIndex];
        $('#lb-img').src = p.src;
        $('#lb-img').alt = p.caption || '';
        $('#lb-cap').textContent = p.caption || '';
    }
    function openLightbox(i) { state.lbIndex = i; lb().hidden = false; document.body.classList.add('no-scroll'); updateLightbox(); }
    function closeLightbox() { lb().hidden = true; document.body.classList.remove('no-scroll'); }

    /* ---------------- Eventos (delegação: continuam valendo após cada render) ---------------- */
    function setMenu(open) {
        const nav = $('#nav-menu'), btn = $('#nav-toggle');
        if (!nav || !btn) return;
        nav.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    document.addEventListener('click', (e) => {
        const t = e.target;
        if (t.closest('#nav-toggle')) { const nav = $('#nav-menu'); setMenu(!nav.classList.contains('open')); return; }
        if (t.closest('#nav-menu a')) setMenu(false);

        const mt = t.closest('[data-svctab]');
        if (mt) { state.svcTab = Number(mt.dataset.svctab); cache['sec:services'] = null; renderMain(); return; }

        const li = t.closest('[data-lb]');
        if (li) { openLightbox(Number(li.dataset.lb)); return; }
        if (t.closest('[data-lb-close]') || t === lb()) { closeLightbox(); return; }
        if (t.closest('[data-lb-prev]')) { state.lbIndex--; updateLightbox(); return; }
        if (t.closest('[data-lb-next]')) { state.lbIndex++; updateLightbox(); return; }

        if (t.closest('#discard-draft')) { clearDraft(); location.reload(); }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { setMenu(false); if (lightboxOpen()) closeLightbox(); }
        if (lightboxOpen()) {
            if (e.key === 'ArrowLeft') { state.lbIndex--; updateLightbox(); }
            if (e.key === 'ArrowRight') { state.lbIndex++; updateLightbox(); }
        }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });
    window.addEventListener('scroll', () => {
        const h = $('#site-header');
        if (h) h.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    /* ---------------- Prévia ao vivo dentro do painel admin ---------------- */
    window.addEventListener('message', (e) => {
        if (e.source !== window.parent || !e.data) return;
        if (e.data.type === 'siteData') { D = deepMerge(base, e.data.data); renderAll(); }
        if (e.data.type === 'scrollTo') {
            const el = document.getElementById(e.data.id) || (e.data.id === 'top' ? document.body : null);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    /* ---------------- Início ---------------- */
    document.addEventListener('DOMContentLoaded', () => {
        renderAll();

        if (IN_PREVIEW) {
            document.body.classList.add('in-preview');
            window.parent.postMessage({ type: 'preview-ready' }, '*');
        } else if (loaded.fromDraft) {
            const banner = $('#draft-banner');
            banner.innerHTML = '<span><i class="fas fa-eye"></i> Você está vendo alterações do painel que ainda <strong>não foram publicadas</strong> (só neste navegador).</span> <button type="button" id="discard-draft">Descartar</button>';
            banner.hidden = false;
        }
    });
})();
