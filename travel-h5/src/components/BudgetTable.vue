<template>
  <div class="budget-table">
    <div class="budget-row" v-for="row in rows" :key="row.key">
      <div class="budget-label">{{ row.label }}</div>
      <div class="budget-bar">
        <div class="budget-bar-inner" :style="{ width: row.percent + '%' }"></div>
      </div>
      <div class="budget-value">¥{{ row.value }}</div>
    </div>

    <div class="budget-row total" v-if="total">
      <div class="budget-label">合计</div>
      <div class="budget-bar"></div>
      <div class="budget-value">¥{{ total }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 预算字段到中文标签的映射（与后端提示词约定的结构一致）
const LABELS = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他'
}

const props = defineProps({
  data: {
    type: Object,
    default: null
  },
  total: {
    type: [Number, String],
    default: 0
  }
})

// 计算每类支出占比，用于渲染进度条宽度
const rows = computed(() => {
  const data = props.data || {}
  const sum = Object.keys(data).reduce(
    (acc, key) => acc + (Number(data[key]) || 0),
    0
  )
  return Object.keys(data).map(key => {
    const value = Number(data[key]) || 0
    return {
      key,
      label: LABELS[key] || key,
      value,
      percent: sum ? Math.round((value / sum) * 100) : 0
    }
  })
})
</script>

<style scoped>
.budget-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f2f5fa;
}

.budget-row:last-child {
  border-bottom: none;
}

.budget-label {
  flex-shrink: 0;
  width: 56px;
  font-size: 14px;
  color: var(--text-sub);
}

.budget-bar {
  flex: 1;
  height: 8px;
  margin: 0 12px;
  border-radius: 4px;
  background: #eef3fb;
  overflow: hidden;
}

/* 进度条使用品牌渐变，与整体设计统一 */
.budget-bar-inner {
  height: 100%;
  border-radius: 4px;
  background: var(--brand-gradient);
  transition: width 0.6s ease;
}

.budget-value {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-main);
}

.budget-row.total .budget-label,
.budget-row.total .budget-value {
  font-weight: 600;
  color: var(--text-main);
}
</style>
