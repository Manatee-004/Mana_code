  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from 'axios';
  import { useCounterStore } from '@/stores/counter';
  import TypeSelector from '../views/TypeSelector.vue'

  const store = useCounterStore();
  const route = useRoute();
  const router = useRouter();
  const topics = ref([]);
  const selectedTopic = ref(null);
  const currentPage = ref(1);
  const itemsPerPage = 5;
  const newComment = ref('');
  const newTopic = ref({
    title: '',
    description: '',
    type_id: null
  });
  const showNewTopicForm = ref(false);
  // const selectedType = ref(null);
  // const selectedType = ref(route.params.typeId || null); 
  const selectedType = ref(Number(route.params.typeId) || null); 

  const fetchTopicsByType = async (typeId = null) => { // 修改参数默认值
    console.log('获取主题列表，typeId:', typeId); // 添加日志
    const params = typeId !== null ? { type_id: typeId } : {};
    try {
      const response = await axios.get('http://localhost:5000/api/discuss-by-type', {params});
      topics.value = response.data;
    } catch (err) {
      console.error('获取主题失败:', err);
    }
  };


  const handleTypeSelected = (typeId) => {
  if (selectedTopic.value) {
    selectedTopic.value = null; // 切换类型时，清空当前详情
    router.push({ name: 'discuss-list', query: { type: typeId } }); // 返回列表页
  }
  fetchTopicsByType(typeId);
  };



  // 监听路由变化
  watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchTopicDetails(newId); // 当路由参数id变化时，获取主题详情
    } else {
      selectedTopic.value = null; // 无id时，清空详情
    }
  },
  { immediate: true } // 初始化时触发
  );
  watch(
  () => route.fullPath,
  (newPath) => {
    console.log('路由变化:', newPath);
  }
  );

  // 获取所有讨论主题
  const fetchTopics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/discuss');
      topics.value = response.data;
      
      if (route.params.id) {
        fetchTopicDetails(route.params.id);
      }
    } catch (err) {
      console.error('获取主题失败:', err);
    }
  };

  // 获取单个主题详情
  const fetchTopicDetails = async (id) => {
    console.log('正在获取主题详情，ID:', id); // 添加日志
    try {
      const response = await axios.get(`http://localhost:5000/api/discuss/${id}`);
      // console.log('获取主题详情成功:', response.data); // 添加日志
      // selectedTopic.value = response.data;
      selectedTopic.value = {
      ...response.data,
      comments: response.data.comments || []
    };
    } catch (err) {
      console.error('获取主题详情失败:', err);
    }
  };

  // 分页后的主题列表
  const paginatedTopics = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return topics.value.slice(start, end);
  });

  // 切换分页
  const changePage = (page) => {
    currentPage.value = page;
  };

  // 添加新评论
  const addComment = async () => {
    if (!newComment.value.trim()) return;
    
    try {
      const currentUser = store.getUsername();
      const response = await axios.post(
        `http://localhost:5000/api/discuss/${selectedTopic.value.id}/comment`,
        {
          user: currentUser,
          comment: newComment.value.trim()
        }
      );
      
      selectedTopic.value.comments.unshift(response.data);
      newComment.value = '';
    } catch (err) {
      console.error('添加评论失败:', err);
    }
  };

  // 创建新主题
  const createTopic = async () => {
  try {
    const currentUser = store.getUsername();
    if (!newTopic.value.title || !selectedType.value) {
      throw new Error('标题和类型不能为空');
    }
    
    const response = await axios.post('http://localhost:5000/api/discuss', {
      title: newTopic.value.title,
      description: newTopic.value.description,
      creator: currentUser,
      type_id: selectedType.value
    });
    
    if (response.data.success) {
      showNewTopicForm.value = false;
      newTopic.value = { title: '', description: '' };
      fetchTopicsByType(selectedType.value);
      router.push({
        path: `/discuss/${response.data.id}`,
        query: { type: selectedType.value }
      });
    }
  } catch (err) {
    console.error('创建主题失败:', err);
  }
};

  // 选择主题
  const selectTopic = (topicId) => {
  // 保留当前查询参数（如type），并跳转到详情页
  router.push({
    name: 'discuss-detail',
    params: { id: topicId },
    query: route.query // 携带type参数到详情页
  });
  };

  const goBackToList = () => {
  selectedTopic.value = null;
  router.push({ 
    name: 'discuss-list',
    query: route.query // 保持当前查询参数
  });
};
  // 初始化加载
  onMounted(() => {
    if (route.params.id) {
    // 进入详情页时，直接获取主题详情
    fetchTopicDetails(route.params.id);
  } else {
    // 列表页时，根据类型获取主题列表
    const initialTypeId = route.query.type || null; // 从查询参数获取type
    fetchTopicsByType(initialTypeId);
  }
  });
  </script>

  <template>
    <div class="discuss-page">
      <!-- 讨论主题列表 -->
      <section class="topic-list">
        <div class="header">
          <h1>讨论区</h1>
          <button v-if="!selectedTopic" @click="showNewTopicForm = true" class="new-topic-btn">新建主题</button> 
          <TypeSelector 
            v-model="selectedType" 
            @update:modelValue="handleTypeSelected"
          />
        </div>
        
        <!-- 新建主题表单 -->
        <div v-if="showNewTopicForm" class="new-topic-form">
          <h2>创建新主题</h2>
          <div class="form-group">
            <input v-model="newTopic.title" placeholder="标题" class="form-input" />
          </div>
          <div class="form-group">
            <textarea v-model="newTopic.description" placeholder="内容" class="form-textarea"></textarea>
          </div>
          <div class="form-actions">
            <button @click="createTopic" class="submit-btn">提交</button>
            <button @click="showNewTopicForm = false" class="cancel-btn">取消</button>
          </div>
        </div>

        <ul v-else>
          <li
            v-for="topic in paginatedTopics"
            :key="topic.id"
            class="topic-item"
            @click="selectTopic(topic.id)"
          >
            <h2>{{ topic.title }}</h2>
            <p class="meta">作者: {{ topic.creator }} | 日期: {{ topic.date }}</p>
            <p class="content">{{ topic.description }}</p>
          </li>
        </ul>

        <!-- 分页 -->
        <div class="pagination">
          <button
            v-for="page in Math.ceil(topics.length / itemsPerPage)"
            :key="page"
            @click="changePage(page)"
            :class="{ active: currentPage === page }"
          >
            {{ page }}
          </button>
        </div>
      </section>

      <!-- 主题详情 -->
      <section v-if="selectedTopic" class="topic-details">
        <div class="topic-header">
          <h2>{{ selectedTopic.title }}</h2>
          <p class="meta">作者: {{ selectedTopic.creator }} | 日期: {{ selectedTopic.date }}</p>
          <p class="content">{{ selectedTopic.description }}</p>
          <button @click="goBackToList">返回</button> 
        </div>

        <!-- 评论区域 -->
        <div class="comments">
          <h3>评论 ({{ selectedTopic.comments.length }})</h3>
          <ul>
            <li v-for="comment in selectedTopic.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="user">{{ comment.user }}</span>
                <span class="date">{{ comment.date }}</span>
              </div>
              <p class="content">{{ comment.comment }}</p>
            </li>
          </ul>

          <!-- 添加评论 -->
          <div class="add-comment">
            <textarea v-model="newComment" placeholder="写下你的评论..."></textarea>
            <button @click="addComment">提交评论</button>
          </div>
        </div>
      </section>
    </div>
  </template>

  <style scoped>
  .discuss-page {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    gap: 30px; 
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .new-topic-btn {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .new-topic-form {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .form-textarea {
    width: 100%;
    min-height: 100px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
  }

  .form-actions {
    display: flex;
    gap: 10px;
  }

  .submit-btn {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-btn {
    padding: 10px 20px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .topic-list {
    flex: 1;
  }

  .topic-item {
    background-color: #f9f9f9;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  .topic-item h2 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .topic-item .meta {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }

  .topic-item .content {
    font-size: 14px;
    color: #333;
    display: -webkit-box;
    line-clamp: 3;
    overflow: hidden;
  }

  .pagination {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .pagination button {
    padding: 5px 10px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .pagination button.active {
    background-color: #0056b3;
  }

  .topic-details {
    flex: 2;
  }

  .topic-header {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .topic-header h2 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  .topic-header .meta {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }

  .topic-header .content {
    font-size: 16px;
    color: #333;
    margin-bottom: 20px;
  }

  .comments {
    margin-top: 20px;
  }

  .comments h3 {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .comment-item {
    background-color: #f0f0f0;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .comment-header .user {
    font-weight: bold;
    color: #007BFF;
  }

  .comment-header .date {
    font-size: 12px;
    color: #666;
  }

  .comment-item .content {
    font-size: 14px;
    color: #333;
  }

  .add-comment {
    margin-top: 20px;
  }

  .add-comment textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    resize: vertical;
    margin-bottom: 10px;
    min-height: 100px;
  }

  .add-comment button {
    padding: 10px 20px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

  .add-comment button:hover {
    background-color: #0056b3;
  }
  </style>