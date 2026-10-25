<template>
  <div class="page-container">
    <van-nav-bar title="我的收藏" left-arrow left-text="返回" @click-left="onBack" />

    <div class="page-content">
      <!-- 空态 -->
      <van-empty v-if="list.length === 0" description="还没有收藏的行程，去详情页点星标收藏吧">
        <van-button type="primary" round size="small" class="primary-button" @click="goHome">
          去规划行程
        </van-button>
      </van-empty>

      <!-- 收藏列表：点击卡片跳转详情页重新生成该行程 -->
      <div
        v-for="item in list"
        :key="item.id"
        class="card fav-card"
        @click="goDetail(item)"
      >
        <div class="fav-main">
          <div class="fav-city">{{ item.city }} · {{ item.days }}天行程</div>
          <div class="fav-meta">预算 ¥{{ item.budget }} ｜ 收藏于 {{ formatTime(item.savedAt) }}</div>
        </div>
        <van-button
          size="small"
          plain
          type="danger"
          round
          @click.stop="askRemove(item)"
        >删除</van-button>
      </div>
    </div>

    <!-- 删除确认对话框（模板组件方式） -->
    <van-dialog
      v-model:show="removeDialogVisible"
      title="删除收藏"
      show-cancel-button
      @confirm="doRemove"
    >
      <div class="dialog-text">确定要删除「{{ pendingItem?.city }}」的收藏吗？</div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavorites, removeFavorite } from '@/utils/storage'

const router = useRouter()

// 收藏列表（页面每次进入重新读取 localStorage）
const list = ref([])

// 删除确认状态
const removeDialogVisible = ref(false)
const pendingItem = ref(null)

onMounted(() => {
  list.value = getFavorites()
})

// 相对时间展示：比 ISO 字符串更易读
const formatTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 点击卡片：带着原参数跳转详情页，由 AI 重新生成行程
const goDetail = (item) => {
  router.push({
    path: '/detail',
    query: { city: item.city, budget: item.budget, days: item.days }
  })
}

// 弹出删除确认
const askRemove = (item) => {
  pendingItem.value = item
  removeDialogVisible.value = true
}

// 确认删除后刷新列表
const doRemove = () => {
  if (pendingItem.value) {
    list.value = removeFavorite(pendingItem.value.id)
    pendingItem.value = null
  }
}

const goHome = () => {
  router.push('/')
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.fav-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fav-city {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

.fav-meta {
  font-size: 12px;
  color: var(--text-light);
}
</style>
