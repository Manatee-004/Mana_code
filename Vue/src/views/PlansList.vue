<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useCounterStore } from '@/stores/counter';

const router = useRouter();
const plans = ref([]);
const loading = ref(true);
const error = ref(null);
const store = useCounterStore();
const currentUser = ref(store.getUsername()); // 获取当前登录用户

const fetchPlans = async () => {
  try {
    // 修改API调用，只获取当前用户的学习计划
    const response = await axios.get('http://localhost:5000/api/user-plans', {
      params: { username: currentUser.value }
    });
    
    if (response.data.success) {
      plans.value = response.data.plans;
    } else {
      throw new Error('获取用户计划失败');
    }
  } catch (err) {
    console.error('获取计划列表失败:', err);
    error.value = '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const viewPlanDetail = (id) => {
  router.push(`/plan/${id}`);
};

onMounted(() => {
  fetchPlans();
});
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>学习计划列表</h1>
      <router-link to="/plans/new" class="new-plan-btn">
        新建计划
      </router-link>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载计划...</p>
    </div>

    <div v-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchPlans" class="retry-btn">重试</button>
    </div>

    <div v-if="!loading && plans.length === 0 && !error" class="empty-state">
      <i class="fas fa-book-open"></i>
      <p>暂无学习计划</p>
      <router-link to="/plan/new" class="create-btn">创建第一个计划</router-link>
    </div>

    <div class="plan-grid" v-if="!loading && plans.length > 0">
      <div 
        v-for="plan in plans" 
        :key="plan.id" 
        class="plan-card"
        @click="viewPlanDetail(plan.id)"
      >
        <div class="card-header">
          <h3>{{ plan.title }}</h3>
          <span class="badge" v-if="plan.date">NEW</span>
        </div>
        <p class="creator"><i class="fas fa-user"></i> {{ plan.creator }}</p>
        <p class="date"><i class="fas fa-calendar-alt"></i> {{ plan.date }}</p>
        <div class="card-footer">
          <span class="view-detail">查看详情 <i class="fas fa-arrow-right"></i></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.new-plan-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.new-plan-btn:hover {
  background-color: #3e8e41;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  color: #e74c3c;
}

.error-state i {
  font-size: 3rem;
}

.retry-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background-color: #2980b9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  color: #7f8c8d;
}

.empty-state i {
  font-size: 3rem;
}

.create-btn {
  background-color: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background-color: #2980b9;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e0e0e0;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: #4CAF50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
  flex: 1;
}

.badge {
  background-color: #e74c3c;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: bold;
}

.creator, .date {
  margin: 0.5rem 0;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.view-detail {
  color: #4CAF50;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.plan-card:hover .view-detail {
  color: #3e8e41;
}
</style>