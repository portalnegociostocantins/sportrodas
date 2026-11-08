/* ============================================================
   admin.js — painel administrativo (formulários gerados a partir do ESQUEMA abaixo)
   Para criar um novo campo editável: adicione o dado em dados.js, uma linha no
   ESQUEMA (GRUPOS) e use o dado no script.js. Todo o resto (salvar, prévia,
   publicar) funciona sozinho.
   ============================================================ */
(function () {
    'use strict';

    const base = getBaseData();
    if (!base) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Erro: dados.js não encontrado.</p>'; return; }

    let D = loadSiteData().data;
    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
    const OPEN = new Set();          // itens de lista abertos
    const LISTS = {};                // configuração das listas renderizadas (por caminho)
    const REG = {};                  // definição dos campos renderizados (por caminho)
    let current = (function () { try { return sessionStorage.getItem('fw_grupo') || 'marca'; } catch (e) { return 'marca'; } })();
    let dirty = false;               // há alterações ainda não publicadas (ZIP)
    let saveTimer = null;

    /* ---------- Ícones sugeridos (Font Awesome) ---------- */
    const ICONS = ['fas fa-screwdriver-wrench','fas fa-wrench','fas fa-gear','fas fa-gears','fas fa-car','fas fa-car-side','fas fa-car-burst','fas fa-truck','fas fa-truck-monster','fas fa-truck-field','fas fa-bus','fas fa-tractor','fas fa-van-shuttle','fas fa-oil-can','fas fa-toolbox','fas fa-hammer','fas fa-compass-drafting','fas fa-circle-notch','fas fa-road','fas fa-gauge-high','fas fa-shield-halved','fas fa-building','fas fa-warehouse','fas fa-industry','fas fa-award','fas fa-medal','fas fa-star','fas fa-heart','fas fa-thumbs-up','fas fa-check','fas fa-clock','fas fa-magnifying-glass','fas fa-file-invoice-dollar','fas fa-hand-holding-dollar','fas fa-handshake','fas fa-people-group','fas fa-credit-card','fas fa-location-dot','fas fa-phone','fas fa-envelope','fas fa-link','fab fa-whatsapp','fab fa-instagram','fab fa-facebook','fab fa-youtube','fab fa-google','fab fa-tiktok'];
    $('#icon-list').innerHTML = ICONS.map(i => `<option value="${i}">`).join('');

    /* ---------- Construtores de campos ---------- */
    const T = (path, label, o) => Object.assign({ type: 'text', path, label }, o);
    const A = (path, label, o) => Object.assign({ type: 'area', path, label }, o);
    const N = (path, label, o) => Object.assign({ type: 'number', path, label }, o);
    const B = (path, label, o) => Object.assign({ type: 'bool', path, label }, o);
    const C = (path, label, o) => Object.assign({ type: 'color', path, label }, o);
    const I = (path, label, o) => Object.assign({ type: 'icon', path, label }, o);
    const IMG = (path, label, o) => Object.assign({ type: 'image', path, label }, o);
    const SEL = (path, label, options, o) => Object.assign({ type: 'select', path, label, options }, o);
    const LIST = (path, label, o) => Object.assign({ type: 'list', path, label }, o);
    const sectionHeader = (prefix, withDesc) => [
        T(prefix + '.subtitle', 'Subtítulo pequeno (acima do título)', { half: true }),
        T(prefix + '.title', 'Título da seção', { half: true })
    ].concat(withDesc === false ? [] : [A(prefix + '.desc', 'Texto de apoio (opcional)', { rows: 2 })]);

    const SECTION_NAMES = { hero: 'Banner principal', stats: 'Faixa de números', lines: 'Linhas de atendimento', services: 'Serviços', process: 'Como funciona', why: 'Diferenciais', gallery: 'Galeria de fotos', about: 'Sobre nós', reviews: 'Avaliações', faq: 'Dúvidas frequentes', location: 'Localização e horários', cta: 'Chamada final' };

    const PRESETS = [
        { name: 'Sport Rodas (vermelho e azul)', c: { bg: '#ffffff', bgAlt: '#f3f4f5', card: '#ffffff', text: '#1b1f23', muted: '#5b656d', accent: '#d7262c', accent2: '#14306b' } },
        { name: 'Grafite e amarelo', c: { bg: '#0f1113', bgAlt: '#16191c', card: '#1e2226', text: '#f3f4f5', muted: '#a9b0b6', accent: '#f5b301', accent2: '#d62f2f' } },
        { name: 'Azul industrial', c: { bg: '#0b1220', bgAlt: '#101a2e', card: '#16233b', text: '#eef3fb', muted: '#9fb0c9', accent: '#3da5ff', accent2: '#ffb020' } },
        { name: 'Vermelho racing', c: { bg: '#120c0c', bgAlt: '#1b1111', card: '#251717', text: '#fbf0ef', muted: '#c4a9a7', accent: '#ff4b3e', accent2: '#f5b301' } },
        { name: 'Claro técnico', c: { bg: '#f5f6f7', bgAlt: '#e9ecee', card: '#ffffff', text: '#1b1f23', muted: '#5b656d', accent: '#d99a00', accent2: '#b3261e' } },
        { name: 'Claro azul', c: { bg: '#f4f7fb', bgAlt: '#e6edf6', card: '#ffffff', text: '#14213a', muted: '#58667e', accent: '#1565c0', accent2: '#e08a00' } }
    ];

    const itemsList = (path, label, name, fields, newItem, titleKey, o) => LIST(path, label, Object.assign({
        itemName: name, itemTitle: (it) => it[titleKey] || ('Novo ' + name), itemFields: fields, newItem
    }, o || {}));

    const GROUPS = [
        {
            id: 'marca', icon: 'fa-store', title: 'Marca e menu do topo', scroll: 'top',
            desc: 'Nome da empresa, logo e botão do menu.',
            fields: [
                T('brand.name', 'Nome que aparece no topo e no rodapé', { half: true }),
                T('brand.sub', 'Frase pequena abaixo do nome', { half: true }),
                T('brand.fullName', 'Razão social / nome completo (Google e leitores de tela)'),
                IMG('brand.logoImage', 'Logo em imagem (opcional)', { maxW: 500, png: true, hint: 'Se enviar um logo, ele substitui o nome escrito no topo. Prefira PNG com fundo transparente.' }),
                N('brand.logoHeight', 'Altura do logo no topo (px)', { min: 30, max: 120, half: true, hint: 'Aumente para destacar mais a marca (ex.: 68). No celular ele é reduzido automaticamente.' }),
                IMG('brand.footerLogoImage', 'Logo do rodapé (opcional)', { maxW: 600, png: true, hint: 'Se vazio, usa o mesmo logo do topo.' }),
                T('nav.ctaLabel', 'Texto do botão colorido do menu', { hint: 'Leva ao WhatsApp (ou ao mapa se não houver WhatsApp). Deixe vazio para esconder.' })
            ]
        },
        {
            id: 'secoes', icon: 'fa-list-ol', title: 'Seções: ordem e visibilidade', scroll: 'top',
            desc: 'Escolha o que aparece no site, em que ordem, e quais seções entram no menu do topo.',
            fields: [
                LIST('sections', 'Seções do site (use as setas para reordenar)', {
                    canAdd: false, canDelete: false,
                    itemTitle: (it) => (SECTION_NAMES[it.id] || it.id) + (it.visible ? '' : '  (oculta)'),
                    itemFields: [B('visible', 'Mostrar esta seção no site'), B('inNav', 'Mostrar link no menu do topo'), T('navLabel', 'Nome do link no menu')]
                })
            ]
        },
        {
            id: 'hero', icon: 'fa-star', title: 'Banner principal', scroll: 'inicio',
            desc: 'A primeira coisa que o cliente vê.',
            fields: [
                T('hero.badge', 'Selo acima do título'),
                A('hero.title', 'Título principal', { rows: 2 }),
                A('hero.desc', 'Descrição', { rows: 3 }),
                IMG('hero.bgImage', 'Foto de fundo do banner (ex.: fachada da loja)', { maxW: 1920 }),
                IMG('hero.sideImage', 'Foto em destaque ao lado do texto (opcional)', { maxW: 900, hint: 'Se não enviar, aparece o selo circular abaixo.' }),
                T('hero.emblemValue', 'Selo circular — destaque', { half: true, hint: 'Ex.: 40+' }),
                T('hero.emblemLabel', 'Selo circular — texto', { half: true }),
                T('hero.btnWa', 'Botão de WhatsApp', { half: true, hint: 'Só aparece se o WhatsApp estiver preenchido em "Contato".' }),
                T('hero.btnMaps', 'Botão "Como chegar"', { half: true }),
                T('hero.btn3Label', 'Terceiro botão — texto (opcional)', { half: true }),
                T('hero.btn3Url', 'Terceiro botão — link', { half: true, hint: 'Use #servicos, #linhas ou um link completo.' }),
                itemsList('hero.chips', 'Destaques rápidos (ícones abaixo dos botões)', 'destaque',
                    [I('icon', 'Ícone', { half: true }), T('text', 'Texto', { half: true })], () => ({ icon: 'fas fa-check', text: 'Novo destaque' }), 'text')
            ]
        },
        {
            id: 'stats', icon: 'fa-chart-simple', title: 'Faixa de números', scroll: 'numeros',
            desc: 'Faixa colorida com números de impacto (anos de mercado, etc.).',
            fields: [
                itemsList('stats.items', 'Números', 'número', [T('value', 'Destaque', { half: true, hint: 'Ex.: +40' }), T('label', 'Texto', { half: true })], () => ({ value: '', label: '' }), 'value')
            ]
        },
        {
            id: 'linhas', icon: 'fa-truck-monster', title: 'Linhas de atendimento', scroll: 'linhas',
            desc: 'Cartões grandes para Linha Leve e Linha Pesada (ou outras que quiser).',
            fields: [].concat(sectionHeader('lines'), [
                itemsList('lines.items', 'Linhas', 'linha', [
                    T('title', 'Título', { half: true }), T('subtitle', 'Subtítulo (ex.: Caminhões, ônibus e tratores)', { half: true }),
                    I('icon', 'Ícone', { half: true }), T('btnLabel', 'Texto do botão de orçamento', { half: true }),
                    A('desc', 'Descrição', { rows: 2 }),
                    A('bullets', 'Lista de serviços — um por linha', { rows: 4 }),
                    IMG('image', 'Foto da linha (opcional)', { maxW: 1100 })
                ], () => ({ icon: 'fas fa-gear', title: 'Nova linha', subtitle: '', desc: '', bullets: '', image: '', btnLabel: 'Pedir orçamento' }), 'title', { thumb: 'image' })
            ])
        },
        {
            id: 'servicos', icon: 'fa-screwdriver-wrench', title: 'Serviços e produtos', scroll: 'servicos',
            desc: 'Catálogo por categoria. Preço é opcional: "Solicite orçamento" vira um link para o WhatsApp.',
            fields: [].concat(sectionHeader('services'), [
                LIST('services.categories', 'Categorias (abas)', {
                    itemName: 'categoria', itemTitle: (it) => (it.name || 'Nova categoria') + ' (' + ((it.items || []).length) + ')',
                    newItem: () => ({ name: 'Nova categoria', items: [] }),
                    itemFields: [
                        T('name', 'Nome da categoria'),
                        itemsList('items', 'Itens desta categoria', 'serviço', [
                            T('name', 'Nome', { half: true }),
                            T('price', 'Preço ou chamada', { half: true, hint: 'Ex.: R$ 250,00 ou Solicite orçamento.' }),
                            A('desc', 'Descrição', { rows: 2 }),
                            T('badge', 'Selo (opcional)', { hint: 'Ex.: Especialidade, Promoção' }),
                            IMG('photo', 'Foto (opcional)', { maxW: 900 })
                        ], () => ({ name: 'Novo serviço', desc: '', price: 'Solicite orçamento', badge: '', photo: '' }), 'name', { thumb: 'photo' })
                    ]
                }),
                A('services.footnote', 'Observação abaixo da lista (opcional)', { rows: 2 })
            ])
        },
        {
            id: 'processo', icon: 'fa-list-check', title: 'Como funciona', scroll: 'como-funciona',
            desc: 'Passo a passo do atendimento.',
            fields: [].concat(sectionHeader('process'), [
                itemsList('process.items', 'Passos', 'passo', [I('icon', 'Ícone', { half: true }), T('title', 'Título', { half: true }), A('desc', 'Descrição', { rows: 2 })], () => ({ icon: 'fas fa-check', title: 'Novo passo', desc: '' }), 'title')
            ])
        },
        {
            id: 'diferenciais', icon: 'fa-award', title: 'Diferenciais', scroll: 'diferenciais',
            desc: 'Cartões com os motivos para escolher a empresa.',
            fields: [].concat(sectionHeader('why'), [
                itemsList('why.items', 'Cartões', 'diferencial', [I('icon', 'Ícone', { half: true }), T('title', 'Título', { half: true }), A('desc', 'Descrição', { rows: 2 })], () => ({ icon: 'fas fa-star', title: 'Novo diferencial', desc: '' }), 'title')
            ])
        },
        {
            id: 'galeria', icon: 'fa-images', title: 'Galeria de fotos', scroll: 'galeria',
            desc: 'Fachada, estoque, oficina e serviços. A seção só aparece quando houver fotos.',
            fields: [].concat(sectionHeader('gallery'), [
                LIST('gallery.photos', 'Fotos', {
                    itemName: 'foto', thumb: 'src', bulkKey: 'src', itemTitle: (it, i) => it.caption || ('Foto ' + (i + 1)),
                    newItem: () => ({ src: '', caption: '' }),
                    itemFields: [IMG('src', 'Foto', { maxW: 1400 }), T('caption', 'Legenda (opcional)')]
                })
            ])
        },
        {
            id: 'sobre', icon: 'fa-circle-info', title: 'Sobre nós', scroll: 'sobre',
            desc: 'A história da empresa.',
            fields: [
                T('about.subtitle', 'Subtítulo pequeno', { half: true }),
                T('about.title', 'Título', { half: true }),
                A('about.p1', 'Primeiro parágrafo', { rows: 4 }),
                A('about.p2', 'Segundo parágrafo', { rows: 3 }),
                IMG('about.image', 'Foto ao lado do texto (opcional)', { maxW: 1100 }),
                itemsList('about.features', 'Selos de destaque', 'selo', [I('icon', 'Ícone', { half: true }), T('text', 'Texto', { half: true })], () => ({ icon: 'fas fa-check', text: 'Novo selo' }), 'text')
            ]
        },
        {
            id: 'avaliacoes', icon: 'fa-comments', title: 'Avaliações', scroll: 'avaliacoes',
            desc: 'Cadastre apenas depoimentos reais. Sem depoimentos, a seção mostra só o botão do Google.',
            fields: [].concat(sectionHeader('reviews'), [
                T('reviews.googleBtnLabel', 'Texto do botão do Google', { half: true }),
                T('reviews.googleUrl', 'Link das avaliações no Google', { half: true }),
                LIST('reviews.items', 'Depoimentos', {
                    itemName: 'depoimento', itemTitle: (it) => (it.name || 'Cliente') + ' — ' + String(it.text || '').slice(0, 30),
                    newItem: () => ({ name: '', text: '', stars: 5, source: 'Google' }),
                    itemFields: [T('name', 'Nome do cliente', { half: true }), T('source', 'Origem (ex.: Google)', { half: true }), A('text', 'Depoimento', { rows: 3 }), N('stars', 'Estrelas (1 a 5)', { min: 1, max: 5 })]
                })
            ])
        },
        {
            id: 'faq', icon: 'fa-circle-question', title: 'Dúvidas frequentes', scroll: 'duvidas',
            desc: 'Perguntas e respostas. Sem perguntas, a seção some.',
            fields: [].concat(sectionHeader('faq'), [
                itemsList('faq.items', 'Perguntas', 'pergunta', [T('q', 'Pergunta'), A('a', 'Resposta', { rows: 3 })], () => ({ q: 'Nova pergunta?', a: '' }), 'q')
            ])
        },
        {
            id: 'local', icon: 'fa-map-location-dot', title: 'Localização e horários', scroll: 'localizacao',
            desc: 'Endereço, mapa e horário de funcionamento.',
            fields: [].concat(sectionHeader('location'), [
                A('location.address', 'Endereço completo', { rows: 2, hint: 'Ex.: Av. Exemplo, 1234 - Bairro, Palmas - TO' }),
                T('location.lat', 'Latitude do mapa', { half: true }),
                T('location.lng', 'Longitude do mapa', { half: true, hint: 'O mapa usa estas coordenadas (já configuradas pelo seu link do Google Maps).' }),
                N('location.zoom', 'Zoom do mapa (1 a 20)', { min: 1, max: 20, half: true }),
                T('location.mapEmbedUrl', 'Link de mapa incorporado (avançado — opcional)', { half: true }),
                itemsList('location.hours', 'Horário de funcionamento', 'horário', [T('days', 'Dias', { half: true }), T('time', 'Horário', { half: true })], () => ({ days: 'Segunda a Sexta', time: '8h às 18h' }), 'days'),
                A('location.hoursNote', 'Observação sobre horários (opcional)', { rows: 2 }),
                T('location.btnMaps', 'Texto do botão do mapa', { half: true }),
                T('location.btnCall', 'Texto do botão de ligar', { half: true })
            ])
        },
        {
            id: 'cta', icon: 'fa-bullhorn', title: 'Chamada final', scroll: 'orcamento',
            desc: 'Faixa de convite antes do rodapé.',
            fields: [
                A('cta.title', 'Título', { rows: 2 }), A('cta.desc', 'Texto', { rows: 2 }),
                T('cta.btnWa', 'Botão de WhatsApp', { half: true }), T('cta.btnMaps', 'Botão "Como chegar"', { half: true }),
                IMG('cta.bgImage', 'Foto de fundo', { maxW: 1920 })
            ]
        },
        {
            id: 'contato', icon: 'fa-address-book', title: 'Contato e redes sociais', scroll: 'contato',
            desc: 'Telefone, WhatsApp, links e rodapé.',
            fields: [
                { type: 'note', text: 'Enquanto o WhatsApp estiver vazio, os botões de WhatsApp ficam escondidos no site. Preencha o número para ativá-los.' },
                T('contact.phone', 'Celular / WhatsApp (como aparece no site)', { half: true, ph: '(34) 99999-9999' }),
                T('contact.landline', 'Telefone fixo (como aparece no site)', { half: true, ph: '(34) 3213-0000' }),
                T('contact.whatsapp', 'WhatsApp só com números (com DDD)', { half: true, ph: '34999999999', hint: 'Ex.: 34999999999 (o 55 do Brasil é adicionado sozinho).' }),
                A('contact.waMessage', 'Mensagem pronta que o cliente envia no WhatsApp', { rows: 2 }),
                T('contact.email', 'E-mail (opcional)', { half: true }),
                T('contact.mapsUrl', 'Link do Google Maps ("Como chegar")', { half: true }),
                B('contact.floatingWhatsapp', 'Mostrar botão flutuante de WhatsApp no canto da tela'),
                T('contact.footerSub', 'Frase do rodapé'),
                T('contact.copyright', 'Texto de direitos autorais (o ano é automático)'),
                B('contact.showAdminLink', 'Mostrar o link "Área do administrador" no rodapé'),
                itemsList('contact.socials', 'Redes sociais e links (só aparecem se tiverem link)', 'rede', [I('icon', 'Ícone', { half: true }), T('label', 'Nome', { half: true }), T('url', 'Link completo (https://…)')], () => ({ icon: 'fab fa-instagram', label: 'Instagram', url: '' }), 'label')
            ]
        },
        {
            id: 'aparencia', icon: 'fa-palette', title: 'Aparência (cores e fontes)', scroll: 'top',
            desc: 'Mude o visual do site inteiro com um clique ou ajuste cada cor.',
            fields: [
                { type: 'presets' },
                C('theme.accent', 'Cor de destaque (botões, faixa de números)', { half: true }), C('theme.accent2', 'Cor secundária (marcadores)', { half: true }),
                C('theme.bg', 'Fundo principal', { half: true }), C('theme.bgAlt', 'Fundo alternado das seções', { half: true }),
                C('theme.card', 'Fundo dos cartões', { half: true }), C('theme.text', 'Cor do texto', { half: true }),
                C('theme.muted', 'Cor do texto secundário', { half: true }),
                SEL('theme.headingFont', 'Fonte dos títulos', FONT_OPTIONS.map(f => f.name), { half: true }),
                SEL('theme.bodyFont', 'Fonte dos textos', FONT_OPTIONS.map(f => f.name), { half: true })
            ]
        },
        {
            id: 'seo', icon: 'fa-magnifying-glass', title: 'Google e compartilhamento', scroll: 'top',
            desc: 'Como o site aparece no Google e quando alguém compartilha o link.',
            fields: [
                T('seo.title', 'Título da página (aba do navegador e Google)', { hint: 'Ideal: até 60 caracteres.' }),
                A('seo.description', 'Descrição para o Google', { rows: 3, hint: 'Ideal: até 160 caracteres.' }),
                T('seo.siteUrl', 'Endereço final do site (opcional)', { ph: 'https://www.seusite.com.br', hint: 'Preencha quando o site estiver no ar.' })
            ]
        },
        { id: 'backup', icon: 'fa-shield-halved', title: 'Segurança e backup', scroll: null, desc: 'Troque a senha, salve uma cópia ou desfaça alterações.', fields: [{ type: 'tools' }] }
    ];

    /* ============================================================
       Renderização dos campos
       ============================================================ */
    function wrap(fd, inner, extra) {
        return `<div class="f ${fd.half ? '' : 'full'}" ${extra || ''}><label>${esc(fd.label)}</label>${inner}${fd.hint ? `<small class="hint">${esc(fd.hint)}</small>` : ''}</div>`;
    }

    function renderField(fd, path) {
        const val = fd.path !== undefined || fd.type === 'list' ? getPath(D, path) : undefined;
        if (fd.type !== 'note' && fd.type !== 'presets' && fd.type !== 'tools') REG[path] = fd;
        switch (fd.type) {
            case 'text':
                return wrap(fd, `<input class="in" type="text" data-path="${path}" value="${esc(val)}" placeholder="${esc(fd.ph || '')}">`);
            case 'area':
                return wrap(fd, `<textarea class="in" rows="${fd.rows || 3}" data-path="${path}">${esc(val)}</textarea>`);
            case 'number':
                return wrap(fd, `<input class="in" type="number" data-kind="number" data-path="${path}" value="${esc(val)}" ${fd.min != null ? `min="${fd.min}"` : ''} ${fd.max != null ? `max="${fd.max}"` : ''}>`);
            case 'bool':
                return `<div class="f full"><label class="sw"><input type="checkbox" data-path="${path}" ${val ? 'checked' : ''}><span class="sw-ui"></span><span>${esc(fd.label)}</span></label>${fd.hint ? `<small class="hint">${esc(fd.hint)}</small>` : ''}</div>`;
            case 'color': {
                const hex = toHex(parseHex(val, [0, 0, 0]));
                return wrap(fd, `<div class="color-row"><input type="color" data-path="${path}" data-kind="color" value="${hex}"><code>${hex}</code></div>`);
            }
            case 'select':
                return wrap(fd, `<select class="in" data-path="${path}">${fd.options.map(o => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`);
            case 'icon':
                return wrap(fd, `<div class="icon-row"><span class="icon-prev"><i class="${esc(val)}"></i></span><input class="in" type="text" list="icon-list" data-kind="icon" data-path="${path}" value="${esc(val)}" placeholder="fas fa-gear"></div>`,
                    '') + '';
            case 'image':
                return renderImage(fd, path);
            case 'list':
                return renderList(fd, path);
            case 'note':
                return `<div class="note"><i class="fas fa-circle-info"></i>${esc(fd.text)}</div>`;
            case 'presets':
                return `<div class="f full"><span class="f-label">Temas prontos (clique para aplicar)</span><div class="presets">${PRESETS.map((p, i) =>
                    `<button type="button" class="preset" data-act="preset" data-i="${i}"><div class="sw-row">${['bg', 'card', 'accent', 'accent2', 'text'].map(k => `<span style="background:${p.c[k]}"></span>`).join('')}</div>${esc(p.name)}</button>`).join('')}</div></div>`;
            case 'tools':
                return renderTools();
        }
        return '';
    }

    function renderImage(fd, path) {
        const v = getPath(D, path) || '';
        const isData = String(v).indexOf('data:') === 0;
        return `<div class="f full" data-imgwrap="${path}"><label>${esc(fd.label)}</label>
            <div class="img-field">
                <div class="img-thumb">${v ? `<img src="${esc(v)}" alt="">` : '<i class="fas fa-image"></i>'}</div>
                <div class="img-ctl">
                    <input class="in" type="text" data-kind="image-url" data-path="${path}" value="${isData ? '' : esc(v)}" ${isData ? 'disabled' : ''}
                        placeholder="${isData ? 'Foto enviada pelo painel — será salva na pasta imagens/ ao publicar' : 'Link da foto ou caminho (ex.: imagens/foto.jpg)'}">
                    <div class="img-btns">
                        <label class="btn-sm ok"><i class="fas fa-upload"></i> Enviar foto<input type="file" accept="image/*" hidden data-upload="${path}"></label>
                        ${v ? `<button type="button" class="btn-sm danger" data-act="img-clear" data-target="${path}"><i class="fas fa-xmark"></i> Remover</button>` : ''}
                    </div>
                </div>
            </div>${fd.hint ? `<small class="hint">${esc(fd.hint)}</small>` : ''}</div>`;
    }

    // Os campos "half" ficam lado a lado: agrupamos em .f-grid
    function renderFieldsGrid(fields, prefix) {
        let html = '', buf = '';
        const flush = () => { if (buf) { html += `<div class="f-grid">${buf}</div>`; buf = ''; } };
        fields.forEach(fd => {
            const path = prefix !== undefined ? (prefix + '.' + fd.path) : fd.path;
            const h = renderField(fd, fd.type === 'list' && prefix !== undefined ? prefix + '.' + fd.path : path);
            if (fd.half) buf += h; else { flush(); html += h; }
        });
        flush();
        return html;
    }

    function renderList(fd, path) {
        LISTS[path] = fd;
        const arr = getPath(D, path) || [];
        const canMove = fd.canMove !== false, canAdd = fd.canAdd !== false, canDel = fd.canDelete !== false;
        const items = arr.map((it, i) => {
            const key = path + '.' + i;
            const thumb = fd.thumb && it[fd.thumb] ? `<img class="li-thumb" src="${esc(it[fd.thumb])}" alt="">` : '';
            return `<details class="li" data-lp="${path}" data-i="${i}" data-key="${key}" ${OPEN.has(key) ? 'open' : ''}>
                <summary>${thumb}<span class="li-title">${esc(fd.itemTitle ? fd.itemTitle(it, i) : 'Item ' + (i + 1))}</span>
                    <span class="li-actions">
                        ${canMove && i > 0 ? `<button type="button" class="ic-btn" data-act="up" title="Subir"><i class="fas fa-arrow-up"></i></button>` : ''}
                        ${canMove && i < arr.length - 1 ? `<button type="button" class="ic-btn" data-act="down" title="Descer"><i class="fas fa-arrow-down"></i></button>` : ''}
                        ${canDel ? `<button type="button" class="ic-btn danger" data-act="del" title="Excluir"><i class="fas fa-trash-can"></i></button>` : ''}
                    </span></summary>
                <div class="li-body">${renderFieldsGrid(fd.itemFields, key)}</div>
            </details>`;
        }).join('');
        return `<div class="list" data-list="${path}">
            <div class="list-head"><span class="f-label">${esc(fd.label)}</span>
                ${canAdd && fd.bulkKey ? `<label class="btn-sm"><i class="fas fa-images"></i> Enviar várias fotos<input type="file" accept="image/*" multiple hidden data-bulk="${path}"></label>` : ''}
            </div>
            ${items || '<p class="empty-list">Nenhum item ainda.</p>'}
            ${canAdd ? `<button type="button" class="btn-add" data-act="add" data-lp="${path}"><i class="fas fa-plus"></i> Adicionar ${esc(fd.itemName || 'item')}</button>` : ''}
        </div>`;
    }

    function renderTools() {
        return `<div class="f full">
            <span class="f-label">Alterar senha do painel</span>
            <div class="f-grid">
                <div class="f"><input class="in" type="password" id="pw1" placeholder="Nova senha (mín. 6 caracteres)" autocomplete="new-password"></div>
                <div class="f"><input class="in" type="password" id="pw2" placeholder="Repita a nova senha" autocomplete="new-password"></div>
            </div>
            <button type="button" class="btn-sm ok" data-act="set-password"><i class="fas fa-key"></i> Definir nova senha</button>
            <small class="hint">A nova senha passa a valer no site depois que você publicar o .ZIP. Esta senha só protege o editor; o site público é sempre visível.</small>
        </div>
        <div class="f full"><span class="f-label">Backup e restauração</span>
            <div class="tools">
                <button type="button" class="btn-sm" data-act="export-json"><i class="fas fa-download"></i> Baixar backup (.json)</button>
                <label class="btn-sm"><i class="fas fa-upload"></i> Carregar backup (.json)<input type="file" accept=".json,application/json" hidden id="import-json"></label>
                <button type="button" class="btn-sm" data-act="copy-code"><i class="fas fa-code"></i> Copiar código do dados.js</button>
                <button type="button" class="btn-sm danger" data-act="discard"><i class="fas fa-rotate-left"></i> Descartar alterações não publicadas</button>
            </div>
            <small class="hint">"Descartar" volta o painel para o que está no dados.js publicado.</small>
        </div>`;
    }

    /* ============================================================
       Painel: menu lateral, grupos, prévia
       ============================================================ */
    function renderSide() {
        $('#a-side').innerHTML = GROUPS.map(g => `<button type="button" data-group="${g.id}" class="${g.id === current ? 'active' : ''}"><i class="fas ${g.icon}"></i><span>${esc(g.title)}</span></button>`).join('');
    }

    function renderGroup(keepScroll) {
        const g = GROUPS.find(x => x.id === current) || GROUPS[0];
        Object.keys(LISTS).forEach(k => delete LISTS[k]);
        Object.keys(REG).forEach(k => delete REG[k]);
        const y = window.scrollY;
        $('#a-form').innerHTML = `<h2 class="g-title"><i class="fas ${g.icon}"></i>${esc(g.title)}</h2><p class="g-desc">${esc(g.desc || '')}</p>${renderFieldsGrid(g.fields)}`;
        if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    }

    function selectGroup(id) {
        current = id;
        try { sessionStorage.setItem('fw_grupo', id); } catch (e) { /* ignora */ }
        renderSide();
        renderGroup(false);
        const g = GROUPS.find(x => x.id === id);
        if (g && g.scroll) postToPreview({ type: 'scrollTo', id: g.scroll });
    }

    const pv = () => $('#pv');
    function postToPreview(msg) { try { pv().contentWindow.postMessage(msg, '*'); } catch (e) { /* ignora */ } }
    function postPreview() { postToPreview({ type: 'siteData', data: D }); }

    window.addEventListener('message', (e) => {
        if (e.source === pv().contentWindow && e.data && e.data.type === 'preview-ready') {
            postPreview();
            const g = GROUPS.find(x => x.id === current);
            if (g && g.scroll) setTimeout(() => postToPreview({ type: 'scrollTo', id: g.scroll }), 300);
        }
    });

    /* ---------- Salvar rascunho + atualizar prévia ---------- */
    function setStatus(kind, text) {
        const el = $('#save-status');
        el.className = 'a-status ' + kind;
        el.innerHTML = `<i class="fas ${kind === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> <span>${esc(text)}</span>`;
        const bm = $('#save-bar-msg');
        if (bm) { bm.className = 'msg ' + kind; bm.innerHTML = `<i class="fas ${kind === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> <span>${kind === 'ok' ? esc(text) : 'Há alterações não salvas — clique em "Salvar alterações"'}</span>`; }
    }

    function touched() {
        dirty = true;
        setStatus('dirty', 'Alterações ainda não publicadas — clique em "Publicar"');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            postPreview();
            const ok = saveDraft(D);
            if (!ok) setStatus('dirty', 'Fotos pesadas: o rascunho não coube no navegador. Publique (.ZIP) para não perder.');
        }, 350);
    }

    /* ---------- Entrada de dados ---------- */
    function readInput(el) {
        if (el.type === 'checkbox') return el.checked;
        if (el.dataset.kind === 'number') return el.value === '' ? '' : Number(el.value);
        return el.value;
    }

    function refreshTitle(li) {
        if (!li) return;
        const cfg = LISTS[li.dataset.lp];
        const it = getPath(D, li.dataset.key);
        const t = li.querySelector(':scope > summary .li-title');
        if (cfg && cfg.itemTitle && t && it) t.textContent = cfg.itemTitle(it, Number(li.dataset.i));
    }

    const form = $('#a-form');

    form.addEventListener('input', (e) => {
        const el = e.target.closest('[data-path]');
        if (!el) return;
        setPath(D, el.dataset.path, readInput(el));
        if (el.dataset.kind === 'color') el.nextElementSibling.textContent = el.value;
        if (el.dataset.kind === 'icon') { const i = el.parentElement.querySelector('.icon-prev i'); if (i) i.className = el.value; }
        refreshTitle(el.closest('details.li'));
        touched();
    });

    form.addEventListener('change', async (e) => {
        const t = e.target;
        if (t.dataset && t.dataset.kind === 'image-url') { renderGroup(true); return; }
        if (t.matches('select[data-path], input[type=checkbox][data-path]')) {
            const secs = t.dataset.path.indexOf('sections.') === 0;
            if (secs) { refreshTitle(t.closest('details.li')); }
        }
        if (t.dataset && t.dataset.upload) {
            const fd = REG[t.dataset.upload] || {};
            const f = t.files && t.files[0];
            if (!f) return;
            try {
                setPath(D, t.dataset.upload, await compressImage(f, fd.maxW || 1400, !!fd.png));
                touched(); renderGroup(true);
            } catch (err) { toast('Não consegui ler essa imagem. Tente outra (JPG ou PNG).'); }
            return;
        }
        if (t.dataset && t.dataset.bulk) {
            const lp = t.dataset.bulk, cfg = LISTS[lp];
            const files = Array.from(t.files || []);
            if (!files.length) return;
            toast('Processando ' + files.length + ' foto(s)…');
            const arr = getPath(D, lp);
            for (const f of files) {
                try {
                    const it = cfg.newItem();
                    it[cfg.bulkKey] = await compressImage(f, 1400, false);
                    arr.push(it);
                } catch (err) { /* pula arquivo inválido */ }
            }
            touched(); renderGroup(true);
            return;
        }
        if (t.id === 'import-json') {
            const f = t.files && t.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
                try {
                    const imported = JSON.parse(r.result);
                    if (!isObj(imported) || !imported.hero || !imported.brand) throw new Error('estrutura');
                    D = deepMerge(base, imported);
                    touched(); renderGroup(false);
                    toast('Backup carregado!');
                } catch (err) { toast('Arquivo de backup inválido.'); }
            };
            r.readAsText(f);
        }
    });

    form.addEventListener('toggle', (e) => {
        const d = e.target;
        if (d && d.dataset && d.dataset.key) { if (d.open) OPEN.add(d.dataset.key); else OPEN.delete(d.dataset.key); }
    }, true);

    function dropOpenUnder(prefix) { Array.from(OPEN).forEach(k => { if (k.indexOf(prefix + '.') === 0) OPEN.delete(k); }); }

    form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        const li = b.closest('details.li');

        if (['up', 'down', 'del'].includes(act)) {
            e.preventDefault(); e.stopPropagation();
            const lp = li.dataset.lp, i = Number(li.dataset.i), arr = getPath(D, lp);
            if (act === 'del') {
                if (!confirm('Excluir este item? Isso não pode ser desfeito (a menos que você descarte as alterações).')) return;
                arr.splice(i, 1);
            } else {
                const j = act === 'up' ? i - 1 : i + 1;
                if (j < 0 || j >= arr.length) return;
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            dropOpenUnder(lp);
            touched(); renderGroup(true);
            return;
        }
        if (act === 'add') {
            const lp = b.dataset.lp, cfg = LISTS[lp];
            let arr = getPath(D, lp);
            if (!Array.isArray(arr)) { setPath(D, lp, []); arr = getPath(D, lp); }
            arr.push(cfg.newItem ? cfg.newItem() : {});
            OPEN.add(lp + '.' + (arr.length - 1));
            touched(); renderGroup(true);
            return;
        }
        if (act === 'img-clear') { setPath(D, b.dataset.target, ''); touched(); renderGroup(true); return; }
        if (act === 'preset') {
            const p = PRESETS[Number(b.dataset.i)];
            Object.keys(p.c).forEach(k => setPath(D, 'theme.' + k, p.c[k]));
            touched(); renderGroup(true); toast('Tema "' + p.name + '" aplicado.');
            return;
        }
        if (act === 'set-password') {
            const a = $('#pw1').value, c = $('#pw2').value;
            if (a.length < 6) { toast('A senha precisa ter pelo menos 6 caracteres.'); return; }
            if (a !== c) { toast('As senhas não são iguais.'); return; }
            setPath(D, 'security.passwordHash', sha256(a));
            $('#pw1').value = ''; $('#pw2').value = '';
            touched(); toast('Nova senha definida. Publique o .ZIP para valer no site.');
            return;
        }
        if (act === 'export-json') { download(new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' }), 'sport-rodas-backup.json'); return; }
        if (act === 'copy-code') {
            const txt = buildDadosJs(prepareExport(D).data);
            (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Código copiado! Cole dentro do arquivo dados.js.')).catch(() => toast('Não foi possível copiar. Use o botão Publicar.'));
            return;
        }
        if (act === 'discard') {
            if (confirm('Descartar todas as alterações que ainda não foram publicadas e voltar ao dados.js original?')) {
                clearDraft(); dirty = false; location.reload();
            }
        }
    });

    $('#a-side').addEventListener('click', (e) => {
        const b = e.target.closest('[data-group]');
        if (b) selectGroup(b.dataset.group);
    });

    /* ---------- Imagens ---------- */
    function compressImage(file, maxW, asPng) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onerror = reject;
            fr.onload = () => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    const maxH = maxW * 1.5;
                    const k = Math.min(1, maxW / img.width, maxH / img.height);
                    const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
                    const c = document.createElement('canvas');
                    c.width = w; c.height = h;
                    const x = c.getContext('2d');
                    if (!asPng) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
                    x.drawImage(img, 0, 0, w, h);
                    resolve(c.toDataURL(asPng ? 'image/png' : 'image/jpeg', 0.84));
                };
                img.src = fr.result;
            };
            fr.readAsDataURL(file);
        });
    }

    /* ============================================================
       Publicar: gera o .ZIP completo (dados.js + imagens + site)
       ============================================================ */
    function download(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    }

    function buildDadosJs(data) {
        return '// Dados padrão do site Restaurante Novo Acordo\n// Gerado pelo painel admin.html em ' + new Date().toLocaleString('pt-BR') + '\nconst defaultSiteData = ' + JSON.stringify(data, null, 4) + ';\n';
    }

    function slug(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'foto';
    }

    // Troca fotos enviadas (base64) por arquivos dentro de imagens/ e devolve a lista de arquivos
    function prepareExport(source) {
        const data = clone(source);
        data._version = new Date().toISOString();
        const files = [];           // { name, base64 }
        const seen = new Map();     // base64 -> caminho
        const used = new Set();
        const walk = (node, parent) => {
            if (Array.isArray(node)) { node.forEach((v, i) => { if (typeof v === 'string') return; walk(v, node); }); return; }
            if (!isObj(node)) return;
            Object.keys(node).forEach(k => {
                const v = node[k];
                if (typeof v === 'string' && v.indexOf('data:image') === 0) {
                    if (seen.has(v)) { node[k] = seen.get(v); return; }
                    const comma = v.indexOf(',');
                    const mime = (v.slice(0, comma).match(/:(.*?);/) || [])[1] || 'image/jpeg';
                    const ext = mime.indexOf('png') > -1 ? 'png' : 'jpg';
                    const label = slug(node.name || node.caption || node.title || node.text || k);
                    let n = 1, name;
                    do { name = `${label}${n > 1 ? '-' + n : ''}.${ext}`; n++; } while (used.has(name));
                    used.add(name);
                    files.push({ name, base64: v.slice(comma + 1) });
                    const rel = 'imagens/' + name;
                    seen.set(v, rel);
                    node[k] = rel;
                } else if (v && typeof v === 'object') walk(v, node);
            });
        };
        walk(data, null);
        return { data, files };
    }

    function collectLocalImages(node, out) {
        if (typeof node === 'string') { if (/^imagens\/[^?#]+$/.test(node)) out.add(node); return; }
        if (Array.isArray(node)) node.forEach(v => collectLocalImages(v, out));
        else if (isObj(node)) Object.keys(node).forEach(k => collectLocalImages(node[k], out));
    }

    async function publish() {
        const btn = $('#btn-publish');
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Gerando…</span>';
        try {
            saveDraft(D);
            const { data, files } = prepareExport(D);

            if (typeof JSZip === 'undefined') {
                download(new Blob([buildDadosJs(data)], { type: 'text/javascript' }), 'dados.js');
                showModal('Baixei só o dados.js', '<p>Não consegui carregar a biblioteca de ZIP (verifique a internet). O arquivo <code>dados.js</code> baixado já tem todas as alterações, mas as <b>fotos enviadas pelo painel não foram incluídas</b>. Tente publicar de novo com internet.</p>');
                return;
            }

            const zip = new JSZip();
            const img = zip.folder('imagens');
            files.forEach(f => img.file(f.name, f.base64, { base64: true }));

            // Fotos que já estão na pasta imagens/ (só consegue copiar quando o painel está hospedado)
            const local = new Set(); collectLocalImages(data, local);
            const newNames = new Set(files.map(f => 'imagens/' + f.name));
            let copied = 0;
            for (const p of local) {
                if (newNames.has(p)) continue;
                try { const r = await fetch(p); if (r.ok) { zip.file(p, await r.blob()); copied++; } } catch (e) { /* abriu direto do computador */ }
            }

            zip.file('dados.js', buildDadosJs(data));

            const project = ['index.html', 'admin.html', 'style.css', 'admin.css', 'core.js', 'script.js', 'admin.js', 'README.md'];
            const included = [];
            for (const name of project) {
                try {
                    const r = await fetch(name);
                    if (!r.ok) continue;
                    let txt = await r.text();
                    if (name === 'index.html') txt = txt.replace(/<!--SEO:START-->[\s\S]*?<!--SEO:END-->/, () => buildSeoBlock(data));
                    zip.file(name, txt);
                    included.push(name);
                } catch (e) { /* bloqueado pelo navegador */ }
            }
            const full = included.length >= 6;
            zip.file('LEIA-ME_ATUALIZACAO.txt', full
                ? 'PACOTE COMPLETO.\nDescompacte e suba/substitua TODOS os arquivos no seu site (ou no GitHub), incluindo a pasta imagens/.\n'
                : 'PACOTE DE ATUALIZAÇÃO (dados + fotos).\nO navegador não deixou copiar os demais arquivos (acontece quando o painel é aberto direto do computador).\nCopie apenas o arquivo dados.js e a pasta imagens/ para a pasta do seu site, substituindo os atuais. Se você alterou o título/descrição do Google, o index.html também precisa ser atualizado: hospede o site para o painel gerar o pacote completo.\n');

            const blob = await zip.generateAsync({ type: 'blob' });
            download(blob, 'sport-rodas-site-atualizado.zip');
            dirty = false;
            setStatus('ok', 'ZIP gerado — falta subir os arquivos no seu site');
            showModal(full ? 'ZIP completo gerado!' : 'ZIP de atualização gerado!',
                `<p>O arquivo <code>sport-rodas-site-atualizado.zip</code> foi baixado.</p>
                 <ol><li>Descompacte o ZIP.</li>
                 <li>${full ? 'Envie <b>todos os arquivos e a pasta <code>imagens/</code></b> para o seu site (ou GitHub), substituindo os atuais.' : 'Copie o <code>dados.js</code> e a pasta <code>imagens/</code> para a pasta do site, substituindo os atuais.'}</li>
                 <li>Aguarde alguns instantes e atualize o site (Ctrl+F5).</li></ol>
                 ${files.length ? `<p><b>${files.length}</b> foto(s) enviada(s) pelo painel foram salvas como arquivos em <code>imagens/</code>.</p>` : ''}
                 ${full ? '' : '<p>O navegador não permitiu copiar os demais arquivos (o painel foi aberto direto do computador). Está tudo certo: eles não mudaram.</p>'}`);
        } catch (err) {
            console.error(err);
            showModal('Algo deu errado', '<p>Não consegui gerar o ZIP. Use <b>Segurança e backup → Baixar backup (.json)</b> para não perder o trabalho e tente de novo.</p>');
        } finally {
            btn.disabled = false;
            btn.innerHTML = label;
        }
    }

    function showModal(title, html) {
        const m = $('#modal');
        m.innerHTML = `<div class="modal-box"><h2><i class="fas fa-circle-check"></i>${esc(title)}</h2>${html}<button type="button" class="btn-primary block" id="modal-ok">Entendi</button></div>`;
        m.hidden = false;
        $('#modal-ok').addEventListener('click', () => { m.hidden = true; });
    }
    function toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast'; t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3200);
    }

    /* ============================================================
       Login e inicialização
       ============================================================ */
    const SESSION_KEY = 'sportrodas_admin_ok';
    function validHashes() {
        return [base.security && base.security.passwordHash, D.security && D.security.passwordHash].filter(Boolean);
    }
    function openDash() {
        $('#auth').hidden = true;
        $('#dash').hidden = false;
        document.body.classList.toggle('pv-open', window.innerWidth >= 1280);
        renderSide();
        renderGroup(false);
        setStatus('ok', loadSiteData().fromDraft ? 'Rascunho carregado deste navegador (não publicado)' : 'Tudo em dia');
        if (loadSiteData().fromDraft) { dirty = true; setStatus('dirty', 'Rascunho carregado deste navegador — ainda não publicado'); }
        pv().src = 'index.html';
    }

    $('#auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (validHashes().includes(sha256($('#admin-password').value))) {
            try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (err) { /* ignora */ }
            openDash();
        } else {
            $('#login-error').textContent = 'Senha incorreta.';
        }
    });

    $('#btn-logout').addEventListener('click', () => {
        if (dirty && !confirm('Há alterações não publicadas (ficam salvas como rascunho neste navegador). Sair mesmo assim?')) return;
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignora */ }
        location.reload();
    });

    $('#btn-publish').addEventListener('click', publish);
    $('#btn-save').addEventListener('click', async () => {
        const b = $('#btn-save'); b.disabled = true;
        clearTimeout(saveTimer); saveDraft(D); postPreview();
        try { await publish(); } finally { b.disabled = false; }
    });
    $('#btn-toggle-preview').addEventListener('click', () => document.body.classList.toggle('pv-open'));
    $('#pv-close').addEventListener('click', () => document.body.classList.remove('pv-open'));
    $$('[data-pv]').forEach(b => b.addEventListener('click', () => {
        $$('[data-pv]').forEach(x => x.classList.toggle('active', x === b));
        $('#a-preview').dataset.device = b.dataset.pv;
    }));
    window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

    let logged = false;
    try { logged = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { /* ignora */ }
    if (logged) openDash();
})();
