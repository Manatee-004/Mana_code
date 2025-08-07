<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// 定义数据
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

// 注册逻辑
const registerbutton = async () => {
  // 检查两次输入的密码是否一致
  if (password.value !== confirmPassword.value) {
    alert('两次输入的密码不一致！');
    return;
  }
  // 检查用户名和密码是否为空
  if (!username.value || !password.value) {
    alert('用户名和密码不能为空！');
    return;
  }
  // 发送注册请求到后端
  const response = await axios.post('http://localhost:5000/api/register', {
    username: username.value,
    password: password.value,
  });
  // 注册成功
  if (response.data.success) {
    alert('注册成功！');
    router.push('/login'); // 跳转到登录页面
  } 
};

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="background">
    <div class="container">
      <h2>注册</h2>
      <form id="auth-form" @submit.prevent="register">
        <div class="form-group">
          <label for="username">用户名:</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">密码:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认密码:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
          />
        </div>
        <button type="submit" @click="registerbutton">注册</button>
        <button type="button" @click="goToLogin">登录</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.background {
  background-image: url('@/img/LoginBackground.png'); /* 使用 @/assets 引用静态资源 */
  background-size: cover; /* 使背景图覆盖整个容器 */
  background-position: center; /* 将背景图居中 */
  background-repeat: no-repeat; /* 防止背景图重复 */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}

.container {
  background-color: rgba(255, 255, 255, 0.293); /* 半透明背景 */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 300px;
  text-align: center;
}

h2 {
  color: black;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 5px;
  color: black;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  margin-top: 10px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.293); /* 半透明背景 */
  color: blue;
  font-size: 16px;
  margin-right: 10px;
}

button:hover {
  background-color: #1eb300;
}
</style>