<template>
  <div class="page-container profile-page">
    <!-- 渐变头卡：头像与昵称读取「设置」中的本地数据 -->
    <div class="profile-hero">
      <div class="hero-title">我的</div>
      <div class="user-info">
        <div class="avatar" :style="{ background: avatarPreset.bg }">
          {{ avatarPreset.emoji }}
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ settings.nickname }}</h2>
          <p class="user-desc">欢迎使用智能旅游助手</p>
        </div>
      </div>
    </div>

    <div class="menu-wrap">
      <!-- 我的服务：三个入口均已接入真实功能页 -->
      <div class="menu-card">
        <div class="menu-title">我的服务</div>
        <van-cell-group :border="false">
          <van-cell title="我的收藏" is-link @click="goPage('/favorites')">
            <template #icon><span class="menu-icon">⭐</span></template>
          </van-cell>
          <van-cell title="历史记录" is-link @click="goPage('/history')">
            <template #icon><span class="menu-icon">🕐</span></template>
          </van-cell>
          <van-cell title="设置" is-link @click="goPage('/settings')">
            <template #icon><span class="menu-icon">⚙️</span></template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 关于 -->
      <div class="menu-card">
        <div class="menu-title">关于</div>
        <van-cell-group :border="false">
          <van-cell title="关于我们" is-link @click="showAboutDialog" />
          <van-cell title="版本信息" value="v1.1.0" />
        </van-cell-group>
      </div>
    </div>

    <!-- 关于我们对话框（模板组件方式，禁止函数式 showDialog） -->
    <van-dialog
      v-model:show="aboutDialogVisible"
      title="关于我们"
      show-cancel-button
    >
      <div class="about-content">
        <p>智能旅游助手 v1.1.0</p>
        <p class="mt-2">基于 AI 技术的智能旅游规划平台</p>
        <p class="mt-2">为您提供个性化的旅游行程推荐和实时旅游咨询服务</p>
        <p class="mt-4 text-center">© 2026 智能旅游助手</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getSettings, AVATAR_PRESETS } from '@/utils/storage'

const router = useRouter()

// 用户设置（昵称 + 头像索引），存于 localStorage
const settings = ref(getSettings())

// 当前头像预设：索引越界时回退到默认第一个
const avatarPreset = computed(
  () => AVATAR_PRESETS[settings.value.avatarIndex] || AVATAR_PRESETS[0]
)

// 对话框状态
const aboutDialogVisible = ref(false)

// 显示关于我们对话框
const showAboutDialog = () => {
  aboutDialogVisible.value = true
}

// 跳转到功能子页面
const goPage = (path) => {
  router.push(path)
}
</script>

<style scoped>
.profile-page {
  background: var(--page-bg);
}

/* 渐变头部区域 */
.profile-hero {
  background: var(--brand-gradient);
  padding: 20px 20px 64px;
  color: #fff;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
}

.hero-title {
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  margin-top: 20px;
}

/* 头像：渐变圆底 + emoji */
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  border: 3px solid rgba(255, 255, 255, 0.35);
}

.user-details {
  margin-left: 16px;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}

.user-desc {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

/* 菜单卡片叠压 hero 下缘 */
.menu-wrap {
  margin-top: -40px;
  padding: 0 12px;
}

.menu-card {
  background: #fff;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  margin-bottom: 14px;
  overflow: hidden;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  padding: 14px 16px 6px;
}

/* 菜单项 emoji 图标 */
.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.about-content {
  text-align: center;
  line-height: 1.6;
  padding: 20px;
  color: var(--text-sub);
  font-size: 14px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}
</style>
