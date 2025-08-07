<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCounterStore } from '@/stores/counter'
const router = useRouter();
const username = ref('');
const password = ref('');
const usepinia = useCounterStore();

// 登录
const loginbutton = async () => {
  if (!username.value || !password.value) {
    alert('用户名和密码不能为空！');
    return;
  }
  // 调用 Pinia Store 的登录方法
  const success = await usepinia.login(username.value, password.value);
  if (success) {
    alert('登录成功！');
    usepinia.setUsername(username.value)
    router.push('/home'); // 跳转到首页
  } else {
    alert('用户名或密码错误！');
  }
};

// 注册
const registerbutton = () => {
  router.push('/register'); // 跳转到注册页面
};
</script>

<template>
    <div class="background">
        <div class="container">
        <h2>登录</h2>
        <form id="auth-form">
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
        <button type="button" @click="loginbutton">登录</button>
        <button type="button" @click="registerbutton">注册</button>
        </form>
        </div>
    </div>
</template>

<style scoped>
.background {
  background-image: url('@/img/LoginBackground.png'); 
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
label{
    color: black;   
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
}
 
input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}
 
button {
    background-color: rgba(255, 255, 255, 0.293); /* 半透明背景 */
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
    border: none;
    border-radius: 5px;
    color: blue;
    font-size: 16px;
    margin-right: 10px;
}
 
button:hover {
    background-color: #1eb300;
}
</style>
