/* ============================================================
   图片拖拽定位控制器 — ImageCropController
   上传的图片可通过拖拽调整可见区域
   使用 transform 定位（html2canvas 兼容），Pointer Events 统一交互
   ============================================================ */

const ImageCropController = {
    _posX: 50,        // 0-100 百分比，50=居中
    _posY: 50,
    _enabled: false,
    _dragging: false,
    _startX: 0,
    _startY: 0,
    _startPosX: 50,
    _startPosY: 50,

    // cover 布局缓存
    _rangeX: 0,       // 图片超出容器的水平像素
    _rangeY: 0,       // 图片超出容器的垂直像素
    _displayW: 0,
    _displayH: 0,
    _layoutReady: false,

    _storageKey: 'zaoan_image_position',
    _POS_DEFAULT: 50,

    /** 启用拖拽（用户上传了图片） */
    enable() {
        if (this._enabled) return;
        this._enabled = true;
        this._layoutReady = false;

        this._loadPosition();

        const zone = document.getElementById('posterImageZone');
        if (zone) {
            zone.classList.add('croppable');
            zone.addEventListener('pointerdown', this._onPointerDown);
        }

        // 图片加载完成后计算布局
        this._initLayout();
    },

    /** 禁用拖拽（切回 Unsplash 默认图） */
    disable() {
        if (!this._enabled) return;
        this._enabled = false;
        this._layoutReady = false;

        this.reset(false);

        const zone = document.getElementById('posterImageZone');
        if (zone) {
            zone.classList.remove('croppable', 'dragging');
            zone.removeEventListener('pointerdown', this._onPointerDown);
        }

        this._hideResetBtn();
    },

    /** 重置为居中 */
    reset(save = true) {
        this._posX = this._POS_DEFAULT;
        this._posY = this._POS_DEFAULT;
        if (this._layoutReady) this._applyPosition();
        else this._applyObjectPositionFallback();
        this._updateResetBtn();

        if (save && this._enabled) {
            this._savePosition();
        }
    },

    /** 获取当前位置 */
    getPosition() {
        return { x: this._posX, y: this._posY };
    },

    /* ================================================================
       布局计算 — 模拟 object-fit: cover
       ================================================================ */

    /**
     * 等待图片加载完成 → 计算 cover 尺寸
     */
    _initLayout() {
        const img = document.getElementById('posterImage');
        if (!img) return;

        const doLayout = () => {
            this._calcLayout();
            this._applyPosition();
        };

        if (img.complete && img.naturalWidth > 0) {
            doLayout();
        } else {
            img.addEventListener('load', doLayout, { once: true });
        }
    },

    /**
     * 计算 cover 缩放后的尺寸，以及可拖拽的像素范围
     */
    _calcLayout() {
        const img = document.getElementById('posterImage');
        const zone = document.getElementById('posterImageZone');
        if (!img || !zone) return;

        const cW = zone.clientWidth;
        const cH = zone.clientHeight;
        const iW = img.naturalWidth;
        const iH = img.naturalHeight;

        if (cW === 0 || cH === 0 || iW === 0 || iH === 0) return;

        // object-fit: cover 算法 — 取最大缩放比
        const scale = Math.max(cW / iW, cH / iH);
        this._displayW = Math.round(iW * scale);
        this._displayH = Math.round(iH * scale);
        this._rangeX = this._displayW - cW;
        this._rangeY = this._displayH - cH;
        this._layoutReady = true;

        // 设置图片元素尺寸
        img.style.width = this._displayW + 'px';
        img.style.height = this._displayH + 'px';
    },

    /* ================================================================
       位置应用
       ================================================================ */

    /**
     * 将百分比位置转换为 transform: translate()
     * pos=0   → 图片左/上边缘对齐容器 → translate(0, 0)
     * pos=50  → 居中 → translate(-range/2, -range/2)
     * pos=100 → 图片右/下边缘对齐容器 → translate(-range, -range)
     */
    _applyPosition() {
        const img = document.getElementById('posterImage');
        if (!img || !this._layoutReady) {
            this._applyObjectPositionFallback();
            return;
        }

        const tx = -(this._rangeX * this._posX / 100);
        const ty = -(this._rangeY * this._posY / 100);

        img.style.transform = `translate(${tx}px, ${ty}px)`;
        img.style.objectPosition = '';  // 清除 fallback
    },

    /**
     * Fallback: 布局未就绪时使用 object-position
     */
    _applyObjectPositionFallback() {
        const img = document.getElementById('posterImage');
        if (!img) return;
        img.style.transform = '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = `${this._posX}% ${this._posY}%`;
    },

    _loadPosition() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            if (raw) {
                const pos = JSON.parse(raw);
                if (typeof pos.x === 'number' && typeof pos.y === 'number') {
                    this._posX = pos.x;
                    this._posY = pos.y;
                }
            }
        } catch (_) {}
    },

    _savePosition() {
        try {
            localStorage.setItem(this._storageKey,
                JSON.stringify({ x: this._posX, y: this._posY }));
        } catch (_) {}
    },

    _clearPosition() {
        try { localStorage.removeItem(this._storageKey); } catch (_) {}
    },

    _updateResetBtn() {
        const btn = document.getElementById('cropResetBtn');
        if (!btn) return;
        const isDefault = (Math.abs(this._posX - this._POS_DEFAULT) < 0.5 &&
                           Math.abs(this._posY - this._POS_DEFAULT) < 0.5);
        btn.classList.toggle('visible', !isDefault);
    },

    _hideResetBtn() {
        const btn = document.getElementById('cropResetBtn');
        if (btn) btn.classList.remove('visible');
    },

    /* ================================================================
       拖拽事件处理（Pointer Events）
       ================================================================ */

    _onPointerDown: null,
    _onPointerMove: null,
    _onPointerUp: null,

    _handlePointerDown(e) {
        if (!this._enabled) return;

        const img = document.getElementById('posterImage');
        if (!img || !img.complete || img.classList.contains('loading')) return;

        // 确保布局是最新的
        this._calcLayout();

        this._dragging = true;
        this._startX = e.clientX;
        this._startY = e.clientY;
        this._startPosX = this._posX;
        this._startPosY = this._posY;

        const zone = document.getElementById('posterImageZone');
        if (zone) {
            zone.classList.add('dragging');
            zone.setPointerCapture(e.pointerId);
        }

        e.preventDefault();
    },

    _handlePointerMove(e) {
        if (!this._dragging) return;

        const zone = document.getElementById('posterImageZone');
        if (!zone) return;

        const rect = zone.getBoundingClientRect();
        const containerW = rect.width;
        const containerH = rect.height;

        if (containerW === 0 || containerH === 0) return;

        const dx = e.clientX - this._startX;
        const dy = e.clientY - this._startY;

        // 像素位移 → 百分比变化
        // 拖拽一整格容器宽度 = 100% position 变化
        this._posX = Math.max(0, Math.min(100,
            this._startPosX + (dx / containerW) * 100));
        this._posY = Math.max(0, Math.min(100,
            this._startPosY + (dy / containerH) * 100));

        this._applyPosition();
        e.preventDefault();
    },

    _handlePointerUp(e) {
        if (!this._dragging) return;

        this._dragging = false;

        const zone = document.getElementById('posterImageZone');
        if (zone) {
            zone.classList.remove('dragging');
            zone.releasePointerCapture(e.pointerId);
        }

        this._updateResetBtn();
        this._savePosition();
    },
};

/* -------- 初始化事件绑定 -------- */
(function initCropController() {
    ImageCropController._onPointerDown = function(e) {
        ImageCropController._handlePointerDown(e);
    };
    ImageCropController._onPointerMove = function(e) {
        ImageCropController._handlePointerMove(e);
    };
    ImageCropController._onPointerUp = function(e) {
        ImageCropController._handlePointerUp(e);
    };

    document.addEventListener('pointermove', ImageCropController._onPointerMove);
    document.addEventListener('pointerup', ImageCropController._onPointerUp);

    // 重置按钮
    function bindResetBtn() {
        const btn = document.getElementById('cropResetBtn');
        if (btn) {
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                ImageCropController.reset(true);
            });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindResetBtn);
    } else {
        bindResetBtn();
    }

    // 模板 / 窗口变化时重新计算布局
    window.addEventListener('resize', () => {
        if (ImageCropController._enabled) {
            ImageCropController._calcLayout();
            ImageCropController._applyPosition();
        }
    });

    // 监听 poster 的 class 变化（模板切换）
    const poster = document.getElementById('poster');
    if (poster) {
        new MutationObserver(() => {
            if (ImageCropController._enabled) {
                // 延迟等 CSS 过渡完成
                setTimeout(() => {
                    ImageCropController._calcLayout();
                    ImageCropController._applyPosition();
                }, 100);
            }
        }).observe(poster, { attributes: true, attributeFilter: ['class'] });
    }
})();
