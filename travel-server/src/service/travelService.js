import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage,SystemMessage} from '@langchain/core/messages';
import 'dotenv/config'

class TravelService {
    constructor() {
        this.llm = null;
        //初始化时不抛错：即使密钥缺失服务也能启动（便于调试健康检查等接口），
        //真正的配置校验推迟到首次调用大模型时进行
        try {
            this.initLLM();
        } catch (error) {
            console.warn('大模型初始化失败：', error.message);
            console.warn('AI 相关接口将返回错误提示，请配置好 .env 后重启服务');
        }
    }

    //根据环境变量创建大模型客户端（当前支持 deepseek-chat，走 OpenAI 兼容协议）
    initLLM(){
        const provider = process.env.MODEL_PROVIDER;
        let apiKey, baseURL, model;

        if (provider === 'deepseek-chat') {
            apiKey = process.env.DeepSeek_API_KEY;
            baseURL = process.env.DeepSeek_BASE_URL;
            model = process.env.DeepSeek_API_MODEL;
        } else {
            //provider 未配置或不在支持列表：给出可读的中文错误，而不是让构造函数报 undefined
            throw new Error(`不支持的模型提供商「${provider || '(未设置)'}」，请检查 .env 中的 MODEL_PROVIDER（当前支持：deepseek-chat）`);
        }

        //三项配置缺一不可，提前校验避免调用时才失败且错误信息晦涩
        const missingKeys = [];
        if (!apiKey) missingKeys.push('DeepSeek_API_KEY');
        if (!baseURL) missingKeys.push('DeepSeek_BASE_URL');
        if (!model) missingKeys.push('DeepSeek_API_MODEL');
        if (missingKeys.length > 0) {
            throw new Error(`模型配置缺失：请检查 .env 中的 ${missingKeys.join('、')}`);
        }

        this.llm = new ChatOpenAI({
            configuration: {
                baseURL: baseURL,
            },
            apiKey: apiKey,
            model,
            temperature: 0.7,
            streaming: true,
        });
    }

    //确保大模型客户端可用：initLLM 失败时在此重试，仍失败则抛出可读错误
    ensureLLM() {
        if (!this.llm) {
            this.initLLM();
        }
    }

    async recommend(city,budget,days){
            //参数校验：返回业务错误对象而不是 throw，
            //配合路由层 try/catch 双保险，避免请求挂起
            if(budget<100 || days<1 || days>30) {
                return {
                    success: false,
                    error: '预算不能低于100元，天数必须在1-30天之间'
                };
            }

            try {
                this.ensureLLM();
            } catch (configError) {
                return { success: false, error: configError.message };
            }

            //提示词数据
            const message = this.getTravelPrompt(city,budget,days);
            try{
                const response = await this.llm.invoke(message);
                //获取大模型返回的内容
                const fullResponse = response.content || ''
                try{
                    //依次尝试提取 ```json ...```、``` ...```、裸 JSON 三种形态
                    const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                    fullResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                    fullResponse.match(/\{[\s\S]*\}/);
                    //取出JSON字符串：第三个正则没有捕获组，需回退到 [0]
                    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : fullResponse;
                    //处理之后的json字符串
                    const resData = JSON.parse(jsonStr);
                    return resData;
                } catch(error){
                    return {
                        success: false, 
                        error: '大模型返回的不是JSON格式', 
                        rawResponse: fullResponse
                    }
                }
            } catch(error){
                return {
                    success: false, 
                    error: '大模型调用失败', 
                    rawResponse: error.message
                }
            }
        }

        getTravelPrompt(city,budget,days){
            return[
                new HumanMessage(
                `你是一个专业的旅游规划师，擅长根据用户的需求生成详细的旅行行程。

                请根据以下信息为用户生成一份详细的旅游规划：
                - 目的地城市：${city}
                - 预算：${budget}元
                - 旅行天数：${days}天

                要求：
                1. 每天的行程安排（上午、下午、晚上）
                2. 每个景点的详细介绍
                3. 交通建议
                4. 预算分配明细
                5. 注意事项

                请以JSON格式输出，结构如下：
                {
                "success": true,
                "city": "城市名",
                "days": 天数,
                "totalBudget": 总预算,
                "dailyItinerary": [
                    {
                    "day": 1,
                    "date": "第1天",
                    "morning": {
                        "spot": "景点名称",
                        "duration": "游览时长",
                        "ticket": "门票价格",
                        "transportation": "交通方式",
                        "description": "景点介绍"
                    },
                    "afternoon": {
                        "spot": "景点名称",
                        "duration": "游览时长",
                        "ticket": "门票价格",
                        "transportation": "交通方式",
                        "description": "景点介绍"
                    },
                    "evening": {
                        "spot": "活动名称",
                        "duration": "活动时长",
                        "ticket": "费用",
                        "transportation": "交通方式",
                        "description": "活动介绍"
                    }
                    }
                ],
                "budgetBreakdown": {
                    "accommodation": 住宿费用,
                    "food": 餐饮费用,
                    "transportation": 交通费用,
                    "tickets": 门票费用,
                    "other": 其他费用
                },
                "tips": ["提示1", "提示2", "提示3"],
                "warnings": ["注意事项1", "注意事项2"]
                }

                请确保JSON格式正确，可以被解析。`
                ),
            ] ;
        }

        //流式对话
        async chat(message,streamCallback){
            //确保模型客户端可用：配置缺失时抛出可读错误，由路由层通过 SSE 下发
            this.ensureLLM();

            //组装参数
            const messages = [
                new SystemMessage('你是一个专业的旅游规划师，请用中文回答关于用户旅游的问题'),
                new HumanMessage(message)
            ]
            try{
            //调用LLM获取响应流数据
            const stream =await this.llm.stream(messages)

            let fullResponse = ''
            for await (const chunk of stream){
                const content = chunk.content || ''
                //过滤空白分片（修复：原写法 !content.trim() === '' 恒为 false，过滤从未生效）
                if(!content.trim()){
                    continue;
                }
                fullResponse += content;
                if(streamCallback){
                    streamCallback(content)
                }
            }
            return{
                success: true,
                response: fullResponse
            }
            } catch(err){
                return {
                    success: false, 
                    error: '大模型调用失败',
                    rawResponse: err.message
                }
            }
            
        }

        //根据真实天气数据生成每日穿着建议
        async dressingAdvice(city, days, weatherData) {
            this.ensureLLM()

            //把结构化天气数据转成易读的中文摘要，供大模型理解
            const weatherSummary = weatherData.map((w) => {
                return `${w.date}：白天${w.textDay}，夜间${w.textNight}，气温${w.tempMin}~${w.tempMax}℃，${w.windDirDay}${w.windScaleDay}级，降水${w.precip}mm，湿度${w.humidity}%，紫外线${w.uvIndex}`;
            }).join('\n');

            const message = [new HumanMessage(
                `你是一名贴心的旅游穿搭顾问。请根据下面「${city}」未来${days}天的真实天气预报，为游客给出每天的穿衣建议。

天气预报：
${weatherSummary}

要求：
1. 每天给出一条穿着建议，结合当天气温、天气状况、风力、降水给出具体穿搭（上衣、下装、鞋子、是否需要外套/雨具/防晒/保暖）。
2. 建议要实用、具体，直接告诉游客穿什么，而不是泛泛而谈。
3. 严格以 JSON 数组格式输出，不要输出任何其他文字，结构如下：
[
  {"day": 1, "date": "日期", "dressing": "当天的穿着建议"}
]

请确保 JSON 格式正确、可被解析。`
            )];

            try {
                const response = await this.llm.invoke(message);
                const fullResponse = response.content || '';
                //兼容 markdown 代码块包裹的 JSON 数组（与 recommend 的解析策略一致）
                const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                    fullResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                    fullResponse.match(/\[[\s\S]*\]/);
                const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : fullResponse;
                const data = JSON.parse(jsonStr);
                //确保返回的是数组，否则按失败处理（由路由层降级为仅展示天气）
                return Array.isArray(data) ? data : null;
            } catch (error) {
                //大模型调用或 JSON 解析失败：返回 null，由路由层降级为「仅展示天气」
                console.error('穿着建议生成失败:', error.message);
                return null;
            }
        }
        
    }



export default new TravelService();
