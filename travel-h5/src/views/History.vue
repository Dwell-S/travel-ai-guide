<template>
  <div class="page-container">
    <van-nav-bar title="历史记录" left-arrow left-text="返回" @click-left="onBack">
      <template #right>
        <span v-if="list.length" class="clear-text" @click="askClear">清空</span>
      </template>
    </van-nav-bar>

    <div class="page-content">
      <!-- 空态 -->
      <van-empty v-if="list.length === 0" description="暂无规划历史，去首页规划一次行程吧">
        <van-button type="primary" round size="small" class="primary-button" @click="goHome">
          去规划行程
        </van-button>
      </van-empty>

      <!-- 历史列表：按时间倒序，点击重新生成 -->
      <div
        v-for="item in list"
        :key="item.id"
        class="card history-card"
        @click="goDetail(item)"
      >
        <div class="history-main">
          <div class="history-city">{{ item.city }} · {{ item.days }}天行程</div>
          <div class="history-meta">预算 ¥{{ item.budget }} ｜ 规划于 {{ formatTime(item.visitedAt) }}</div>
        </div>
        <van-icon name="arrow" color="#9aa7b8" />
      </div>
    </div>

    <!-- 清空确认对话框（模板组件方式） -->
    <van-dialog
      v-model:show="clearDialogVisible"
      title="清空历史记录"
      show-cancel-button
      @confirm="doClear"
    >
      <div class="dialog-text">确定要清空全部历史记录吗？收藏不受影响。</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHistory, clearHistory } from '@/utils/storage'

const router = useRouter()

// 历史列表（每次进入页面重新读取）
const list = ref([])

const clearDialogVisible = ref(false)

onMounted(() => {
  list.value = getHistory()
})

// 相对时间展示
const formatTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 点击历史条目：带原参数跳转详情页重新生成
const goDetail = (item) => {
  router.push({
    path: '/detail',
    query: { city: item.city, budget: item.budget, days: item.days }
  })
}

const askClear = () => {
  clearDialogVisible.value = true
}

// 确认后清空并刷新列表
const doClear = () => {
  clearHistory()
  list.value = getHistory()
}

const goHome = () => {
  router.push('/')
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.clear-text {
  font-size: 14px;
  color: var(--brand);
}

.history-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-city {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

.history-meta {
  font-size: 12px;
  color: var(--text-light);
}
</style>
