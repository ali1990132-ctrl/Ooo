// رحلة المدربة — الواجهة وتشغيل القصة والمعارك
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var SAVE_KEY = 'rihla_save_v1';
  var save = null;
  var current = 'title';

  // ===== الحفظ =====
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function newSave() {
    return { ep: 1, idx: 0, team: [], items: { potion: 3 }, bg: 'village', actors: {}, done: [] };
  }
  function persist() { if (save) store(SAVE_KEY, save); }

  // ===== الصوت =====
  var actx = null;
  function beep(freq, dur, type, vol, slide) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur);
    } catch (e) {}
  }
  var sfx = {
    tap: function () { beep(660, 0.06, 'square', 0.05); },
    hit: function () { beep(180, 0.18, 'sawtooth', 0.09, 60); },
    zap: function () { beep(900, 0.25, 'square', 0.07, 1800); beep(1400, 0.15, 'triangle', 0.05); },
    heal: function () { beep(520, 0.12, 'sine', 0.08); setTimeout(function () { beep(780, 0.18, 'sine', 0.08); }, 110); },
    faint: function () { beep(400, 0.5, 'triangle', 0.08, 80); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.18, 'square', 0.06); }, i * 140); }); },
    join: function () { [784, 988, 1175].forEach(function (f, i) { setTimeout(function () { beep(f, 0.14, 'triangle', 0.07); }, i * 110); }); }
  };

  // ===== الشاشات =====
  function show(id, instant) {
    return new Promise(function (res) {
      var f = $('fade');
      function swap() {
        document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
        current = id;
      }
      if (instant) { swap(); return res(); }
      f.classList.add('on');
      setTimeout(function () { swap(); f.classList.remove('on'); setTimeout(res, 300); }, 330);
    });
  }

  function charSvg(name, mood) {
    if (name === 'shahd') return Art.shahd(mood, Meta.look('outfit'));
    if (name === 'mazen') return Art.mazen();
    if (name === 'salma') return Art.salma();
    return Art.creature(name, false, name === 'sharara' ? Meta.look('skin') : null);
  }

  // ===== الشاشة الرئيسية =====
  function initTitle() {
    $('titleBg').innerHTML = Art.bg('village');
    $('epBg').innerHTML = Art.bg('path');
    $('onBg').innerHTML = Art.bg('night');
    drawTitleChars();
    save = load(SAVE_KEY);
    $('btnContinue').disabled = !save;

    $('btnNew').onclick = function () {
      sfx.tap();
      if (save && !confirmNew()) return;
      save = newSave(); persist(); startStory();
    };
    $('btnContinue').onclick = function () { sfx.tap(); if (save) startStory(); };
    $('btnEpisodes').onclick = function () { sfx.tap(); renderEpisodes(); show('episodes'); };
    $('btnOnline').onclick = function () {
      sfx.tap();
      $('onlineMsg').innerHTML = 'قريباً ستتمكن من تحدي أصدقائك في معارك مباشرة! ⚡<br><br>' +
        'هذه الميزة تحتاج ربط سيرفر اللعب، وسيتم تفعيلها في التحديث القادم.';
      show('online');
    };
    document.querySelectorAll('[data-back]').forEach(function (b) { b.onclick = function () { sfx.tap(); goTitle(); }; });
  }

  var newConfirmArmed = false;
  function confirmNew() {
    if (newConfirmArmed) { newConfirmArmed = false; $('btnNew').textContent = 'مغامرة جديدة'; return true; }
    newConfirmArmed = true;
    $('btnNew').textContent = 'اضغط مرة ثانية لمسح التقدم';
    setTimeout(function () { newConfirmArmed = false; $('btnNew').textContent = 'مغامرة جديدة'; }, 3000);
    return false;
  }

  function goTitle() {
    save = load(SAVE_KEY);
    $('btnContinue').disabled = !save;
    drawTitleChars();
    Meta.updateWallet();
    show('title');
  }

  function drawTitleChars() {
    $('titleShahd').innerHTML = charSvg('shahd');
    $('titleSharara').innerHTML = charSvg('sharara');
  }

  function renderEpisodes() {
    var done = (save && save.done) || [];
    var html = '';
    EPISODES.forEach(function (ep) {
      var state = ep.locked ? '🔒 قريباً' : (done.indexOf(ep.id) >= 0 ? '⭐ مكتملة' : '▶ متاحة');
      html += '<div class="ep' + (ep.locked ? ' locked' : '') + '" data-ep="' + ep.id + '"><span>' + ep.title + '</span><span>' + state + '</span></div>';
    });
    $('epList').innerHTML = html;
    $('epList').querySelectorAll('.ep:not(.locked)').forEach(function (el) {
      el.onclick = function () {
        sfx.tap();
        var id = +el.getAttribute('data-ep');
        if (!save) save = newSave();
        if (save.ep !== id) { save.ep = id; save.idx = 0; }
        persist(); startStory();
      };
    });
  }

  // ===== القصة =====
  var queue = [];     // خطوات مضافة من الاختيارات
  var waiting = null; // دالة تنتظر الضغط

  function episode() { return EPISODES.filter(function (e) { return e.id === save.ep; })[0]; }

  function startStory() {
    queue = [];
    ['actorL', 'actorR', 'actorPet'].forEach(function (id) { $(id).removeAttribute('data-name'); });
    $('epBadge').textContent = episode().title;
    applyBg(save.bg || 'village');
    renderActors();
    show('story').then(function () { nextStep(); });
  }

  function applyBg(name) { save.bg = name; $('storyBg').innerHTML = Art.bg(name); }

  function renderActors() {
    var a = save.actors || {};
    setActor('actorL', a.left);
    setActor('actorR', a.right || a.creatureRight, !!a.creatureRight && !a.right);
    setActor('actorPet', a.pet);
  }
  function setActor(id, name, isCreature) {
    var el = $(id);
    el.classList.toggle('creature-right', !!isCreature);
    if (!name) { el.classList.remove('show'); return; }
    if (el.getAttribute('data-name') !== name) { el.innerHTML = charSvg(name); el.setAttribute('data-name', name); }
    el.classList.add('show');
    el.classList.toggle('bob', id === 'actorPet' || !!isCreature);
  }

  function setDialog(speaker, text) {
    $('speaker').textContent = speaker || '';
    $('dlgText').textContent = text;
    $('choices').innerHTML = '';
    $('dialog').classList.remove('choosing');
  }

  function highlight(speaker) {
    var map = { 'شهد': 'actorL', 'الحكيمة سلمى': 'actorR', 'مازن': 'actorR' };
    var target = map[speaker];
    ['actorL', 'actorR'].forEach(function (id) { $(id).classList.toggle('dim', !!target && id !== target); });
  }

  $('dialog').addEventListener('click', function () {
    if (waiting) { var w = waiting; waiting = null; sfx.tap(); w(); }
  });

  function nextStep() {
    var step;
    if (queue.length) step = queue.shift();
    else {
      var ep = episode();
      if (save.idx >= ep.steps.length) return;
      var k = save.idx;
      step = ep.steps[k];
      // نحفظ مكان الخطوة الحالية حتى نرجع لها إذا انسدت اللعبة
      persist();
      save.idx = k + 1;
    }
    runStep(step);
  }

  function runStep(s) {
    if (s.bg) { applyBg(s.bg); }
    if (s.hide) { s.hide.forEach(function (k) { delete save.actors[k]; if (k === 'right') delete save.actors.creatureRight; }); }
    if (s.show) {
      Object.keys(s.show).forEach(function (k) {
        if (s.show[k]) save.actors[k] = s.show[k]; else delete save.actors[k];
        if (k === 'right' && s.show[k]) delete save.actors.creatureRight;
        if (k === 'creatureRight' && s.show[k]) delete save.actors.right;
      });
    }
    if (s.bg || s.hide || s.show) renderActors();

    if (s.say || s.narr) {
      if (s.say === 'شهد') { $('actorL').innerHTML = charSvg('shahd', s.mood); $('actorL').setAttribute('data-name', 'shahd'); }
      highlight(s.say);
      setDialog(s.say || '', s.say ? s.text : s.narr);
      waiting = nextStep;
      return;
    }
    if (s.choice) {
      setDialog('شهد', 'ماذا ستفعلين؟');
      $('dialog').classList.add('choosing');
      s.choice.forEach(function (c) {
        var b = document.createElement('button');
        b.className = 'btn'; b.textContent = c.text;
        b.onclick = function (e) { e.stopPropagation(); sfx.tap(); queue = c.next.concat(queue); nextStep(); };
        $('choices').appendChild(b);
      });
      return;
    }
    if (s.join) {
      if (!save.team.some(function (m) { return m.species === s.join; })) {
        save.team.push(Battle.createMon(s.join, s.level || 5));
      }
      sfx.join(); persist();
      return nextStep();
    }
    if (s.heal) { Battle.healTeam(save.team); sfx.heal(); persist(); return nextStep(); }
    if (s.battle) { return startBattle(s.battle); }
    if (s.end) {
      if (save.done.indexOf(save.ep) < 0) save.done.push(save.ep);
      Meta.episodeReward(save.ep);
      persist();
      sfx.win();
      highlight(null);
      setDialog('', '🎉 نهاية ' + episode().title.split(':')[0] + ' 🎉\nيتبع في ' + s.next + '...');
      $('dialog').classList.add('choosing');
      var b = document.createElement('button');
      b.className = 'btn primary'; b.textContent = 'القائمة الرئيسية';
      b.onclick = function (e) { e.stopPropagation(); sfx.tap(); goTitle(); };
      $('choices').appendChild(b);
      return;
    }
    nextStep();
  }

  // ===== المعركة =====
  var B = null, cfg = null, busy = false, skip = null;

  function startBattle(c) {
    cfg = c;
    var foeTeam = c.team.map(function (t) { return Battle.createMon(t[0], t[1]); });
    B = Battle.createBattle({
      player: { name: 'شهد', team: save.team, items: save.items },
      foe: { name: c.wild ? foeTeam[0].name + ' البري' : c.foe, team: foeTeam, items: JSON.parse(JSON.stringify(c.items || {})) },
      wild: c.wild
    });
    $('battleBg').innerHTML = Art.bg(c.bg || 'forest');
    renderMon(0, true); renderMon(1, true);
    show('battle').then(function () {
      var intro = c.wild ? 'ظهر ' + foeTeam[0].name + ' البري!' : c.foe + ' يريد المعركة!';
      msg(intro).then(function () { return wait(1100); })
        .then(function () { return msg(c.wild ? '' : c.foe + ' أرسل ' + foeTeam[0].name + '!'); })
        .then(function () { return c.wild ? null : wait(1000); })
        .then(function () { return msg('هيا يا ' + Battle.active(B.sides[0]).name + '!'); })
        .then(function () { return wait(900); })
        .then(function () {
          if (c.tutorial) return msg('اختاري "الضربات" ثم اختاري ضربة لشرارة.').then(function () { return wait(400); });
        })
        .then(mainMenu);
    });
  }

  function renderMon(side, enter) {
    var mon = Battle.active(B.sides[side]);
    var el = side === 0 ? $('myMon') : $('foeMon');
    el.className = 'mon ' + (side === 0 ? 'my-mon' : 'foe-mon') + (enter ? ' enter' : '');
    el.innerHTML = Art.creature(mon.species, false, mon.species === 'sharara' ? Meta.look('skin') : null);
    if (side === 0) el.firstChild.style.transform = 'scaleX(-1)';
    updateHud(side, true);
  }

  function updateHud(side, instant) {
    var mon = Battle.active(B.sides[side]);
    var hud = side === 0 ? $('hudMine') : $('hudFoe');
    hud.querySelector('.nm').textContent = mon.name;
    hud.querySelector('.lv').textContent = 'م' + mon.level;
    var tag = hud.querySelector('.type-tag');
    tag.textContent = Battle.TYPES[mon.type].name; tag.style.background = Battle.TYPES[mon.type].color;
    var fill = hud.querySelector('.hpfill');
    if (instant) { fill.style.transition = 'none'; requestAnimationFrame(function () { fill.style.transition = ''; }); }
    var pct = Math.max(0, mon.hp / mon.maxHp * 100);
    fill.style.width = pct + '%';
    fill.className = 'hpfill' + (pct < 25 ? ' low' : pct < 50 ? ' mid' : '');
    if (side === 0) {
      hud.querySelector('.hptext').textContent = mon.hp + ' / ' + mon.maxHp;
      hud.querySelector('.xpfill').style.width = (mon.xp / Battle.xpToNext(mon) * 100) + '%';
    }
  }

  function msg(t) { $('bmsg').textContent = t; return Promise.resolve(); }
  function wait(ms) {
    return new Promise(function (res) {
      var done = false;
      function fin() { if (!done) { done = true; skip = null; res(); } }
      skip = fin;
      setTimeout(fin, ms);
    });
  }
  $('battle').addEventListener('click', function (e) {
    if (skip && !e.target.closest('.btn')) skip();
  });

  function menu(buttons) {
    var m = $('bmenu'); m.innerHTML = '';
    buttons.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn' + (b.full ? ' full' : '');
      el.innerHTML = b.html;
      if (b.bg) el.style.background = b.bg;
      el.disabled = !!b.disabled;
      el.onclick = function () { if (busy) return; sfx.tap(); b.fn(); };
      m.appendChild(el);
    });
  }

  function mainMenu() {
    busy = false;
    var me = Battle.active(B.sides[0]);
    msg('ماذا سيفعل ' + me.name + '؟');
    menu([
      { html: '⚔️ الضربات', bg: '#fca5a5', fn: movesMenu },
      { html: '🐾 الفريق', bg: '#86efac', fn: function () { teamMenu(false); } },
      { html: '🎒 الحقيبة', bg: '#fde68a', fn: bagMenu },
      { html: '🏃 هروب', bg: '#bae6fd', fn: function () { act({ kind: 'run' }); } }
    ]);
  }

  function movesMenu() {
    var me = Battle.active(B.sides[0]);
    var foe = Battle.active(B.sides[1]);
    var btns = me.moves.map(function (s, i) {
      var mv = GameData.MOVES[s.id];
      var eff = mv.power ? Battle.effectiveness(mv.type, foe.type) : 1;
      var hint = eff > 1 ? ' 🔥' : eff < 1 ? ' 🔻' : '';
      return { html: mv.name + hint + '<small>' + Battle.TYPES[mv.type].name + ' · ' + s.pp + '/' + mv.pp + '</small>',
               bg: Battle.TYPES[mv.type].color, disabled: s.pp <= 0, fn: function () { act({ kind: 'move', index: i }); } };
    });
    btns.push({ html: 'رجوع', full: true, fn: mainMenu });
    msg('اختاري ضربة: 🔥 قوية ضد الخصم، 🔻 ضعيفة.');
    menu(btns);
  }

  function teamMenu(forced) {
    var side = B.sides[0];
    var btns = side.team.map(function (m, i) {
      var isActive = i === side.active;
      return { html: m.name + ' م' + m.level + '<small>' + m.hp + '/' + m.maxHp + (isActive ? ' · في المعركة' : '') + '</small>',
               bg: Battle.TYPES[m.type].color, disabled: m.hp <= 0 || isActive,
               fn: function () {
                 if (forced) {
                   side.active = i;
                   busy = true;
                   play([{ t: 'switch', side: 0, index: i, msg: 'تعال يا ' + m.name + '!' }]).then(mainMenu);
                 } else act({ kind: 'switch', to: i });
               } };
    });
    if (!forced) btns.push({ html: 'رجوع', full: true, fn: mainMenu });
    msg(forced ? 'اختاري كائناً آخر للمعركة!' : 'من تريدين أن ترسلي؟');
    menu(btns);
  }

  function bagMenu() {
    var n = B.sides[0].items.potion || 0;
    var me = Battle.active(B.sides[0]);
    menu([
      { html: '🧪 جرعة شفاء<small>عندك ' + n + '</small>', bg: '#f9a8d4', disabled: n <= 0 || me.hp >= me.maxHp,
        fn: function () { act({ kind: 'item', item: 'potion' }); } },
      { html: 'رجوع', fn: mainMenu }
    ]);
    msg(GameData.ITEMS.potion.desc);
  }

  function act(action) {
    busy = true;
    menu([]);
    var foeAction = Battle.aiChoose(B, 1);
    var ev = Battle.resolveTurn(B, [action, foeAction]);
    play(ev).then(afterTurn);
  }

  function afterTurn() {
    if (B.over) return endBattle();
    if (Battle.active(B.sides[0]).hp <= 0) return teamMenu(true);
    mainMenu();
  }

  var typeFlash = { electric: '#fef08a', water: '#7dd3fc', grass: '#86efac', fire: '#fdba74', rock: '#d6b48a', normal: '#ffffff' };

  function play(events) {
    var p = Promise.resolve();
    events.forEach(function (e) {
      p = p.then(function () { return playOne(e); });
    });
    return p;
  }

  function playOne(e) {
    var el = function (side) { return side === 0 ? $('myMon') : $('foeMon'); };
    switch (e.t) {
      case 'attack':
        msg(e.msg);
        var a = el(e.side);
        a.classList.add(e.side === 0 ? 'lunge-mine' : 'lunge-foe');
        if (e.mtype === 'electric') { a.classList.add('star-glow'); sfx.zap(); }
        var f = document.createElement('div');
        f.className = 'flash'; f.style.background = typeFlash[e.mtype] || '#fff';
        $('fx').appendChild(f);
        setTimeout(function () { f.remove(); a.classList.remove('lunge-mine', 'lunge-foe', 'star-glow'); }, 400);
        return wait(800);
      case 'damage':
        var t = el(e.side);
        t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit');
        sfx.hit();
        updateHud(e.side);
        return wait(650);
      case 'heal':
        msg(e.msg); sfx.heal();
        if (e.side === 0 && e.mon !== B.sides[0].active) {} else updateHud(e.side);
        return wait(1200);
      case 'faint':
        msg(e.msg); sfx.faint();
        el(e.side).classList.add('faint');
        return wait(1300);
      case 'switch':
        msg(e.msg);
        renderMon(e.side, true);
        return wait(1100);
      case 'xp':
        msg(e.msg); updateHud(0);
        return wait(1100);
      case 'levelup':
        msg(e.msg); sfx.win(); updateHud(0);
        return wait(1400);
      case 'end':
      case 'needSwitch':
        return Promise.resolve();
      default:
        if (e.msg) { msg(e.msg); return wait(1100); }
        return Promise.resolve();
    }
  }

  function endBattle() {
    var won = B.winner === 0, ran = B.winner === -1;
    var text = won ? (cfg.wild ? 'انتصرتِ في المعركة! 🎉' : 'فزتِ على ' + cfg.foe + '! 🎉') : ran ? 'هربتِ من المعركة.' : 'خسرتِ المعركة...';
    if (won) sfx.win();
    msg(text);
    menu([]);
    wait(1800).then(function () {
      Battle.healTeam(save.team);
      if (won) {
        Meta.addStars(cfg.wild ? GameData.STAR_REWARDS.wildWin : GameData.STAR_REWARDS.trainerWin, true);
        persist();
        return show('story').then(nextStep);
      }
      // خسارة أو هروب: نعيد المعركة بعد التشجيع
      save.idx--; // نرجع لخطوة المعركة
      queue = [
        { show: { right: 'salma' } },
        { say: 'الحكيمة سلمى', text: ran ? 'لا يمكن الهرب دائماً يا شهد. خذي نفساً عميقاً وحاولي مرة ثانية!' :
            'لا بأس يا شهد، كل مدرب عظيم خسر مرة. شفيت فريقك، حاولي مرة ثانية!' },
        { hide: ['right'] }
      ];
      persist();
      return show('story').then(nextStep);
    });
  }

  // زر الرجوع في أندرويد
  window.goBack = function () {
    if (current === 'title') return 'exit';
    persist();
    goTitle();
    return 'ok';
  };

  window.Game = { show: show, sfx: sfx, goTitle: goTitle, current: function () { return current; } };
  initTitle();
  Meta.init();
})();
