<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCounterStore } from '@/stores/counter';

const usepinia = useCounterStore();
const route = useRoute();
const username = ref(usepinia.getUsername());

// 用户信息
const user = ref({
  name: '',
  password: '',
  profile: '',
  email: '',
  createdate: '',
  updatedate: '',
});

// 编辑模式
const isEditing = ref(false);

// 保存原始用户信息
const originalUserInfo = ref({});

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/profile', {
      params: { username: username.value }, // 传递 username 查询参数
    });
    if (response.data.success) {
      user.value = response.data.user;
      // 保存原始信息
      originalUserInfo.value = { ...response.data.user };
    } else {
      alert('获取用户信息失败！');
    }
  } catch (error) {
    console.error('获取用户信息失败:', error); // 打印详细的错误信息
    alert('获取用户信息失败，请稍后重试！');
  }
};

// 保存和修改个人信息
const saveProfile = async () => {
  try {
    const response = await axios.put('http://localhost:5000/api/updateprofile', {
      username: username.value, // 当前用户名
      newUsername: user.value.name, // 新用户名
      email: user.value.email, // 新邮箱
      profile: user.value.profile, // 新简介
    });
    if (response.data.success) {
      alert('用户信息更新成功！');
      usepinia.setUsername(user.value.name); // 更新 Pinia 中的用户名
      isEditing.value = false; // 退出编辑模式
    } else {
      alert('用户信息更新失败！');
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      alert('用户名已存在，请选择其他用户名！');
    } else {
      console.error('更新用户信息失败:', error);
      alert('更新用户信息失败，请稍后重试！');
    }
  }
};

// 取消编辑，恢复原始信息
const cancelEdit = () => {
  user.value = { ...originalUserInfo.value }; // 恢复原始信息
  isEditing.value = false; // 退出编辑模式
};

// 用户参与的学习计划
const userPlans = ref([]);

// 获取用户参与的学习计划
const fetchUserPlans = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/user-plans', {
      params: { username: username.value }, // 传递用户名
    });
    if (response.data.success) {
      userPlans.value = response.data.plans; // 更新学习计划列表
    } else {
      alert('获取学习计划失败！');
    }
  } catch (error) {
    console.error('获取学习计划失败:', error);
    alert('获取学习计划失败，请稍后重试！');
  }
};

// 模拟用户发布的讨论主题
const userTopics = ref([ ]);

// 获取用户发布的讨论主题
const fetchUserTopics = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/user-topics', {
      params: { username: username.value }, // 传递用户名
    });
    if (response.data.success) {
      userTopics.value = response.data.topics; // 更新讨论主题列表
    } else {
      alert('获取讨论主题失败！');
    }
  } catch (error) {
    console.error('获取讨论主题失败:', error);
    alert('获取讨论主题失败，请稍后重试！');
  }
};

onMounted(() => {
  fetchUserInfo();
  fetchUserPlans(); // 获取用户参与的学习计划
  fetchUserTopics(); // 获取用户发布的讨论主题
});



</script>

<template>
  <div class="profile-page">
    <!-- 用户信息 -->
    <section class="user-info">
      <h1>个人中心</h1>
      <div v-if="!isEditing" class="info-display">
        <p><strong>姓名:</strong> {{ user.name }}</p>
        <p><strong>邮箱:</strong> {{ user.email }}</p>
        <p><strong>简介:</strong> {{ user.profile }}</p>
        <p><strong>加入日期:</strong> {{ user.createdate }}</p>
        <button @click="isEditing = true">编辑个人信息</button>
      </div>
      <div v-else class="info-edit">
        <label for="name">姓名:</label>
        <input type="text" id="name" v-model="user.name" />
        <label for="email">邮箱:</label>
        <input type="email" id="email" v-model="user.email" />
        <label for="bio">简介:</label>
        <textarea id="bio" v-model="user.profile"></textarea>
        <button @click="saveProfile">保存</button>
        <button @click="cancelEdit">取消</button>
      </div>
    </section>

    <!-- 学习计划 -->
    <section class="user-plans">
      <h2>我的学习计划</h2>
      <ul v-if="userPlans.length > 0">
        <li v-for="plan in userPlans" :key="plan.id" class="plan-item">
          <h3>{{ plan.title }}</h3>
          <p>{{ plan.description }}</p>
          <p><strong>创建时间:</strong> {{ plan.date }}</p>
        </li>
      </ul>
      <p v-else class="no-plans">暂无学习计划。</p>
    </section>

    <!-- 讨论主题 -->
    <section class="user-topics">
      <h2>我的讨论主题</h2>
      <ul v-if="userTopics.length > 0">
        <li v-for="topic in userTopics" :key="topic.id" class="topic-item">
          <h3>{{ topic.title }}</h3>
          <p class="date">{{ topic.date }}</p>
        </li>
      </ul>
      <p v-else class="no-topics">暂无讨论主题。</p>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.user-info {
  margin-bottom: 40px;
}

.user-info h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.info-display p {
  font-size: 16px;
  margin-bottom: 10px;
}

.info-display button {
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.info-display button:hover {
  background-color: #0056b3;
}

.info-edit label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.info-edit input,
.info-edit textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.info-edit textarea {
  resize: vertical;
}

.info-edit button {
  padding: 10px 20px;
  margin-right: 10px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.info-edit button:hover {
  background-color: #0056b3;
}

.user-plans,
.user-topics {
  margin-bottom: 40px;
}

.user-plans h2,
.user-topics h2 {
  font-size: 20px;
  margin-bottom: 20px;
}

.plan-item,
.topic-item {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.plan-item h3,
.topic-item h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar .progress {
  height: 100%;
  background-color: #007BFF;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.topic-item .date {
  font-size: 14px;
  color: #666;
}
</style>