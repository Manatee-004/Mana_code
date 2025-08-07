<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);
const types = ref([]);
const selectedType = ref(props.modelValue);
// 添加加载状态
const isLoading = ref(true); // 初始化为加载中

const handleSelect = (typeId) => {
  emit('update:modelValue', typeId);
};

onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await axios.get('http://localhost:5000/api/types');
    if (response.data.success) {
      types.value = response.data.types;
      
      // 查找"编程"类型的ID
      // const programmingType = types.value.find(type => 
      //   type.name.toLowerCase().includes('编程')
      // );
      // 默认选择"编程"类型或第一个类型
      // const defaultTypeId = programmingType?.id || (types.value[0]?.id || null);
      
      // 仅在父组件未传递modelValue时，启用默认选中逻辑
      if (props.modelValue === null) {
        const programmingType = types.value.find(type => 
          type.name.toLowerCase().includes('编程')
        );
        const defaultTypeId = programmingType?.id || types.value[0]?.id || null;
        selectedType.value = defaultTypeId; // 赋值给selectedType
        emit('update:modelValue', defaultTypeId); // 触发更新
      }
      // if (defaultTypeId) {
      //   selectedType.value = defaultTypeId;
      //   emit('update:modelValue', defaultTypeId);
      // }
    }
  } catch (err) {
    console.error('获取类型失败:', err);
  }
});

// 监听props.modelValue变化（包括初始化）
watch(
  () => props.modelValue,
  (newVal) => {
    selectedType.value = newVal; // 同步父组件的值到子组件
  },
  { immediate: true } // 立即执行，处理初始化值
);
// 监听外部modelValue变化
// watch(() => props.modelValue, (newVal) => {
//   selectedType.value = newVal;
// });

// 监听selectedType变化，同步到父组件
watch(
  selectedType,
  (newVal) => {
    emit('update:modelValue', newVal); // 触发父组件更新
  }
);
// 监听选择变化
// watch(selectedType, (newVal) => {
//   emit('update:modelValue', newVal);
// });


</script>

<template>
  <div class="type-selector-container">
    <label class="type-selector-label">选择学习类型:</label>
    <div class="custom-select">
      <select 
        v-model="selectedType" 
        class="type-select"
        :disabled="!types.length" 
      >
       <option value="">请选择类型</option> <!-- 占位选项 -->
        <option 
          v-for="type in types" 
          :key="type.id" 
          :value="type.id"
          class="type-option"
        >
          {{ type.name }}
        </option>
      </select>
      <span class="custom-arrow"></span>
    </div>
    <!-- 加载状态提示 -->
    <div v-if="!types.length && !isLoading" class="empty-tip">暂无类型数据</div>
  </div>
</template>

<style scoped>
.empty-tip {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 5px;
}
.type-selector-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.type-selector-label {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 500;
}

.custom-select {
  position: relative;
  width: 250px;
}

.type-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.type-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.custom-arrow {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #7f8c8d;
  pointer-events: none;
  transition: all 0.3s ease;
}

.type-select:hover {
  border-color: #bdc3c7;
}

.type-select:hover + .custom-arrow {
  border-top-color: #2c3e50;
}

.type-option {
  padding: 10px;
  background-color: white;
  color: #2c3e50;
}

.type-option:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .type-selector-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .custom-select {
    width: 100%;
  }
}
</style>