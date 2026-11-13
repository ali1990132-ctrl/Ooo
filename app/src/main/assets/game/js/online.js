// رحلة المدربة — الاتصال بسيرفر Firebase (بدون مكتبات خارجية، عن طريق REST)
// يشمل: حساب اللاعب التلقائي، آيدي اللاعب، رصيد كارة كوين، الشراء، ولوحة الشحن للمدير.

var FIREBASE = {
  apiKey: 'AIzaSyCL74bP-HvoJ8hnB1LQdl-IMI5e65goMRo',
  projectId: 'rihla-game'
};
var STORE_URL = 'https://ali1990132-ctrl.github.io/Karar-TV/';

(function (root) {
  var AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  var TOKEN = 'https://securetoken.googleapis.com/v1/token?key=' + FIREBASE.apiKey;
  var DB = 'projects/' + FIREBASE.projectId + '/databases/(default)/documents';
  var FS = 'https://firestore.googleapis.com/v1/' + DB;
  var KEY = 'rihla_account_v1';

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ===== تحويل القيم من وإلى صيغة Firestore =====
  function toFs(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    var f = {}; Object.keys(v).forEach(function (k) { f[k] = toFs(v[k]); });
    return { mapValue: { fields: f } };
  }
  function fromFs(v) {
    if (!v) return null;
    if ('integerValue' in v) return parseInt(v.integerValue, 10);
    if ('doubleValue' in v) return v.doubleValue;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFs);
    if ('mapValue' in v) return fields(v.mapValue.fields || {});
    return null;
  }
  function fields(f) { var o = {}; Object.keys(f || {}).forEach(function (k) { o[k] = fromFs(f[k]); }); return o; }
  function docFields(obj) { var f = {}; Object.keys(obj).forEach(function (k) { f[k] = toFs(obj[k]); }); return f; }

  // ===== طلبات الشبكة =====
  function req(method, url, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) {
            var msg = (j.error && (j.error.message || j.error.status)) || ('HTTP ' + r.status);
            var e = new Error(msg); e.status = r.status; throw e;
          }
          return j;
        });
      });
  }

  // ===== الحسابات =====
  // acc = { uid, idToken, refreshToken, exp, email? }
  function saveSession(key, j) {
    var acc = { uid: j.localId || j.user_id, idToken: j.idToken || j.id_token,
                refreshToken: j.refreshToken || j.refresh_token,
                exp: Date.now() + (parseInt(j.expiresIn || j.expires_in, 10) - 120) * 1000 };
    var old = load(key) || {};
    Object.keys(acc).forEach(function (k) { old[k] = acc[k]; });
    store(key, old);
    return old;
  }

  function token(key) {
    var acc = load(key);
    if (!acc || !acc.refreshToken) return Promise.reject(new Error('NO_ACCOUNT'));
    if (acc.idToken && Date.now() < acc.exp) return Promise.resolve(acc);
    return fetch(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                          body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(acc.refreshToken) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.id_token) throw new Error((j.error && j.error.message) || 'TOKEN_FAILED');
        return saveSession(key, j);
      });
  }

  function getDoc(path, tk) {
    return req('GET', FS + '/' + path, null, tk).then(function (d) {
      return { data: fields(d.fields), updateTime: d.updateTime };
    }).catch(function (e) { if (e.status === 404) return null; throw e; });
  }

  function commit(writes, tk) {
    return req('POST', 'https://firestore.googleapis.com/v1/' + DB + ':commit', { writes: writes }, tk);
  }

  function randomPid() { return String(10000000 + Math.floor(Math.random() * 90000000)); }

  // ===== اللاعب =====
  var Player = {
    profile: null,

    account: function () { return load(KEY); },

    // ينشئ حساب اللاعب أول مرة ويعطيه آيدي من 8 أرقام
    ensure: function () {
      var acc = load(KEY);
      var p = acc && acc.refreshToken ? Promise.resolve(acc)
        : req('POST', AUTH + 'signUp?key=' + FIREBASE.apiKey, { returnSecureToken: true })
            .then(function (j) { return saveSession(KEY, j); });
      return p.then(function () { return token(KEY); }).then(function (a) {
        if (a.pid) return Player.refresh();
        return Player.createProfile(a, 0);
      });
    },

    createProfile: function (a, tries) {
      var pid = randomPid();
      var writes = [
        { update: { name: DB + '/pids/' + pid, fields: docFields({ uid: a.uid }) },
          currentDocument: { exists: false } },
        { update: { name: DB + '/players/' + a.uid,
                    fields: docFields({ pid: pid, coins: 0, owned: [], lastBuy: '', created: new Date() }) },
          currentDocument: { exists: false } }
      ];
      return commit(writes, a.idToken).then(function () {
        var acc = load(KEY); acc.pid = pid; store(KEY, acc);
        return Player.refresh();
      }).catch(function (e) {
        // الآيدي مستعمل أو الحساب موجود مسبقاً
        if (tries < 4) {
          return getDoc('players/' + a.uid, a.idToken).then(function (d) {
            if (d) { var acc = load(KEY); acc.pid = d.data.pid; store(KEY, acc); return Player.refresh(); }
            return Player.createProfile(a, tries + 1);
          });
        }
        throw e;
      });
    },

    refresh: function () {
      return token(KEY).then(function (a) {
        return getDoc('players/' + a.uid, a.idToken).then(function (d) {
          if (!d) { var acc = load(KEY); delete acc.pid; store(KEY, acc); return Player.createProfile(a, 0); }
          Player.profile = d.data; Player.profile._updateTime = d.updateTime;
          var acc2 = load(KEY); acc2.pid = d.data.pid; acc2.lastCoins = acc2.lastCoins == null ? d.data.coins : acc2.lastCoins; store(KEY, acc2);
          return Player.profile;
        });
      });
    },

    // يرجع عدد الكوينات الجديدة اللي وصلت منذ آخر مرة
    newCoins: function () {
      var acc = load(KEY);
      if (!acc || !Player.profile) return 0;
      var diff = Player.profile.coins - (acc.lastCoins || 0);
      acc.lastCoins = Player.profile.coins; store(KEY, acc);
      return diff > 0 ? diff : 0;
    },

    buy: function (itemId, price) {
      return Player.refresh().then(function (pr) {
        if (pr.owned.indexOf(itemId) >= 0) return pr;
        if (pr.coins < price) { var e = new Error('NOT_ENOUGH'); throw e; }
        return token(KEY).then(function (a) {
          var next = { pid: pr.pid, coins: pr.coins - price, owned: pr.owned.concat([itemId]), lastBuy: itemId, created: pr.created };
          var w = [{ update: { name: DB + '/players/' + a.uid, fields: docFields({ coins: next.coins, owned: next.owned, lastBuy: itemId }) },
                     updateMask: { fieldPaths: ['coins', 'owned', 'lastBuy'] },
                     currentDocument: { updateTime: pr._updateTime } }];
          return commit(w, a.idToken).then(function () {
            var acc = load(KEY); acc.lastCoins = next.coins; store(KEY, acc);
            return Player.refresh();
          });
        });
      });
    }
  };

  // ===== المدير (لوحة الشحن) =====
  var ADMIN_KEY = 'rihla_admin_v1';
  var Admin = {
    logged: function () { var a = load(ADMIN_KEY); return !!(a && a.refreshToken); },
    login: function (email, password) {
      return req('POST', AUTH + 'signInWithPassword?key=' + FIREBASE.apiKey,
                 { email: email, password: password, returnSecureToken: true })
        .then(function (j) { var a = saveSession(ADMIN_KEY, j); a.email = email; store(ADMIN_KEY, a); return a; });
    },
    logout: function () { try { localStorage.removeItem(ADMIN_KEY); } catch (e) {} },
    lookup: function (pid) {
      return token(ADMIN_KEY).then(function (a) {
        return getDoc('pids/' + pid, a.idToken).then(function (m) {
          if (!m) throw new Error('PID_NOT_FOUND');
          return getDoc('players/' + m.data.uid, a.idToken).then(function (p) {
            if (!p) throw new Error('PID_NOT_FOUND');
            return { uid: m.data.uid, pid: pid, coins: p.data.coins, owned: p.data.owned || [] };
          });
        });
      });
    },
    topup: function (pid, amount) {
      return Admin.lookup(pid).then(function (pl) {
        return token(ADMIN_KEY).then(function (a) {
          var logId = Date.now() + '_' + pid;
          var w = [
            { transform: { document: DB + '/players/' + pl.uid,
                           fieldTransforms: [{ fieldPath: 'coins', increment: { integerValue: String(amount) } }] },
              currentDocument: { exists: true } },
            { update: { name: DB + '/topups/' + logId,
                        fields: docFields({ pid: pid, uid: pl.uid, amount: amount, before: pl.coins, at: new Date() }) } }
          ];
          return commit(w, a.idToken).then(function () { return Admin.lookup(pid); });
        });
      });
    },
    history: function () {
      return token(ADMIN_KEY).then(function (a) {
        return req('POST', 'https://firestore.googleapis.com/v1/' + DB + ':runQuery', {
          structuredQuery: { from: [{ collectionId: 'topups' }], orderBy: [{ field: { fieldPath: 'at' }, direction: 'DESCENDING' }], limit: 20 }
        }, a.idToken).then(function (rows) {
          return rows.filter(function (r) { return r.document; }).map(function (r) { return fields(r.document.fields); });
        });
      });
    }
  };

  root.Online = { Player: Player, Admin: Admin, STORE_URL: STORE_URL, _toFs: toFs, _fromFs: fromFs };
})(typeof window !== 'undefined' ? window : this);
