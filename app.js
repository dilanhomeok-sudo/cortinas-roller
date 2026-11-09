/* Cotizador de cortinas roller · Dilan Home */
(function () {
  'use strict';
  var CFG = window.APP_CONFIG;
  var LINEAS = window.LINEAS, TELAS = window.TELAS, P = window.Precios;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var money = function (n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); };
  var redondeo = function (n) { return Math.round(n / 100) * 100; };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  // ---------- Tipos de tela ----------
  var TIPOS = [
    { id: 'blackout',  n: 'Blackout',       d: 'Oscurecen del todo. Ideales para dormitorios.' },
    { id: 'filtro',    n: 'Filtro de luz',  d: 'Suavizan la luz y dan privacidad, sin oscurecer.' },
    { id: 'sunscreen', n: 'Sunscreen',      d: 'Bajan el calor y el brillo y dejan ver hacia afuera.' },
    { id: 'natural',   n: 'Naturales',      d: 'Texturas de lino, algodón y ramio. Look cálido.' }
  ];
  var TIPO_HINT = {
    blackout: 'Blackout: no deja pasar la luz. Elegí el color que mejor combine con tu ambiente.',
    filtro: 'Filtro de luz: entra claridad suave y tenés privacidad. Perfecta para living y comedor.',
    sunscreen: 'Sunscreen: el número (1%, 3%, 5%…) es la apertura de la trama. Cuanto más bajo, menos luz y calor entra; cuanto más alto, mejor se ve hacia afuera.',
    natural: 'Naturales: telas con textura de lino, algodón y ramio.'
  };
  var CAIDA_HINT = {
    tras: 'Trasera: la tela baja pegada a la pared, por detrás del caño.',
    del: 'Delantera: la tela baja por delante del caño, separada de la pared.'
  };

  // ---------- Color de cada tela ----------
  function hexToRgb(h) { return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hsl(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, h = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return { h: h, s: s, l: l };
  }
  var FAM = [
    { id: 'claro', n: 'Blancos y marfil', c: '#F4F0E6' },
    { id: 'beige', n: 'Beige y arena', c: '#D9C7A6' },
    { id: 'gris', n: 'Grises', c: '#A5A5A2' },
    { id: 'marron', n: 'Marrones', c: '#7B5A44' },
    { id: 'oscuro', n: 'Negros', c: '#2D2B2A' },
    { id: 'color', n: 'Colores', c: '#C9695A' }
  ];
  function familia(t) {
    var x = hsl(t.rgb);
    if (x.l < .2) return 'oscuro';
    if (x.l > .78 && x.s < .45) return 'claro';
    if (x.s > .38 && x.l > .22 && !(x.h > 20 && x.h < 60 && x.s < .6)) return 'color';
    if (x.s < .12) return x.l < .32 ? 'oscuro' : 'gris';
    if (x.h >= 15 && x.h <= 55) return x.l < .38 ? 'marron' : 'beige';
    return x.s < .2 ? 'gris' : 'beige';
  }
  TELAS.forEach(function (t) {
    t.rgb = hexToRgb(t.rgb || 'cfc8bb');
    t.fam = familia(t);
    t.hay = (t.n + ' ' + LINEAS[t.l].n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  });
  var telaById = {}; TELAS.forEach(function (t) { telaById[t.id] = t; });

  // ---------- Estado ----------
  var S = { w: 150, h: 180, tipo: 'blackout', fam: '', q: '', tela: null, lado: 'der', caida: 'tras', cadena: 'plas', contra: 'no', drop: 100, nombre: '' };
  var LIST = store.get('dh_cortinas_v1') || [];
  var imgUrl = function (t) { return t.i ? 'img/t/' + t.i + '.jpg' : ''; };

  // ---------- Precios ----------
  function medidasOk() { return S.w >= CFG.anchoMin && S.w <= CFG.anchoMax && S.h >= CFG.altoMin && S.h <= CFG.altoMax && P.disponible(S.w, S.h); }
  function costoTela(t) {
    if (!medidasOk() || S.w > t.w * 100 + 0.01) return null;
    return P.costo(t, S.w, S.h);
  }
  function extras() {
    var c = 0;
    if (S.cadena === 'met') c += P.metalica(S.w, S.h);
    if (S.contra === 'si') c += P.contrapeso(S.w, S.h);
    return c;
  }
  function precios(costo) {
    if (costo == null) return null;
    var ef = redondeo((costo + extras()) * CFG.multEfectivo);
    return { ef: ef, lista: redondeo(ef * CFG.recargoLista) };
  }

  // ---------- Vista previa ----------
  var uid = 0;
  function shade(rgb, f) { return 'rgb(' + rgb.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); }).join(',') + ')'; }
  function opacidad(t) {
    var l = LINEAS[t.l];
    if (l.tp === 'blackout') return 1;
    if (l.tp === 'sunscreen') return l.ap ? Math.max(.62, 1 - l.ap * .022) : .88;
    if (l.tp === 'filtro') return .82;
    return .88;
  }
  function renderScene() {
    var W = 800, H = 600, floor = 536;
    var w = S.w || 150, h = S.h || 180;
    var s = Math.min(580 / (w + 24), 400 / (h + 30));
    var cw = w * s, ch = h * s;
    var cx = W / 2 + 10, topY = 58 + Math.max(0, (400 - (ch + 30 * s)) / 2);
    var x0 = cx - cw / 2;
    var fr = 9 * s;                       // marco
    var t = S.tela ? telaById[S.tela] : null;
    var rgb = t ? t.rgb : [214, 205, 190];
    var id = 'f' + (++uid);
    var drop = S.drop / 100;
    var tube = Math.max(7, 5.5 * s), y0 = topY;                       // caño
    var fabTop = y0 + tube * .5, fabH = (ch - tube * .5) * drop;
    var op = t ? opacidad(t) : 1;
    var tile = 120;
    var img = t && t.i ? 'img/f/' + t.i + '.jpg' : '';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cortina roller de ' + w + ' por ' + h + ' centímetros">';
    svg += '<defs>' +
      '<linearGradient id="wall' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3EBDD"/><stop offset="1" stop-color="#E9DECB"/></linearGradient>' +
      '<linearGradient id="sky' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BBD9EC"/><stop offset=".62" stop-color="#E6F0F2"/><stop offset="1" stop-color="#F7F3E6"/></linearGradient>' +
      '<linearGradient id="tb' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5F1"/><stop offset=".45" stop-color="#D9D5CE"/><stop offset="1" stop-color="#A9A49B"/></linearGradient>' +
      '<linearGradient id="sh' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>' +
      '<linearGradient id="tp' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="mt' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFEFEF"/><stop offset=".5" stop-color="#9A9A9A"/><stop offset="1" stop-color="#6D6D6D"/></linearGradient>' +
      '<linearGradient id="fl' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDB896"/><stop offset="1" stop-color="#B59E7A"/></linearGradient>' +
      '<clipPath id="cp' + id + '"><rect x="' + x0 + '" y="' + fabTop + '" width="' + cw + '" height="' + fabH + '"/></clipPath>';
    if (img) {
      svg += '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="' + tile + '" height="' + tile + '">' +
        '<image href="' + img + '" x="0" y="0" width="' + tile + '" height="' + tile + '" preserveAspectRatio="none"/></pattern>';
    }
    svg += '</defs>';
    // pared y piso
    svg += '<rect width="' + W + '" height="' + H + '" fill="url(#wall' + id + ')"/>';
    svg += '<rect y="' + floor + '" width="' + W + '" height="' + (H - floor) + '" fill="url(#fl' + id + ')"/>';
    svg += '<rect y="' + (floor - 14) + '" width="' + W + '" height="14" fill="#F6F1E8"/><rect y="' + (floor - 15) + '" width="' + W + '" height="1.5" fill="#D8CDB9"/>';
    // ventana
    var wx = x0 - fr, wy = topY + tube * .3, ww = cw + fr * 2, wh = ch + fr + tube * .2;
    svg += '<rect x="' + (wx - 5) + '" y="' + (wy - 5) + '" width="' + (ww + 10) + '" height="' + (wh + 12) + '" rx="3" fill="#FBF9F4" stroke="#D8CDB9"/>';
    svg += '<rect x="' + x0 + '" y="' + topY + '" width="' + cw + '" height="' + ch + '" fill="url(#sky' + id + ')"/>';
    // paisaje visto por la ventana
    svg += '<g clip-path="url(#win' + id + ')"><clipPath id="win' + id + '"><rect x="' + x0 + '" y="' + topY + '" width="' + cw + '" height="' + ch + '"/></clipPath>' +
      '<ellipse cx="' + (x0 + cw * .2) + '" cy="' + (topY + ch * 1.02) + '" rx="' + cw * .42 + '" ry="' + ch * .36 + '" fill="#9DB48A"/>' +
      '<ellipse cx="' + (x0 + cw * .72) + '" cy="' + (topY + ch * 1.05) + '" rx="' + cw * .5 + '" ry="' + ch * .3 + '" fill="#86A074"/>' +
      '<circle cx="' + (x0 + cw * .78) + '" cy="' + (topY + ch * .22) + '" r="' + Math.min(cw, ch) * .07 + '" fill="#FFF3C9" opacity=".9"/></g>';
    // divisor central del vidrio si la ventana es ancha
    // tela
    if (t) {
      svg += '<g clip-path="url(#cp' + id + ')">';
      svg += '<rect x="' + x0 + '" y="' + fabTop + '" width="' + cw + '" height="' + fabH + '" fill="' + shade(rgb, 1) + '" opacity="' + op + '"/>';
      if (img) svg += '<rect x="' + x0 + '" y="' + fabTop + '" width="' + cw + '" height="' + fabH + '" fill="url(#' + id + ')" opacity="' + op + '"/>';
      svg += '<rect x="' + x0 + '" y="' + fabTop + '" width="' + cw + '" height="' + fabH + '" fill="url(#sh' + id + ')"/>';
      svg += '<rect x="' + x0 + '" y="' + fabTop + '" width="' + cw + '" height="' + Math.min(fabH, 46) + '" fill="url(#tp' + id + ')"/>';
      svg += '</g>';
      // barra inferior
      var bh = S.contra === 'si' ? Math.max(8, 4.5 * s) : Math.max(4, 2 * s);
      var by = fabTop + fabH - bh * .25;
      svg += '<rect x="' + (x0 - 1) + '" y="' + by + '" width="' + (cw + 2) + '" height="' + bh + '" rx="' + bh / 2.4 + '" fill="' + (S.contra === 'si' ? shade(rgb, .78) : shade(rgb, .9)) + '" stroke="rgba(0,0,0,.18)"/>';
      svg += '<rect x="' + x0 + '" y="' + by + '" width="' + cw + '" height="' + bh * .4 + '" rx="' + bh / 3 + '" fill="#fff" opacity=".22"/>';
      svg += '<ellipse cx="' + cx + '" cy="' + (by + bh + 5) + '" rx="' + cw * .46 + '" ry="3.5" fill="#000" opacity=".1"/>';
    } else {
      svg += '<rect x="' + x0 + '" y="' + topY + '" width="' + cw + '" height="' + ch + '" fill="none" stroke="#B8AC96" stroke-dasharray="7 6" stroke-width="2"/>';
      svg += '<text x="' + cx + '" y="' + (topY + ch / 2) + '" text-anchor="middle" font-family="Outfit,sans-serif" font-size="20" fill="#8A7F6E">Elegí una tela para ver tu cortina</text>';
    }
    // caño y soportes
    var ty = y0 - tube * .35, tl = cw + 10;
    var tubeFront = S.caida === 'tras' || !t;
    var tubeSvg = '<rect x="' + (x0 - 5) + '" y="' + ty + '" width="' + tl + '" height="' + tube + '" rx="' + tube / 2 + '" fill="url(#tb' + id + ')" stroke="rgba(0,0,0,.2)"/>';
    var br = '<rect x="' + (x0 - 14) + '" y="' + (ty - 3) + '" width="11" height="' + (tube + 8) + '" rx="2.5" fill="#E7E3DC" stroke="rgba(0,0,0,.25)"/>' +
      '<rect x="' + (x0 + cw + 3) + '" y="' + (ty - 3) + '" width="11" height="' + (tube + 8) + '" rx="2.5" fill="#E7E3DC" stroke="rgba(0,0,0,.25)"/>';
    if (tubeFront) svg += br + tubeSvg; else svg += br + '<g opacity=".35">' + tubeSvg + '</g>';
    if (!tubeFront && t) {
      svg += '<rect x="' + x0 + '" y="' + (ty + tube * .3) + '" width="' + cw + '" height="' + (tube * .75) + '" fill="' + shade(rgb, 1) + '" opacity="' + op + '"/>';
      if (img) svg += '<rect x="' + x0 + '" y="' + (ty + tube * .3) + '" width="' + cw + '" height="' + (tube * .75) + '" fill="url(#' + id + ')" opacity="' + op + '"/>';
    }
    // cadena
    var cxs = S.lado === 'izq' ? x0 - 22 : x0 + cw + 22, len = Math.min(ch * .52, 200) * (.55 + .45 * drop);
    var cadCol = S.cadena === 'met' ? '#8D8D8D' : '#F6F3EC';
    svg += '<line x1="' + (cxs - 3) + '" y1="' + (ty + tube) + '" x2="' + (cxs - 3) + '" y2="' + (ty + tube + len) + '" stroke="' + cadCol + '" stroke-width="3.2" stroke-dasharray="1.6 2.4" stroke-linecap="round"/>' +
      '<line x1="' + (cxs + 3) + '" y1="' + (ty + tube) + '" x2="' + (cxs + 3) + '" y2="' + (ty + tube + len * .9) + '" stroke="' + cadCol + '" stroke-width="3.2" stroke-dasharray="1.6 2.4" stroke-linecap="round"/>';
    if (S.cadena !== 'met') svg += '<line x1="' + (cxs - 3) + '" y1="' + (ty + tube) + '" x2="' + (cxs - 3) + '" y2="' + (ty + tube + len) + '" stroke="rgba(0,0,0,.13)" stroke-width="1" stroke-dasharray="1.6 2.4" transform="translate(.8 .8)"/>';
    svg += '<ellipse cx="' + cxs + '" cy="' + (ty + tube + len + 2) + '" rx="6.5" ry="2.8" fill="' + (S.cadena === 'met' ? '#777' : '#E9E4D8') + '"/>';
    // plantita
    svg += '<g transform="translate(70 ' + (floor - 6) + ')"><path d="M-22 0 L22 0 L17 52 L-17 52Z" fill="#CBB79C"/><rect x="-24" y="-7" width="48" height="9" rx="3" fill="#D8C6AB"/>' +
      '<path d="M0 -7 C-8 -52 -34 -72 -50 -70 C-40 -50 -22 -22 0 -7Z" fill="#6F9065"/><path d="M0 -7 C6 -62 24 -92 44 -96 C38 -66 22 -30 0 -7Z" fill="#82A377"/><path d="M0 -7 C-2 -48 -8 -88 -4 -112 C8 -84 8 -40 0 -7Z" fill="#5F8057"/></g>';
    // cotas
    var cy = topY + ch + fr + 26;
    svg += '<g font-family="Outfit,sans-serif" font-size="15" fill="#6E665E" stroke="#6E665E">' +
      '<line x1="' + x0 + '" y1="' + cy + '" x2="' + (x0 + cw) + '" y2="' + cy + '" stroke-width="1.2"/><line x1="' + x0 + '" y1="' + (cy - 6) + '" x2="' + x0 + '" y2="' + (cy + 6) + '" stroke-width="1.2"/><line x1="' + (x0 + cw) + '" y1="' + (cy - 6) + '" x2="' + (x0 + cw) + '" y2="' + (cy + 6) + '" stroke-width="1.2"/>' +
      '<text stroke="none" x="' + cx + '" y="' + (cy + 21) + '" text-anchor="middle">' + w + ' cm</text></g>';
    var hx = x0 + cw + fr + 40;
    svg += '<g font-family="Outfit,sans-serif" font-size="15" fill="#6E665E" stroke="#6E665E">' +
      '<line x1="' + hx + '" y1="' + topY + '" x2="' + hx + '" y2="' + (topY + ch) + '" stroke-width="1.2"/><line x1="' + (hx - 6) + '" y1="' + topY + '" x2="' + (hx + 6) + '" y2="' + topY + '" stroke-width="1.2"/><line x1="' + (hx - 6) + '" y1="' + (topY + ch) + '" x2="' + (hx + 6) + '" y2="' + (topY + ch) + '" stroke-width="1.2"/>' +
      '<text stroke="none" transform="translate(' + (hx + 20) + ' ' + (topY + ch / 2) + ') rotate(90)" text-anchor="middle">' + h + ' cm</text></g>';
    svg += '</svg>';
    $('scene').innerHTML = svg;
  }

  // ---------- Medidas ----------
  function leerMedidas() {
    var a = parseFloat($('ancho').value), b = parseFloat($('alto').value), m = $('medMsg');
    S.w = isFinite(a) ? a : 0; S.h = isFinite(b) ? b : 0;
    m.className = 'msg'; m.textContent = '';
    if (!S.w || !S.h) { m.textContent = 'Cargá el ancho y el alto de tu ventana.'; return false; }
    if (S.w < CFG.anchoMin || S.w > CFG.anchoMax || S.h < CFG.altoMin || S.h > CFG.altoMax) {
      m.className = 'msg warn';
      m.textContent = 'Medidas posibles: ancho de ' + CFG.anchoMin + ' a ' + CFG.anchoMax + ' cm y alto de ' + CFG.altoMin + ' a ' + CFG.altoMax + ' cm. Para otras medidas, consultanos por WhatsApp.';
      return false;
    }
    if (!P.disponible(S.w, S.h)) {
      m.className = 'msg warn';
      m.textContent = 'Si el ancho pasa los 250 cm, el alto máximo es 220 cm. Para esa medida, consultanos por WhatsApp.';
      return false;
    }
    if (S.w > 200) m.textContent = 'En ventanas de más de 2 m de ancho el precio puede variar levemente cuando confirmamos la medida.';
    return true;
  }

  // ---------- Selector de telas ----------
  function renderTipos() {
    var box = $('types'); box.textContent = '';
    TIPOS.forEach(function (t) {
      var b = el('button', 'type'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.appendChild(el('b', '', t.n)); b.appendChild(el('span', '', t.d));
      b.setAttribute('aria-pressed', S.tipo === t.id ? 'true' : 'false');
      b.onclick = function () { S.tipo = t.id; S.fam = ''; renderTipos(); renderChips(); renderTelas(); };
      box.appendChild(b);
    });
    $('typeHint').textContent = TIPO_HINT[S.tipo];
  }
  function renderChips() {
    var box = $('colorChips'); box.textContent = '';
    var have = {}; TELAS.forEach(function (t) { if (LINEAS[t.l].tp === S.tipo) have[t.fam] = 1; });
    var all = el('button', '', 'Todos los colores'); all.type = 'button'; all.setAttribute('aria-pressed', S.fam === '' ? 'true' : 'false');
    all.onclick = function () { S.fam = ''; renderChips(); renderTelas(); }; box.appendChild(all);
    FAM.forEach(function (f) {
      if (!have[f.id]) return;
      var b = el('button'); b.type = 'button'; var i = el('i'); i.style.background = f.c; b.appendChild(i); b.appendChild(document.createTextNode(f.n));
      b.setAttribute('aria-pressed', S.fam === f.id ? 'true' : 'false');
      b.onclick = function () { S.fam = S.fam === f.id ? '' : f.id; renderChips(); renderTelas(); };
      box.appendChild(b);
    });
  }
  var swEls = {};
  function renderTelas() {
    var box = $('telas'); box.textContent = ''; swEls = {};
    var q = S.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    var any = false;
    LINEAS.forEach(function (l, li) {
      if (l.tp !== S.tipo) return;
      var items = TELAS.filter(function (t) { return t.l === li && (!S.fam || t.fam === S.fam) && (!q || t.hay.indexOf(q) >= 0); });
      if (!items.length) return;
      any = true;
      var g = el('div', 'grp'), hd = el('div', 'grp-h'), tt = el('div');
      tt.appendChild(el('h3', '', l.n));
      if (l.nota) tt.appendChild(el('small', '', l.nota));
      hd.appendChild(tt);
      var hp = el('span', '', ''); hp.dataset.linea = li; hd.appendChild(hp);
      g.appendChild(hd);
      var grid = el('div', 'sw-grid');
      items.forEach(function (t) {
        var b = el('button', 'sw'); b.type = 'button'; b.dataset.id = t.id;
        var im = el('div', 'im');
        if (t.i) { var i = el('img'); i.loading = 'lazy'; i.alt = ''; i.width = 128; i.height = 128; i.src = imgUrl(t); im.appendChild(i); }
        else im.style.background = 'rgb(' + t.rgb.join(',') + ')';
        b.appendChild(im);
        b.appendChild(el('span', 'nm', t.n));
        b.appendChild(el('span', 'pr', ''));
        if (t.c) b.appendChild(el('span', 'tag', 'Consultar stock'));
        else if (t.z) b.appendChild(el('span', 'tag', 'Zócalo visible'));
        b.onclick = function () { elegirTela(t.id); };
        grid.appendChild(b); swEls[t.id] = b;
      });
      g.appendChild(grid); box.appendChild(g);
    });
    if (!any) box.appendChild(el('div', 'empty', 'No encontramos telas con ese filtro. Probá con otro color o borrá la búsqueda.'));
    actualizarPrecios();
  }
  function actualizarPrecios() {
    var min = {};
    Object.keys(swEls).forEach(function (id) {
      var t = telaById[id], b = swEls[id], c = costoTela(t), p = precios(c), pr = b.querySelector('.pr');
      var ok = c != null;
      b.disabled = !ok && medidasOk();
      pr.textContent = p ? money(p.ef) : (medidasOk() ? 'hasta ' + String(t.w).replace('.', ',') + ' m de ancho' : '');
      b.setAttribute('aria-pressed', S.tela === t.id ? 'true' : 'false');
      if (p && (min[t.l] == null || p.ef < min[t.l])) min[t.l] = p.ef;
    });
    document.querySelectorAll('.grp-h span[data-linea]').forEach(function (s) {
      var m = min[s.dataset.linea]; s.textContent = m != null ? 'desde ' + money(m) : '';
    });
    renderBar();
  }
  function elegirTela(id) {
    S.tela = id; actualizarPrecios(); renderScene(); renderStage();
  }
  function renderStage() {
    var t = S.tela ? telaById[S.tela] : null;
    $('stageName').textContent = t ? LINEAS[t.l].n + ' · ' + t.n : 'Elegí una tela';
  }

  // ---------- Barra de precio ----------
  function renderBar() {
    var t = S.tela ? telaById[S.tela] : null, box = $('pbPrices'); box.textContent = '';
    $('pbTela').textContent = t ? LINEAS[t.l].n + ' · ' + t.n + ' · ' + S.w + '×' + S.h + ' cm' : 'Elegí una tela';
    var p = t && medidasOk() ? precios(costoTela(t)) : null;
    if (!p) {
      var msg = !medidasOk() ? 'Revisá las medidas' : t && costoTela(t) == null ? 'Esta tela no llega a ese ancho' : 'Elegí tu tela';
      box.appendChild(el('span', 'na', msg)); $('addBtn').disabled = true; return;
    }
    var a = el('div', 'ef'); a.appendChild(el('small', '', 'Efectivo')); a.appendChild(el('b', '', money(p.ef)));
    var b = el('div'); b.appendChild(el('small', '', 'Lista (cuotas)')); b.appendChild(el('b', '', money(p.lista)));
    box.appendChild(a); box.appendChild(b);
    $('addBtn').disabled = false;
  }
  function actualizarExtras() {
    var okm = medidasOk();
    $('plusMet').textContent = okm ? '+ ' + money(redondeo(P.metalica(S.w, S.h) * CFG.multEfectivo)) : '';
    $('plusCon').textContent = okm ? '+ ' + money(redondeo(P.contrapeso(S.w, S.h) * CFG.multEfectivo)) : '';
  }

  // ---------- Presupuesto ----------
  function optsTexto(it) {
    return 'Caída ' + (it.caida === 'tras' ? 'trasera' : 'delantera') + ' · cadena ' + (it.lado === 'izq' ? 'izquierda' : 'derecha') + ' ' + (it.cadena === 'met' ? 'metálica' : 'plástica') + (it.contra === 'si' ? ' · con contrapeso' : '');
  }
  function guardarLista() { store.set('dh_cortinas_v1', LIST); $('listCount').textContent = LIST.length; }
  function agregar() {
    var t = S.tela ? telaById[S.tela] : null; if (!t) return;
    var p = precios(costoTela(t)); if (!p) return;
    LIST.push({ tela: t.id, w: S.w, h: S.h, lado: S.lado, caida: S.caida, cadena: S.cadena, contra: S.contra, nombre: S.nombre.trim(), ef: p.ef, lista: p.lista });
    guardarLista(); abrirPanel();
  }
  function recalc(it) {
    var t = telaById[it.tela]; if (!t) return it;
    var keep = { w: S.w, h: S.h, cadena: S.cadena, contra: S.contra };
    S.w = it.w; S.h = it.h; S.cadena = it.cadena; S.contra = it.contra;
    var p = precios(P.costo(t, it.w, it.h));
    S.w = keep.w; S.h = keep.h; S.cadena = keep.cadena; S.contra = keep.contra;
    if (p) { it.ef = p.ef; it.lista = p.lista; }
    return it;
  }
  function renderPanel() {
    var box = $('items'); box.textContent = ''; var tEf = 0, tLi = 0;
    if (!LIST.length) box.appendChild(el('p', 'hint', 'Todavía no agregaste ninguna cortina. Armá la primera y sumala acá; podés presupuestar todas las ventanas de tu casa.'));
    LIST.forEach(function (it, i) {
      recalc(it);
      var t = telaById[it.tela]; if (!t) return;
      tEf += it.ef; tLi += it.lista;
      var d = el('div', 'it'), im = el('div', 'im');
      if (t.i) { var g = el('img'); g.alt = ''; g.src = imgUrl(t); im.appendChild(g); } else im.style.background = 'rgb(' + t.rgb.join(',') + ')';
      var m = el('div'); m.appendChild(el('h4', '', (it.nombre ? it.nombre + ' · ' : '') + it.w + ' × ' + it.h + ' cm'));
      m.appendChild(el('p', '', LINEAS[t.l].n + ' · ' + t.n)); m.appendChild(el('p', '', optsTexto(it)));
      var rm = el('button', 'rm', 'Quitar'); rm.type = 'button'; rm.onclick = function () { LIST.splice(i, 1); guardarLista(); renderPanel(); }; m.appendChild(rm);
      var pr = el('div', 'pr'); pr.appendChild(el('b', '', money(it.ef))); pr.appendChild(document.createTextNode('efectivo')); pr.appendChild(el('div', '', money(it.lista) + ' lista'));
      d.appendChild(im); d.appendChild(m); d.appendChild(pr); box.appendChild(d);
    });
    var tot = $('totals'); tot.textContent = ''; tot.hidden = !LIST.length;
    var r1 = el('div', 'ef'); r1.appendChild(el('small', '', 'Total efectivo / transferencia')); r1.appendChild(el('b', '', money(tEf)));
    var r2 = el('div'); r2.appendChild(el('small', '', 'Total precio de lista (cuotas)')); r2.appendChild(el('b', '', money(tLi)));
    tot.appendChild(r1); tot.appendChild(r2);
    $('waBtn').disabled = !LIST.length; $('clearBtn').hidden = !LIST.length;
    guardarLista();
  }
  function abrirPanel() { renderPanel(); $('panel').hidden = false; document.body.style.overflow = 'hidden'; $('closePanel').focus(); }
  function cerrarPanel() { $('panel').hidden = true; document.body.style.overflow = ''; }
  function mensaje() {
    var t = '¡Hola Dilan Home! Quiero consultar por cortinas roller a medida:\n', tEf = 0, tLi = 0;
    LIST.forEach(function (it, i) {
      var tela = telaById[it.tela]; if (!tela) return; tEf += it.ef; tLi += it.lista;
      t += '\n' + (i + 1) + ') ' + (it.nombre ? it.nombre + ' — ' : '') + it.w + ' × ' + it.h + ' cm\n   Tela: ' + LINEAS[tela.l].n + ' · ' + tela.n + '\n   ' + optsTexto(it) + '\n   Efectivo: ' + money(it.ef) + ' · Lista: ' + money(it.lista) + '\n';
    });
    t += '\nTotal efectivo/transferencia: ' + money(tEf) + '\nTotal precio de lista (cuotas): ' + money(tLi);
    var n = $('cliente').value.trim(); if (n) t += '\n\nMi nombre: ' + n;
    t += '\n\n(Presupuesto estimativo armado en el cotizador online)';
    return t;
  }

  // ---------- Eventos ----------
  function onMedidas() {
    var ok = leerMedidas(); actualizarExtras(); actualizarPrecios(); renderScene();
    if (!ok) $('addBtn').disabled = true;
  }
  function bindSeg(name, key) {
    var box = document.querySelector('.seg[data-opt="' + name + '"]');
    box.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        S[key] = b.dataset.v;
        box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (name === 'caida') $('caidaHint').textContent = CAIDA_HINT[S.caida];
        actualizarPrecios(); renderScene();
      };
    });
  }
  function init() {
    $('listCount').textContent = LIST.length;
    renderTipos(); renderChips(); renderTelas(); renderScene(); actualizarExtras(); renderStage();
    $('caidaHint').textContent = CAIDA_HINT[S.caida];
    var tm; ['ancho', 'alto'].forEach(function (id) { $(id).addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(onMedidas, 120); }); });
    var tq; $('q').addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { S.q = $('q').value; renderTelas(); }, 150); });
    $('drop').addEventListener('input', function () { S.drop = +this.value; renderScene(); });
    $('nombre').addEventListener('input', function () { S.nombre = this.value; });
    bindSeg('lado', 'lado'); bindSeg('caida', 'caida'); bindSeg('cadena', 'cadena'); bindSeg('contra', 'contra');
    $('addBtn').onclick = agregar;
    $('openList').onclick = abrirPanel; $('closePanel').onclick = cerrarPanel;
    $('panel').addEventListener('click', function (e) { if (e.target === $('panel')) cerrarPanel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('panel').hidden) cerrarPanel(); });
    $('clearBtn').onclick = function () { LIST = []; renderPanel(); };
    $('waBtn').onclick = function () { window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(mensaje()), '_blank', 'noopener'); };
    leerMedidas();
  }
  init();
})();
