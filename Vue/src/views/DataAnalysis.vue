<script setup>
import { ref, onMounted } from 'vue';
import { Chart } from 'chart.js';
import axios from 'axios';

// 定义响应式数据
const chartData = ref(null);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // 获取每个类型下评论最多的主题
    const response  = await axios.get('http://localhost:5000/api/most-commented-topic-by-type');
    if (!topicsResponse.ok) {
      throw new Error('获取主题数据失败');
    }
    const topics = response.data;
    console.log('获取的主题数据:', topics);

    const typeToWords = {};
    
    // 并行获取每个主题的高频词
    const wordPromises = topics.map(async topic => {
      const { type_id, id } = topic;
      const wordsResponse = await fetch(`/api/top-frequency-words/${id}`);
      if (!wordsResponse.ok) {
        throw new Error('获取高频词失败');
      }
      const words = await wordsResponse.json();
      typeToWords[type_id] = words;
    });
    await Promise.all(wordPromises);
    
    // 处理高频词数据
    const types = Object.keys(typeToWords);
    const wordData = {};
    
    types.forEach(type => {
      const words = typeToWords[type];
      words.forEach(word => {
        if (!wordData[word]) {
          wordData[word] = { count: 1, types: [type] };
        } else {
          wordData[word].count++;
          wordData[word].types.push(type);
        }
      });
    });
    
    // 取前5个高频词
    const sortedWordData = Object.entries(wordData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
    
    // 准备图表数据
    chartData.value = {
      labels: sortedWordData.map(([word]) => word),
      datasets: [{
        label: '高频词出现次数',
        data: sortedWordData.map(([, value]) => value.count),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
    
    // 创建图表
    const ctx = document.getElementById('frequency-chart')?.getContext('2d');
    if (ctx && chartData.value) {
      new Chart(ctx, {
        type: 'bar',
        data: chartData.value,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  } catch (err) {
    error.value = err.message;
    console.error('数据分析失败:', err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="data-analysis-page">
    <h1>数据分析</h1>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error">
      <i class="fa fa-exclamation-circle"></i>
      <p>{{ error }}</p>
    </div>
    
    <!-- 图表 -->
    <div v-else class="chart-container">
      <canvas id="frequency-chart"></canvas>
    </div>
  </div>
</template>

<style scoped>
.data-analysis-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.chart-container {
  margin-top: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.error {
  color: #e74c3c;
}

.error i {
  font-size: 2rem;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>