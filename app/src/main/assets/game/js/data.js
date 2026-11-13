// رحلة المدربة — بيانات الكائنات والضربات والأنواع
// كل الكائنات والشخصيات من تأليف اللعبة.

var TYPES = {
  normal:   { name: 'عادي',   color: '#a8a29e' },
  electric: { name: 'كهرباء', color: '#facc15' },
  water:    { name: 'ماء',    color: '#38bdf8' },
  fire:     { name: 'نار',    color: '#fb923c' },
  grass:    { name: 'نبات',   color: '#4ade80' },
  rock:     { name: 'صخر',    color: '#a16207' }
};

// الفعالية: TYPE_CHART[المهاجم][المدافع]
var TYPE_CHART = {
  normal:   {},
  electric: { water: 2, rock: 0.5, grass: 0.5, electric: 0.5 },
  water:    { fire: 2, rock: 2, grass: 0.5, water: 0.5 },
  fire:     { grass: 2, water: 0.5, rock: 0.5, fire: 0.5 },
  grass:    { water: 2, rock: 2, fire: 0.5, grass: 0.5 },
  rock:     { fire: 2, electric: 2, grass: 0.5 }
};

var MOVES = {
  scratch:   { name: 'خربشة',      type: 'normal',   power: 35, acc: 100, pp: 30 },
  shock:     { name: 'صعقة',       type: 'electric', power: 45, acc: 100, pp: 20 },
  growl:     { name: 'زمجرة',      type: 'normal',   power: 0,  acc: 100, pp: 20, effect: { stat: 'atk', target: 'foe', stages: -1 } },
  flash:     { name: 'برق خاطف',   type: 'electric', power: 70, acc: 90,  pp: 5 },
  tackle:    { name: 'دفعة',       type: 'normal',   power: 35, acc: 100, pp: 30 },
  leafcut:   { name: 'شفرة ورق',   type: 'grass',    power: 45, acc: 95,  pp: 20 },
  sprout:    { name: 'نمو',        type: 'grass',    power: 0,  acc: 100, pp: 10, effect: { stat: 'atk', target: 'self', stages: 1 } },
  bubble:    { name: 'فقاعات',     type: 'water',    power: 40, acc: 100, pp: 25 },
  splash:    { name: 'رشة موج',    type: 'water',    power: 60, acc: 90,  pp: 10 },
  shell:     { name: 'درع الصدفة', type: 'normal',   power: 0,  acc: 100, pp: 15, effect: { stat: 'def', target: 'self', stages: 1 } },
  pebble:    { name: 'رمي حصى',    type: 'rock',     power: 45, acc: 90,  pp: 20 },
  curl:      { name: 'تكور',       type: 'normal',   power: 0,  acc: 100, pp: 15, effect: { stat: 'def', target: 'self', stages: 1 } }
};

// القيم الأساسية للكائنات
var SPECIES = {
  sharara: { name: 'شرارة', type: 'electric', hp: 42, atk: 14, def: 10, spd: 16,
             moves: ['scratch', 'shock', 'growl', 'flash'],
             desc: 'ثعلب صغير ذيله منفوش، تلمع النجمة على جبهته عندما يستعمل الكهرباء.' },
  waraqa:  { name: 'ورقة',  type: 'grass',    hp: 40, atk: 12, def: 11, spd: 12,
             moves: ['tackle', 'leafcut', 'sprout'],
             desc: 'أرنب أخضر خجول، أذناه ورقتان تتحركان مع الريح.' },
  fuqaa:   { name: 'فقاعة', type: 'water',    hp: 44, atk: 12, def: 12, spd: 11,
             moves: ['tackle', 'bubble', 'shell', 'splash'],
             desc: 'فقمة زرقاء مدورة تنفخ الفقاعات عندما تفرح.' },
  hasawa:  { name: 'حصوة',  type: 'rock',     hp: 46, atk: 13, def: 15, spd: 7,
             moves: ['tackle', 'pebble', 'curl'],
             desc: 'قنفذ صخري ظهره حصى ملونة، يتكور عندما يخاف.' }
};

var ITEMS = {
  potion: { name: 'جرعة شفاء', heal: 25, desc: 'تعيد 25 نقطة صحة لكائن واحد.' }
};

// ===== المتجر =====
// currency: 'star' نجوم مجانية من اللعب | 'coin' كارة كوين بالشحن
// انتبه: أسعار الكوين لازم تطابق قواعد Firestore (firestore.rules)
var SHOP = [
  { id: 'outfit_default', kind: 'outfit', name: 'الطقم الأصلي', price: 0, currency: 'star', look: {} },
  { id: 'outfit_sky', kind: 'outfit', name: 'طقم السماء', price: 100, currency: 'star',
    look: { jacket: '#3b82f6', jacketDark: '#1d4ed8', collar: '#e0f2fe', straps: '#f59e0b', pants: '#1e293b', shoes: '#f59e0b',
            hat: '#3b82f6', brim: '#1d4ed8', ribbon: '#f59e0b', ribbon2: '#d97706' } },
  { id: 'outfit_desert', kind: 'outfit', name: 'طقم الصحراء', price: 150, currency: 'coin',
    look: { jacket: '#d6a35c', jacketDark: '#a16207', collar: '#fef3c7', straps: '#78350f', pants: '#78350f', shoes: '#92400e',
            hat: '#ca8a04', brim: '#854d0e', badge: '#fef08a', ribbon: '#16a34a', ribbon2: '#15803d' } },
  { id: 'outfit_royal', kind: 'outfit', name: 'الطقم الملكي', price: 200, currency: 'coin',
    look: { jacket: '#7c3aed', jacketDark: '#5b21b6', collar: '#fde047', straps: '#facc15', pants: '#4c1d95', shoes: '#facc15',
            hat: '#facc15', brim: '#ca8a04', badge: '#f43f5e', ribbon: '#f0abfc', ribbon2: '#d946ef' } },
  { id: 'outfit_ninja', kind: 'outfit', name: 'طقم النينجا', price: 250, currency: 'coin',
    look: { jacket: '#1f2937', jacketDark: '#111827', collar: '#ef4444', straps: '#ef4444', pants: '#111827', shoes: '#ef4444',
            hat: '#1f2937', brim: '#ef4444', badge: '#ef4444', ribbon: '#ef4444', ribbon2: '#b91c1c' } },
  { id: 'outfit_spring', kind: 'outfit', name: 'طقم الربيع', price: 300, currency: 'coin',
    look: { jacket: '#f9a8d4', jacketDark: '#db2777', collar: '#ffffff', straps: '#22c55e', pants: '#be185d', shoes: '#22c55e',
            hat: '#fbcfe8', brim: '#ec4899', badge: '#22c55e', ribbon: '#22c55e', ribbon2: '#16a34a', hair: '#3b1f10' } },

  { id: 'skin_default', kind: 'skin', name: 'شرارة الأصلية', price: 0, currency: 'star', look: {} },
  { id: 'skin_mint', kind: 'skin', name: 'شرارة النعناعية', price: 200, currency: 'star',
    look: { body: '#6ee7b7', tail: '#34d399', belly: '#ecfdf5', feet: '#10b981', tip: '#f472b6', inner: '#d1fae5', star: '#f472b6', eye: '#065f46', blush: '#f472b6' } },
  { id: 'skin_ice', kind: 'skin', name: 'شرارة الثلجية', price: 300, currency: 'coin',
    look: { body: '#e0f2fe', tail: '#bae6fd', belly: '#ffffff', feet: '#7dd3fc', tip: '#0284c7', inner: '#f0f9ff', star: '#0ea5e9', eye: '#0369a1', blush: '#7dd3fc', glow: '#bae6fd' } },
  { id: 'skin_shadow', kind: 'skin', name: 'شرارة الليلية', price: 400, currency: 'coin',
    look: { body: '#6d28d9', tail: '#5b21b6', belly: '#c4b5fd', feet: '#4c1d95', tip: '#facc15', inner: '#a78bfa', star: '#facc15', eye: '#fde047', blush: '#f0abfc', glow: '#a78bfa' } },
  { id: 'skin_gold', kind: 'skin', name: 'شرارة الذهبية', price: 500, currency: 'coin',
    look: { body: '#fbbf24', tail: '#f59e0b', belly: '#fffbeb', feet: '#d97706', tip: '#ffffff', inner: '#fde68a', star: '#ffffff', eye: '#b45309', blush: '#fb7185', glow: '#fde047' } }
];

// النجوم المجانية
var STAR_REWARDS = { wildWin: 20, trainerWin: 50, episode: 100, daily: 30 };

// باقات الشحن (تظهر للاعب في صفحة الحساب)
var COIN_PACKS = [
  { coins: 100, price: '2,500' },
  { coins: 250, price: '6,250' },
  { coins: 500, price: '12,500' },
  { coins: 1000, price: '25,000' }
];

var GameData = { TYPES: TYPES, TYPE_CHART: TYPE_CHART, MOVES: MOVES, SPECIES: SPECIES, ITEMS: ITEMS,
                 SHOP: SHOP, STAR_REWARDS: STAR_REWARDS, COIN_PACKS: COIN_PACKS };
if (typeof module !== 'undefined') module.exports = GameData;
else window.GameData = GameData;
