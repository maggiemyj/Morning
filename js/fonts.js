/* ============================================================
   字体预设管理器 — 6 套免费手写体（Google Fonts）
   马山正·站酷快乐·致莽星·柳建毛草·龙藏·站酷小薇
   每套早安字体各不相同，相邻切换变化明显
   每天自动轮换，也可手动切换
   ============================================================ */

const FONT_PRESETS = [
    {
        id: 'mashan',
        name: '马山正',
        desc: '毛笔楷书，浑厚有力',
        morning: '"Ma Shan Zheng", cursive, serif',
        blessing: '"ZCOOL KuaiLe", cursive, sans-serif',
        morningWeight: '400',
        morningSpacing: '8px',
        blessingSize: '18px',
        blessingWeight: '400',
    },
    {
        id: 'kuaile',
        name: '站酷快乐',
        desc: '圆润可爱，轻松活泼',
        morning: '"ZCOOL KuaiLe", cursive, sans-serif',
        blessing: '"Long Cang", cursive, serif',
        morningWeight: '400',
        morningSpacing: '6px',
        blessingSize: '17px',
        blessingWeight: '400',
    },
    {
        id: 'zhimang',
        name: '致莽星',
        desc: '行草飘逸，一气呵成',
        morning: '"Zhi Mang Xing", cursive, serif',
        blessing: '"ZCOOL XiaoWei", cursive, sans-serif',
        morningWeight: '400',
        morningSpacing: '6px',
        blessingSize: '18px',
        blessingWeight: '400',
    },
    {
        id: 'liujian',
        name: '柳建毛草',
        desc: '狂草奔放，艺术感强',
        morning: '"Liu Jian Mao Cao", cursive, serif',
        blessing: '"Ma Shan Zheng", cursive, serif',
        morningWeight: '400',
        morningSpacing: '2px',
        blessingSize: '18px',
        blessingWeight: '400',
    },
    {
        id: 'longcang',
        name: '龙藏',
        desc: '随性手写，亲切温暖',
        morning: '"Long Cang", cursive, serif',
        blessing: '"Zhi Mang Xing", cursive, serif',
        morningWeight: '400',
        morningSpacing: '12px',
        blessingSize: '17px',
        blessingWeight: '400',
    },
    {
        id: 'xiaowei',
        name: '站酷小薇',
        desc: '娟秀细腻，温婉雅致',
        morning: '"ZCOOL XiaoWei", cursive, sans-serif',
        blessing: '"Long Cang", cursive, serif',
        morningWeight: '400',
        morningSpacing: '10px',
        blessingSize: '18px',
        blessingWeight: '400',
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

    apply() {
        const preset = this.getPreset();
        const poster = document.getElementById('poster');
        if (!poster) return preset;

        FONT_PRESETS.forEach(p => poster.classList.remove('font-' + p.id));
        poster.classList.add('font-' + preset.id);

        const s = poster.style;
        s.setProperty('--font-morning', preset.morning);
        s.setProperty('--font-blessing', preset.blessing);
        s.setProperty('--morning-weight', preset.morningWeight);
        s.setProperty('--morning-spacing', preset.morningSpacing);
        s.setProperty('--blessing-size', preset.blessingSize);
        s.setProperty('--blessing-weight', preset.blessingWeight);

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
