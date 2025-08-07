<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCounterStore } from '@/stores/counter';

// 首先定义 props
const props = defineProps({
  isNew: {
    type: Boolean,
    default: false
  }
});
const route = useRoute();
const router = useRouter();
const store = useCounterStore(); // 获取 Pinia store
const planId = ref(props.isNew ? 'new' : route.params.id);  

const plan = ref(null);
const comments = ref([]);
const loading = ref(true);
const error = ref(null);
const commentText = ref('');
const isEditing = ref(false); 
// 添加文件引用
const fileInput = ref(null);
const selectedFile = ref(null);

// 打开文件选择对话框
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    console.log('选中文件:', selectedFile.value.name);
    console.log('文件大小:', selectedFile.value.size);
    console.log('文件类型:', selectedFile.value.type);
    
    // 尝试读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
      console.log('文件内容读取成功，大小:', e.target.result.length);
    };
    reader.onerror = function(e) {
      console.error('文件读取错误:', e);
    };
    if (file.size < 10 * 1024 * 1024) { // 10MB限制
      reader.readAsArrayBuffer(file);
    }
  }
};

const editPlan = () => {
  // 检查当前用户是否是计划的创建者
  if (plan.value.creator !== store.getUsername()) {
    alert('您只能编辑自己创建的学习计划');
    return;
  }
  // 进入编辑模式
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  //在这里恢复原始数据
  fetchPlanDetails(planId.value); // 重新获取原始数据
};

// fetchPlanDetails函数
const fetchPlanDetails = async (id) => {
  try {
    if (id === 'new') return;
    
    const response = await axios.get(`http://localhost:5000/api/plan/${id}`);
    // plan.value = {
    //   ...response.data,
    //   // 确保所有字段都有默认值
    //   title: response.data.title || '',
    //   description: response.data.description || '',
    //   address: response.data.address || '',  // 确保address字段存在
    //   creator: response.data.creator || '',
    //   date: response.data.date || new Date().toISOString()
    // };
    plan.value = {
      ...response.data,
      type: response.data.type || '未分类',
      title: response.data.title || '',
      description: response.data.description || '',
      address: response.data.address || '',
      creator: response.data.creator || '',
      date: response.data.date || new Date().toISOString()
    };
    console.log('前端接收到的计划数据:', plan.value);
  } catch (err) {
    console.error('获取计划详情失败:', err);
    error.value = err.response?.data?.message || '加载计划详情失败';
  }
};

const savePlan = async () => {
  try {
    // 验证必填字段
    if (!plan.value.title || !plan.value.type_id) { // 确保type_id存在
      throw new Error('标题和类型不能为空');
    }

    const currentUser = store.getUsername();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    let response;
    if (props.isNew) {
      // 新建计划：调用POST接口
      response = await axios.post(
        'http://localhost:5000/api/plans',
        {
          title: plan.value.title,
          description: plan.value.description,
          address: plan.value.address,
          creator: currentUser,
          type_id: plan.value.type_id // 新增类型ID
        }
      );
      alert('计划创建成功');
      router.push(`/plan/${response.data.id}`); // 新建后跳转至详情页
    } else {
      // 编辑计划：调用PUT接口，传递planId和更新数据
      response = await axios.put(
        `http://localhost:5000/api/plan/${planId.value}`, // 使用当前计划ID
        {
          title: plan.value.title,
          description: plan.value.description,
          address: plan.value.address,
          type_id: plan.value.type_id, // 传递类型ID（后端需支持）
          currentUser: currentUser // 用于权限校验
        }
      );
      alert('计划更新成功');
      isEditing.value = false; // 退出编辑模式
    }
  } catch (err) {
    console.error('保存错误:', err);
    alert(`保存失败: ${err.response?.data?.message || err.message}`);
  }
};
// const savePlan = async () => {
//   try {
//     // 验证必填字段
//     if (!plan.value.title) {
//       throw new Error('标题不能为空');
//     }

//     const currentUser = store.getUsername();
//     if (!currentUser) {
//       throw new Error('用户未登录');
//     }

//     let response;
//     if (props.isNew) {
//       // 新建计划
//       response = await axios.post(
//         'http://localhost:5000/api/plans',
//         {
//           title: plan.value.title,
//           description: plan.value.description,
//           address: plan.value.address,
//           creator: currentUser
//         }
//       );
//     } else {
//       // 更新计划
//       response = await axios.put(
//         `http://localhost:5000/api/plan/${planId.value}`,
//         {
//           title: plan.value.title,
//           description: plan.value.description,
//           address: plan.value.address,
//           currentUser: currentUser
//         }
//       );
//     }

//     if (response.data.success) {
//       alert('保存成功');
//       if (props.isNew) {
//         // 新建成功后跳转到详情页
//         router.push(`/plan/${response.data.id}`);
//       } else {
//         isEditing.value = false;
//       }
//     }
//   } catch (err) {
//     console.error('保存错误:', {
//       message: err.message,
//       response: err.response?.data
//     });
//     alert(`保存失败: ${err.response?.data?.message || err.message}`);
//   }
// };

const submitComment = async () => {
  if (!commentText.value.trim()) return;
  
  try {
    const currentUser = store.getUsername();
    await axios.post(`http://localhost:5000/api/plan/${planId.value}/comment`, {
      user: currentUser, // 替换为实际用户
      comment: commentText.value
    });
    commentText.value = '';
    fetchComments(planId.value);
  } catch (err) {
    console.error('提交评论失败:', err);
  }
};

// 获取计划的评论
const fetchComments = async (id) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/plan/${id}/comments`);
    comments.value = response.data;
  } catch (err) {
    console.error('获取评论失败:', err);
    error.value = '获取评论失败，请稍后重试';
  }
};

// 上传文件
const uploadFile = async () => {
  if (!selectedFile.value) {
    alert('请选择文件');
    return;
  }

  try {
    loading.value = true;
    
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('planId', planId.value);
    formData.append('currentUser', store.getUsername());

    const response = await axios.post(
      'http://localhost:5000/api/upload-file', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // 使用服务器返回的路径
    plan.value.address = response.data.filePath;
    alert('文件上传成功');
    
  } catch (err) {
    console.error('上传失败:', err);
    alert(`上传失败: ${err.response?.data?.message || err.message}`);
  } finally {
    loading.value = false;
    selectedFile.value = null;
  }
};
//删除计划
const deletePlan = async () => {
  // 先检查当前用户是否是创建者
  if (plan.value.creator !== store.getUsername()) {
    alert('您只能删除自己创建的学习计划');
    return;
  }

  if (!confirm('确定要删除这个学习计划吗？所有相关评论也将被删除！')) {
    return;
  }

  try {
    const response = await axios.delete(`http://localhost:5000/api/plan/${planId.value}`, {
      data: { currentUser: store.getUsername() }
    });
    
    if (response.data.success) {
      alert('学习计划已删除');
      router.push('/plans');
    }
  } catch (err) {
    console.error('删除失败:', err);
    alert(`删除失败: ${err.response?.data?.message || err.message}`);
  }
};

// onMounted钩子
onMounted(() => {
  if (props.isNew) {
    // 新建计划初始化
    plan.value = {
      id: 'new',
      title: '',
      creator: store.getUsername(), // 设置当前用户为创建者
      description: '',
      date: new Date().toISOString(),
      address: ''
    };
    isEditing.value = true; // 新建计划直接进入编辑模式
    loading.value = false;
  } else if (planId.value) {
    // 现有计划才需要获取数据
    Promise.all([fetchPlanDetails(planId.value), fetchComments(planId.value)])
      .finally(() => loading.value = false);
  } else {
    error.value = '无效的计划ID';
    loading.value = false;
  }
});

watch(
  () => route.params.id,
  (newId) => {
    if (!props.isNew && newId) {
      planId.value = newId;
      loading.value = true;
      Promise.all([fetchPlanDetails(newId), fetchComments(newId)])
        .finally(() => loading.value = false);
    }
  }
);
</script>

<template>
  <div class="detail-container">
    <button @click="router.go(-1)" class="back-btn">
      <i class="fas fa-arrow-left"></i> 返回列表
    </button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载计划详情...</p>
    </div>

    <div v-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchPlanDetails(planId)" class="retry-btn">重试</button>
    </div>

    <template v-if="!loading && plan">
      <div class="plan-header">
        <div class="title-section">
          <h1 v-if="!isEditing">{{ plan.title }}</h1>
          <input v-else v-model="plan.title" class="edit-title" />
          
         <!-- 新增：显示类型名称 -->
          <div class="type-badge">
            <span class="badge bg-primary text-white">
              <i class="fas fa-tag mr-1"></i>{{ plan.type }}
            </span>
          </div>

          <div class="meta">
            <span class="creator"><i class="fas fa-user"></i> {{ plan.creator }}</span>
            <span class="date"><i class="fas fa-calendar-alt"></i> {{ plan.date }}</span>
          </div>
        </div>
    
        <div class="action-btns">
          <button v-if="!isEditing" class="edit-btn" @click="editPlan">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button v-if="!isEditing" class="delete-btn" @click="deletePlan">
            <i class="fas fa-trash"></i> 删除
          </button>
          <div v-else>
            <button @click="savePlan" class="save-btn">保存</button>
            <button @click="cancelEdit" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <div class="plan-content">
        <div class="description">
          <h3><i class="fas fa-align-left"></i> 计划描述</h3>
          <p v-if="!isEditing">{{ plan.description || '暂无描述' }}</p>
          <textarea v-else v-model="plan.description" class="edit-description"></textarea>
        </div>

        <div v-if="plan.address" class="document-section">
          <h3><i class="fas fa-file-word"></i> 相关文档</h3>
          <template v-if="!isEditing">
          <a :href="'http://localhost:5000' + plan.address" target="_blank" class="doc-link">
            <i class="fas fa-external-link-alt"></i> 查看文档
          </a>
          </template>
          <template v-else>
            <div class="file-upload-section">
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileChange" 
                style="display: none"
              />
              <button @click="triggerFileInput" class="upload-btn">
                <i class="fas fa-upload"></i> 选择文件
              </button>
            <span v-if="selectedFile" class="file-name">
              {{ selectedFile.name }}
            </span>
            <button 
              v-if="selectedFile" 
              @click="uploadFile" 
              class="confirm-upload-btn"
            >
              <i class="fas fa-check"></i> 上传
            </button>
          </div>
        </template>
      </div>
      </div>

      <div class="comments-section">
        <h2><i class="fas fa-comments"></i> 评论区</h2>
        
        <div class="comment-form">
          <textarea 
            v-model="commentText" 
            placeholder="写下你的评论..."
            rows="3"
          ></textarea>
          <button @click="submitComment" class="submit-btn">
            <i class="fas fa-paper-plane"></i> 提交评论
          </button>
        </div>

        <div v-if="comments.length === 0" class="no-comments">
          <i class="fas fa-comment-slash"></i>
          <p>暂无评论，快来发表第一条吧~</p>
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="user"><i class="fas fa-user-circle"></i> {{ comment.user }}</span>
              <span class="date">{{ comment.date }}</span>
            </div>
            <div class="comment-content">
              {{ comment.comment }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.type-meta {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
}

.delete-btn:hover {
  background-color: #d32f2f;
}
.file-upload-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.upload-btn {
  background-color: #2196F3;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.upload-btn:hover {
  background-color: #0b7dda;
}

.file-name {
  font-size: 14px;
  color: #555;
}

.confirm-upload-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.confirm-upload-btn:hover {
  background-color: #3e8e41;
}

.edit-title {
  font-size: 1.75rem;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.edit-description {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: #4CAF50;
}

.loading-state, .error-state {
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

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.title-section h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.75rem;
}

.meta {
  display: flex;
  gap: 1.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.meta i {
  margin-right: 0.5rem;
}

.action-btns {
  display: flex;
  gap: 0.75rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.edit-btn {
  background-color: #FFC107;
  color: #2c3e50;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.plan-content {
  margin-bottom: 2rem;
}

.description h3, .document-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.description p {
  line-height: 1.6;
  color: #34495e;
  padding-left: 1.75rem;
}

.document-section {
  margin-top: 2rem;
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2196F3;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  margin-left: 1.75rem;
  transition: all 0.3s ease;
}

.doc-link:hover {
  background-color: #0b7dda;
}

.comments-section {
  border-top: 1px solid #eee;
  padding-top: 2rem;
}

.comments-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-form {
  margin-bottom: 2rem;
}

.comment-form textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background-color: #3e8e41;
}

.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #7f8c8d;
  gap: 0.5rem;
}

.no-comments i {
  font-size: 2rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 4px solid #4CAF50;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.user {
  font-weight: bold;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.comment-content {
  color: #34495e;
  line-height: 1.6;
  padding-left: 1.75rem;
}
</style>