# 智能旅游助手（Travel AI Helper）

> AI 驱动的全栈旅游规划应用：输入目的地、预算和出游日期，自动生成详细行程规划，并结合**真实天气预报**给出每日穿搭建议，还能随时与 AI 实时对话咨询目的地相关问题。

## 1. 项目解决了什么问题

传统旅行规划通常要经历「查攻略 → 算预算 → 排日程 → 查天气 → 想穿搭」多个割裂的环节，耗时费力。本项目把这些痛点整合成一个一站式应用：

| 痛点 | 本项目的解决方式 |
| --- | --- |
| 行程规划费时 | 输入城市 + 预算 + 出游日期，AI 自动生成每日上午/下午/晚上的结构化行程、景点介绍、交通建议、预算分配 |
| 天气信息割裂 | 接入和风天气真实预报，自动查取**实际出游日期**的天气 |
| 不知道该穿什么 | 把真实天气注入大模型，AI 基于温度/降水/风力生成**每日穿搭建议**（而不是凭空编造） |
| 临时问题没人问 | 内置 SSE 流式 AI 对话，随时咨询目的地相关问题 |

## 2. 主要功能

- **智能行程规划**：选择目的地城市、输入预算、选择**出游日期范围（出发日期 + 结束日期）**，天数自动计算；AI 生成结构化行程，前端以每日时间轴 + 预算明细进度条展示
- **天气与穿着提醒**：详情页展示目的地出游日期的真实天气（温度/天气状况/风向/降水），并由 AI 生成每日穿搭建议
- **AI 旅游咨询**：基于 SSE（Server-Sent Events）的流式对话，回复逐字呈现（打字机效果）
- **行程收藏**：一键收藏/取消收藏行程，收藏列表可随时重新生成
- **历史记录**：自动保存最近 20 条规划记录（去重置顶），支持一键清空
- **个人设置**：自定义昵称与头像（6 款预设），设置后在「我的」页与对话气泡中同步展示
- **数据管理**：所有个人数据保存在浏览器 localStorage，支持一键清除，无需注册登录

## 3. 技术栈

### 前端（travel-h5）

| 技术 | 版本 | 作用 |
| --- | --- | --- |
| Vue | 3.5 | 前端框架，全部页面使用 Composition API（`<script setup>`）编写 |
| Vite | 8 | 开发服务器与打包工具 |
| Vant | 4.10 | 移动端 UI 组件库，通过 unplugin-vue-components + VantResolver 按需自动引入 |
| Vue Router | 4 | 页面路由，使用 createWebHistory 模式 |
| Axios | 1.x | 普通 HTTP 请求（行程推荐接口） |
| Fetch API | 原生 | 读取 SSE 流式响应，实现对话打字机效果 |

> 本项目**没有使用 Pinia**。个人数据（收藏/历史/设置/行程参数）通过自封装的 localStorage 工具（`src/utils/storage.js`）管理，架构更轻量。

### 后端（travel-server）

| 技术 | 版本 | 作用 |
| --- | --- | --- |
| Node.js | 24（ESM 模块） | 运行环境，`package.json` 中 `type` 为 `module` |
| Express | 4.19 | Web 服务器框架，提供 API 路由、CORS 跨域、错误处理中间件 |
| LangChain.js | @langchain/openai 1.x | 大模型集成框架，通过 OpenAI 兼容协议调用 DeepSeek |
| dotenv | 16.x | 读取 `.env` 环境变量（API 密钥等敏感配置） |
| nodemon | 3.x | 开发时监听文件变化自动重启服务 |
| SSE | 原生实现 | 对话接口的流式响应（无需额外依赖） |

### 外部服务

- **DeepSeek**（https://platform.deepseek.com）：大语言模型，通过 OpenAI 兼容接口调用，负责行程生成、AI 对话与穿搭建议
- **和风天气 QWeather**（https://dev.qweather.com）：真实天气预报数据，负责提供目的地出游日期的天气

## 4. 项目结构

```
travel-ai-helper/
├── travel-h5/                     # 前端（Vue 3 移动端 H5）
│   └── src/
│       ├── main.js                # 应用入口
│       ├── App.vue                # 根组件：路由出口 + 底部标签栏（首页/对话/我的）
│       ├── router/index.js        # 路由表（6 个页面懒加载）
│       ├── utils/
│       │   ├── request.js         # 网络层：axios 实例 + fetchStream（SSE 流式请求）
│       │   └── storage.js         # 本地存储工具：收藏/历史/设置/行程参数
│       ├── views/
│       │   ├── Home.vue           # 首页：规划表单（城市/预算/出游日期范围）+ 热门目的地
│       │   ├── Detail.vue         # 详情页：行程概览 + 每日时间轴 + 预算明细 + 天气穿搭卡片
│       │   ├── Chat.vue           # 对话页：SSE 流式聊天气泡
│       │   ├── Profile.vue        # 我的：昵称/头像 + 功能菜单
│       │   ├── Favorites.vue      # 我的收藏
│       │   ├── History.vue        # 历史记录
│       │   └── Settings.vue       # 设置：昵称、头像、清空数据
│       └── components/
│           ├── ChatBubble.vue     # 聊天气泡
│           ├── SpotItem.vue       # 景点信息卡
│           └── BudgetTable.vue    # 预算明细 + 进度条
├── travel-server/                 # 后端（Node.js + Express）
│   ├── .env.example               # 环境变量示例
│   └── src/
│       ├── index.js               # 服务入口：CORS、JSON 解析、日志、错误处理中间件
│       ├── routes/
│       │   ├── travel.js          # /recommend（行程）、/chat（SSE 对话）
│       │   └── weather.js         # /weather（天气与穿搭建议）
│       ├── service/
│       │   ├── travelService.js   # LLM 客户端、行程/对话/穿搭提示词、JSON 解析
│       │   └── weatherService.js  # 和风天气：城市名 → LocationID → 每日预报
│       └── utils/
│           └── streamUtils.js     # SSE 工具：统一设置响应头 + send/error/end
├── .gitignore                     # Git 忽略规则（排除 node_modules、.env、dist 等）
└── README.md                      # 本文档
```

## 5. 安装方法

### 5.1 环境要求

- Node.js ≥ 18（开发时使用 v24）
- 一个 DeepSeek API 密钥（https://platform.deepseek.com 注册创建）
- 一个和风天气 API Key + API Host（https://console.qweather.com 注册创建，免费版即可）

### 5.2 后端安装

```bash
cd travel-server
npm install
cp .env.example .env
```

编辑 `.env`，填写以下配置：

```ini
# 服务端口
PORT=3300

# 大模型（DeepSeek，OpenAI 兼容协议）
MODEL_PROVIDER=deepseek-chat
DeepSeek_API_KEY=sk-xxxxxxxxxxxx
DeepSeek_BASE_URL=https://api.deepseek.com/v1
DeepSeek_API_MODEL=deepseek-chat

# 和风天气（行程天气与穿搭提醒）
QWEATHER_API_KEY=xxxxxxxxxxxx
QWEATHER_API_HOST=xxx.qweatherapi.com
```

> 和风天气 API Host 在控制台「设置」页查看，形如 `abcxyz.qweatherapi.com`。

### 5.3 前端安装

```bash
cd travel-h5
npm install
```

## 6. 使用方法

### 6.1 启动后端（端口 3300）

```bash
cd travel-server
npm run dev        # nodemon 热重启；或 npm start
```

验证：浏览器访问 `http://localhost:3300/api/health`，返回 `success: true` 即启动成功。

### 6.2 启动前端（端口 5173）

```bash
cd travel-h5
npm run dev
```

浏览器访问 `http://localhost:5173`，建议开启移动端设备模拟（F12 → 设备模拟）体验最佳。

### 6.3 使用流程

1. 首页选择**目的地**城市、输入**预算**、选择**出游日期范围**（出发日期 + 结束日期）
2. 点击「开始规划」，跳转详情页，AI 生成行程 + 拉取天气
3. 详情页查看每日行程、预算明细、**天气与穿搭建议**
4. 点击「咨询 AI 助手」进入对话页，或底部「对话」标签直接提问

> 前端接口地址配置在 `travel-h5/src/utils/request.js` 的 `API_BASE` 常量（默认 `http://127.0.0.1:3300/api/travel`）。后端已开启 CORS。

## 7. 输入输出示例

### 7.1 行程规划接口

**请求**（`POST /api/travel/recommend`）：

```bash
curl -X POST http://127.0.0.1:3300/api/travel/recommend \
  -H "Content-Type: application/json" \
  -d '{"city":"北京","budget":2000,"days":3}'
```

**响应**（一次性返回完整行程 JSON）：

```json
{
  "success": true,
  "city": "北京",
  "days": 3,
  "totalBudget": 2000,
  "dailyItinerary": [
    {
      "day": 1,
      "date": "第1天",
      "morning": {
        "spot": "天安门广场",
        "duration": "2小时",
        "ticket": "免费",
        "transportation": "地铁1号线",
        "description": "世界上最大的城市广场……"
      },
      "afternoon": { "spot": "故宫博物院", "duration": "3小时", "ticket": "60元", "transportation": "步行", "description": "……" },
      "evening": { "spot": "王府井步行街", "duration": "2小时", "ticket": "免费", "transportation": "步行", "description": "……" }
    }
  ],
  "budgetBreakdown": {
    "accommodation": 600,
    "food": 450,
    "transportation": 200,
    "tickets": 165,
    "other": 585
  },
  "tips": ["提前在官网预约故宫门票", "……"],
  "warnings": ["早晚温差较大，注意保暖", "……"]
}
```

### 7.2 天气与穿搭建议接口

**请求**（`GET /api/travel/weather`）：

```bash
curl "http://127.0.0.1:3300/api/travel/weather?city=北京&days=3&startDate=2026-10-28"
```

**响应**（真实天气 + AI 穿搭建议）：

```json
{
  "success": true,
  "city": "北京",
  "days": 3,
  "weather": [
    { "date": "2026-10-28", "textDay": "多云", "textNight": "晴", "tempMin": "4", "tempMax": "16", "windDirDay": "南风", "windScaleDay": "1-3", "precip": "0.0" },
    { "date": "2026-10-29", "textDay": "晴", "textNight": "晴", "tempMin": "2", "tempMax": "20", "windDirDay": "西北风", "windScaleDay": "1-3", "precip": "0.0" },
    { "date": "2026-10-30", "textDay": "晴", "textNight": "晴", "tempMin": "1", "tempMax": "15", "windDirDay": "西北风", "windScaleDay": "1-3", "precip": "0.0" }
  ],
  "dressing": [
    { "day": 1, "date": "2026-10-28", "dressing": "白天多云、夜间晴，4~16℃，建议穿长袖T恤或薄毛衣，外搭轻薄外套，早晚温差大需随身带外套保暖。" },
    { "day": 2, "date": "2026-10-29", "dressing": "晴，2~20℃，昼夜温差大，建议洋葱式穿法……" },
    { "day": 3, "date": "2026-10-30", "dressing": "晴，1~15℃，早晚偏冷，建议厚外套加长裤……" }
  ]
}
```

### 7.3 AI 对话接口（SSE 流式）

**请求**（`POST /api/travel/chat`）：

```bash
curl -X POST http://127.0.0.1:3300/api/travel/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"北京有哪些必去的景点？"}'
```

**响应**（`text/event-stream`，逐块下发实现打字机效果）：

```
data:{"type":"chunk","content":"北京"}
data:{"type":"chunk","content":"作为"}
data:{"type":"chunk","content":"中国的"}
data:{"type":"chunk","content":"首都"}
……
data:{"type":"complete","data":{"success":true,"response":"……"}}
event:end
data:{"done":"true"}
```

## 8. API 接口一览

| 方法 | 路径 | 说明 | 请求参数 | 响应形式 |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | 健康检查 | - | JSON |
| POST | `/api/heartbeat` | 心跳测试 | - | JSON |
| POST | `/api/travel/recommend` | 行程规划 | `city`（城市）、`budget`（预算，≥100）、`days`（天数，1-30） | JSON（一次性返回完整行程） |
| GET | `/api/travel/weather` | 天气与穿搭建议 | `city`（城市）、`days`（天数，1-15）、`startDate`（出发日期，YYYY-MM-DD，可选） | JSON |
| POST | `/api/travel/chat` | AI 对话 | `message`（用户问题） | SSE 流式（chunk / complete / error） |

参数非法时返回 `400 + { success: false, error: 原因 }`；服务异常返回 `500 + 同样结构`，不会出现请求挂起。

## 9. 常见问题（FAQ）

- **对话/规划报「大模型调用失败」**：检查 `.env` 中 `DeepSeek_API_KEY` 是否填写、密钥是否有效、账户余额是否充足。
- **天气卡片报错或空白**：检查 `.env` 中 `QWEATHER_API_KEY` 和 `QWEATHER_API_HOST` 是否填写正确；和风天气免费版仅支持未来 15 天预报，出游日期超出范围会返回提示。
- **前端请求一直失败**：确认后端已启动且端口为 3300；修改过 `request.js` 的 `API_BASE` 后需与后端实际地址一致。
- **收藏/历史/设置数据哪来的**：全部存在浏览器 localStorage（键名以 `travel_` 开头），清除浏览器数据或设置页「清除全部数据」会将其删除，不依赖任何账号体系。
- **刷新详情页显示「缺少行程参数」**：会回退读取 localStorage 中保存的最近一次规划参数；若从未提交过表单，回首页重新填写即可。
- **为什么 Vant 提示组件不用 `showToast` 函数**：本项目 Vue 3.5 环境下函数式 API 存在响应式兼容问题，统一改用模板组件 `<van-toast>` / `<van-dialog>`。

## 10. 相关资源

- Vue 3：https://cn.vuejs.org/
- Vite：https://vitejs.cn/
- Vant 4：https://vant.pro/vant/#/zh-CN
- Vue Router：https://router.vuejs.org/zh/
- Express：https://www.expressjs.com.cn/
- LangChain.js：https://js.langchain.com/
- DeepSeek 开放平台：https://platform.deepseek.com/
- 和风天气开发文档：https://dev.qweather.com/
- SSE 流式响应参考：https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events
