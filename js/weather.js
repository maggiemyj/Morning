/* ============================================================
   天气模块
   数据源: Open-Meteo (免费, 无需 API Key)
   固定城市: 西宁 (36.6171°N, 101.7785°E)
   缓存 30 分钟
   ============================================================ */

const WeatherManager = {
    _storageKey: 'zaoan_weather_cache',
    _cacheDuration: 30 * 60 * 1000, // 30 分钟

    /** WMO 天气代码 → 中文 + emoji 映射 */
    _weatherMap: {
        0:  { icon: '☀️',   text: '晴' },
        1:  { icon: '🌤️',  text: '少云' },
        2:  { icon: '⛅',   text: '多云' },
        3:  { icon: '☁️',   text: '阴' },
        45: { icon: '🌫️',  text: '雾' },
        48: { icon: '🌫️',  text: '雾凇' },
        51: { icon: '🌦️',  text: '小毛毛雨' },
        53: { icon: '🌦️',  text: '毛毛雨' },
        55: { icon: '🌧️',  text: '大毛毛雨' },
        61: { icon: '🌧️',  text: '小雨' },
        63: { icon: '🌧️',  text: '中雨' },
        65: { icon: '🌧️',  text: '大雨' },
        71: { icon: '🌨️',  text: '小雪' },
        73: { icon: '🌨️',  text: '中雪' },
        75: { icon: '❄️',   text: '大雪' },
        77: { icon: '❄️',   text: '雪粒' },
        80: { icon: '🌦️',  text: '阵雨' },
        81: { icon: '🌧️',  text: '中阵雨' },
        82: { icon: '⛈️',   text: '大阵雨' },
        85: { icon: '🌨️',  text: '小阵雪' },
        86: { icon: '🌨️',  text: '大阵雪' },
        95: { icon: '⛈️',   text: '雷阵雨' },
        96: { icon: '⛈️',   text: '雷暴冰雹' },
        99: { icon: '⛈️',   text: '强雷暴冰雹' },
    },

    /**
     * 获取天气数据
     * @returns {Promise<{icon: string, text: string, temp: number, tempMin: number, tempMax: number}>}
     */
    async fetch() {
        // 1. 尝试读缓存
        const cached = this._loadCache();
        if (cached && (Date.now() - cached.ts) < this._cacheDuration) {
            return cached.data;
        }

        // 2. 请求 Open-Meteo
        try {
            const url = 'https://api.open-meteo.com/v1/forecast'
                + '?latitude=36.62&longitude=101.77'
                + '&current=temperature_2m,weather_code'
                + '&daily=temperature_2m_max,temperature_2m_min'
                + '&timezone=Asia/Shanghai'
                + '&forecast_days=1';

            const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const json = await resp.json();
            const code   = json.current.weather_code;
            const temp   = Math.round(json.current.temperature_2m);
            const tempMax = Math.round(json.daily.temperature_2m_max[0]);
            const tempMin = Math.round(json.daily.temperature_2m_min[0]);

            const weather = this._weatherMap[code] || { icon: '🌤️', text: '多云' };

            const data = {
                icon: weather.icon,
                text: weather.text,
                temp,
                tempMin,
                tempMax,
            };

            // 缓存
            this._saveCache(data);
            return data;

        } catch (err) {
            console.warn('天气获取失败:', err.message);
            // 返回缓存（即使过期）或兜底
            if (cached) return cached.data;
            return this._fallback();
        }
    },

    /** 兜底天气 */
    _fallback() {
        return {
            icon: '🌤️',
            text: '晴间多云',
            temp: 18,
            tempMin: 8,
            tempMax: 22,
            _fallback: true,
        };
    },

    /* -------- 内部方法 -------- */
    _loadCache() {
        try {
            const raw = localStorage.getItem(this._storageKey);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return null;
    },

    _saveCache(data) {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify({
                ts: Date.now(),
                data,
            }));
        } catch (_) {}
    },
};
