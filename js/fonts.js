/* ============================================================
   字体预设管理器 — 6 套手写/书法风格
   Google Fonts 免费中文字体 + 系统楷体兜底
   每天自动轮换，也可手动切换
   ============================================================ */

const FONT_PRESETS = [
    {
        id: 'song',
        name: '马山正',
        desc: '日常手写，亲切自然',
        // Ma Shan Zheng — Google Fonts; KaiTi — 系统兜底
        morning: '"Ma Shan Zheng", "STKaiti", "KaiTi", "Kaiti SC", cursive',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", serif',
        morningWeight: '400',
        morningSpacing: '4px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'kai',
        name: '毛草',
        desc: '狂草书法，气韵生动',
        // Liu Jian Mao Cao — 草书风格
        morning: '"Liu Jian Mao Cao", "STKaiti", "KaiTi", "Kaiti SC", cursive',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", serif',
        morningWeight: '400',
        morningSpacing: '2px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'modern',
        name: '黄油体',
        desc: '艺术字，活泼有趣',
        // ZCOOL QingKe HuangYou — 站酷庆科黄油体
        morning: '"ZCOOL QingKe HuangYou", "STKaiti", "KaiTi", "Kaiti SC", cursive',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        morningWeight: '400',
        morningSpacing: '4px',
        blessingSize: '19px',
        blessingWeight: '400',
    },
    {
        id: 'classic',
        name: '龙藏',
        desc: '随性手写，禅意十足',
        // Long Cang — 龙藏体
        morning: '"Long Cang", "STKaiti", "KaiTi", "Kaiti SC", cursive',
        blessing: '"Noto Serif SC", "STSong", "SimSun", "Songti SC", serif',
        morningWeight: '400',
        morningSpacing: '2px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'warm',
        name: '志莽行',
        desc: '行书飘逸，洒脱大气',
        // Zhi Mang Xing — 志莽行书
        morning: '"Zhi Mang Xing", "STKaiti", "KaiTi", "Kaiti SC", cursive',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", serif',
        morningWeight: '400',
        morningSpacing: '2px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
    {
        id: 'elegant',
        name: '楷体',
        desc: '系统楷体，经典永不过时',
        // 纯系统字体，无需加载，永远可用的兜底
        morning: '"STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", serif',
        blessing: '"STKaiti", "KaiTi", "Kaiti SC", "DFKai-SB", serif',
        morningWeight: '400',
        morningSpacing: '4px',
        blessingSize: '20px',
        blessingWeight: '400',
    },
];

const FontManager = {
    _storageKey: 'zaoan_font_preset',

    /** 获取当天字体预设（日期哈希决定，每天自动换） */
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

    /** 手动切换到下一个字体预设 */
    switchToNext() {
        const currentId = this.getCurrentId();
        const idx = FONT_PRESETS.findIndex(p => p.id === currentId);
        const next = FONT_PRESETS[(idx + 1) % FONT_PRESETS.length];
        this._save(next.id);
        return next;
    },

    /** 手动切换到指定字体 */
    switchTo(id) {
        if (!FONT_PRESETS.some(p => p.id === id)) return null;
        this._save(id);
        return this.getPreset();
    },

    /** 应用当前字体预设到海报 DOM */
    apply() {
        const preset = this.getPreset();
        const poster = document.getElementById('poster');
        if (!poster) return preset;

        // 移除旧字体 class
        FONT_PRESETS.forEach(p => poster.classList.remove('font-' + p.id));
        // 添加当前字体 class
        poster.classList.add('font-' + preset.id);

        // 动态设置 CSS 变量（覆盖预设值）
        const style = poster.style;
        style.setProperty('--font-morning', preset.morning);
        style.setProperty('--font-blessing', preset.blessing);
        style.setProperty('--morning-weight', preset.morningWeight);
        style.setProperty('--morning-spacing', preset.morningSpacing);
        style.setProperty('--blessing-size', preset.blessingSize);
        style.setProperty('--blessing-weight', preset.blessingWeight);

        return preset;
    },

    getAll() { return FONT_PRESETS; },

    /* -------- 内部 -------- */
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
