/* ============================================================
   早安海报 — 主逻辑
   ============================================================ */

(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);

    const dom = {
        posterImage:     $('#posterImage'),
        weatherIcon:     $('#weatherIcon'),
        weatherText:     $('#weatherText'),
        posterDate:      $('#posterDate'),
        blessingText:    $('#blessingText'),
        authorAvatar:    $('#authorAvatar'),
        authorName:      $('#authorName'),
        btnChangeImage:  $('#btnChangeImage'),
        btnUploadImage:  $('#btnUploadImage'),
        btnTemplate:     $('#btnTemplate'),
        btnSave:         $('#btnSave'),
        btnShare:        $('#btnShare'),
        btnSwitchBless:  $('#btnSwitchBlessing'),
        fileInput:       $('#fileInput'),
        modalOverlay:    $('#modalOverlay'),
        templateList:    $('#templateList'),
        btnCloseModal:   $('#btnCloseModal'),
    };

    // ==================== 图片管理 ====================
    // 20 张 Unsplash 精选自然风景（800px 宽，~50KB/张，无 CORS 限制）
    const UNSPLASH_POOL = (function () {
        const ids = [
            '1507525428034-b723cf961d3e',  // 海滩
            '1470252649378-9c29740c9fa8',  // 晨光
            '1500382017468-9049fed747ef',  // 麦田
            '1490750967868-88aa4f44baee',  // 花海
            '1441974231531-c6227db76b6e',  // 森林
            '1504198453319-5ce911bafcde',  // 樱花
            '1470071459604-3b5ec3a7fe05',  // 山雾
            '1447752875215-b2761b4ce1ac',  // 林间小路
            '1465146344425-f00d5f5ce1bd',  // 野花
            '1501785888041-af3ef285b470',  // 山水
            '1518173946687-a1ae1cb28a7e',  // 秋叶
            '1472396961693-2a5b0af528b9',  // 晨露
            '1464822759023-fed622ff2c3b',  // 雪山
            '1504198328459-05c0a0421ff9',  // 梯田
            '1469474965002-0dd9b74cdb3f',  // 极光
            '1518894348000-6a462cf38b8e',  // 湖泊
            '1497435334941-78c86bd68e6c',  // 竹林
            '1472214103451-9374bd1c798e',  // 草原
            '1506744038136-46273834b3fb',  // 山水画
            '1518837695005-208309761952',  // 海浪
        ];
        return ids.map(id =>
            `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop&auto=format`
        );
    })();

    const ImageManager = {
        _bgStorageKey: 'zaoan_bg_image',
        _uploadStorageKey: 'zaoan_uploaded_bg',
        _poolIndexKey: 'zaoan_img_pool_index',

        async loadBackground() {
            // 1. 用户上传的图片优先
            const uploaded = this._getUploaded();
            if (uploaded) {
                this._setImage(uploaded);
                return;
            }

            // 2. 用日期决定今天用哪张图（同一天同一张，每天不同）
            const todayIdx = this._getTodayPoolIndex();
            const url = UNSPLASH_POOL[todayIdx];
            this._setImage(url);
            this._saveCache({ url, index: todayIdx, date: this._todayKey() });
        },

        async changeBingImage() {
            Toast.show('正在换图...');
            // 从池子里随机选一张不同的
            let idx;
            do {
                idx = Math.floor(Math.random() * UNSPLASH_POOL.length);
            } while (idx === this._getCachedIndex() && UNSPLASH_POOL.length > 1);

            const url = UNSPLASH_POOL[idx];
            this._setImage(url);
            // 更新当天的图（不改变日期逻辑，只改当前显示）
            this._saveCache({ url, index: idx, date: this._todayKey() });
            this._clearUploaded();
            Toast.show('✅ 背景已更新');
        },

        uploadImage(file) {
            if (!file || !file.type.startsWith('image/')) {
                Toast.show('请选择图片文件');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                this._setImage(dataUrl);
                this._saveUploaded(dataUrl);
                Toast.show('✅ 背景已更换');
            };
            reader.onerror = () => Toast.show('图片读取失败');
            reader.readAsDataURL(file);
        },

        /* -------- 内部 -------- */

        _setImage(url) {
            if (dom.posterImage) dom.posterImage.src = url;
        },

        _todayKey() {
            const d = new Date();
            return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        },

        _getTodayPoolIndex() {
            // 用日期哈希决定索引，保证每天同一张、每天不同
            const key = this._todayKey();
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = ((hash << 5) - hash) + key.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash) % UNSPLASH_POOL.length;
        },

        _getCachedIndex() {
            try {
                const raw = localStorage.getItem(this._bgStorageKey);
                if (raw) {
                    const d = JSON.parse(raw);
                    if (d.index !== undefined) return d.index;
                }
            } catch (_) {}
            return -1;
        },

        _getCached() {
            try {
                const raw = localStorage.getItem(this._bgStorageKey);
                if (raw) {
                    const d = JSON.parse(raw);
                    if (d.date === this._todayKey()) return d;
                }
            } catch (_) {}
            return null;
        },

        _saveCache(data) {
            try { localStorage.setItem(this._bgStorageKey, JSON.stringify(data)); }
            catch (_) {}
        },

        _getUploaded() {
            try { return localStorage.getItem(this._uploadStorageKey); }
            catch (_) { return null; }
        },

        _saveUploaded(dataUrl) {
            try { localStorage.setItem(this._uploadStorageKey, dataUrl); }
            catch (_) {}
        },

        _clearUploaded() {
            try { localStorage.removeItem(this._uploadStorageKey); }
            catch (_) {}
        },
    };

    // ==================== 日期 ====================
    function renderDate() {
        const now = new Date();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        if (dom.posterDate) {
            dom.posterDate.textContent =
                `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
        }
    }

    // ==================== 天气 ====================
    async function renderWeather() {
        const data = await WeatherManager.fetch();
        if (dom.weatherIcon) dom.weatherIcon.textContent = data.icon;
        if (dom.weatherText) {
            dom.weatherText.textContent =
                `${data.text} ${data.temp}°C  ${data.tempMin}°~${data.tempMax}°`;
        }
    }

    // ==================== 祝福语 ====================
    function renderBlessing() {
        if (dom.blessingText) {
            dom.blessingText.textContent = BlessingManager.getCurrent();
        }
    }

    // ==================== 模板弹窗 ====================
    function buildTemplateModal() {
        if (!dom.templateList) return;
        const currentId = TemplateManager.getCurrentId();
        const templates = TemplateManager.getAll();

        dom.templateList.innerHTML = templates.map(t => `
            <div class="template-option${t.id === currentId ? ' active' : ''}"
                 data-template-id="${t.id}">
                <span class="tpl-icon">${t.icon}</span>
                <div class="tpl-info">
                    <div class="tpl-name">${t.name}</div>
                    <div class="tpl-desc">${t.desc}</div>
                </div>
                <span class="tpl-check">✓</span>
            </div>
        `).join('');

        dom.templateList.querySelectorAll('.template-option').forEach(el => {
            el.addEventListener('click', () => {
                TemplateManager.switchTo(el.dataset.templateId);
                closeModal();
                Toast.show(`已切换为「${TemplateManager.getCurrent().name}」模板`);
            });
        });
    }

    function openModal() {
        buildTemplateModal();
        dom.modalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        dom.modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ==================== 事件绑定 ====================
    function bindEvents() {
        dom.btnChangeImage.addEventListener('click', () => ImageManager.changeBingImage());
        dom.btnUploadImage.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { ImageManager.uploadImage(file); dom.fileInput.value = ''; }
        });
        dom.btnTemplate.addEventListener('click', openModal);
        dom.btnCloseModal.addEventListener('click', closeModal);
        dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === dom.modalOverlay) closeModal();
        });
        dom.btnSwitchBless.addEventListener('click', () => {
            dom.blessingText.textContent = BlessingManager.switchToNext();
            Toast.show(`已换一句 (${BlessingManager.getCurrentPosition()}/${BlessingManager.getTotal()})`);
        });
        dom.btnSave.addEventListener('click', () => ShareManager.saveAsImage());
        dom.btnShare.addEventListener('click', () => ShareManager.share());

        // 图片加载成功/失败诊断
        if (dom.posterImage) {
            dom.posterImage.addEventListener('load', () => {
                console.log('✅ 海报图片加载成功');
            });
            dom.posterImage.addEventListener('error', () => {
                console.warn('❌ 海报图片加载失败:', dom.posterImage.src);
                // 图片加载失败，CSS 渐变兜底
            });
        }
    }

    // ==================== 初始化 ====================
    async function init() {
        TemplateManager.init();
        renderDate();
        renderBlessing();

        await Promise.all([
            ImageManager.loadBackground(),
            renderWeather(),
        ]);

        buildTemplateModal();
        bindEvents();
        console.log('☀️ 早安海报已就绪');
    }

    // ==================== 启动 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
