import express from 'express';
import cors from 'cors';
import travelRouter from './routes/travel.js';
import weatherRouter from './routes/weather.js';
import 'dotenv/config';

const app = express();
// 未配置 PORT 时回退到 3300，避免服务静默监听失败
const port = process.env.PORT || 3300;

//允许前端跨域访问
app.use(cors());

//解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//简单请求日志中间件：输出方法、路径、状态码、耗时（不引入第三方依赖）
//注意：SSE 长连接的 finish 事件会在流结束时才触发，耗时即整段对话时长
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

//健康检查接口（GET）：供浏览器/监控/联调时快速确认服务存活
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    modelProvider: process.env.MODEL_PROVIDER || '未配置'
  });
});

//心跳接口（保留，兼容教程用法）
app.post('/api/heartbeat', (req, res) => {
  res.json({
    message: '服务正常运行',
    timestamp: new Date().toISOString()
  });
});

//旅游业务路由
app.use('/api/travel', travelRouter);

//天气与穿着建议路由
app.use('/api/travel', weatherRouter);

//404 兜底：未匹配到的路径返回统一 JSON，而不是 HTML 错误页
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `接口不存在：${req.method} ${req.originalUrl}`
  });
});

//全局错误处理中间件（Express 要求四个参数的函数签名，next 不调用也要保留）
//捕获同步/已通过 next(err) 抛出的异常，防止进程崩溃或响应挂起
app.use((err, req, res, next) => {
  console.error('未捕获的服务端异常:', err);
  //响应头已发出（如 SSE 已开始推流）时不能再写 JSON，只能结束连接
  if (res.headersSent) {
    return res.end();
  }
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

//启动时校验关键环境变量：缺失时醒目警告但不阻断启动（便于无密钥调试）
const requiredEnvKeys = ['MODEL_PROVIDER', 'DeepSeek_API_KEY', 'DeepSeek_BASE_URL', 'DeepSeek_API_MODEL'];
const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);
if (missingEnvKeys.length > 0) {
  console.warn(`⚠️ 缺少环境变量：${missingEnvKeys.join('、')}`);
  console.warn('   请复制 .env.example 为 .env 并填写对应配置，否则 AI 接口将不可用');
}

app.listen(port, () => {
  console.log(`服务地址：http://localhost:${port}`);
});
