<template>
    <div class="page-container chat-page">
        <!-- 渐变导航栏 -->
        <div class="chat-navbar">
            <van-nav-bar
                title="AI 旅游助手"
                left-arrow
                left-text="返回"
                @click-left="onBack"
            />
        </div>

        <div class="chat-container" ref="chatContainer">
            <!-- 空态：欢迎语 + 快捷问题卡片 -->
            <div v-if="messages.length === 0" class="chat-empty">
                <div class="welcome-icon">✈️</div>
                <div class="welcome-title">你好，我是你的 AI 旅游助手</div>
                <div class="welcome-sub">关于目的地、行程、美食的任何问题，都可以问我</div>
                <div class="quick-questions">
                    <div class="quick-title">你可以这样问我</div>
                    <div
                        v-for="q in quickQuestions"
                        :key="q"
                        class="quick-item"
                        @click="handleClick(q)"
                    >
                        <span>{{ q }}</span>
                        <van-icon name="arrow" color="#9aa7b8" size="14" />
                    </div>
                </div>
            </div>

            <!-- 消息列表 -->
            <div class="message-list" v-else>
                <ChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
                <div v-if="isStreaming" class="streaming-indicator">
                    <van-loading type="spinner" size="18px" />
                    <span>AI 正在思考中...</span>
                </div>
            </div>
        </div>

        <!-- 底部输入区：胶囊输入框 + 渐变发送按钮 -->
        <div class="chat-input-container">
            <van-field
                v-model="inputMessage"
                :disabled="isStreaming"
                placeholder="请输入您的问题"
                class="chat-input-field"
                @keyup.enter="sendMessage"
            >
                <template #button>
                    <van-button
                        type="primary"
                        size="small"
                        round
                        class="primary-button send-button"
                        :disabled="!inputMessage.trim()"
                        @click="sendMessage"
                    >发送</van-button>
                </template>
            </van-field>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchStream } from '@/utils/request'
import ChatBubble from '@/components/ChatBubble.vue'

const chatContainer = ref(null)

//置底的方法
const scrollToBottom = () => {
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

const router = useRouter()

//常见问题
const quickQuestions = ref([
    '北京有哪些必去的景点？',
    '上海美食推荐',
    '成都三日游攻略',
    '如何选择旅行保险？'
])

//输入框内容
const inputMessage = ref('')

//发送消息
const sendMessage = () => {
    const message = inputMessage.value.trim()
    if (!message || isStreaming.value) {
        return
    }
    addUserMessage(message)
    inputMessage.value = ''
    //进行流式请求
    fetchAIResponse(message)
}

//获取AI响应：先插入一条空的 AI 消息占位，随流式数据逐块填充内容
const fetchAIResponse = (message) => {
    isStreaming.value = true
    messages.value.push({
        id: Date.now() + 1,
        role: 'ai',
        content: '',
        timestamp: new Date().toISOString()
    })
    let fullResponse = ''
    fetchStream('chat', { message }, (chunk) => {
        fullResponse += chunk
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.content = fullResponse
        }
        scrollToBottom()
    }, () => {
        //AI返回完成
        isStreaming.value = false
        scrollToBottom()
    }, (errMsg) => {
        //AI返回错误：在占位消息中展示降级文案
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.content = `抱歉，AI发生错误：${errMsg}`
        }
        isStreaming.value = false
        scrollToBottom()
    })
}

//AI处理的状态
const isStreaming = ref(false)

//往会话中追加用户消息
const addUserMessage = (content) => {
    messages.value.push({
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
    })
}

//点击标签：把问题填入输入框
const handleClick = (q) => {
    inputMessage.value = q
}

//会话数据
const messages = ref([])

const onBack = () => {
    router.back()
}

const route = useRoute()

onMounted(() => {
    // 从详情页「咨询 AI 助手」进入时，自动带入该城市的问题
    if (route.query) {
        if (route.query.scene === 'detail' && route.query.city) {
            inputMessage.value = `我想了解${route.query.city}的旅游景点`
        }
    }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 50px;
  background: var(--page-bg);
}

/* 顶部渐变导航条 */
.chat-navbar {
  background: var(--brand-gradient);
}

/* 让 Vant 导航栏透明，露出外层 .chat-navbar 的渐变背景 */
.chat-navbar :deep(.van-nav-bar) {
  background: transparent;
}

.chat-navbar :deep(.van-nav-bar__title),
.chat-navbar :deep(.van-nav-bar__text),
.chat-navbar :deep(.van-nav-bar__arrow) {
  color: #fff !important;
}

.chat-navbar :deep(.van-hairline--bottom::after) {
  border-bottom: none;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 76px;
}

/* 空态欢迎页 */
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 48px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 8px 20px rgba(47, 128, 237, 0.3);
}

.welcome-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-main);
  margin-top: 16px;
}

.welcome-sub {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 6px;
}

.quick-questions {
  width: 100%;
  margin-top: 28px;
}

.quick-title {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 10px;
}

/* 快捷问题：卡片列表，点击进入输入框 */
.quick-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 13px 16px;
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--text-main);
  box-shadow: var(--card-shadow);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 46px;
  color: var(--text-light);
  font-size: 13px;
}

/* 底部输入区：毛玻璃效果 */
.chat-input-container {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 8px 16px;
  box-shadow: 0 -2px 12px rgba(31, 45, 61, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.chat-input-container :deep(.van-field) {
  background: #f5f8fd;
  border-radius: 22px;
  padding: 8px 12px 8px 16px;
}

.send-button {
  padding: 0 18px;
}
</style>
