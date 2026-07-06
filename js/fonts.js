/* ============================================================
   字体预设管理器 — 6 套手写体「早安」PNG 图片
   预渲染 PNG，无外部字体依赖，每个 2-16KB
   每天自动轮换，也可手动切换
   ============================================================ */

const FONT_PRESETS = [
    {
        id: 'mashan',
        name: '马山正',
        desc: '毛笔楷书，浑厚有力',
        morningSpacing: '8px',
    },
    {
        id: 'kuaile',
        name: '站酷快乐',
        desc: '圆润可爱，轻松活泼',
        morningSpacing: '6px',
    },
    {
        id: 'zhimang',
        name: '致莽星',
        desc: '行草飘逸，一气呵成',
        morningSpacing: '6px',
    },
    {
        id: 'liujian',
        name: '柳建毛草',
        desc: '狂草奔放，艺术感强',
        morningSpacing: '2px',
    },
    {
        id: 'longcang',
        name: '龙藏',
        desc: '随性手写，亲切温暖',
        morningSpacing: '12px',
    },
    {
        id: 'xiaowei',
        name: '站酷小薇',
        desc: '娟秀细腻，温婉雅致',
        morningSpacing: '10px',
    },
];

const FontManager = {
    _storageKey: 'zaoan_font_preset',

    getPreset() {
        const id = this.getCurrentId();
        return FONT_PRESETS.find(p => p.id === id) || FONT_PRESETS[0];
    },

    getCurrentId() {
        try {
            const saved = localStorage.getItem(this._storageKey);
            if (saved && FONT_PRESETS.some(p => p.id === saved)) return saved;
        } catch (_) {}
        return this._getDailyId();
    },

    switchToNext() {
        const currentId = this.getCurrentId();
        const idx = FONT_PRESETS.findIndex(p => p.id === currentId);
        const next = FONT_PRESETS[(idx + 1) % FONT_PRESETS.length];
        this._save(next.id);
        return next;
    },

    switchTo(id) {
        if (!FONT_PRESETS.some(p => p.id === id)) return null;
        this._save(id);
        return this.getPreset();
    },

    /**
     * 应用预设：切换「早安」PNG 图片 + CSS 变量
     */
    apply() {
        const preset = this.getPreset();
        const poster = document.getElementById('poster');
        if (!poster) return preset;

        // 更新 CSS class
        FONT_PRESETS.forEach(p => poster.classList.remove('font-' + p.id));
        poster.classList.add('font-' + preset.id);

        // 更新早安图片 src（组合图 + 单字图）
        const basePath = 'assets/fonts/' + preset.id;
        const combinedImg = document.getElementById('morningImg');
        const charZao = document.getElementById('morningCharZao');
        const charAn = document.getElementById('morningCharAn');
        if (combinedImg) combinedImg.src = basePath + '.png';
        if (charZao) charZao.src = basePath + '_zao.png';
        if (charAn) charAn.src = basePath + '_an.png';

        // 保留间距 CSS 变量（影响图片间 gap）
        const s = poster.style;
        s.setProperty('--morning-weight', '400');
        s.setProperty('--morning-spacing', preset.morningSpacing);
        s.setProperty('--blessing-size', '17px');
        s.setProperty('--blessing-weight', '400');

        return preset;
    },

    getAll() { return FONT_PRESETS; },

    _getDailyId() {
        const d = new Date();
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
        }
        return FONT_PRESETS[Math.abs(hash) % FONT_PRESETS.length].id;
    },

    _save(id) {
        try { localStorage.setItem(this._storageKey, id); } catch (_) {}
    },
};
