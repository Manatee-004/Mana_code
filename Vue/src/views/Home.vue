<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TypeSelector from '../views/TypeSelector.vue'

const router = useRouter();
const plans = ref([]);
const searchKeyword = ref('');
const plan_navbar = ref('最新学习计划');
const loading = ref(false);
const selectedType = ref(null);

const handleTypeSelected = (typeId) => {
  selectedType.value = typeId;
  // 根据类型ID获取相关计划
  fetchPlansByType(typeId);
};

// 获取默认类型ID（编程类型）
const fetchDefaultTypeId = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/types');
    if (response.data.success) {
      const programmingType = response.data.types.find(type => 
        type.name.toLowerCase().includes('编程')
      );
      return programmingType?.id || response.data.types[0]?.id || null;
    }
    return null;
  } catch (error) {
    console.error('获取默认类型失败:', error);
    return null;
  }
};

// 根据类型ID获取相关计划
const fetchPlansByType = async (typeId) => {
  try {
    loading.value = true;
    const response = await axios.get('http://localhost:5000/api/plans-by-type', {
      params: { type_id: typeId }
    });
    if (response.data.success) {
      plans.value = response.data.plans;
      const typeName = response.data.plans[0]?.type_name || '该类型';
      plan_navbar.value = `${typeName}的最新学习计划`;
    }
  } catch (error) {
    console.error('获取学习计划失败:', error);
  } finally {
    loading.value = false;
  }
};

// const fetchPlansByType = async (typeId) => {
//   try {
//     loading.value = true;
//     const response = await axios.get('http://localhost:5000/api/plans-by-type', {
//       params: { type_id: typeId }
//     });
//     if (response.data.success) {
//       plans.value = response.data.plans;
//     }
//   } catch (error) {
//     console.error('获取学习计划失败:', error);
//   } finally {
//     loading.value = false;
//   }
// };


// 截断描述文字
const truncateDescription = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// 判断是否是新计划（7天内）
const isNewPlan = (dateString) => {
  if (!dateString) return false;
  try {
    const planDate = new Date(dateString);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return planDate > weekAgo;
  } catch {
    return false;
  }
};

// 跳转到计划详情页
const viewPlanDetail = (id) => {  
  // router.push(`/plan/${id}`);
  router.push({ name: 'plan-detail', params: { id } }); // 使用命名路由
};

const fetchLatestPlans = async () => {
  try {
    loading.value = true;
    const response = await axios.get('http://localhost:5000/api/latest-plans');
    if (response.data.success) {
      plans.value = response.data.plans;
    }
  } catch (error) {
    console.error('获取学习计划失败:', error);
  } finally {
    loading.value = false;
  }
};

const searchPlans = async () => {
  try {
    loading.value = true;
    const response = await axios.get('http://localhost:5000/api/search-plans', {
      params: { keyword: searchKeyword.value },
    });
    if (response.data.success) {
      plans.value = response.data.plans;
    }
  } catch (error) {
    console.error('搜索学习计划失败:', error);
  } finally {
    loading.value = false;
  }
};

watch(searchKeyword, (newKeyword) => {
  if (newKeyword.trim() === '') {
    plan_navbar.value = '最新学习计划';
    fetchLatestPlans();
  } else {
    plan_navbar.value = '搜索结果';
    searchPlans();
  }
});

onMounted(async () => {
  const defaultTypeId = await fetchDefaultTypeId();
  if (defaultTypeId) {
    selectedType.value = defaultTypeId;
    await fetchPlansByType(defaultTypeId);
  } else {
    // 如果获取类型失败，加载最新计划作为后备
    fetchLatestPlans();
  }
});
</script>

<template>
  <div class="home-container">
    <!-- 欢迎标语 -->
    <header class="welcome-banner">
      <h1>欢迎来到学习计划论坛</h1>
      <p class="subtitle">在这里，你可以创建、分享和跟踪你的学习计划</p>
    </header>
    <TypeSelector v-model="selectedType" @update:modelValue="handleTypeSelected" />

    <!-- 搜索框 -->
    <div class="search-container">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索学习计划..."
        class="search-input"
      />
      <i class="fas fa-search search-icon"></i>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载...</p>
    </div>

    <!-- 学习计划列表 -->
    <section class="plans-section">
      <h2 class="section-title">{{ plan_navbar }}</h2>
      
      <div v-if="plans.length === 0 && !loading" class="empty-state">
        <i class="fas fa-book-open"></i>
        <p>暂无学习计划</p>
      </div>
      
      <div class="plans-grid">
        <div 
          v-for="plan in plans" 
          :key="plan.id" 
          class="plan-card"
          @click="viewPlanDetail(plan.id)"
        >
          <div class="card-header">
            <h3>{{ plan.title }}</h3>
            <span v-if="isNewPlan(plan.date)" class="new-badge">NEW</span>
          </div>
          <p class="plan-desc">{{ truncateDescription(plan.description) }}</p>
          <div class="card-footer">
            <span class="creator"><i class="fas fa-user"></i> {{ plan.creator }}</span>
            <span class="date"><i class="fas fa-calendar-alt"></i> {{ formatDate(plan.date) }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-banner {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-banner h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto 3rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid #ddd;
  border-radius: 50px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

.plans-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #7f8c8d;
  gap: 1rem;
}

.empty-state i {
  font-size: 3rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

.new-badge {
  background-color: #e74c3c;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: bold;
}

.plan-desc {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  line-clamp: 3;
  box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.card-footer i {
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-banner h1 {
    font-size: 2rem;
  }
}
</style>