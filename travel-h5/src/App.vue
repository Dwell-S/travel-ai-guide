<script setup>
import { ref } from 'vue'
// 底部 tabbar 当前选中项（配合 route 模式与路由联动）
const active = ref(0)
</script>

<template>
  <div class="app-container">
    <router-view />
    <van-tabbar route v-model="active" class="app-tabbar">
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/chat" icon="chat-o">对话</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-tabbar {
  box-shadow: 0 -4px 16px rgba(31, 45, 61, 0.06);
}
</style>
