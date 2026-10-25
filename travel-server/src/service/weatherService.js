import 'dotenv/config'

/**
 * 和风天气服务：负责调用和风天气 API 获取目的地未来天气预报。
 * - 认证方式：API KEY（通过 X-QW-Api-Key 请求头）
 * - API Host：每个开发者独立域名，在控制台「设置」中查看
 * - 两步：城市名 -> LocationID（GeoAPI） -> 每日预报（天气预报 v7）
 * 使用 Node 内置 fetch（Node 18+），无需额外依赖。
 */
class WeatherService {
    constructor() {
        this.apiKey = process.env.QWEATHER_API_KEY
        this.apiHost = process.env.QWEATHER_API_HOST
    }

    // 确保天气配置齐全：缺失时抛出可读错误，由路由层 catch 返回结构化错误
    ensureConfig() {
        if (!this.apiKey) {
            throw new Error('缺少天气配置：QWEATHER_API_KEY，请检查 .env')
        }
        if (!this.apiHost) {
            throw new Error('缺少天气配置：QWEATHER_API_HOST，请检查 .env')
        }
    }

    // 构造完整请求 URL（API Host 不含协议前缀，这里统一加 https）
    buildUrl(path, query = {}) {
        const base = `https://${this.apiHost}${path}`
        const params = new URLSearchParams(query).toString()
        return params ? `${base}?${params}` : base
    }

    // 发起和风天气请求并解析 JSON
    async request(path, query) {
        this.ensureConfig()
        const url = this.buildUrl(path, query)
        const response = await fetch(url, {
            headers: { 'X-QW-Api-Key': this.apiKey }
        })
        if (!response.ok) {
            throw new Error(`天气服务请求失败（HTTP ${response.status}）`)
        }
        return response.json()
    }

    // 城市名 -> 位置信息（含 LocationID、经纬度、上级行政区划）
    async lookupCity(city) {
        const data = await this.request('/geo/v2/city/lookup', {
            location: city,
            range: 'cn',
            number: 1
        })
        if (data.code !== '200' || !data.location || data.location.length === 0) {
            throw new Error(`未找到城市「${city}」的天气信息（和风天气 code: ${data.code}）`)
        }
        return data.location[0]
    }

    // 根据需要覆盖的总天数，返回合适的预报档位（免费版稳定支持到 15d）
    resolveForecastDays(days) {
        if (days <= 3) return '3d'
        if (days <= 7) return '7d'
        if (days <= 10) return '10d'
        return '15d'
    }

    // 计算某个日期距离今天的天数（正数=未来，负数=过去）
    daysFromToday(dateStr) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const target = new Date(dateStr)
        target.setHours(0, 0, 0, 0)
        return Math.round((target - today) / 86400000)
    }

    // LocationID -> 每日预报
    async getDailyForecast(locationId, days) {
        const forecastDays = this.resolveForecastDays(days)
        const data = await this.request(`/v7/weather/${forecastDays}`, {
            location: locationId,
            lang: 'zh'
        })
        if (data.code !== '200') {
            throw new Error(`天气查询失败（和风天气 code: ${data.code}）`)
        }
        return data.daily || []
    }

    // 完整流程：城市名 -> 从出发日期起的前 days 天结构化天气数据
    // startDate 可选，格式 YYYY-MM-DD；不传则默认从今天开始
    async getWeather(city, days, startDate) {
        const safeDays = Math.min(Math.max(days, 1), 15)
        const location = await this.lookupCity(city)

        // 计算出发日期距今天数（默认 0，即从今天开始）
        let offset = 0
        if (startDate) {
            offset = this.daysFromToday(startDate)
            if (Number.isNaN(offset)) {
                throw new Error('出行日期格式不正确')
            }
            if (offset < 0) {
                throw new Error('出行日期不能早于今天')
            }
        }

        // 需要覆盖的总天数 = 出发偏移 + 行程天数；超出 15 天预报范围则报错
        const totalNeeded = offset + safeDays
        if (totalNeeded > 15) {
            throw new Error('出行日期超出未来15天预报范围，请选择更近的日期或缩短行程')
        }

        const daily = await this.getDailyForecast(location.id, totalNeeded)
        // 从 offset 处切片，取出行日期开始的 safeDays 天
        return daily.slice(offset, offset + safeDays).map((d) => ({
            date: d.fxDate,
            textDay: d.textDay,
            textNight: d.textNight,
            tempMax: d.tempMax,
            tempMin: d.tempMin,
            windDirDay: d.windDirDay,
            windScaleDay: d.windScaleDay,
            precip: d.precip,
            humidity: d.humidity,
            uvIndex: d.uvIndex
        }))
    }
}

export default new WeatherService()
