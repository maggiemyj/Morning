/* ============================================================
   早安海报 — 主逻辑
   ============================================================ */

(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);

    const dom = {
        posterImage:      $('#posterImage'),
        posterImgLoading: $('#posterImageLoading'),
        weatherIcon:      $('#weatherIcon'),
        weatherText:      $('#weatherText'),
        posterDate:       $('#posterDate'),
        blessingText:     $('#blessingText'),
        blessingEdit:     $('#blessingEdit'),
        blessingActions:  $('#blessingEditActions'),
        posterBlessing:   $('#posterBlessing'),
        authorAvatar:     $('#authorAvatar'),
        authorName:       $('#authorName'),
        btnChangeImage:   $('#btnChangeImage'),
        btnUploadImage:   $('#btnUploadImage'),
        btnSwitchFont:    $('#btnSwitchFont'),
        btnTemplate:      $('#btnTemplate'),
        btnSave:          $('#btnSave'),
        btnShare:         $('#btnShare'),
        btnSwitchBless:   $('#btnSwitchBlessing'),
        btnEditSave:      $('#btnEditSave'),
        btnEditCancel:    $('#btnEditCancel'),
        btnEditReset:     $('#btnEditReset'),
        fileInput:        $('#fileInput'),
        modalOverlay:     $('#modalOverlay'),
        templateList:     $('#templateList'),
        btnCloseModal:    $('#btnCloseModal'),
    };

    // ==================== 图片管理 ====================
    // 20 张 Unsplash 精选自然风景（800px 宽）
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
            `https://images.unsplash.com/photo-${id}?w=1200&h=900&fit=crop&auto=format`
        );
    })();

    const ImageManager = {
        _bgStorageKey: 'zaoan_bg_image',
        _uploadStorageKey: 'zaoan_uploaded_bg',
        _failedUrls: [],

        async loadBackground() {
            const uploaded = this._getUploaded();
            if (uploaded) {
                this._setImage(uploaded);
                ImageCropController.enable();       // 上传图片启用拖拽
                return;
            }

            const todayIdx = this._getTodayPoolIndex();
            const url = UNSPLASH_POOL[todayIdx];
            this._setImage(url);
            ImageCropController.disable();          // Unsplash 禁用拖拽
            this._saveCache({ url, index: todayIdx, date: this._todayKey() });
        },

        async changeBingImage() {
            Toast.show('正在换图…');

            const available = UNSPLASH_POOL
                .map((url, i) => ({ url, i }))
                .filter(item => !this._failedUrls.includes(item.url));

            if (available.length === 0) {
                this._failedUrls = [];
                Toast.show('正在重新尝试…');
                return this.changeBingImage();
            }

            const cachedIdx = this._getCachedIndex();
            let pick;
            if (available.length === 1) {
                pick = available[0];
            } else {
                do {
                    pick = available[Math.floor(Math.random() * available.length)];
                } while (pick.i === cachedIdx && available.length > 1);
            }

            // 预加载 → 成功再设置
            const loaded = await this._preloadImage(pick.url);
            if (loaded) {
                this._setImage(pick.url);
                this._saveCache({ url: pick.url, index: pick.i, date: this._todayKey() });
                this._clearUploaded();
                ImageCropController.disable();      // 切回 Unsplash，禁用拖拽
                Toast.show('✅ 背景已更新');
            } else {
                this._failedUrls.push(pick.url);
                if (this._failedUrls.length < UNSPLASH_POOL.length) {
                    Toast.show('这张加载失败，换一张…');
                    await this.changeBingImage();
                } else {
                    Toast.show('图片加载失败，请稍后重试');
                    this._failedUrls = [];
                }
            }
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
                ImageCropController.enable();       // 启用拖拽定位
                Toast.show('✅ 背景已更换');
            };
            reader.onerror = () => Toast.show('图片读取失败');
            reader.readAsDataURL(file);
        },

        /* -------- 内部 -------- */

        /**
         * 设置海报图片 — <img> 标签，简单可靠
         */
        _setImage(url) {
            if (!dom.posterImage) return;
            dom.posterImage.classList.add('loading');
            if (dom.posterImgLoading) dom.posterImgLoading.classList.add('show');
            dom.posterImage.src = url;
        },

        /** 预加载图片，返回是否成功 */
        _preloadImage(url) {
            return new Promise((resolve) => {
                const img = new Image();
                const timeout = setTimeout(() => {
                    img.src = '';
                    resolve(false);
                }, 12000);

                img.onload = () => {
                    clearTimeout(timeout);
                    resolve(true);
                };
                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };
                img.src = url;
            });
        },

        _todayKey() {
            const d = new Date();
            return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        },

        _getTodayPoolIndex() {
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
            ImageCropController._clearPosition();
        },
    };

    // ==================== 日期 ====================
    function renderDate() {
        const now = new Date();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        if (dom.posterDate) {
            dom.posterDate.innerHTML =
                `<span class="date-month">${now.getMonth()+1}</span>` +
                `<span class="date-sep">月</span>` +
                `<span class="date-day">${now.getDate()}</span>` +
                `<span class="date-sep">日</span>` +
                `<span class="date-weekday">星期${weekDays[now.getDay()]}</span>`;
        }
    }

    // ==================== 天气 ====================
    async function renderWeather() {
        const data = await WeatherManager.fetch();
        if (dom.weatherIcon) dom.weatherIcon.textContent = data.icon;
        if (dom.weatherText) {
            dom.weatherText.innerHTML =
                `<span class="w-desc">${data.text}</span>` +
                `<span class="w-temp">${data.temp}°</span>` +
                `<span class="w-range">${data.tempMin}°~${data.tempMax}°</span>`;
        }
    }

    // ==================== 祝福语 ====================
    function renderBlessing() {
        if (!dom.blessingText) return;
        const text = BlessingManager.getCurrent();
        dom.blessingText.textContent = text;
        if (BlessingManager.isCustom()) {
            dom.blessingText.classList.add('custom');
        } else {
            dom.blessingText.classList.remove('custom');
        }
    }

    // ==================== 祝福语编辑 ====================
    function enterEditMode() {
        if (!dom.posterBlessing || !dom.blessingEdit) return;
        dom.posterBlessing.classList.add('editing');
        dom.blessingEdit.value = dom.blessingText.textContent;
        setTimeout(() => dom.blessingEdit.focus(), 100);
    }

    function exitEditMode() {
        if (!dom.posterBlessing) return;
        dom.posterBlessing.classList.remove('editing');
    }

    function saveCustomBlessing() {
        if (!dom.blessingEdit) return;
        const text = dom.blessingEdit.value.trim();
        if (!text) {
            Toast.show('请输入祝福语');
            return;
        }
        BlessingManager.setCustom(text);
        dom.blessingText.textContent = text;
        dom.blessingText.classList.add('custom');
        exitEditMode();
        Toast.show('祝福语已更新');
    }

    function resetBlessing() {
        const text = BlessingManager.resetToSystem();
        dom.blessingText.textContent = text;
        dom.blessingText.classList.remove('custom');
        exitEditMode();
        Toast.show('已恢复系统祝福语');
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
                Toast.show(`已切换为「${TemplateManager.getCurrent().name}」`);
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

    // ==================== 字体 ====================
    function applyFont() {
        FontManager.apply();
    }

    function switchFont() {
        const preset = FontManager.switchToNext();
        FontManager.apply();
        Toast.show(`字体：${preset.name} · ${preset.desc}`);
    }

    // ==================== 事件绑定 ====================
    function bindEvents() {
        // 图片
        dom.btnChangeImage.addEventListener('click', () => ImageManager.changeBingImage());
        dom.btnUploadImage.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { ImageManager.uploadImage(file); dom.fileInput.value = ''; }
        });

        // 图片加载/错误事件
        if (dom.posterImage) {
            const done = () => {
                dom.posterImage.classList.remove('loading');
                if (dom.posterImgLoading) dom.posterImgLoading.classList.remove('show');
            };
            dom.posterImage.addEventListener('load', done);
            dom.posterImage.addEventListener('error', done);
            // 兜底：5 秒后无论如何清除 loading
            const fallback = setInterval(() => {
                if (dom.posterImage.classList.contains('loading')) {
                    done();
                    clearInterval(fallback);
                }
            }, 5000);
        }

        // 模板
        dom.btnTemplate.addEventListener('click', openModal);
        dom.btnCloseModal.addEventListener('click', closeModal);
        dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === dom.modalOverlay) closeModal();
        });

        // 字体切换
        if (dom.btnSwitchFont) {
            dom.btnSwitchFont.addEventListener('click', switchFont);
        }

        // 祝福语切换
        dom.btnSwitchBless.addEventListener('click', () => {
            dom.blessingText.textContent = BlessingManager.switchToNext();
            dom.blessingText.classList.remove('custom');
            Toast.show('已换一句');
        });

        // 祝福语编辑
        if (dom.blessingText) {
            dom.blessingText.addEventListener('click', enterEditMode);
        }
        if (dom.btnEditSave) {
            dom.btnEditSave.addEventListener('click', saveCustomBlessing);
        }
        if (dom.btnEditCancel) {
            dom.btnEditCancel.addEventListener('click', exitEditMode);
        }
        if (dom.btnEditReset) {
            dom.btnEditReset.addEventListener('click', resetBlessing);
        }
        if (dom.blessingEdit) {
            dom.blessingEdit.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    saveCustomBlessing();
                }
                if (e.key === 'Escape') {
                    exitEditMode();
                }
            });
        }

        // 保存 & 分享
        dom.btnSave.addEventListener('click', () => ShareManager.saveAsImage());
        dom.btnShare.addEventListener('click', () => ShareManager.share());
    }

    // ==================== 初始化 ====================
    async function init() {
        TemplateManager.init();
        applyFont();           // 应用当天字体预设
        renderDate();
        renderBlessing();

        await Promise.all([
            ImageManager.loadBackground(),
            renderWeather(),
        ]);

        buildTemplateModal();
        bindEvents();

        const fp = FontManager.getPreset();
        console.log(`☀️ 早安海报已就绪 · 字体：${fp.name}`);
    }

    // ==================== 启动 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
