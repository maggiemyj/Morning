/* ============================================================
   祝福语库
   温暖 / 吉祥 / 健康主题，面向老年群体
   ============================================================ */

const BLESSINGS = [
    // --- 温暖祝福 ---
    '愿你今天心情如阳光般灿烂，早安！',
    '新的一天，新的美好，愿你笑容常在。',
    '早安！愿你的一天充满温暖和喜悦。',
    '岁月静好，愿你每一天都平安喜乐。',
    '清晨的第一缕阳光为你送来祝福，早安！',
    '愿你如这晨光般温暖明亮，早安吉祥！',
    '生活很美好，愿你开心每一天，早安！',

    // --- 健康主题 ---
    '身体健康是最大的福气，早安，保重身体！',
    '早睡早起身体好，愿你健康长寿，早安！',
    '愿你腿脚利索，吃嘛嘛香，早安！',
    '天大地大，健康最大，早安，照顾好自己！',
    '愿你精神矍铄，步履轻盈，早安吉祥！',
    '身体棒棒，心情美美，新的一天加油！',
    '人到老年福气多，健康平安最可贵，早安！',

    // --- 吉祥如意 ---
    '早安！祝你今天事事顺心，吉祥如意！',
    '福如东海长流水，早安，愿你福气满满！',
    '紫气东来，好运连连，早安吉祥！',
    '愿好运与你相伴，幸福与你同行，早安！',
    '吉星高照，万事顺遂，早安，今天是个好日子！',
    '笑口常开，好运自然来，早安！',

    // --- 晚年生活 ---
    '退休生活多自在，喝茶散步乐开怀，早安！',
    '儿孙绕膝是天伦之乐，愿你享尽天伦，早安！',
    '老有所乐，老有所安，愿你每天都有好心情！',
    '人生的下半场更精彩，早安，活出自己的精彩！',
    '养花种草心情好，公园遛弯身体棒，早安！',
    '和老友聊聊天，打打牌，生活有滋有味，早安！',

    // --- 励志正能量 ---
    '年龄只是数字，心态永远年轻，早安！',
    '人生七十才开始，你正当年，早安！',
    '活到老学到老，今天又是进步的一天，早安！',
    '莫道桑榆晚，为霞尚满天，早安！',
    '每一天都是生命中最年轻的一天，早安！',

    // --- 季节关怀 ---
    '天凉记得添衣，早安，注意保暖！',
    '天气炎热多喝水，早安，注意防暑！',
    '春风送暖，万物复苏，愿你如春天般生机勃勃，早安！',
    '秋高气爽，正是锻炼好时节，早安！',
];

/**
 * 祝福语管理器
 */
const BlessingManager = {
    _storageKey: 'zaoan_blessing_config',

    /**
     * 获取今天的祝福语索引
     * 逻辑：每天自动按顺序取一条，同一天内可自由切换
     */
    getTodayIndex() {
        const today = this._getDateKey();
        const config = this._loadConfig();

        // 如果日期变了，自动推进到下一条
        if (config.dateKey !== today) {
            const nextIndex = (config.lastDailyIndex + 1) % BLESSINGS.length;
            this._saveConfig({
                dateKey: today,
                lastDailyIndex: nextIndex,
                currentIndex: nextIndex,
            });
            return nextIndex;
        }

        // 同一天，返回当前索引
        return config.currentIndex;
    },

    /** 获取当前祝福语 */
    getCurrent() {
        return BLESSINGS[this.getTodayIndex()];
    },

    /** 切换到下一条（当天有效） */
    switchToNext() {
        const today = this._getDateKey();
        const config = this._loadConfig();
        const nextIndex = (config.currentIndex + 1) % BLESSINGS.length;

        const newConfig = {
            dateKey: today,
            lastDailyIndex: config.lastDailyIndex,
            currentIndex: nextIndex,
        };
        this._saveConfig(newConfig);
        return BLESSINGS[nextIndex];
    },

    /** 获取总条数 */
    getTotal() {
        return BLESSINGS.length;
    },

    /** 当前是今天第几条 */
    getCurrentPosition() {
        return this.getTodayIndex() + 1;
    },

    /* -------- 内部方法 -------- */
    _getDateKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    },

    _loadConfig() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            if (raw) return JSON.parse(raw);
        } catch (_) { /* ignore */ }
        return { dateKey: '', lastDailyIndex: -1, currentIndex: 0 };
    },

    _saveConfig(config) {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(config));
        } catch (_) { /* ignore */ }
    },
};
