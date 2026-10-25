<template>
    <div class="page-container home-page">
        <!-- 顶部渐变 hero：品牌标题 + 问候语，表单卡片叠压在其下缘形成层次感 -->
        <div class="hero">
            <div class="hero-brand">智能旅游助手</div>
            <div class="hero-greet">你好，旅行者 👋</div>
            <div class="hero-sub">告诉我你的目的地，让我为你规划下一段旅程</div>
        </div>

        <div class="page-content hero-overlap">
            <!-- 行程规划表单 -->
            <div class="card search-card">
                <div class="section-title">规划你的旅程</div>
                <van-field
                    v-model="formData.city"
                    label="目的地"
                    placeholder="请选择城市"
                    readonly
                    is-link
                    left-icon="location-o"
                    class="form-field"
                    @click="showCityPicker = true"
                />
                <van-field
                    v-model="formData.budget"
                    label="预算(元)"
                    placeholder="请输入预算金额"
                    type="number"
                    left-icon="gold-coin-o"
                    class="form-field"
                    :border="false"
                />
                <van-field
                    v-model="formData.dateRangeText"
                    label="游玩时间"
                    placeholder="请选择出游日期范围"
                    readonly
                    is-link
                    left-icon="calendar-o"
                    class="form-field"
                    :border="false"
                    @click="showCalendar = true"
                />
                <van-button
                    type="primary"
                    round
                    block
                    size="large"
                    class="primary-button"
                    :loading="isLoading"
                    loading-text="规划中..."
                    @click="handleSubmit"
                >开始规划</van-button>
            </div>

            <!-- 热门目的地：横向滚动 emoji 标签，点击快速填充目的地 -->
            <div class="card popular-destinations">
                <div class="section-title">热门目的地</div>
                <div class="dest-scroll">
                    <div
                        v-for="item in popularDestinations"
                        :key="item.city"
                        class="dest-chip"
                        :class="{ active: formData.city === item.city }"
                        @click="selectedCity(item.city)"
                    >
                        <span class="dest-emoji">{{ item.emoji }}</span>
                        <span>{{ item.city }}</span>
                    </div>
                </div>
            </div>

            <!-- 快捷入口 -->
            <div class="card quick-actions">
                <div class="section-title">快捷入口</div>
                <van-grid :gutter="12" :column-num="2" :border="false">
                    <van-grid-item @click="goPage('/chat')" icon="chat-o" text="AI 对话" />
                    <van-grid-item @click="goPage('/profile')" icon="user-o" text="我的" />
                </van-grid>
            </div>
        </div>

        <!-- 城市选择器：底部弹出 -->
        <van-popup round v-model:show="showCityPicker" position="bottom">
            <van-picker
                title="选择目的地"
                :columns="cityColumns"
                @confirm="handleCityConfirm"
                @cancel="showCityPicker = false"
            />
        </van-popup>

        <!-- 出发日期选择器：van-calendar 自带弹出层，直接 v-model:show 控制，无需包 popup -->
        <van-calendar
            v-model:show="showCalendar"
            type="range"
            title="选择出游日期"
            :min-date="minDate"
            :max-date="maxDate"
            @confirm="handleDateConfirm"
        />

        <!-- 提示统一用模板组件（函数式 showToast 在本项目 Vue 3.5 下不生效） -->
        <van-toast v-model:show="toastShow" :message="toastMsg" position="middle" />
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { saveTripParams } from '@/utils/storage'

// 路由实例
const router = useRouter()

// 表单数据
const formData = reactive({
    city: '',
    budget: '',
    startDate: '',     // 出发日期（YYYY-MM-DD）
    endDate: '',       // 结束日期（YYYY-MM-DD）
    dateRangeText: ''  // 日期范围显示文本（如 2026-10-28 ~ 2026-10-30）
})

const showCityPicker = ref(false)

// 游玩时间（出发日期）选择器
const showCalendar = ref(false)
// 可选日期范围：今天 ~ 未来14天（和风免费版支持15天预报，后端会兜底校验行程总跨度）
// 规范化到当天 00:00:00，避免时分秒影响 Vant Calendar 的日期比较
const minDate = new Date()
minDate.setHours(0, 0, 0, 0)
const maxDate = new Date(minDate)
maxDate.setDate(maxDate.getDate() + 14)

// 提示：改用模板组件方式，showTip() 在本项目的按需引入下无法正常显示
const toastShow = ref(false)
const toastMsg = ref('')
const showTip = (msg) => {
    toastMsg.value = msg
    toastShow.value = true
}

// 全部可选城市（已去重：原列表中「西安」重复出现）
const allCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '武汉', '苏州', '长沙', '天津', '郑州', '济南', '青岛',
  '大连', '沈阳', '哈尔滨', '长春', '福州', '厦门', '南昌', '合肥',
  '昆明', '贵阳', '南宁', '桂林', '海口', '三亚', '丽江', '大理',
  '兰州', '乌鲁木齐', '拉萨', '呼和浩特', '太原', '石家庄'
]

// 热门目的地：emoji 让标签更有旅行氛围
const popularDestinations = [
    { city: '北京', emoji: '🏯' },
    { city: '上海', emoji: '🌃' },
    { city: '成都', emoji: '🐼' },
    { city: '杭州', emoji: '🌉' },
    { city: '西安', emoji: '🏮' },
    { city: '重庆', emoji: '🌆' },
    { city: '广州', emoji: '🌸' },
    { city: '深圳', emoji: '🌊' }
]

// van-picker 需要的列数据格式
const cityColumns = allCities.map(city => ({ text: city, value: city }))

// 城市选择确认
const handleCityConfirm = ({ selectedOptions }) => {
    formData.city = selectedOptions[0].value
    showCityPicker.value = false
}

// 日期格式化：Date -> YYYY-MM-DD
const formatDateToStr = (date) => {
    const d = new Date(date)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 出游日期范围确认（range 模式返回 [开始日期, 结束日期]）
const handleDateConfirm = (dateRange) => {
    const [start, end] = dateRange
    formData.startDate = formatDateToStr(start)
    formData.endDate = formatDateToStr(end)
    formData.dateRangeText = `${formData.startDate} ~ ${formData.endDate}`
    showCalendar.value = false
}

// 根据日期范围计算行程天数（结束 - 开始 + 1）
const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    return Math.round((end - start) / 86400000) + 1
}

const isLoading = ref(false)

// 表单校验通过后：保存行程参数到 localStorage（供详情页刷新恢复），再跳转详情页
const handleSubmit = () => {
    //判断目的地
    if (!formData.city) {
        showTip('请选择目的地')
        return
    }
    //判断预算
    if (!formData.budget || formData.budget < 100) {
        showTip('预算不能低于100元')
        return
    }
    //判断出游日期
    if (!formData.startDate || !formData.endDate) {
        showTip('请选择出游日期')
        return
    }
    //根据日期范围自动计算天数
    const days = calcDays()
    if (days < 1 || days > 30) {
        showTip('行程天数需在1-30天之间，请调整出游日期')
        return
    }

    // 写入本地存储：详情页直接刷新导致 query 丢失时可用它恢复
    saveTripParams({
        city: formData.city,
        budget: Number(formData.budget),
        days,
        startDate: formData.startDate,
        endDate: formData.endDate
    })

    //提交表单数据
    router.push({
        path: '/detail',
        query: {
            city: formData.city,
            budget: formData.budget,
            days,
            startDate: formData.startDate,
            endDate: formData.endDate
        }
    })
}

// 跳转页面
const goPage = (path) => {
    router.push(path)
}

// 点击热门城市标签：直接填充目的地
const selectedCity = (city) => {
    formData.city = city
}
</script>

<style scoped>
/* 顶部渐变区：预留出下方卡片叠压的空间 */
.hero {
    background: var(--brand-gradient);
    padding: 28px 20px 64px;
    color: #fff;
    border-bottom-left-radius: 28px;
    border-bottom-right-radius: 28px;
}

.hero-brand {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
}

.hero-greet {
    font-size: 26px;
    font-weight: 700;
    margin-top: 18px;
}

.hero-sub {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 8px;
}

/* 负外边距让第一张卡片「压」在 hero 上，形成层次 */
.hero-overlap {
    margin-top: -44px;
}

.search-card {
    margin-bottom: 16px;
}

/* 表单字段：浅灰底圆角，与卡片区分 */
.form-field {
    background: #f5f8fd;
    border-radius: 12px;
    margin-bottom: 12px;
}

.form-field :deep(.van-field__label) {
    color: var(--text-sub);
    width: 72px;
}

/* 热门目的地：横向滚动，隐藏滚动条更清爽 */
.dest-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
}

.dest-scroll::-webkit-scrollbar {
    display: none;
}

.dest-chip {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 14px;
    background: #f5f8fd;
    color: var(--text-sub);
    transition: all 0.25s;
}

.dest-chip.active {
    background: var(--brand-gradient);
    color: #fff;
    box-shadow: 0 4px 12px rgba(47, 128, 237, 0.3);
}

.dest-emoji {
    font-size: 16px;
}
</style>
