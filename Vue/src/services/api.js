// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // 后端 API 地址
});

export default {
  // 获取学习计划列表
  getPlans() {
    return api.get('/plans');
  },

  // 添加学习计划
  addPlan(plan) {
    return api.post('/plans', plan);
  },
};