/* ============================================================
   保存 & 分享模块
   - html2canvas 按需动态加载（不阻塞首屏）
   - JPEG 输出，控制在 ~200KB
   - Web Share API 分享
   ============================================================ */

const ShareManager = {

    // 缓存 html2canvas 加载 Promise
    _h2cPromise: null,

    /** 输出配置：scale=2→750x1000px，JPEG 质量 0.88→~200KB */
    _EXPORT_SCALE: 2,
    _JPEG_QUALITY: 0.88,
    _BORDER_RADIUS: 16,   // 海报圆角半径（px，CSS 侧为 16px）

    /**
     * 按需加载 html2canvas，避免 CDN 阻塞首屏
     */
    _loadHtml2canvas() {
        if (this._h2cPromise) return this._h2cPromise;

        this._h2cPromise = new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') {
                resolve(html2canvas);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = () => {
                if (typeof html2canvas !== 'undefined') {
                    resolve(html2canvas);
                } else {
                    reject(new Error('html2canvas 加载后未定义'));
                }
            };
            script.onerror = () => {
                const fallback = document.createElement('script');
                fallback.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
                fallback.onload = () => resolve(html2canvas);
                fallback.onerror = () => reject(new Error('html2canvas 加载失败'));
                document.head.appendChild(fallback);
            };
            document.head.appendChild(script);
        });

        return this._h2cPromise;
    },

    /** 渲染海报为 canvas（含圆角裁剪） */
    async _renderCanvas() {
        const posterEl = document.getElementById('poster');
        if (!posterEl) throw new Error('海报元素未找到');

        await this._loadHtml2canvas();
        const rawCanvas = await html2canvas(posterEl, {
            useCORS: true,
            allowTaint: true,
            scale: this._EXPORT_SCALE,
            backgroundColor: null,          // 透明，圆角区域由后续裁剪处理
            logging: false,
        });

        // 圆角裁剪
        const radius = this._BORDER_RADIUS * this._EXPORT_SCALE;
        const w = rawCanvas.width;
        const h = rawCanvas.height;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // 使用 roundRect（现代浏览器均支持）做圆角裁剪
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(0, 0, w, h, radius);
        } else {
            // 兜底：arcTo 路径
            ctx.moveTo(radius, 0);
            ctx.arcTo(w, 0, w, radius, radius);
            ctx.arcTo(w, h, w - radius, h, radius);
            ctx.arcTo(0, h, 0, h - radius, radius);
            ctx.arcTo(0, 0, radius, 0, radius);
            ctx.closePath();
        }
        ctx.clip();
        ctx.drawImage(rawCanvas, 0, 0);

        return canvas;
    },

    /**
     * 保存为 PNG（支持透明圆角）
     */
    async saveAsImage() {
        Toast.show('正在生成图片…');

        try {
            const canvas = await this._renderCanvas();

            const link = document.createElement('a');
            link.download = `早安海报_${this._getDateStr()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 打印文件大小
            const kb = Math.round(link.href.length * 0.75 / 1024);
            Toast.show(`✅ 已保存 (~${kb}KB)`);
        } catch (err) {
            console.error('保存失败:', err);
            Toast.show('保存失败，请尝试截图保存');
        }
    },

    /**
     * 分享（优先 Web Share API，降级为保存）
     */
    async share() {
        const posterEl = document.getElementById('poster');
        if (!posterEl) return;

        if (!navigator.share || !navigator.canShare) {
            Toast.show('当前浏览器不支持直接分享，帮您保存图片');
            await this.saveAsImage();
            return;
        }

        Toast.show('正在生成分享图片…');

        try {
            const canvas = await this._renderCanvas();

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => {
                    if (b) resolve(b);
                    else reject(new Error('toBlob failed'));
                }, 'image/jpeg', this._JPEG_QUALITY);
            });

            const file = new File([blob], `早安海报_${this._getDateStr()}.jpg`, {
                type: 'image/jpeg',
            });

            const shareData = {
                title: '早安海报',
                text: '早安！愿你今天心情如阳光般灿烂！☀️',
                files: [file],
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                Toast.show('分享成功！');
            } else {
                await navigator.share({
                    title: '早安海报',
                    text: '早安！愿你今天心情如阳光般灿烂！☀️',
                });
                Toast.show('请长按海报图片保存后分享');
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('分享失败:', err);
            Toast.show('分享失败，帮您保存图片');
            await this.saveAsImage();
        }
    },

    /* -------- 内部 -------- */
    _getDateStr() {
        const d = new Date();
        return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    },
};


/* ============================================================
   Toast 组件
   ============================================================ */
const Toast = {
    _timer: null,

    show(msg, duration = 2000) {
        const el = document.getElementById('toast');
        if (!el) return;

        if (this._timer) clearTimeout(this._timer);

        el.textContent = msg;
        el.classList.add('show');

        this._timer = setTimeout(() => {
            el.classList.remove('show');
            this._timer = null;
        }, duration);
    },
};
