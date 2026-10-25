import axios from 'axios'

// 后端接口基础地址：axios 与 fetchStream 共用这一个常量，
// 后端端口/地址变化时只需改这里一处
const API_BASE = 'http://127.0.0.1:3300/api/travel'

//创建axios实例
const request = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

//封装响应拦截器
request.interceptors.response.use(
    response => {
        //直接返回后端响应体，调用方拿到的就是业务数据
        return response.data
    },
    error => {
        return Promise.reject(error)
    }
)

export default function post(url,data){
    return request.post(url,data)
}

export function get(url,params){
    return request.get(url,params)
}

//处理流式接口（SSE）：用 fetch 读取可读流，逐块回调，实现打字机效果
export async function fetchStream(url,data,onChunk,onComplete,onError){
    //创建一个请求控制器，用于取消请求
    const controller = new AbortController()

    try{
        const response = await fetch(`${API_BASE}/${url}`,{
                method:'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify(data),
                signal:controller.signal
            })
            //HTTP 状态非 2xx（如后端宕机走代理返回 502、接口 404）时立即报错，
            //否则会把错误页的 HTML 当流数据解析，导致静默失败
            if(!response.ok){
                throw new Error(`服务响应异常（HTTP ${response.status}）`)
            }
            //获取响应体的可读流的读取器
            const reader = response.body.getReader()
            //将二进制数据解码为字符串
            const decoder = new TextDecoder()

            //缓冲区，用于暂存还没凑成完整行的数据
            let buffer = ''

            while(true){
                const {done,value} = await reader.read()
                if(done){
                    //流读取完成，通知调用方
                    onComplete()
                    break
                }
                //把二进制数据解码后追加到缓冲区
                buffer += decoder.decode(value,{stream:true})
                //按换行切分，最后一段可能不完整，留到下一轮拼接
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for(const line of lines){
                    try{
                        if(line.startsWith('data:')){
                            const jsonStr = line.substring(5)
                            const jsonData = JSON.parse(jsonStr)
                            if(jsonData.type === 'chunk'){
                                onChunk(jsonData.content)
                            }
                            else if(jsonData.error){
                                //服务端下发的业务错误（如大模型调用失败）
                                onError(jsonData.error)
                            }
                            //type 为 complete 的消息无需处理：流关闭时会统一触发 onComplete
                        }
                    }catch(error){
                        onError('流式数据解析异常')
                    }
                }
            }
    }catch(error){
        onError(error.message)
    }
}
