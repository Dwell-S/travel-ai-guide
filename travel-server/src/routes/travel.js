import express from 'express';
import travelService from '../service/travelService.js';
import { createStreamResponse } from '../utils/streamUtils.js';

const router = express.Router();

//推荐景点接口：一次性返回完整行程 JSON
//Express 4 不会自动捕获 async handler 的异常，必须手动 try/catch，
//否则 Promise reject 后响应永不发送，前端请求会一直挂起
router.post('/recommend', async (req, res) => {
    try {
        const { city, budget, days } = req.body;
        if (!city || !budget || !days) {
            return res.status(400).json({ success: false, error: '参数缺失：city/budget/days 均为必填' });
        }

        const result = await travelService.recommend(city, budget, days);
        return res.json(result);
    } catch (error) {
        console.error('recommend 接口异常:', error);
        return res.status(500).json({ success: false, error: '行程生成失败，请稍后重试' });
    }
});

//AI 对话接口：SSE 流式返回
router.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({
            success: false, error: '缺少必要参数：message'
        });
    }
    //对SSE流式接口进行处理（注意：创建后响应头已发出，异常只能走 stream.error）
    const stream = createStreamResponse(res);

    try {
        //调用大模型
        const result = await travelService.chat(message, (chunk) => {
            stream.send({ type: 'chunk', content: chunk });
        });
        //service 内部捕获的错误以返回值形式给出：转成 error 事件下发，
        //否则前端只会收到一个空的回复
        if (result && result.success === false) {
            stream.error({ error: result.error || 'AI 对话失败' });
        } else {
            stream.send({ type: 'complete', data: result });
        }
        stream.end();
    } catch (error) {
        console.error('chat 接口异常:', error);
        //把异常信息通过流下发给前端，再正常结束连接，避免前端无限等待
        stream.error({ error: `AI 对话失败：${error.message}` });
        stream.end();
    }
});

export default router;
