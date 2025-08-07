<script setup>
import { computed, watch } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { RouterLink, RouterView, useRouter } from 'vue-router'

const router = useRouter()
const store = useCounterStore()

// 使用计算属性
const isAdmin = computed(() => store.isAdmin)
const isLoggedIn = computed(() => store.isLoggedIn)

if (store.isLoggedIn) {
  const savedUsername = localStorage.getItem('username')
  if (savedUsername) {
    store.setUsername(savedUsername)
  }
}

const logoutbutton = () => {
  store.logout()
  alert('退出登录!')
  router.push('/login')
}

// 监听登录状态变化
watch(() => store.isLoggedIn, (newVal) => {
  console.log('登录状态变化:', newVal)
})
</script>

<template>
  <div>
    <nav class="navbar">
      <div class="navbar-brand">学习计划论坛</div>
      <div class="navbar-links">
        <RouterLink to="/home" class="nav-link">首页</RouterLink>
        <RouterLink to="/plans" class="nav-link">学习计划</RouterLink>
        <RouterLink to="/discuss" class="nav-link">论坛</RouterLink>
        <RouterLink to="/resources" class="nav-link">学习资源</RouterLink>
        <RouterLink to="/profile" class="nav-link">个人中心</RouterLink>
        <!-- <RouterLink to="/data-analysis" class="nav-link">论坛分析</RouterLink> -->
      </div>
      <div class="navbar-actions">
        <template v-if="!isLoggedIn">
          <RouterLink to="/login" class="nav-link">登录</RouterLink>
          <RouterLink to="/register" class="nav-link">注册</RouterLink>
        </template>
        <template v-else>
          <RouterLink 
            v-if="isAdmin" 
            to="/admin" 
            class="nav-link"
          >
            管理员
          </RouterLink>
          <button @click="logoutbutton" class="nav-link">退出</button>
        </template>
      </div>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-image: url('@/img/navbar.png'); 
  background-size: cover; /* 使背景图覆盖整个容器 */
  background-position: center; /* 将背景图居中 */
  background-repeat: no-repeat; /* 防止背景图重复 */
  color: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 阴影效果 */
}
button{
  background-color: transparent;
  border: none;
}
.navbar-brand {
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.navbar-links {
  display: flex;
  gap: 20px; /* 链接之间的间距 */
}

.navbar-actions {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: black;
  text-decoration: none;
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.619); /* 悬停效果 */
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.619); /* 当前激活链接效果 */
  font-weight: bold;
}
</style>
