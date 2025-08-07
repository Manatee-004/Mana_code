<script setup>
import { ref, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';

// 注册 Chart.js 组件
Chart.register(...registerables);

// 模拟用户学习进度数据
const progressData = ref([
  { day: '2023-10-01', progress: 20 },
  { day: '2023-10-02', progress: 40 },
  { day: '2023-10-03', progress: 60 },
  { day: '2023-10-04', progress: 80 },
  { day: '2023-10-05', progress: 100 },
]);

// 图表实例
let progressChart = null;

// 初始化图表
const initChart = () => {
  const ctx = document.getElementById('progressChart').getContext('2d');
  progressChart = new Chart(ctx, {
    type: 'line', // 折线图
    data: {
      labels: progressData.value.map((item) => item.day), // X 轴：日期
      datasets: [
        {
          label: '学习进度 (%)',
          data: progressData.value.map((item) => item.progress), // Y 轴：进度
          borderColor: '#007BFF', // 线条颜色
          backgroundColor: 'rgba(0, 123, 255, 0.1)', // 填充颜色
          borderWidth: 2, // 线条宽度
          fill: true, // 填充区域
        },
      ],
    },
    options: {
      responsive: true, // 响应式
      scales: {
        y: {
          beginAtZero: true, // Y 轴从 0 开始
          max: 100, // Y 轴最大值
        },
      },
    },
  });
};

// 添加新的学习进度
const addProgress = () => {
  const newDay = new Date().toISOString().split('T')[0]; // 获取当前日期
  const newProgress = Math.min(100, progressData.value[progressData.value.length - 1].progress + 20); // 模拟进度增加
  progressData.value.push({ day: newDay, progress: newProgress });

  // 更新图表
  progressChart.data.labels.push(newDay);
  progressChart.data.datasets[0].data.push(newProgress);
  progressChart.update();
};

// 初始化时渲染图表
onMounted(() => {
  initChart();
});
</script>

<template>
  <div class="progress-tracker">
    <h1>学习进度追踪</h1>

    <!-- 图表 -->
    <div class="chart-container">
      <canvas id="progressChart"></canvas>
    </div>

    <!-- 添加进度按钮 -->
    <button @click="addProgress" class="add-progress-button">添加今日进度</button>

    <!-- 进度评估 -->
    <div class="progress-evaluation">
      <h2>学习成效评估</h2>
      <p v-if="progressData.length > 0">
        最近一天的学习进度: <strong>{{ progressData[progressData.length - 1].progress }}%</strong>
      </p>
      <p v-if="progressData.length > 1">
        相比前一天:
        <strong :class="{ positive: progressData[progressData.length - 1].progress > progressData[progressData.length - 2].progress, negative: progressData[progressData.length - 1].progress < progressData[progressData.length - 2].progress }">
          {{ progressData[progressData.length - 1].progress - progressData[progressData.length - 2].progress }}%
        </strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.progress-tracker {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.chart-container {
  margin: 20px 0;
}

.add-progress-button {
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.add-progress-button:hover {
  background-color: #0056b3;
}

.progress-evaluation {
  margin-top: 20px;
}

.progress-evaluation h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.progress-evaluation p {
  font-size: 16px;
  margin-bottom: 10px;
}

.positive {
  color: green;
}

.negative {
  color: red;
}
</style>