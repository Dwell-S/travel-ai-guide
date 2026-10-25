import express from 'express';
import weatherService from '../service/weatherService.js';
import travelService from '../service/travelService.js';

const router = express.Router();

//天气与穿着建议接口：先查真实天气，再让 AI 基于天气生成穿着建议
//GET /api/travel/weather?city=北京&days=3
router.get('/weather', async (req, res) => {
    try {
        const { city, days, startDate } = req.query;
        if (!city) {
            return res.status(400).json({ success: false, error: '参数缺失：city 为必填' });
        }
        //天数容错：默认 3 天，限制在 1-15 天（和风免费版 15 天预报范围）
        const dayCount = Math.min(Math.max(Number(days) || 3, 1), 15);

        //1. 获取目的地出发日期起几天的真实天气（startDate 可选，格式 YYYY-MM-DD）
        const weather = await weatherService.getWeather(city, dayCount, startDate);

        //2. 基于天气让 AI 生成穿着建议（AI 失败时降级为 null，天气仍正常返回）
        let dressing = null;
        try {
            dressing = await travelService.dressingAdvice(city, dayCount, weather);
        } catch (error) {
            console.warn('穿着建议生成失败，已降级为仅展示天气:', error.message);
        }

        return res.json({
            success: true,
            city,
            days: dayCount,
            weather,
            dressing
        });
    } catch (error) {
        console.error('weather 接口异常:', error);
        return res.status(500).json({ success: false, error: error.message || '天气查询失败' });
    }
});

export default router;
