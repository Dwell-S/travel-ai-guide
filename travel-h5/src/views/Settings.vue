<template>
  <div class="page-container">
    <van-nav-bar title="设置" left-arrow left-text="返回" @click-left="onBack" />

    <div class="page-content">
      <!-- 昵称 -->
      <div class="card">
        <div class="section-title">个人资料</div>
        <van-field
          v-model="nickname"
          label="昵称"
          placeholder="请输入昵称"
          maxlength="12"
          class="setting-field"
        />
      </div>

      <!-- 头像选择：预置渐变底 + emoji -->
      <div class="card">
        <div class="section-title">选择头像</div>
        <div class="avatar-grid">
          <div
            v-for="(preset, index) in AVATAR_PRESETS"
            :key="index"
            class="avatar-option"
            :class="{ active: avatarIndex === index }"
            :style="{ background: preset.bg }"
            @click="avatarIndex = index"
          >
            {{ preset.emoji }}
          </div>
        </div>
      </div>

      <van-button
        type="primary"
        round
        block
        class="primary-button save-button"
        @click="handleSave"
      >保存设置</van-button>

      <!-- 数据管理 -->
      <div class="card danger-card">
        <div class="section-title">数据管理</div>
        <van-cell
          title="清空全部本地数据"
          label="将删除收藏、历史记录和个人设置"
          is-link
          @click="clearDialogVisible = true"
        />
      </div>
    </div>

    <!-- 清空二次确认 -->
    <van-dialog
      v-model:show="clearDialogVisible"
      title="清空本地数据"
      show-cancel-button
      @confirm="handleClear"
    >
      <div class="dialog-text">确定要清空全部本地数据吗？此操作不可恢复。</div>
    </van-dialog>

    <!-- 保存/清空结果提示（模板组件方式） -->
    <van-toast v-model:show="toastShow" :message="toastMsg" position="middle" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSettings, saveSettings, clearAllData, AVATAR_PRESETS } from '@/utils/storage'

const router = useRouter()

// 当前设置回填到表单
const settings = getSettings()
const nickname = ref(settings.nickname)
const avatarIndex = ref(settings.avatarIndex)

// 提示
const toastShow = ref(false)
const toastMsg = ref('')
const showTip = (msg) => {
  toastMsg.value = msg
  toastShow.value = true
}

const clearDialogVisible = ref(false)

// 保存昵称与头像选择到 localStorage
const handleSave = () => {
  const trimmed = nickname.value.trim()
  if (!trimmed) {
    showTip('昵称不能为空')
    return
  }
  saveSettings({ nickname: trimmed, avatarIndex: avatarIndex.value })
  showTip('设置已保存')
}

// 清空全部本地数据并重置表单为默认值
const handleClear = () => {
  clearAllData()
  const defaults = getSettings()
  nickname.value = defaults.nickname
  avatarIndex.value = defaults.avatarIndex
  showTip('已清空本地数据')
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.setting-field {
  background: #f5f8fd;
  border-radius: 12px;
}

/* 头像选择网格 */
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.avatar-option {
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 3px solid transparent;
  transition: all 0.2s;
}

/* 选中态：品牌色描边 + 轻阴影 */
.avatar-option.active {
  border-color: var(--brand);
  box-shadow: 0 4px 12px rgba(47, 128, 237, 0.3);
}

.save-button {
  margin-bottom: 14px;
}

.danger-card :deep(.van-cell__title) {
  color: #ee0a24;
}
</style>
