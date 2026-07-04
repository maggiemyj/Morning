/* ============================================================
   模板管理器
   3 套海报模板，切换后数据不变，仅布局变化
   ============================================================ */

const TEMPLATES = [
    {
        id: 'a',
        name: '经典居中',
        desc: '大字居中，简约大气',
        icon: '🖼️',
        className: '',           // 默认无 class
    },
    {
        id: 'b',
        name: '卡片式',
        desc: '上图下卡，层次分明',
        icon: '📇',
        className: 'template-b',
    },
    {
        id: 'c',
        name: '杂志风',
        desc: '大字突出，设计感强',
        icon: '📰',
        className: 'template-c',
    },
];

const TemplateManager = {
    _storageKey: 'zaoan_template',

    /** 获取当前模板 ID */
    getCurrentId() {
        try {
            return localStorage.getItem(this._storageKey) || 'a';
        } catch (_) {
            return 'a';
        }
    },

    /** 获取当前模板对象 */
    getCurrent() {
        const id = this.getCurrentId();
        return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
    },

    /** 切换到指定模板 */
    switchTo(templateId) {
        const tpl = TEMPLATES.find(t => t.id === templateId);
        if (!tpl) return false;

        // 更新 localStorage
        try {
            localStorage.setItem(this._storageKey, templateId);
        } catch (_) {}

        // 更新 DOM
        this._applyClass(tpl.className);

        // 更新弹窗选中状态
        this._updateModalActive();

        return true;
    },

    /** 获取全部模板列表 */
    getAll() {
        return TEMPLATES;
    },

    /** 应用模板 class 到海报 */
    _applyClass(className) {
        const poster = document.getElementById('poster');
        if (!poster) return;

        // 移除所有模板 class
        TEMPLATES.forEach(t => {
            if (t.className) poster.classList.remove(t.className);
        });

        // 添加新 class
        if (className) poster.classList.add(className);
    },

    /** 更新弹窗中的选中状态 */
    _updateModalActive() {
        const currentId = this.getCurrentId();
        document.querySelectorAll('.template-option').forEach(el => {
            const tplId = el.dataset.templateId;
            if (tplId === currentId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    },

    /** 初始化 */
    init() {
        const tpl = this.getCurrent();
        this._applyClass(tpl.className);
    },
};
