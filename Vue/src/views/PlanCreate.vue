<template>
  <div class="create-container">
    <h1>创建新学习计划</h1>
    
    <TypeSelector v-model="plan.type_id" />
    <div v-if="errors.type_id" class="error-message">{{ errors.type_id }}</div>

    <div class="form-group">
      <label>标题</label>
      <input v-model="plan.title" class="form-input" />
      <div v-if="errors.title" class="error-message">{{ errors.title }}</div>
    </div>
    
    <div class="form-group">
      <label>描述</label>
      <textarea v-model="plan.description" class="form-textarea"></textarea>
    </div>
    
    <div class="form-group">
      <label>上传文档</label>
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
        <span v-if="plan.address" class="file-name">
          已上传文件: {{ plan.address.split('/').pop() }}
        </span>
      </div>
    </div>
    
    <div class="action-buttons">
      <button @click="savePlan" class="save-btn">保存计划</button>
      <button @click="cancel" class="cancel-btn">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCounterStore } from '@/stores/counter';
import TypeSelector from '../views/TypeSelector.vue'


const router = useRouter();
const store = useCounterStore();
const errors = ref({
  title: '',
  type_id: ''
});


const plan = ref({
  title: '',
  description: '',
  address: '',
  creator: store.getUsername(),
  type_id: null 
});

const fileInput = ref(null);
const selectedFile = ref(null);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadFile = async () => {
  if (!selectedFile.value) return;
  
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('planId', 'new');
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

    plan.value.address = response.data.filePath;
    alert('文件上传成功');
  } catch (err) {
    console.error('上传失败:', err);
    alert(`上传失败: ${err.response?.data?.message || err.message}`);
  }
};

const savePlan = async () => {
  // 重置错误信息
  errors.value = { title: '', type_id: '' };
  
  // 验证
  let isValid = true;
  if (!plan.value.title) {
    errors.value.title = '请输入标题';
    isValid = false;
  }
  if (!plan.value.type_id) {
    errors.value.type_id = '请选择类型';
    isValid = false;
  }
  
  if (!isValid) {
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/plans', {
      title: plan.value.title,
      description: plan.value.description,
      address: plan.value.address,
      creator: store.getUsername(),
      type_id: plan.value.type_id
    });

    if (response.data.success) {
      alert('计划创建成功');
      router.push(`/plan/${response.data.id}`);
    }
  } catch (err) {
    console.error('保存失败:', err);
    alert(`保存失败: ${err.response?.data?.message || err.message}`);
  }
};
// const savePlan = async () => {
//   try {
//     if (!plan.value.title || !plan.value.type_id) {
//       throw new Error('标题和类型不能为空');
//     }

//     const response = await axios.post('http://localhost:5000/api/plans', {
//       title: plan.value.title,
//       description: plan.value.description,
//       address: plan.value.address,
//       creator: store.getUsername()
//     });

//     if (response.data.success) {
//       alert('计划创建成功');
//       router.push(`/plan/${response.data.id}`);
//     }
//   } catch (err) {
//     console.error('保存失败:', err);
//     alert(`保存失败: ${err.response?.data?.message || err.message}`);
//   }
// };

const cancel = () => {
  router.go(-1);
};
</script>

<style scoped>
.error-message {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-textarea {
  min-height: 150px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
}
</style>