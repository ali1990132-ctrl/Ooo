// رحلة المدربة — محرك المعارك بالدور
// المحرك منفصل عن الرسم: يأخذ الحالة والأوامر ويرجع قائمة أحداث.
// هذا يسهل ربط اللعب أونلاين لاحقاً (كل لاعب يرسل أمره فقط).

(function (root) {
  var D = root.GameData || (typeof require !== 'undefined' ? require('./data.js') : null);
  var MOVES = D.MOVES, SPECIES = D.SPECIES, TYPE_CHART = D.TYPE_CHART, TYPES = D.TYPES, ITEMS = D.ITEMS;

  // مولد أرقام عشوائية بذرة ثابتة (حتى تتطابق المعركة عند اللاعبين أونلاين)
  function makeRng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return (s % 100000) / 100000;
    };
  }

  function calcStats(mon) {
    var b = SPECIES[mon.species], L = mon.level;
    mon.maxHp = b.hp + L * 3;
    mon.atk = Math.floor(b.atk + L * 1.5);
    mon.def = Math.floor(b.def + L * 1.5);
    mon.spd = Math.floor(b.spd + L * 1.5);
  }

  function createMon(speciesId, level, nickname) {
    var b = SPECIES[speciesId];
    var mon = {
      species: speciesId, name: nickname || b.name, type: b.type,
      level: level, xp: 0,
      moves: b.moves.map(function (m) { return { id: m, pp: MOVES[m].pp }; }),
      stages: { atk: 0, def: 0 }
    };
    calcStats(mon);
    mon.hp = mon.maxHp;
    return mon;
  }

  function xpToNext(mon) { return mon.level * 12; }

  function stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }

  function effectiveness(moveType, defType) {
    var row = TYPE_CHART[moveType] || {};
    return row[defType] || 1;
  }

  function active(side) { return side.team[side.active]; }

  function alive(side) { return side.team.filter(function (m) { return m.hp > 0; }); }

  function createBattle(opts) {
    // opts: { player:{name, team, items}, foe:{name, team, items}, wild:bool, seed }
    var st = {
      sides: [
        { name: opts.player.name, team: opts.player.team, active: firstAlive(opts.player.team), items: opts.player.items || {} },
        { name: opts.foe.name, team: opts.foe.team, active: 0, items: opts.foe.items || {} }
      ],
      wild: !!opts.wild, turn: 0, over: false, winner: null,
      seed: opts.seed || Math.floor(Math.random() * 1e9)
    };
    st.rng = makeRng(st.seed);
    st.sides.forEach(function (sd) { sd.team.forEach(function (m) { m.stages = { atk: 0, def: 0 }; }); });
    return st;
  }

  function firstAlive(team) {
    for (var i = 0; i < team.length; i++) if (team[i].hp > 0) return i;
    return 0;
  }

  function calcDamage(st, att, def, move) {
    var A = att.atk * stageMul(att.stages.atk);
    var Df = def.def * stageMul(def.stages.def);
    var base = (((2 * att.level) / 5 + 2) * move.power * (A / Df)) / 50 + 2;
    var stab = move.type === att.type ? 1.5 : 1;
    var eff = effectiveness(move.type, def.type);
    var crit = st.rng() < 0.0625 ? 1.5 : 1;
    var rand = 0.85 + st.rng() * 0.15;
    var dmg = Math.max(1, Math.floor(base * stab * eff * crit * rand * 1.3));
    return { dmg: dmg, eff: eff, crit: crit > 1 };
  }

  // ذكاء الخصم: يختار الضربة الأقوى غالباً
  function aiChoose(st, sideIdx) {
    var me = active(st.sides[sideIdx]), foe = active(st.sides[1 - sideIdx]);
    var side = st.sides[sideIdx];
    if (side.items.potion > 0 && me.hp < me.maxHp * 0.3 && st.rng() < 0.6) {
      return { kind: 'item', item: 'potion' };
    }
    var best = -1, bestScore = -1;
    me.moves.forEach(function (m, i) {
      if (m.pp <= 0) return;
      var mv = MOVES[m.id];
      var score = mv.power ? mv.power * effectiveness(mv.type, foe.type) * (mv.type === me.type ? 1.5 : 1) : 25;
      if (!mv.power && st.turn > 3) score = 5;
      score *= 0.7 + st.rng() * 0.6;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best < 0) return { kind: 'move', index: -1 }; // يصارع بدون ضربات
    return { kind: 'move', index: best };
  }

  function priority(st, idx, action) {
    if (action.kind === 'run' || action.kind === 'switch' || action.kind === 'item') return 1000;
    return active(st.sides[idx]).spd + st.rng();
  }

  // ينفذ دوراً كاملاً. actions[0] للاعب و actions[1] للخصم
  function resolveTurn(st, actions) {
    var ev = [];
    if (st.over) return ev;
    st.turn++;
    var order = [0, 1].sort(function (a, b) {
      return priority(st, b, actions[b]) - priority(st, a, actions[a]);
    });
    for (var k = 0; k < order.length && !st.over; k++) {
      var i = order[k];
      var side = st.sides[i], other = st.sides[1 - i];
      var me = active(side);
      if (me.hp <= 0) continue;
      var a = actions[i];
      if (a.kind === 'run') {
        if (st.wild) {
          ev.push({ t: 'text', msg: 'هربتم بسلام!' });
          st.over = true; st.winner = -1;
          ev.push({ t: 'end', winner: -1 });
        } else {
          ev.push({ t: 'text', msg: 'لا يمكن الهرب من تحدي مدرب!' });
        }
        continue;
      }
      if (a.kind === 'switch') {
        side.active = a.to;
        me.stages = { atk: 0, def: 0 };
        ev.push({ t: 'switch', side: i, index: a.to, msg: side.name + ': تعال يا ' + active(side).name + '!' });
        continue;
      }
      if (a.kind === 'item') {
        var it = ITEMS[a.item];
        var target = a.target != null ? side.team[a.target] : me;
        if (!side.items[a.item]) { ev.push({ t: 'text', msg: 'لا توجد ' + it.name + '!' }); continue; }
        side.items[a.item]--;
        var before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + it.heal);
        ev.push({ t: 'heal', side: i, mon: side.team.indexOf(target), amount: target.hp - before, hp: target.hp,
                  msg: side.name + ' استعمل ' + it.name + '. استعاد ' + target.name + ' ' + (target.hp - before) + ' نقطة صحة.' });
        continue;
      }
      // ضربة
      var slot = me.moves[a.index];
      var move = slot ? MOVES[slot.id] : MOVES.tackle;
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
      var foe = active(other);
      ev.push({ t: 'attack', side: i, move: slot ? slot.id : 'tackle', mtype: move.type, msg: me.name + ' استعمل ' + move.name + '!' });
      if (st.rng() * 100 >= move.acc) {
        ev.push({ t: 'text', msg: 'لكن الضربة أخطأت!' });
        continue;
      }
      if (move.power > 0) {
        var r = calcDamage(st, me, foe, move);
        foe.hp = Math.max(0, foe.hp - r.dmg);
        ev.push({ t: 'damage', side: 1 - i, amount: r.dmg, hp: foe.hp, eff: r.eff });
        if (r.crit) ev.push({ t: 'text', msg: 'ضربة حاسمة!' });
        if (r.eff > 1) ev.push({ t: 'text', msg: 'الضربة فعالة جداً!' });
        else if (r.eff < 1) ev.push({ t: 'text', msg: 'الضربة ليست فعالة كثيراً...' });
        if (foe.hp <= 0) handleFaint(st, 1 - i, ev);
      }
      if (move.effect) {
        var tgt = move.effect.target === 'self' ? me : foe;
        var stat = move.effect.stat, old = tgt.stages[stat];
        tgt.stages[stat] = Math.max(-6, Math.min(6, old + move.effect.stages));
        var statName = stat === 'atk' ? 'هجوم' : 'دفاع';
        if (tgt.stages[stat] === old) ev.push({ t: 'text', msg: 'لم يتغير شيء!' });
        else ev.push({ t: 'stat', side: tgt === me ? i : 1 - i, stat: stat,
                       msg: (move.effect.stages > 0 ? 'ارتفع ' : 'انخفض ') + statName + ' ' + tgt.name + '!' });
      }
    }
    return ev;
  }

  function handleFaint(st, idx, ev) {
    var side = st.sides[idx];
    var mon = active(side);
    ev.push({ t: 'faint', side: idx, msg: mon.name + ' سقط ولم يعد يستطيع القتال!' });
    if (idx === 1) {
      // اللاعب يكسب خبرة
      var pm = active(st.sides[0]);
      if (pm.hp > 0) gainXp(pm, mon.level * 12, ev);
    }
    var left = alive(side);
    if (left.length === 0) {
      st.over = true; st.winner = 1 - idx;
      ev.push({ t: 'end', winner: 1 - idx });
    } else if (idx === 1) {
      side.active = side.team.indexOf(left[0]);
      ev.push({ t: 'switch', side: 1, index: side.active, msg: side.name + ' أرسل ' + active(side).name + '!' });
    } else {
      ev.push({ t: 'needSwitch', side: 0 });
    }
  }

  function gainXp(mon, amount, ev) {
    mon.xp += amount;
    ev.push({ t: 'xp', amount: amount, msg: mon.name + ' كسب ' + amount + ' نقطة خبرة!' });
    while (mon.xp >= xpToNext(mon)) {
      mon.xp -= xpToNext(mon);
      var oldMax = mon.maxHp;
      mon.level++;
      calcStats(mon);
      mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
      ev.push({ t: 'levelup', level: mon.level, msg: mon.name + ' وصل إلى المستوى ' + mon.level + '!' });
    }
  }

  function healTeam(team) {
    team.forEach(function (m) {
      m.hp = m.maxHp;
      m.moves.forEach(function (s) { s.pp = MOVES[s.id].pp; });
    });
  }

  var Battle = {
    makeRng: makeRng, createMon: createMon, createBattle: createBattle, resolveTurn: resolveTurn,
    aiChoose: aiChoose, effectiveness: effectiveness, active: active, alive: alive,
    healTeam: healTeam, xpToNext: xpToNext, TYPES: TYPES
  };
  if (typeof module !== 'undefined') module.exports = Battle;
  else root.Battle = Battle;
})(typeof window !== 'undefined' ? window : this);
