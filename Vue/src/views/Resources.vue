<script setup>
import { ref, computed,} from 'vue';

// 模拟学习资源数据
const resources = ref([
  {
    id: 1,
    title: 'Vue.js 官方文档',
    category: '前端开发',
    description: 'Vue.js 的官方文档，包含详细的教程和 API 参考。',
    link: 'https://vuejs.org/',
  },
  {
    id: 2,
    title: 'React 官方文档',
    category: '前端开发',
    description: 'React 的官方文档，适合初学者和高级开发者。',
    link: 'https://reactjs.org/',
  },
  {
    id: 3,
    title: 'Node.js 官方文档',
    category: '后端开发',
    description: 'Node.js 的官方文档，涵盖核心模块和 API。',
    link: 'https://nodejs.org/',
  },
  {
    id: 4,
    title: 'Python 官方教程',
    category: '编程语言',
    description: 'Python 的官方教程，适合初学者。',
    link: 'https://docs.python.org/3/tutorial/',
  },
]);

// 当前选中的资源
const selectedResource = ref(null);

// 搜索关键词
const searchQuery = ref('');

// 分类筛选
const selectedCategory = ref('全部');

// 分类列表
const categories = computed(() => {
  const uniqueCategories = new Set(resources.value.map((resource) => resource.category));
  return ['全部', ...uniqueCategories];
});

// 过滤后的资源列表
const filteredResources = computed(() => {
  return resources.value.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory =
      selectedCategory.value === '全部' || resource.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});
</script>

<template>
  <div class="resources-page">
    <!-- 搜索和分类筛选 -->
    <section class="filters">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索资源..."
        class="search-input"
      />
      <select v-model="selectedCategory" class="category-select">
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </section>

    <!-- 资源列表 -->
    <section class="resource-list">
      <ul>
        <li
          v-for="resource in filteredResources"
          :key="resource.id"
          class="resource-item"
          @click="selectedResource = resource"
        >
          <h2>{{ resource.title }}</h2>
          <p class="category">{{ resource.category }}</p>
          <p class="description">{{ resource.description }}</p>
        </li>
      </ul>
    </section>

    <!-- 资源详情 -->
    <section v-if="selectedResource" class="resource-details">
      <h2>{{ selectedResource.title }}</h2>
      <p class="category">{{ selectedResource.category }}</p>
      <p class="description">{{ selectedResource.description }}</p>
      <a :href="selectedResource.link" target="_blank" class="resource-link">访问资源</a>
    </section>
  </div>
</template>

<style scoped>
.resources-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.category-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.resource-list {
  margin-bottom: 40px;
}

.resource-item {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.resource-item h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.resource-item .category {
  font-size: 14px;
  color: #007BFF;
  margin-bottom: 10px;
}

.resource-item .description {
  font-size: 14px;
  color: #666;
}

.resource-details {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resource-details h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.resource-details .category {
  font-size: 16px;
  color: #007BFF;
  margin-bottom: 10px;
}

.resource-details .description {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

.resource-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
}

.resource-link:hover {
  background-color: #0056b3;
}
</style>