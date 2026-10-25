<template>
    <div class="chat-bubble" :class="isUser ? 'bubble-user' : 'bubble-ai'">
        <!-- AI 消息：左侧品牌渐变飞机头像 -->
        <div v-if="!isUser" class="bubble-avatar ai-avatar">✈️</div>

        <div class="bubble-content">{{ message.content }}</div>

        <!-- 用户消息：右侧显示「设置」里选择的头像（渐变底色 + emoji） -->
        <div v-if="isUser" class="bubble-avatar user-avatar" :style="{ background: userAvatar.bg }">
            {{ userAvatar.emoji }}
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSettings, AVATAR_PRESETS } from '@/utils/storage'

const props = defineProps({
    message: {
        type: Object,
        required: true
    }
})

//用户消息靠右，AI消息靠左
const isUser = computed(() => props.message.role === 'user')

// 读取用户在「设置」页选择的头像；索引越界时回退到默认第一个
const userAvatar = computed(() => {
    const { avatarIndex } = getSettings()
    return AVATAR_PRESETS[avatarIndex] || AVATAR_PRESETS[0]
})
</script>

<style scoped>
.chat-bubble {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.bubble-user {
    justify-content: flex-end;
}

.bubble-ai {
    justify-content: flex-start;
}

/* 头像：圆形渐变底 */
.bubble-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.ai-avatar {
    background: var(--brand-gradient);
}

/* 气泡：AI 白底阴影、用户品牌渐变底白字 */
.bubble-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
    white-space: pre-wrap;
}

.bubble-user .bubble-content {
    background: var(--brand-gradient);
    color: #fff;
    border-top-right-radius: 6px;
    box-shadow: 0 4px 12px rgba(47, 128, 237, 0.25);
}

.bubble-ai .bubble-content {
    background: #fff;
    color: var(--text-main);
    border-top-left-radius: 6px;
    box-shadow: var(--card-shadow);
}
</style>
