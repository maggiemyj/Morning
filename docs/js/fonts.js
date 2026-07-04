/* ============================================================
   字体预设管理器 — 6 套纯系统字体
   宋体·楷体·黑体各有鲜明个性，无需加载任何 web font
   每天自动轮换，也可手动切换
   ============================================================ */

const FONT_PRESETS = [
    {
        id: 'song',
        name: '宋韵',
        desc: '宋体大字，古朴典雅',
        morning: '"STSong", "SimSun", "Songti SC", "Noto Serif SC", serif',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        morningWeight: '700',
        morningSpacing: '10px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'kai',
        name: '楷风',
        desc: '楷体大字，温润亲切',
        morning: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        blessing: '"STSong", "SimSun", "Songti SC", serif',
        morningWeight: '600',
        morningSpacing: '6px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'modern',
        name: '清黑',
        desc: '细黑体，简约时尚',
        morning: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Heiti SC", "SimHei", sans-serif',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        morningWeight: '300',
        morningSpacing: '12px',
        blessingSize: '19px',
        blessingWeight: '400',
    },
    {
        id: 'classic',
        name: '浑黑',
        desc: '粗黑体，沉稳有力',
        morning: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Heiti SC", "SimHei", sans-serif',
        blessing: '"STSong", "SimSun", "Songti SC", serif',
        morningWeight: '700',
        morningSpacing: '4px',
        blessingSize: '18px',
        blessingWeight: '300',
    },
    {
        id: 'warm',
        name: '宋墨',
        desc: '细宋体，清雅脱俗',
        morning: '"STSong", "SimSun", "Songti SC", "Noto Serif SC", serif',
        blessing: '"PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif',
        morningWeight: '400',
        morningSpacing: '14px',
        blessingSize: '18px',
        blessingWeight: '300',
    },
    {
        id: 'elegant',
        name: '楷墨',
        desc: '楷体配黑体，刚柔并济',
        morning: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        blessing: '"PingFang SC", "Microsoft YaHei", "Heiti SC", "SimHei", sans-serif',
        morningWeight: '400',
        morningSpacing: '8px',
        blessingSize: '19px',
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
