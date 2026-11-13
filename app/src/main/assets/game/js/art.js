// رحلة المدربة — رسومات الشخصيات (SVG مرسوم يدوياً، كلها من تأليف اللعبة)
(function (root) {

  function eyes(cx1, cx2, cy, r, color) {
    color = color || '#3b2314';
    function eye(cx) {
      return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + (r * 1.25) + '" fill="#fff"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy + r * 0.15) + '" rx="' + (r * 0.75) + '" ry="' + (r * 0.95) + '" fill="' + color + '"/>' +
        '<circle cx="' + cx + '" cy="' + (cy + r * 0.2) + '" r="' + (r * 0.4) + '" fill="#111"/>' +
        '<circle cx="' + (cx - r * 0.3) + '" cy="' + (cy - r * 0.3) + '" r="' + (r * 0.28) + '" fill="#fff"/>' +
        '<circle cx="' + (cx + r * 0.3) + '" cy="' + (cy + r * 0.45) + '" r="' + (r * 0.12) + '" fill="#fff"/>';
    }
    return eye(cx1) + eye(cx2);
  }

  var SHAHD_BASE = { jacket: '#14b8a6', jacketDark: '#0f766e', collar: '#fde68a', straps: '#7c3aed', pants: '#1e3a8a',
    shoes: '#f43f5e', hat: '#f43f5e', brim: '#be123c', badge: '#facc15', ribbon: '#f43f5e', ribbon2: '#e11d48', hair: '#6b3a1f', hair2: '#8a4b26' };
  function pal(base, over) { var o = {}; Object.keys(base).forEach(function (k) { o[k] = (over && over[k]) || base[k]; }); return o; }

  // شهد — البطلة (look: ألوان الملابس)
  function shahd(mood, look) {
    var c = pal(SHAHD_BASE, look);
    var mouth = mood === 'surprised'
      ? '<ellipse cx="100" cy="122" rx="6" ry="8" fill="#9b2c2c"/>'
      : mood === 'sad'
        ? '<path d="M90 126 Q100 118 110 126" stroke="#9b2c2c" stroke-width="3" fill="none" stroke-linecap="round"/>'
        : '<path d="M88 118 Q100 132 112 118 Q100 124 88 118Z" fill="#c2414b"/>';
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M140 70 Q185 90 172 160 Q165 200 150 215 Q158 170 145 130 Z" fill="' + c.hair + '"/>' +
      '<path d="M146 84 Q172 110 160 170" stroke="' + c.hair2 + '" stroke-width="4" fill="none"/>' +
      '<path d="M62 175 Q100 160 138 175 L150 262 L50 262 Z" fill="' + c.jacket + '"/>' +
      '<path d="M100 168 L100 262" stroke="' + c.jacketDark + '" stroke-width="3"/>' +
      '<path d="M84 168 L100 190 L116 168" fill="' + c.collar + '"/>' +
      '<rect x="66" y="176" width="10" height="70" rx="5" fill="' + c.straps + '"/>' +
      '<rect x="124" y="176" width="10" height="70" rx="5" fill="' + c.straps + '"/>' +
      '<path d="M62 178 Q42 210 50 240" stroke="' + c.jacket + '" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<path d="M138 178 Q158 210 150 240" stroke="' + c.jacket + '" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<circle cx="50" cy="244" r="9" fill="#f6c9a4"/><circle cx="150" cy="244" r="9" fill="#f6c9a4"/>' +
      '<rect x="66" y="258" width="28" height="30" rx="6" fill="' + c.pants + '"/>' +
      '<rect x="106" y="258" width="28" height="30" rx="6" fill="' + c.pants + '"/>' +
      '<ellipse cx="80" cy="292" rx="18" ry="7" fill="' + c.shoes + '"/><ellipse cx="120" cy="292" rx="18" ry="7" fill="' + c.shoes + '"/>' +
      '<rect x="90" y="140" width="20" height="26" fill="#f0b98f"/>' +
      '<ellipse cx="100" cy="100" rx="48" ry="52" fill="#f6c9a4"/>' +
      '<path d="M52 98 Q50 40 100 40 Q150 40 148 98 Q140 70 120 62 Q112 78 90 70 Q70 80 60 70 Q54 82 52 98Z" fill="' + c.hair + '"/>' +
      '<path d="M52 98 Q46 130 56 150 Q58 120 60 104Z" fill="' + c.hair + '"/>' +
      '<path d="M148 98 Q154 130 144 150 Q142 120 140 104Z" fill="' + c.hair + '"/>' +
      '<path d="M138 66 L160 52 L158 78 Z" fill="' + c.ribbon + '"/><path d="M138 66 L162 82 L150 90 Z" fill="' + c.ribbon2 + '"/>' +
      '<circle cx="140" cy="68" r="6" fill="' + c.ribbon + '"/>' +
      '<path d="M56 62 Q100 18 144 62 Q100 50 56 62Z" fill="' + c.hat + '"/>' +
      '<path d="M50 64 Q100 54 150 64 Q100 72 50 64Z" fill="' + c.brim + '"/>' +
      '<polygon points="100,32 104,42 115,42 106,48 109,58 100,52 91,58 94,48 85,42 96,42" fill="' + c.badge + '"/>' +
      '<path d="M70 82 Q80 76 90 82" stroke="#5a2e15" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M110 82 Q120 76 130 82" stroke="#5a2e15" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      eyes(80, 120, 98, 11, '#7c4a1e') +
      '<ellipse cx="68" cy="118" rx="9" ry="5" fill="#fb7185" opacity=".45"/>' +
      '<ellipse cx="132" cy="118" rx="9" ry="5" fill="#fb7185" opacity=".45"/>' +
      mouth +
      '</svg>';
  }

  var SHARARA_BASE = { body: '#facc15', tail: '#fbbf24', belly: '#fff7d6', feet: '#eab308', tip: '#38bdf8', inner: '#fde68a',
                       star: '#38bdf8', eye: '#1d4ed8', blush: '#fb923c', glow: '' };

  // شرارة — ثعلب كهربائي صغير (skin: ألوان الشكل)
  function sharara(back, skin) {
    var c = pal(SHARARA_BASE, skin);
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      (c.glow ? '<circle cx="100" cy="110" r="92" fill="' + c.glow + '" opacity=".35"/>' : '') +
      '<path d="M140 150 Q195 140 185 85 Q178 60 160 70 Q172 100 150 120 Z" fill="' + c.tail + '"/>' +
      '<path d="M178 78 Q184 66 170 64 Q160 64 162 74Z" fill="' + c.belly + '"/>' +
      '<ellipse cx="100" cy="140" rx="45" ry="38" fill="' + c.body + '"/>' +
      '<ellipse cx="100" cy="150" rx="26" ry="22" fill="' + c.belly + '"/>' +
      '<ellipse cx="74" cy="176" rx="12" ry="8" fill="' + c.feet + '"/><ellipse cx="126" cy="176" rx="12" ry="8" fill="' + c.feet + '"/>' +
      '<path d="M62 78 L44 14 L92 60 Z" fill="' + c.body + '"/><path d="M52 40 L44 14 L62 32 Z" fill="' + c.tip + '"/>' +
      '<path d="M138 78 L156 14 L108 60 Z" fill="' + c.body + '"/><path d="M148 40 L156 14 L138 32 Z" fill="' + c.tip + '"/>' +
      '<path d="M64 70 L54 34 L84 62 Z" fill="' + c.inner + '"/><path d="M136 70 L146 34 L116 62 Z" fill="' + c.inner + '"/>' +
      '<ellipse cx="100" cy="90" rx="50" ry="40" fill="' + c.body + '"/>' +
      (back ? '' :
        '<path d="M60 100 Q100 140 140 100 Q130 122 100 124 Q70 122 60 100Z" fill="' + c.belly + '"/>' +
        eyes(80, 120, 88, 9, c.eye) +
        '<ellipse cx="100" cy="106" rx="5" ry="4" fill="#3b2314"/>' +
        '<path d="M92 112 Q100 118 108 112" stroke="#3b2314" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="66" cy="104" rx="7" ry="4" fill="' + c.blush + '" opacity=".5"/><ellipse cx="134" cy="104" rx="7" ry="4" fill="' + c.blush + '" opacity=".5"/>') +
      '<polygon class="star" points="100,52 104,62 114,62 106,68 109,78 100,72 91,78 94,68 86,62 96,62" fill="' + c.star + '" stroke="#e0f2fe" stroke-width="1.5"/>' +
      '</svg>';
  }

  // ورقة — أرنب نباتي
  function waraqa(back) {
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M78 70 Q50 10 70 0 Q96 20 92 70Z" fill="#22c55e"/><path d="M80 62 Q68 30 72 8" stroke="#15803d" stroke-width="3" fill="none"/>' +
      '<path d="M122 70 Q150 10 130 0 Q104 20 108 70Z" fill="#22c55e"/><path d="M120 62 Q132 30 128 8" stroke="#15803d" stroke-width="3" fill="none"/>' +
      '<ellipse cx="100" cy="148" rx="42" ry="36" fill="#86efac"/>' +
      '<circle cx="146" cy="160" r="14" fill="#f0fdf4"/>' +
      '<ellipse cx="78" cy="180" rx="13" ry="7" fill="#4ade80"/><ellipse cx="122" cy="180" rx="13" ry="7" fill="#4ade80"/>' +
      '<ellipse cx="100" cy="100" rx="44" ry="38" fill="#86efac"/>' +
      (back ? '' :
        eyes(82, 118, 98, 8, '#166534') +
        '<path d="M96 112 L100 116 L104 112" stroke="#14532d" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="70" cy="112" rx="7" ry="4" fill="#f472b6" opacity=".5"/><ellipse cx="130" cy="112" rx="7" ry="4" fill="#f472b6" opacity=".5"/>') +
      '<path d="M100 64 Q110 52 120 60 Q108 64 100 64Z" fill="#16a34a"/>' +
      '</svg>';
  }

  // فقاعة — فقمة مائية
  function fuqaa(back) {
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M40 170 Q20 186 30 192 Q50 192 60 176Z" fill="#0284c7"/><path d="M160 170 Q180 186 170 192 Q150 192 140 176Z" fill="#0284c7"/>' +
      '<ellipse cx="100" cy="130" rx="62" ry="58" fill="#38bdf8"/>' +
      '<ellipse cx="100" cy="148" rx="40" ry="34" fill="#e0f2fe"/>' +
      (back ? '' :
        eyes(78, 122, 108, 10, '#0c4a6e') +
        '<ellipse cx="100" cy="128" rx="7" ry="5" fill="#0c4a6e"/>' +
        '<path d="M88 136 Q100 146 112 136" stroke="#0c4a6e" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M70 130 L52 126 M70 136 L52 140 M130 130 L148 126 M130 136 L148 140" stroke="#0c4a6e" stroke-width="1.5"/>') +
      '<circle cx="150" cy="60" r="12" fill="#bae6fd" opacity=".8" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="168" cy="36" r="7" fill="#bae6fd" opacity=".8" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="40" cy="70" r="8" fill="#bae6fd" opacity=".8" stroke="#fff" stroke-width="2"/>' +
      '</svg>';
  }

  // حصوة — قنفذ صخري
  function hasawa(back) {
    var spikes = '';
    var cols = ['#a16207', '#78716c', '#92400e', '#57534e', '#b45309'];
    for (var i = 0; i < 9; i++) {
      var a = Math.PI * (0.95 + i * 0.13);
      var x = 100 + Math.cos(a) * 62, y = 120 + Math.sin(a) * 52;
      spikes += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="16" ry="13" fill="' + cols[i % 5] + '" stroke="#44403c" stroke-width="2"/>';
    }
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      spikes +
      '<ellipse cx="100" cy="130" rx="58" ry="46" fill="#d6b48a"/>' +
      '<ellipse cx="72" cy="176" rx="14" ry="8" fill="#a8825a"/><ellipse cx="128" cy="176" rx="14" ry="8" fill="#a8825a"/>' +
      (back ? '' :
        eyes(80, 120, 124, 8, '#422006') +
        '<ellipse cx="100" cy="142" rx="6" ry="5" fill="#422006"/>' +
        '<path d="M92 150 Q100 155 108 150" stroke="#422006" stroke-width="2.5" fill="none" stroke-linecap="round"/>') +
      '</svg>';
  }

  // مازن — المنافس
  function mazen() {
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M62 175 Q100 160 138 175 L150 262 L50 262 Z" fill="#2563eb"/>' +
      '<path d="M62 178 Q42 210 50 240" stroke="#2563eb" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<path d="M138 178 Q158 210 150 240" stroke="#2563eb" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<circle cx="50" cy="244" r="9" fill="#d9a06f"/><circle cx="150" cy="244" r="9" fill="#d9a06f"/>' +
      '<rect x="66" y="258" width="28" height="30" rx="6" fill="#374151"/><rect x="106" y="258" width="28" height="30" rx="6" fill="#374151"/>' +
      '<ellipse cx="80" cy="292" rx="18" ry="7" fill="#111827"/><ellipse cx="120" cy="292" rx="18" ry="7" fill="#111827"/>' +
      '<rect x="90" y="140" width="20" height="26" fill="#c98d5b"/>' +
      '<ellipse cx="100" cy="102" rx="46" ry="50" fill="#d9a06f"/>' +
      '<path d="M66 60 L60 28 L84 48 L92 20 L106 46 L124 22 L124 50 L146 38 L138 66Z" fill="#1f2937"/>' +
      '<path d="M54 96 Q48 44 100 46 Q154 44 146 96 Q138 70 112 66 Q86 64 70 72 Q58 80 54 96Z" fill="#1f2937"/>' +
      '<path d="M70 84 L90 88" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/><path d="M130 84 L110 88" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>' +
      eyes(80, 120, 100, 9, '#1f2937') +
      '<path d="M88 124 Q104 132 114 120" stroke="#7f1d1d" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  // الحكيمة سلمى — مرشدة القرية
  function salma() {
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M56 172 Q100 156 144 172 L158 292 L42 292 Z" fill="#f8fafc"/>' +
      '<path d="M100 166 L100 292" stroke="#cbd5e1" stroke-width="3"/>' +
      '<path d="M80 166 L100 196 L120 166" fill="#7c3aed"/>' +
      '<path d="M56 176 Q36 210 46 240" stroke="#f8fafc" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<path d="M144 176 Q164 210 154 240" stroke="#f8fafc" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      '<circle cx="46" cy="244" r="9" fill="#e8b48c"/><circle cx="154" cy="244" r="9" fill="#e8b48c"/>' +
      '<rect x="90" y="140" width="20" height="24" fill="#d9a07a"/>' +
      '<path d="M44 110 Q40 30 100 34 Q160 30 156 110 Q160 150 140 160 L60 160 Q40 150 44 110Z" fill="#7c3aed"/>' +
      '<ellipse cx="100" cy="104" rx="42" ry="46" fill="#e8b48c"/>' +
      '<path d="M58 90 Q62 54 100 52 Q138 54 142 90 Q120 70 100 72 Q80 70 58 90Z" fill="#cbd5e1"/>' +
      '<circle cx="80" cy="102" r="13" fill="none" stroke="#475569" stroke-width="3"/><circle cx="120" cy="102" r="13" fill="none" stroke="#475569" stroke-width="3"/>' +
      '<path d="M93 102 L107 102" stroke="#475569" stroke-width="3"/>' +
      '<circle cx="80" cy="103" r="5" fill="#3b2314"/><circle cx="120" cy="103" r="5" fill="#3b2314"/>' +
      '<path d="M86 126 Q100 136 114 126" stroke="#9b2c2c" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  // الخلفيات
  var bgCount = 0;
  function bg(name) {
    var gid = 'sk' + name + (bgCount++);
    var sky = { village: ['#7dd3fc', '#e0f2fe'], forest: ['#065f46', '#6ee7b7'], path: ['#fdba74', '#fef3c7'],
                lab: ['#c7d2fe', '#eef2ff'], night: ['#1e1b4b', '#6d28d9'] }[name] || ['#7dd3fc', '#e0f2fe'];
    var s = '<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="700" fill="url(#' + gid + ')"/>';
    if (name === 'village') {
      s += '<circle cx="320" cy="90" r="40" fill="#fde047"/>' +
        '<ellipse cx="80" cy="120" rx="50" ry="18" fill="#fff" opacity=".9"/><ellipse cx="250" cy="170" rx="40" ry="14" fill="#fff" opacity=".8"/>' +
        '<path d="M0 420 Q100 360 200 410 Q300 360 400 410 L400 700 L0 700Z" fill="#86efac"/>' +
        house(40, 340, '#fca5a5') + house(250, 350, '#fdba74') +
        palm(170, 330) + palm(360, 320) +
        '<path d="M0 520 Q200 480 400 520 L400 700 L0 700Z" fill="#4ade80"/>' +
        '<path d="M170 700 Q190 560 200 520 Q210 560 240 700Z" fill="#fde68a"/>';
    } else if (name === 'forest' || name === 'night') {
      for (var i = 0; i < 7; i++) s += tree(i * 64 - 10, 300 + (i % 2) * 40, name === 'night' ? '#14532d' : '#15803d');
      s += '<path d="M0 470 Q200 440 400 470 L400 700 L0 700Z" fill="' + (name === 'night' ? '#166534' : '#22c55e') + '"/>';
      if (name === 'night') s += '<circle cx="320" cy="90" r="30" fill="#fef9c3"/><circle cx="60" cy="60" r="2" fill="#fff"/><circle cx="160" cy="40" r="2" fill="#fff"/><circle cx="240" cy="120" r="2" fill="#fff"/>';
      for (var j = 0; j < 6; j++) s += '<circle cx="' + (30 + j * 70) + '" cy="' + (520 + (j % 3) * 40) + '" r="6" fill="#f9a8d4"/>';
    } else if (name === 'path') {
      s += '<circle cx="80" cy="110" r="45" fill="#fde047" opacity=".9"/>' +
        '<path d="M0 400 L80 320 L160 390 L260 290 L400 400 L400 700 L0 700Z" fill="#c4b5fd" opacity=".6"/>' +
        '<path d="M0 470 Q200 430 400 470 L400 700 L0 700Z" fill="#a3e635"/>' +
        '<path d="M150 700 Q190 540 200 470 Q210 540 260 700Z" fill="#fcd34d"/>';
    } else if (name === 'lab') {
      s += '<rect x="0" y="460" width="400" height="240" fill="#e2e8f0"/>' +
        '<rect x="30" y="200" width="120" height="160" rx="10" fill="#fff" stroke="#94a3b8" stroke-width="4"/>' +
        '<rect x="250" y="220" width="120" height="240" rx="6" fill="#a78bfa"/>' +
        '<rect x="262" y="240" width="96" height="40" fill="#ede9fe"/><rect x="262" y="300" width="96" height="40" fill="#ede9fe"/>' +
        '<circle cx="90" cy="280" r="30" fill="#7dd3fc"/>';
    }
    return s + '</svg>';
  }

  function house(x, y, c) {
    return '<rect x="' + x + '" y="' + y + '" width="100" height="80" fill="' + c + '"/>' +
      '<path d="M' + (x - 10) + ' ' + y + ' L' + (x + 50) + ' ' + (y - 50) + ' L' + (x + 110) + ' ' + y + 'Z" fill="#b45309"/>' +
      '<rect x="' + (x + 40) + '" y="' + (y + 35) + '" width="22" height="45" fill="#78350f"/>' +
      '<rect x="' + (x + 10) + '" y="' + (y + 20) + '" width="20" height="18" fill="#e0f2fe"/>' +
      '<rect x="' + (x + 72) + '" y="' + (y + 20) + '" width="20" height="18" fill="#e0f2fe"/>';
  }
  function palm(x, y) {
    return '<path d="M' + x + ' ' + (y + 110) + ' Q' + (x + 10) + ' ' + (y + 50) + ' ' + x + ' ' + y + '" stroke="#92400e" stroke-width="10" fill="none"/>' +
      '<path d="M' + x + ' ' + y + ' Q' + (x - 40) + ' ' + (y - 20) + ' ' + (x - 60) + ' ' + (y + 10) + ' M' + x + ' ' + y + ' Q' + (x + 40) + ' ' + (y - 20) + ' ' + (x + 60) + ' ' + (y + 10) +
      ' M' + x + ' ' + y + ' Q' + (x - 20) + ' ' + (y - 40) + ' ' + (x - 40) + ' ' + (y - 40) + ' M' + x + ' ' + y + ' Q' + (x + 20) + ' ' + (y - 40) + ' ' + (x + 40) + ' ' + (y - 40) + '" stroke="#16a34a" stroke-width="9" fill="none" stroke-linecap="round"/>';
  }
  function tree(x, y, c) {
    return '<rect x="' + (x + 30) + '" y="' + (y + 80) + '" width="16" height="100" fill="#713f12"/>' +
      '<circle cx="' + (x + 38) + '" cy="' + (y + 60) + '" r="46" fill="' + c + '"/>' +
      '<circle cx="' + (x + 14) + '" cy="' + (y + 90) + '" r="30" fill="' + c + '"/><circle cx="' + (x + 62) + '" cy="' + (y + 90) + '" r="30" fill="' + c + '"/>';
  }

  var Art = {
    shahd: shahd, mazen: mazen, salma: salma, bg: bg,
    creature: function (id, back, skin) {
      return ({ sharara: sharara, waraqa: waraqa, fuqaa: fuqaa, hasawa: hasawa }[id])(back, skin);
    }
  };
  root.Art = Art;
})(typeof window !== 'undefined' ? window : this);
