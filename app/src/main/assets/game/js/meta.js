// رحلة المدربة — النجوم، المتجر، صفحة الحساب، ولوحة الشحن
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var META_KEY = 'rihla_meta_v1';
  var SHOP = GameData.SHOP;
  var P = Online.Player, A = Online.Admin;

  function load() { try { return JSON.parse(localStorage.getItem(META_KEY)); } catch (e) { return null; } }
  function persist() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }
  var meta = load() || {};
  meta.stars = meta.stars || 0;
  meta.ownedStar = meta.ownedStar || [];
  meta.look = meta.look || { outfit: 'outfit_default', skin: 'skin_default' };
  meta.rewardedEps = meta.rewardedEps || [];

  var online = false;     // هل الاتصال بالسيرفر شغال
  var shopTab = 'outfit';

  function item(id) { return SHOP.filter(function (i) { return i.id === id; })[0]; }
  function coins() { return P.profile ? P.profile.coins : null; }
  function owns(it) {
    if (it.price === 0) return true;
    if (it.currency === 'star') return meta.ownedStar.indexOf(it.id) >= 0;
    return !!(P.profile && P.profile.owned.indexOf(it.id) >= 0);
  }

  // ===== تنبيه =====
  var toastTimer = null;
  function toast(msg, err) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast' + (err ? ' err' : ''); }, 2800);
  }

  // ===== المحفظة =====
  function updateWallet() {
    var c = coins();
    var txt = c == null ? '—' : String(c);
    $('wCoins').textContent = txt; $('wStars').textContent = meta.stars;
    document.querySelectorAll('.mwCoins').forEach(function (e) { e.textContent = txt; });
    document.querySelectorAll('.mwStars').forEach(function (e) { e.textContent = meta.stars; });
    if ($('pCoins')) { $('pCoins').textContent = txt; $('pStars').textContent = meta.stars; }
  }

  function addStars(n) {
    meta.stars += n; persist(); updateWallet();
    toast('حصلتِ على ' + n + ' نجمة ⭐');
  }

  function episodeReward(ep) {
    if (meta.rewardedEps.indexOf(ep) >= 0) return;
    meta.rewardedEps.push(ep);
    meta.stars += GameData.STAR_REWARDS.episode; persist(); updateWallet();
    setTimeout(function () { toast('مكافأة إكمال الحلقة: ' + GameData.STAR_REWARDS.episode + ' نجمة ⭐'); }, 900);
  }

  function dailyReward() {
    var today = new Date().toISOString().slice(0, 10);
    if (meta.lastDaily === today) return;
    meta.lastDaily = today;
    meta.stars += GameData.STAR_REWARDS.daily; persist(); updateWallet();
    setTimeout(function () { toast('مكافأة اليوم: ' + GameData.STAR_REWARDS.daily + ' نجمة ⭐'); }, 1200);
  }

  // ===== الاتصال =====
  function sync(showNew) {
    return P.ensure().then(function () {
      online = true;
      var n = P.newCoins();
      updateWallet();
      if (n > 0 && showNew !== false) { Game.sfx.win(); toast('وصلتك ' + n + ' كارة كوين 🪙'); }
      if (Game.current() === 'shop') renderShop();
      if (Game.current() === 'profile') renderProfile();
    }).catch(function () {
      online = false;
      updateWallet();
      if (Game.current() === 'profile') renderProfile();
    });
  }

  // ===== الشكل الحالي =====
  function look(kind) {
    var id = meta.look[kind];
    var it = item(id);
    if (!it || !owns(it)) return {};
    return it.look;
  }

  // ===== المتجر =====
  function renderShop() {
    updateWallet();
    $('pvShahd').innerHTML = Art.shahd('', look('outfit'));
    $('pvSharara').innerHTML = Art.creature('sharara', false, look('skin'));
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === shopTab); });
    var g = $('shopGrid');
    if (shopTab === 'chars') {
      g.innerHTML = '<div class="card soon">🐾 شخصيات وكائنات جديدة<br>قريباً في التحديث القادم!</div>';
      return;
    }
    g.innerHTML = '';
    SHOP.filter(function (i) { return i.kind === shopTab; }).forEach(function (it) {
      var el = document.createElement('div');
      var equipped = meta.look[it.kind] === it.id;
      el.className = 'item' + (equipped ? ' equipped' : '');
      var thumb = it.kind === 'outfit' ? Art.shahd('', it.look) : Art.creature('sharara', false, it.look);
      var btn;
      if (equipped) btn = '<button class="btn eq" disabled>✔ مستعمل</button>';
      else if (owns(it)) btn = '<button class="btn eq" data-act="equip">ارتدِ</button>';
      else if (it.currency === 'coin') btn = '<button class="btn buy-coin" data-act="buy">🪙 ' + it.price + '</button>';
      else btn = '<button class="btn buy-star" data-act="buy">⭐ ' + it.price + '</button>';
      el.innerHTML = '<div class="thumb">' + thumb + '</div><div class="nm">' + it.name + '</div>' + btn;
      var b = el.querySelector('[data-act]');
      if (b) b.onclick = function () { Game.sfx.tap(); act(it, b.getAttribute('data-act'), b); };
      g.appendChild(el);
    });
  }

  function equip(it) {
    meta.look[it.kind] = it.id; persist();
    toast('صار ' + it.name + ' هو الشكل المستعمل ✨');
    renderShop();
  }

  function act(it, what, btn) {
    if (what === 'equip') return equip(it);
    if (it.currency === 'star') {
      if (meta.stars < it.price) return toast('نجومك ما تكفي. العبي واجمعي نجوم أكثر ⭐', true);
      meta.stars -= it.price; meta.ownedStar.push(it.id); persist();
      Game.sfx.join(); toast('اشتريتِ ' + it.name + '!');
      return equip(it);
    }
    // شراء بالكوين
    if (!online) return toast('المتجر بالكوين يحتاج إنترنت', true);
    if (coins() < it.price) return toast('رصيدك ما يكفي. اشحن كارة كوين من صفحة حسابي 🪙', true);
    btn.disabled = true; btn.textContent = '...';
    P.buy(it.id, it.price).then(function () {
      Game.sfx.join(); toast('اشتريتِ ' + it.name + '!');
      equip(it);
    }).catch(function (e) {
      toast(e.message === 'NOT_ENOUGH' ? 'رصيدك ما يكفي 🪙' : 'صار خطأ بالشراء، حاول مرة ثانية', true);
      renderShop();
    });
  }

  // ===== حسابي =====
  function renderProfile() {
    var acc = P.account();
    $('pidText').textContent = (acc && acc.pid) || (online ? '...' : '—');
    var st = $('netStatus');
    if (online) { st.textContent = 'متصل بالسيرفر ✅'; st.className = 'status ok'; }
    else { st.textContent = 'غير متصل. شغّل الإنترنت حتى يظهر الآيدي والرصيد.'; st.className = 'status err'; }
    $('packs').innerHTML = GameData.COIN_PACKS.map(function (p) {
      return '<div class="pack">🪙 ' + p.coins + '<small>' + p.price + ' دينار</small></div>';
    }).join('');
    updateWallet();
  }

  function copy(text) {
    if (window.AndroidBridge && AndroidBridge.copy) { AndroidBridge.copy(text); return Promise.resolve(); }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); return Promise.resolve();
  }
  function openUrl(url) {
    if (window.AndroidBridge && AndroidBridge.open) AndroidBridge.open(url);
    else window.open(url, '_blank');
  }

  // ===== لوحة الشحن =====
  var admAmount = 0;
  function renderAdmin() {
    var logged = A.logged();
    $('admLogin').style.display = logged ? 'none' : 'block';
    $('admPanel').style.display = logged ? 'block' : 'none';
    if (logged) loadHistory();
    $('admAmounts').innerHTML = '';
    GameData.COIN_PACKS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'btn'; b.textContent = p.coins;
      b.onclick = function () {
        admAmount = p.coins; $('admAmount').value = '';
        $('admAmounts').querySelectorAll('.btn').forEach(function (x) { x.classList.toggle('sel', x === b); });
      };
      $('admAmounts').appendChild(b);
    });
  }

  function msg(id, text, cls) { $(id).textContent = text; $(id).className = 'status' + (cls ? ' ' + cls : ''); }

  function errText(e) {
    var m = (e && e.message) || '';
    if (m === 'PID_NOT_FOUND') return 'ما لكيت لاعب بهذا الآيدي';
    if (/INVALID_LOGIN|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL/.test(m)) return 'الإيميل أو كلمة السر غلط';
    if (/PERMISSION|403/.test(m)) return 'ما عندك صلاحية. تأكد من قواعد Firestore.';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'ما أكو إنترنت';
    return 'خطأ: ' + m;
  }

  function loadHistory() {
    A.history().then(function (rows) {
      $('admHistory').innerHTML = rows.length ? rows.map(function (r) {
        var d = new Date(r.at);
        return '<div><span>🆔 ' + r.pid + '</span><b>+' + r.amount + ' 🪙</b><span>' + d.toLocaleDateString('en-GB') + ' ' +
               d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
      }).join('') : '<div>ما أكو عمليات بعد</div>';
    }).catch(function (e) { $('admHistory').textContent = errText(e); });
  }

  function initAdmin() {
    $('admLoginBtn').onclick = function () {
      msg('admLoginMsg', 'جاري الدخول...');
      A.login($('admEmail').value.trim(), $('admPass').value).then(function () {
        $('admPass').value = ''; msg('admLoginMsg', ''); renderAdmin();
      }).catch(function (e) { msg('admLoginMsg', errText(e), 'err'); });
    };
    $('admFind').onclick = function () {
      var pid = $('admPid').value.trim();
      if (!/^\d{8}$/.test(pid)) return msg('admPlayer', 'الآيدي لازم يكون 8 أرقام', 'err');
      msg('admPlayer', 'جاري البحث...');
      A.lookup(pid).then(function (p) {
        msg('admPlayer', 'اللاعب ' + p.pid + ' — رصيده الحالي: ' + p.coins + ' 🪙', 'ok');
      }).catch(function (e) { msg('admPlayer', errText(e), 'err'); });
    };
    $('admSend').onclick = function () {
      var pid = $('admPid').value.trim();
      var amount = parseInt($('admAmount').value, 10) || admAmount;
      if (!/^\d{8}$/.test(pid)) return msg('admMsg', 'اكتب آيدي اللاعب (8 أرقام)', 'err');
      if (!amount || amount <= 0 || amount > 100000) return msg('admMsg', 'اختار عدد الكوينات', 'err');
      var b = $('admSend');
      if (b.getAttribute('data-confirm') !== pid + ':' + amount) {
        b.setAttribute('data-confirm', pid + ':' + amount);
        b.textContent = 'تأكيد: ' + amount + ' كوين للآيدي ' + pid + '؟';
        return;
      }
      b.removeAttribute('data-confirm'); b.textContent = '➕ إضافة الكوينات'; b.disabled = true;
      msg('admMsg', 'جاري الشحن...');
      A.topup(pid, amount).then(function (p) {
        Game.sfx.win();
        msg('admMsg', '✅ تم! رصيد اللاعب صار ' + p.coins + ' 🪙', 'ok');
        msg('admPlayer', '');
        loadHistory();
      }).catch(function (e) { msg('admMsg', errText(e), 'err'); })
        .then(function () { b.disabled = false; });
    };
    $('admAmount').oninput = function () {
      admAmount = 0;
      $('admAmounts').querySelectorAll('.btn').forEach(function (x) { x.classList.remove('sel'); });
    };
    $('admLogout').onclick = function () { A.logout(); renderAdmin(); };
  }

  // ===== التشغيل =====
  function init() {
    $('shopBg').innerHTML = Art.bg('village');
    $('profBg').innerHTML = Art.bg('path');
    $('admBg').innerHTML = Art.bg('night');

    $('btnShop').onclick = function () { Game.sfx.tap(); renderShop(); Game.show('shop'); sync(); };
    $('btnProfile').onclick = function () { Game.sfx.tap(); renderProfile(); Game.show('profile'); sync(); };
    document.querySelectorAll('.tab').forEach(function (t) {
      t.onclick = function () { Game.sfx.tap(); shopTab = t.getAttribute('data-tab'); renderShop(); };
    });
    $('btnCopy').onclick = function () {
      var acc = P.account();
      if (!acc || !acc.pid) return toast('الآيدي يظهر بعد الاتصال بالإنترنت', true);
      copy(acc.pid).then(function () { toast('تم نسخ الآيدي: ' + acc.pid + ' 📋'); });
    };
    $('btnStore').onclick = function () { Game.sfx.tap(); openUrl(Online.STORE_URL); };
    $('btnRefresh').onclick = function () { Game.sfx.tap(); msg('netStatus', 'جاري التحديث...'); sync(); };

    // لوحة الشحن مخفية: اضغط على شعار اللعبة 7 مرات
    var taps = 0, tapTimer = null;
    $('logo').onclick = function () {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 2500);
      if (taps >= 7) { taps = 0; renderAdmin(); Game.show('admin'); }
    };
    initAdmin();

    updateWallet();
    dailyReward();
    sync(false);
    // فحص الرصيد كل 45 ثانية حتى توصل الكوينات للاعب مباشرة
    setInterval(function () {
      var c = Game.current();
      if (c === 'title' || c === 'shop' || c === 'profile') sync();
    }, 45000);
  }

  window.Meta = { init: init, look: look, addStars: addStars, episodeReward: episodeReward,
                  updateWallet: updateWallet, toast: toast };
})();
