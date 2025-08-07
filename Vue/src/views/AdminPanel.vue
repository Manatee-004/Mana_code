<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useCounterStore } from '@/stores/counter';

const router = useRouter();
const store = useCounterStore();
const currentUser = store.getUsername();

const types = ref([]);
const newType = ref({
  name: '',
  description: ''
});

const fetchTypes = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/types');
    if (response.data.success) {
      types.value = response.data.types;
    }
  } catch (err) {
    console.error('获取类型失败:', err);
  }
};

const addType = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/types', newType.value);
    if (response.data.success) {
      alert('类型添加成功');
      newType.value = { name: '', description: '' };
      await fetchTypes();
    }
  } catch (err) {
    console.error('添加类型失败:', err);
    alert('添加类型失败');
  }
};

const deleteType = async (id) => {
  if (!confirm('确定要删除这个类型吗？')) return;
  
  try {
    const response = await axios.delete(`http://localhost:5000/api/types/${id}`);
    if (response.data.success) {
      alert('类型删除成功');
      await fetchTypes();
    }
  } catch (err) {
    console.error('删除类型失败:', err);
    alert('删除类型失败');
  }
};


// 检查是否是管理员
onMounted(() => {
  if (currentUser !== 'Bob') {
    router.push('/home');
  }
  fetchUsers(); // 加载时自动获取用户数据
  fetchTypes();
});

const activeTab = ref('users');
const users = ref([]);
const searchQuery = ref('');
const loading = ref(false);
const error = ref(null);

// 获取所有用户
const fetchUsers = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await axios.get('http://localhost:5000/api/admin/users');
    
    // 确保数据格式正确
    if (response.data.success && Array.isArray(response.data.users)) {
      users.value = response.data.users;
      console.log('用户数据已加载:', users.value); // 调试日志
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (err) {
    error.value = '获取用户列表失败: ' + err.message;
    console.error('获取用户列表失败:', err);
  } finally {
    loading.value = false;
  }
};

// 封禁/解封用户
const toggleBanUser = async (username, isBanned) => {
  if (!confirm(`确定要${isBanned ? '解封' : '封禁'}用户 ${username} 吗？`)) {
    return;
  }

  try {
    const response = await axios.put(
      `http://localhost:5000/api/admin/users/${username}/ban`,
      { action: isBanned ? 'unban' : 'ban' }
    );
    
    if (response.data.success) {
      alert(response.data.message);
      await fetchUsers(); // 操作成功后刷新数据
    }
  } catch (err) {
    alert('操作失败: ' + (err.response?.data?.message || err.message));
    console.error('操作失败:', err);
  }
};

// 过滤用户 - 使用计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  return users.value.filter(user => 
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 学习计划相关状态
const plans = ref([]);
const planSearchQuery = ref('');
const planPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
});
const planLoading = ref(false);

// 获取学习计划
const fetchPlans = async () => {
  try {
    planLoading.value = true;
    const response = await axios.get('http://localhost:5000/api/admin/plans', {
      params: {
        page: planPagination.value.page,
        pageSize: planPagination.value.pageSize,
        search: planSearchQuery.value
      }
    });
    
    if (response.data.success) {
      plans.value = response.data.plans;
      planPagination.value = {
        ...planPagination.value,
        ...response.data.pagination
      };
    }
  } catch (err) {
    console.error('获取学习计划失败:', err);
  } finally {
    planLoading.value = false;
  }
};

// 删除学习计划
const deletePlan = async (planId) => {
  if (!confirm('确定要删除这个学习计划吗？所有相关评论也将被删除！')) return;
  
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/plans/${planId}`);
    
    if (response.data.success) {
      alert(response.data.message || '删除成功');
      await fetchPlans(); // 刷新列表
    } else {
      alert(response.data.message || '删除失败');
    }
  } catch (err) {
    console.error('删除失败详情:', {
      message: err.message,
      response: err.response?.data
    });
    
    // 尝试从HTML错误响应中提取信息
    let errorMsg = '删除失败';
    if (err.response && typeof err.response.data === 'string') {
      const match = err.response.data.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        errorMsg = match[1].replace(/<br>/g, '\n');
      }
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    }
    
    alert(errorMsg);
  }
};

// 评论管理相关状态
const comments = ref([]);
const selectedPlan = ref(null);
const selectedCommentIds = ref([]);
const commentPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
});
const commentLoading = ref(false);
const showCommentModal = ref(false);
const planOptions = ref([]);

const openCommentModal = async () => {
  showCommentModal.value = true;
  await fetchPlanOptions(); // 加载学习计划选项
};

const fetchPlanOptions = async () => {
  try {
    console.log('正在获取学习计划选项...');
    const response = await axios.get('http://localhost:5000/api/admin/plans', {
      params: { pageSize: 100 }
    });
    console.log('计划选项响应:', response.data);
    
    if (response.data.success) {
      planOptions.value = response.data.plans;
      console.log('获取到的计划选项:', planOptions.value);
    } else {
      throw new Error(response.data.message || '获取计划选项失败');
    }
  } catch (err) {
    console.error('获取学习计划选项失败:', err);
    alert('获取学习计划选项失败: ' + err.message);
  }
};

// 获取评论
const fetchComments = async () => {
  if (!selectedPlan.value) return;
  
  try {
    commentLoading.value = true;
    selectedCommentIds.value = []; // 清空选择
    
    const response = await axios.get(
      `http://localhost:5000/api/admin/plans/${selectedPlan.value}/comments`,
      {
        params: {
          page: commentPagination.value.page,
          pageSize: commentPagination.value.pageSize
        }
      }
    );
    
    if (response.data.success) {
      comments.value = response.data.comments;
      commentPagination.value = {
        ...commentPagination.value,
        ...response.data.pagination
      };
    }
  } catch (err) {
    console.error('获取评论失败:', err);
  } finally {
    commentLoading.value = false;
  }
};

// 切换评论分页
const changeCommentPage = (page) => {
  commentPagination.value.page = page;
  fetchComments();
};

// 选择/取消选择评论
const toggleCommentSelection = (commentId) => {
  const index = selectedCommentIds.value.indexOf(commentId);
  if (index === -1) {
    selectedCommentIds.value.push(commentId);
  } else {
    selectedCommentIds.value.splice(index, 1);
  }
};

// 批量删除评论
const deleteCommentsBatch = async () => {
  if (selectedCommentIds.value.length === 0) {
    alert('请先选择要删除的评论');
    return;
  }
  
  if (!confirm(`确定要删除选中的 ${selectedCommentIds.value.length} 条评论吗？`)) {
    return;
  }
  
  try {
    const response = await axios.delete('http://localhost:5000/api/admin/comments/batch', {
      data: { commentIds: selectedCommentIds.value }
    });
    
    if (response.data.success) {
      alert(`成功删除 ${response.data.deletedCount} 条评论`);
      await fetchComments(); // 刷新列表
    }
  } catch (err) {
    alert('删除失败');
    console.error('批量删除评论失败:', err);
  }
};

// 删除单个评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return;
  
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/comments/${commentId}`);
    if (response.data.success) {
      alert('评论已删除');
      await fetchComments(); // 刷新列表
    }
  } catch (err) {
    alert('删除失败');
    console.error('删除评论失败:', err);
  }
};

// 切换分页
const changePlanPage = (page) => {
  planPagination.value.page = page;
  fetchPlans();
};

// 搜索学习计划
const searchPlans = () => {
  planPagination.value.page = 1; // 重置为第一页
  fetchPlans();
};


// 讨论主题管理相关状态
const topics = ref([]);
const topicSearchQuery = ref('');
const topicPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
});
const topicLoading = ref(false);

// 讨论主题评论管理相关状态
const topicComments = ref([]);
const selectedTopic = ref(null);
const selectedTopicCommentIds = ref([]);
const topicCommentPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
});
const topicCommentLoading = ref(false);
const showTopicCommentModal = ref(false);

// 获取讨论主题
const fetchTopics = async () => {
  try {
    topicLoading.value = true;
    const response = await axios.get('http://localhost:5000/api/admin/topics', {
      params: {
        page: topicPagination.value.page,
        pageSize: topicPagination.value.pageSize,
        search: topicSearchQuery.value
      }
    });
    
    if (response.data.success) {
      topics.value = response.data.topics;
      topicPagination.value = {
        ...topicPagination.value,
        ...response.data.pagination
      };
    }
  } catch (err) {
    console.error('获取讨论主题失败:', err);
  } finally {
    topicLoading.value = false;
  }
};

// 删除讨论主题
const deleteTopic = async (topicId) => {
  if (!confirm('确定要删除这个讨论主题吗？所有相关评论也将被删除！')) return;
  
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/topics/${topicId}`);
    
    if (response.data.success) {
      alert(response.data.message || '删除成功');
      await fetchTopics(); // 刷新列表
    } else {
      alert(response.data.message || '删除失败');
    }
  } catch (err) {
    console.error('删除失败详情:', {
      message: err.message,
      response: err.response?.data
    });
    
    let errorMsg = '删除失败';
    if (err.response && typeof err.response.data === 'string') {
      const match = err.response.data.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        errorMsg = match[1].replace(/<br>/g, '\n');
      }
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    }
    
    alert(errorMsg);
  }
};

// 打开讨论主题评论管理模态框
const openTopicCommentModal = async () => {
  showTopicCommentModal.value = true;
  await fetchTopics(); // 加载讨论主题选项
};

// 获取讨论主题评论
const fetchTopicComments = async () => {
  if (!selectedTopic.value) return;
  
  try {
    topicCommentLoading.value = true;
    selectedTopicCommentIds.value = []; // 清空选择
    
    const response = await axios.get(
      `http://localhost:5000/api/admin/topics/${selectedTopic.value}/comments`,
      {
        params: {
          page: topicCommentPagination.value.page,
          pageSize: topicCommentPagination.value.pageSize
        }
      }
    );
    
    if (response.data.success) {
      topicComments.value = response.data.comments;
      topicCommentPagination.value = {
        ...topicCommentPagination.value,
        ...response.data.pagination
      };
    }
  } catch (err) {
    console.error('获取评论失败:', err);
  } finally {
    topicCommentLoading.value = false;
  }
};

// 切换讨论主题评论分页
const changeTopicCommentPage = (page) => {
  topicCommentPagination.value.page = page;
  fetchTopicComments();
};

// 选择/取消选择讨论主题评论
const toggleTopicCommentSelection = (commentId) => {
  const index = selectedTopicCommentIds.value.indexOf(commentId);
  if (index === -1) {
    selectedTopicCommentIds.value.push(commentId);
  } else {
    selectedTopicCommentIds.value.splice(index, 1);
  }
};

// 批量删除讨论主题评论
const deleteTopicCommentsBatch = async () => {
  if (selectedTopicCommentIds.value.length === 0) {
    alert('请先选择要删除的评论');
    return;
  }
  
  if (!confirm(`确定要删除选中的 ${selectedTopicCommentIds.value.length} 条评论吗？`)) {
    return;
  }
  
  try {
    const response = await axios.delete('http://localhost:5000/api/admin/topic-comments/batch', {
      data: { commentIds: selectedTopicCommentIds.value }
    });
    
    if (response.data.success) {
      alert(`成功删除 ${response.data.deletedCount} 条评论`);
      await fetchTopicComments(); // 刷新列表
    }
  } catch (err) {
    alert('删除失败');
    console.error('批量删除评论失败:', err);
  }
};

// 删除单个讨论主题评论
const deleteTopicComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return;
  
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/topic-comments/${commentId}`);
    if (response.data.success) {
      alert('评论已删除');
      await fetchTopicComments(); // 刷新列表
    }
  } catch (err) {
    alert('删除失败');
    console.error('删除评论失败:', err);
  }
};

// 切换讨论主题分页
const changeTopicPage = (page) => {
  topicPagination.value.page = page;
  fetchTopics();
};

// 搜索讨论主题
const searchTopics = () => {
  topicPagination.value.page = 1; // 重置为第一页
  fetchTopics();
};

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'plans') {
    fetchPlans();
  } else if (newTab === 'users') {
    fetchUsers();
  }else if (newTab === 'topics') {
    fetchTopics();
  }else if (newTab === 'types') {  
    fetchTypes();
  }
});
</script>

<template>
  <div class="admin-panel">
    <h1>管理员面板</h1>
    
    <div class="tabs">
      <button 
        @click="activeTab = 'users'" 
        :class="{ active: activeTab === 'users' }"
      >
        用户管理
      </button>
      <button 
        @click="activeTab = 'plans'" 
        :class="{ active: activeTab === 'plans' }"
      >
        学习计划管理
      </button>
      <button 
        @click="activeTab = 'topics'" 
        :class="{ active: activeTab === 'topics' }"
      >
        讨论主题管理
      </button>
      <button @click="activeTab = 'types'" :class="{ active: activeTab === 'types' }">
        类型管理
      </button>
    </div>

    <!-- 类型管理内容 -->
  <div v-if="activeTab === 'types'" class="tab-content">
    <h2>类型管理</h2>
    
    <div class="add-type-form">
      <h3>添加新类型</h3>
      <div class="form-group">
        <label>名称:</label>
        <input v-model="newType.name" class="form-input" />
      </div>
      <div class="form-group">
        <label>描述:</label>
        <textarea v-model="newType.description" class="form-textarea"></textarea>
      </div>
      <button @click="addType" class="add-btn">添加类型</button>
    </div>
    
    <div class="types-list">
      <h3>现有类型</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="type in types" :key="type.id">
            <td>{{ type.id }}</td>
            <td>{{ type.name }}</td>
            <td>{{ type.description }}</td>
            <td>
              <button @click="deleteType(type.id)" class="delete-btn">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

    <!-- 用户管理 -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          placeholder="搜索用户名..." 
          class="search-input"
          @input="searchQuery = $event.target.value"
        />
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="users.length === 0" class="empty">没有用户数据</div>
      <div v-else class="user-list">
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>注册日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.email || '未设置' }}</td>
              <td>{{ user.createdate }}</td>
              <td>{{ user.is_banned ? '已封禁' : '正常' }}</td>
              <td>
                <button 
                  @click="toggleBanUser(user.username, user.is_banned)"
                  :class="{ 'ban-btn': !user.is_banned, 'unban-btn': user.is_banned }"
                >
                  {{ user.is_banned ? '解封' : '封禁' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 评论管理模态框 -->
  <div v-if="showCommentModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>评论管理</h3>
        <button @click="showCommentModal = false" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>选择学习计划:</label>
          <select v-model="selectedPlan" @change="fetchComments" class="form-select">
            <option value="">-- 请选择 --</option>
            <option 
                v-for="plan in planOptions" 
                :key="plan.id" 
                :value="plan.id"
            >
                {{ plan.title }} ({{ plan.creator }})
            </option>
            </select>
        </div>
        
        <div v-if="selectedPlan">
          <div class="comment-actions">
            <button 
              @click="deleteCommentsBatch" 
              :disabled="selectedCommentIds.length === 0"
              class="batch-delete-btn"
            >
              批量删除 ({{ selectedCommentIds.length }})
            </button>
          </div>
          
          <div v-if="commentLoading" class="loading">加载中...</div>
          <div v-else-if="comments.length === 0" class="empty">没有评论数据</div>
          <div v-else class="comment-list">
            <table class="comment-table">
              <thead>
                <tr>
                  <th width="50px">
                    <input 
                      type="checkbox" 
                      :checked="selectedCommentIds.length === comments.length"
                      @change="e => {
                        selectedCommentIds = e.target.checked 
                          ? comments.map(c => c.id) 
                          : [];
                      }"
                    />
                  </th>
                  <th>评论内容</th>
                  <th>用户</th>
                  <th>日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comment in comments" :key="comment.id">
                  <td>
                    <input 
                      type="checkbox" 
                      :checked="selectedCommentIds.includes(comment.id)"
                      @change="toggleCommentSelection(comment.id)"
                    />
                  </td>
                  <td>{{ comment.comment }}</td>
                  <td>{{ comment.user }}</td>
                  <td>{{ comment.date }}</td>
                  <td>
                    <button 
                      @click="deleteComment(comment.id)"
                      class="delete-btn"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- 分页 -->
            <div class="pagination">
              <button 
                v-for="page in commentPagination.totalPages" 
                :key="page"
                @click="changeCommentPage(page)"
                :class="{ active: commentPagination.page === page }"
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- 学习计划管理 -->
    <div v-if="activeTab === 'plans'" class="tab-content">
      <h2>学习计划管理</h2>
      
      <div class="search-bar">
        <input
          v-model="planSearchQuery"
          placeholder="搜索学习计划..."
          class="search-input"
          @keyup.enter="searchPlans"
        />
        <button @click="searchPlans" class="search-btn">搜索</button>
      </div>
      
      <div v-if="planLoading" class="loading">加载中...</div>
      <div v-else-if="plans.length === 0" class="empty">没有学习计划数据</div>
      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>创建者</th>
              <th>创建日期</th>
              <th>评论数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in plans" :key="plan.id">
              <td>{{ plan.title }}</td>
              <td>{{ plan.creator }}</td>
              <td>{{ plan.date }}</td>
              <td>{{ plan.comment_count }}</td>
              <td>
                <button 
                  @click="deletePlan(plan.id)"
                  class="delete-btn"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页控件 -->
        <div class="pagination">
          <button 
            v-for="page in planPagination.totalPages" 
            :key="page"
            @click="changePlanPage(page)"
            :class="{ active: planPagination.page === page }"
          >
            {{ page }}
          </button>
        </div>
    
        <!-- 添加管理评论按钮 -->
        <button @click="openCommentModal" class="manage-comments-btn">
          管理评论
        </button>
      </div>
    </div>

    <!-- 讨论主题管理 -->
    <div v-if="activeTab === 'topics'" class="tab-content">
      <h2>讨论主题管理</h2>
      
      <div class="search-bar">
        <input
          v-model="topicSearchQuery"
          placeholder="搜索讨论主题..."
          class="search-input"
          @keyup.enter="searchTopics"
        />
        <button @click="searchTopics" class="search-btn">搜索</button>
      </div>
      
      <div v-if="topicLoading" class="loading">加载中...</div>
      <div v-else-if="topics.length === 0" class="empty">没有讨论主题数据</div>
      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>创建者</th>
              <th>创建日期</th>
              <th>评论数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="topic in topics" :key="topic.id">
              <td>{{ topic.title }}</td>
              <td>{{ topic.creator }}</td>
              <td>{{ topic.date }}</td>
              <td>{{ topic.comment_count }}</td>
              <td>
                <button 
                  @click="deleteTopic(topic.id)"
                  class="delete-btn"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页控件 -->
        <div class="pagination">
          <button 
            v-for="page in topicPagination.totalPages" 
            :key="page"
            @click="changeTopicPage(page)"
            :class="{ active: topicPagination.page === page }"
          >
            {{ page }}
          </button>
        </div>
        <button @click="openTopicCommentModal" class="manage-comments-btn">
          管理评论
        </button>
      </div>
    </div>

<!-- 讨论主题评论管理模态框 -->
<div v-if="showTopicCommentModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>讨论主题评论管理</h3>
      <button @click="showTopicCommentModal = false" class="close-btn">&times;</button>
    </div>
    
    <div class="modal-body">
      <div class="form-group">
        <label>选择讨论主题:</label>
        <select v-model="selectedTopic" @change="fetchTopicComments" class="form-select">
          <option value="">-- 请选择 --</option>
          <option 
              v-for="topic in topics" 
              :key="topic.id" 
              :value="topic.id"
          >
              {{ topic.title }} ({{ topic.creator }})
          </option>
        </select>
      </div>
      
      <div v-if="selectedTopic">
        <div class="comment-actions">
          <button 
            @click="deleteTopicCommentsBatch" 
            :disabled="selectedTopicCommentIds.length === 0"
            class="batch-delete-btn"
          >
            批量删除 ({{ selectedTopicCommentIds.length }})
          </button>
        </div>
        
        <div v-if="topicCommentLoading" class="loading">加载中...</div>
        <div v-else-if="topicComments.length === 0" class="empty">没有评论数据</div>
        <div v-else class="comment-list">
          <table class="comment-table">
            <thead>
              <tr>
                <th width="50px">
                  <input 
                    type="checkbox" 
                    :checked="selectedTopicCommentIds.length === topicComments.length"
                    @change="e => {
                      selectedTopicCommentIds = e.target.checked 
                        ? topicComments.map(c => c.id) 
                        : [];
                    }"
                  />
                </th>
                <th>评论内容</th>
                <th>用户</th>
                <th>日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="comment in topicComments" :key="comment.id">
                <td>
                  <input 
                    type="checkbox" 
                    :checked="selectedTopicCommentIds.includes(comment.id)"
                    @change="toggleTopicCommentSelection(comment.id)"
                  />
                </td>
                <td>{{ comment.comment }}</td>
                <td>{{ comment.user }}</td>
                <td>{{ comment.date }}</td>
                <td>
                  <button 
                    @click="deleteTopicComment(comment.id)"
                    class="delete-btn"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 分页 -->
          <div class="pagination">
            <button 
              v-for="page in topicCommentPagination.totalPages" 
              :key="page"
              @click="changeTopicCommentPage(page)"
              :class="{ active: topicCommentPagination.page === page }"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  </div>
</template>

<style scoped>
.add-type-form {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.types-list table {
  width: 100%;
  border-collapse: collapse;
}

.types-list th, .types-list td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
}

.types-list th {
  background-color: #f0f0f0;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.manage-comments-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.manage-comments-btn:hover {
  background-color: #0b7dda;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  width: 80%;
  max-width: 900px;
  max-height: 80vh;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px;
  background-color: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

/* 评论管理特定样式 */
.form-group {
  margin-bottom: 16px;
}

.form-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.comment-actions {
  margin-bottom: 16px;
}

.batch-delete-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.batch-delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.comment-table {
  width: 100%;
  border-collapse: collapse;
}

.comment-table th, .comment-table td {
  padding: 12px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.comment-table th {
  background-color: #f5f5f5;
}

.manage-comments-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn {
  margin-left: 10px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background-color: #f5f5f5;
}

.delete-btn {
  padding: 6px 12px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination {
  margin-top: 20px;
  display: flex;
  gap: 5px;
}

.pagination button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.pagination button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  margin-right: 10px;
  border-bottom: 3px solid transparent;
}

.tabs button.active {
  border-bottom: 3px solid #4CAF50;
  font-weight: bold;
}

.tabs button:hover {
  background-color: #f5f5f5;
}

.tab-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.user-list table {
  width: 100%;
  border-collapse: collapse;
}

.user-list th, .user-list td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.user-list th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.user-list tr:hover {
  background-color: #f9f9f9;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.ban-btn {
  background-color: #f44336;
  color: white;
}

.ban-btn:hover {
  background-color: #d32f2f;
}

.unban-btn {
  background-color: #4CAF50;
  color: white;
}

.unban-btn:hover {
  background-color: #388e3c;
}

.loading, .error, .empty {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.error {
  color: #f44336;
}

.empty {
  color: #666;
}
</style>