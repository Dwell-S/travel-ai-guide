<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar
        :title="pageTitle"
        left-text="返回"
        left-arrow
        @click-left="onBack"
        fixed
        placeholder
      />
    </div>

    <div class="page-content">
      <!-- 加载中 -->
      <div v-if="isLoading" class="loading-container">
        <van-loading type="spinner" size="48px">正在生成旅游规划...</van-loading>
      </div>

      <!-- 请求出错：可重试 -->
      <div v-else-if="error" class="card error-card">
        <van-empty :description="error">
          <van-button type="primary" size="small" round @click="retry">重试</van-button>
        </van-empty>
      </div>

      <template v-else-if="tripData && tripData.success !== false">
        <!-- 行程概览：品牌渐变头卡 + 收藏星标 -->
        <div class="overview-card">
          <div class="trip-header">
            <div class="trip-title">
              <h2>{{ tripData.city }} · {{ tripData.days }}天行程</h2>
              <div class="trip-budget">预算 ¥{{ tripData.totalBudget || formData.budget }}</div>
            </div>
            <!-- 收藏按钮：点击写入/移除 localStorage 收藏 -->
            <div class="fav-button" :class="{ active: favorited }" @click="toggleFavorite">
              <van-icon :name="favorited ? 'star' : 'star-o'" size="22" />
              <span>{{ favorited ? '已收藏' : '收藏' }}</span>
            </div>
          </div>
        </div>

        <!-- 天气与穿着建议：真实天气 + AI 穿搭建议 -->
        <div class="card weather-card">
          <div class="section-title">🌤️ 天气与穿着建议</div>

          <div v-if="weatherLoading" class="weather-loading">
            <van-loading type="spinner" size="18px" /> 天气加载中...
          </div>

          <template v-else-if="weatherData && weatherData.weather">
            <!-- 未来几天天气横向滚动 -->
            <div class="weather-scroll">
              <div v-for="w in weatherData.weather" :key="w.date" class="weather-day">
                <div class="weather-date">{{ formatDate(w.date) }}</div>
                <div class="weather-text">{{ w.textDay }}</div>
                <div class="weather-temp">{{ w.tempMin }}~{{ w.tempMax }}℃</div>
                <div class="weather-wind">💨 {{ w.windDirDay }}{{ w.windScaleDay }}级</div>
              </div>
            </div>

            <!-- AI 穿着建议 -->
            <div v-if="weatherData.dressing && weatherData.dressing.length" class="dressing-list">
              <div class="dressing-title">👗 AI 穿搭建议</div>
              <div v-for="d in weatherData.dressing" :key="d.day" class="dressing-item">
                <span class="dressing-day">第{{ d.day }}天</span>
                <span class="dressing-text">{{ d.dressing }}</span>
              </div>
            </div>
          </template>

          <div v-else-if="weatherError" class="weather-error">{{ weatherError }}</div>
        </div>

        <!-- 每日行程：折叠面板 + 时间轴 -->
        <div class="card day-card">
          <van-collapse v-model="activeDays" accordion>
            <van-collapse-item
              v-for="day in tripData.dailyItinerary"
              :key="day.day"
              :title="`第${day.day}天 · ${day.date}`"
              :name="day.day"
            >
              <div class="day-timeline">
                <div class="timeline-section">
                  <div class="timeline-icon">🌅</div>
                  <div class="timeline-label">上午</div>
                  <SpotItem :data="day.morning" />
                </div>
                <div class="timeline-section">
                  <div class="timeline-icon">☀️</div>
                  <div class="timeline-label">下午</div>
                  <SpotItem :data="day.afternoon" />
                </div>
                <div class="timeline-section">
                  <div class="timeline-icon">🌙</div>
                  <div class="timeline-label">晚上</div>
                  <SpotItem :data="day.evening" />
                </div>
              </div>
            </van-collapse-item>
          </van-collapse>
        </div>

        <!-- 预算明细 -->
        <div class="card budget-card" v-if="tripData.budgetBreakdown">
          <div class="section-title">💰 预算明细</div>
          <BudgetTable :data="tripData.budgetBreakdown" :total="tripData.totalBudget" />
        </div>

        <!-- 温馨提示 -->
        <div class="card tips-card" v-if="tripData.tips && tripData.tips.length">
          <div class="section-title">💡 温馨提示</div>
          <ul class="tips-list">
            <li v-for="(tip, index) in tripData.tips" :key="index">{{ tip }}</li>
          </ul>
        </div>

        <!-- 注意事项 -->
        <div class="card warnings-card" v-if="tripData.warnings && tripData.warnings.length">
          <div class="section-title">⚠️ 注意事项</div>
          <ul class="warnings-list">
            <li v-for="(warning, index) in tripData.warnings" :key="index">{{ warning }}</li>
          </ul>
        </div>
      </template>

      <!-- 无数据兜底 -->
      <div v-else class="card error-card">
        <van-empty description="暂无规划数据">
          <van-button type="primary" size="small" round @click="goHome">去首页</van-button>
        </van-empty>
      </div>
    </div>

    <!-- 底部固定操作栏 -->
    <div class="detail-footer" v-if="tripData && tripData.success !== false">
      <van-button type="primary" size="large" round class="primary-button" @click="goToChat">
        咨询 AI 助手
      </van-button>
    </div>

    <!-- 收藏/取消收藏反馈提示（模板组件方式） -->
    <van-toast v-model:show="toastShow" :message="toastMsg" position="middle" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import post, { get } from '@/utils/request'
import SpotItem from '@/components/SpotItem.vue'
import BudgetTable from '@/components/BudgetTable.vue'
import { getTripParams, addHistory, isFavorite, addFavorite, removeFavorite } from '@/utils/storage'

const router = useRouter()
const route = useRoute()

const formData = reactive({
  city: '',
  budget: 0,
  days: 0,
  startDate: ''  // 出发日期（YYYY-MM-DD，可选）
})

// 行程数据，存储从API获取的行程规划信息
const tripData = ref(null)
// 加载状态，用于显示加载动画
const isLoading = ref(false)
// 错误信息，用于显示请求失败时的提示
const error = ref('')
// 活跃天数，accordion 模式下为单个展开项的名称
const activeDays = ref('')

// 当前行程是否已收藏
const favorited = ref(false)

// 天气与穿着建议
const weatherData = ref(null)
const weatherLoading = ref(false)
const weatherError = ref('')

// 提示：统一用模板组件 <van-toast>
const toastShow = ref(false)
const toastMsg = ref('')
const showTip = (msg) => {
  toastMsg.value = msg
  toastShow.value = true
}

// 页面标题，根据城市名称动态生成
const pageTitle = computed(() => {
  if (formData.city) {
    return `${formData.city}行程规划`
  }
  return '行程详情'
})

onMounted(() => {
  formData.city = route.query.city || ''
  formData.budget = Number(route.query.budget) || 0
  formData.days = Number(route.query.days) || 0
  formData.startDate = route.query.startDate || ''

  if (formData.city && formData.budget && formData.days) {
    fetchTripData()
  } else {
    // query 丢失（如刷新）时，回退读取首页保存的行程参数
    const savedParams = getTripParams()
    if (savedParams) {
      formData.city = savedParams.city
      formData.budget = savedParams.budget
      formData.days = savedParams.days
      formData.startDate = savedParams.startDate || ''
      fetchTripData()
    } else {
      error.value = '缺少行程参数'
    }
  }
})

const fetchTripData = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await post('recommend', {
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    })

    if (response && response.success !== false) {
      tripData.value = response
      // 生成成功后写入历史记录（去重、上限 20 条由 storage 工具处理）
      addHistory({ city: formData.city, budget: formData.budget, days: formData.days })
      // 同步当前行程的收藏状态
      favorited.value = isFavorite({ city: formData.city, budget: formData.budget, days: formData.days })
      // 行程生成成功后，并行拉取目的地天气与穿着建议
      fetchWeather()
    } else {
      error.value = response.error || '无法获取规划数据'
    }
  } catch (err) {
    error.value = err.message || '请求失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 拉取目的地天气与 AI 穿着建议（独立于行程主流程，失败不阻塞行程展示）
const fetchWeather = async () => {
  if (!formData.city) return
  weatherLoading.value = true
  weatherError.value = ''
  try {
    const params = { city: formData.city, days: formData.days || 3 }
    // 带上出发日期（可选），让天气精确对应实际出行时间
    if (formData.startDate) {
      params.startDate = formData.startDate
    }
    const data = await get('weather', { params })
    if (data && data.success !== false) {
      weatherData.value = data
    } else {
      weatherError.value = (data && data.error) || '天气查询失败'
    }
  } catch (err) {
    weatherError.value = err.message || '天气查询失败'
  } finally {
    weatherLoading.value = false
  }
}

// 天气日期格式化：2026-10-25 -> 10-25
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr
}

// 收藏/取消收藏当前行程
const toggleFavorite = () => {
  const params = { city: formData.city, budget: formData.budget, days: formData.days }
  if (favorited.value) {
    removeFavorite(`${params.city}_${params.budget}_${params.days}`)
    favorited.value = false
    showTip('已取消收藏')
  } else {
    addFavorite(params)
    favorited.value = true
    showTip('已加入收藏')
  }
}

const retry = () => {
  fetchTripData()
}

const goHome = () => {
  router.push('/')
}

const onBack = () => {
  router.back()
}

const goToChat = () => {
  router.push({
    path: '/chat',
    query: { scene: 'detail', city: formData.city }
  })
}
</script>

<style scoped>
/* 概览头卡：品牌渐变，突出城市与预算 */
.overview-card {
  background: var(--brand-gradient);
  border-radius: var(--card-radius);
  padding: 20px 16px;
  margin-bottom: 14px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(47, 128, 237, 0.25);
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-title h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #fff;
}

.trip-budget {
  display: inline-block;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  padding: 3px 12px;
}

/* 收藏按钮 */
.fav-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #fff;
  opacity: 0.85;
  padding: 4px 8px;
}

.fav-button.active {
  opacity: 1;
}

.fav-button.active :deep(.van-icon) {
  color: #ffd54f;
}

.day-card {
  margin-bottom: 14px;
  padding: 4px 16px;
}

/* 天气卡片 */
.weather-card {
  margin-bottom: 14px;
}

.weather-loading,
.weather-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  color: var(--text-light);
  font-size: 13px;
}

/* 天气横向滚动 */
.weather-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 0 12px;
  scrollbar-width: none;
}

.weather-scroll::-webkit-scrollbar {
  display: none;
}

.weather-day {
  flex-shrink: 0;
  width: 96px;
  background: #f5f8fd;
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
}

.weather-date {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.weather-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.weather-temp {
  font-size: 13px;
  color: var(--brand);
  font-weight: 600;
  margin-bottom: 4px;
}

.weather-wind {
  font-size: 11px;
  color: var(--text-light);
}

/* AI 穿搭建议 */
.dressing-list {
  border-top: 1px solid #f2f5fa;
  padding-top: 12px;
}

.dressing-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.dressing-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f5fa;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-sub);
}

.dressing-item:last-child {
  border-bottom: none;
}

.dressing-day {
  flex-shrink: 0;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 8px;
}

/* 时间轴：左侧竖线串联上午/下午/晚上三个节点 */
.day-timeline {
  padding: 4px 0;
}

.timeline-section {
  position: relative;
  padding-left: 40px;
  margin-bottom: 16px;
}

.timeline-section:last-child {
  margin-bottom: 0;
}

/* 节点之间的连接线 */
.timeline-section::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: -14px;
  width: 2px;
  background: #e3ecf7;
}

.timeline-section:last-child::before {
  display: none;
}

.timeline-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eef4fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.timeline-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 6px;
}

.budget-card,
.tips-card,
.warnings-card {
  margin-bottom: 14px;
}

.tips-list,
.warnings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li,
.warnings-list li {
  padding: 8px 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.6;
  border-bottom: 1px solid #f2f5fa;
}

.tips-list li:last-child,
.warnings-list li:last-child {
  border-bottom: none;
}

/* 底部操作栏：定位在 tabbar（50px）之上，避免遮挡底部导航的点击 */
.detail-footer {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  max-width: 750px;
  margin: 0 auto;
  z-index: 10;
}

/* 内容区为固定操作栏 + tabbar 留出滚动空间 */
.page-container {
  padding-bottom: 150px;
}

.error-card {
  text-align: center;
  padding: 40px 16px;
}
</style>
