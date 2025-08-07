import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios';

export const useCounterStore = defineStore('counter', () => {
  const isLoggedIn = ref(localStorage.getItem('isLoggedIn') === 'true')
  const usernameprofile = ref(localStorage.getItem('username') || '') // 添加本地存储

  // 添加计算属性判断是否是管理员
  const isAdmin = computed(() => usernameprofile.value === 'Bob')

  const setUsername = (name) => {
    usernameprofile.value = name
    localStorage.setItem('username', name) // 保存到本地存储
  }

  const getUsername = () => usernameprofile.value

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password })
      if (response.data.success) {
        isLoggedIn.value = true
        setUsername(username) // 使用setter方法
        localStorage.setItem('isLoggedIn', 'true')
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    isLoggedIn.value = false
    usernameprofile.value = ''
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
  }

  return { 
    isLoggedIn,
    usernameprofile,
    isAdmin, // 暴露计算属性
    login,
    logout,
    setUsername,
    getUsername
  }
})