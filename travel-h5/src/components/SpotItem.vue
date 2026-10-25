<template>
  <div class="spot-item">
    <div class="spot-name">{{ data?.spot || '自由活动' }}</div>
    <!-- 时长/门票/交通 用小标签展示，信息密度高且不拥挤 -->
    <div class="spot-meta" v-if="data">
      <span class="meta-tag" v-if="data.duration">🕐 {{ data.duration }}</span>
      <span class="meta-tag" v-if="data.ticket">🎫 {{ data.ticket }}</span>
      <span class="meta-tag" v-if="data.transportation">🚌 {{ data.transportation }}</span>
    </div>
    <div class="spot-desc" v-if="data?.description">{{ data.description }}</div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
/* 景点卡片：白底圆角，嵌在详情页时间轴内 */
.spot-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.05);
}

.spot-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

.spot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-tag {
  font-size: 12px;
  color: var(--text-sub);
  background: #f5f8fd;
  border-radius: 6px;
  padding: 3px 8px;
}

.spot-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}
</style>
