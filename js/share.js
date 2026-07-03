/* ============================================================
   保存 & 分享模块
   - html2canvas 按需动态加载（不阻塞首屏）
   - Web Share API 分享
   ============================================================ */

const ShareManager = {

    // 缓存 html2canvas 加载 Promise
    _h2cPromise: null,

    /**
     * 按需加载 html2canvas，避免 CDN 阻塞首屏
     */
    _loadHtml2canvas() {
        if (this._h2cPromise) return this._h2cPromise;

        this._h2cPromise = new Promise((resolve, reject) => {
            // 如果已加载过（比如其他方式引入），直接返回
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
                // 尝试备用 CDN
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

    /**
     * 将海报区域保存为 PNG 图片并触发下载
     */
    async saveAsImage() {
        const posterEl = document.getElementById('poster');
        if (!posterEl) return;

        Toast.show('正在生成图片...');

        try {
            await this._loadHtml2canvas();
            const canvas = await html2canvas(posterEl, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `早安海报_${this._getDateStr()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            Toast.show('✅ 图片已保存！');
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

        Toast.show('正在生成分享图片...');

        try {
            await this._loadHtml2canvas();
            const canvas = await html2canvas(posterEl, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
            });

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => {
                    if (b) resolve(b);
                    else reject(new Error('toBlob failed'));
                }, 'image/png');
            });

            const file = new File([blob], `早安海报_${this._getDateStr()}.png`, {
                type: 'image/png',
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
