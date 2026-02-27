// src/utils/request.ts
import axios from 'axios';
import { message } from 'antd';
// 🚀 引入我们准备好的 Mock 数据
import { mockDeviceList, mockDeviceDetail } from '@/mock/device.mock'; 

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
});

// 请求拦截器不变
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authorization');
    if (token) {
      config.headers['authorization'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 兼容后端的 code: 1 或 code: 200 成功标志
    if (res.code !== 200 && res.code !== 1) {
      message.error(res.msg || '操作失败');
      return Promise.reject(new Error(res.msg || 'Error'));
    }
    return res;
  },
  (error) => {
    const { config, response } = error;

    // 【核心增强】后端未启动时的分发处理
    if (!response || response.status === 404 || response.status >= 500) {
      console.warn(`检测到后端未上线，正拦截接口: ${config.url}`);
      
      // 1. 如果是登录相关的接口，按你之前的逻辑返回假 Token
      if (config.url.includes('/login') || config.url.includes('/register')) {
        return Promise.resolve({
          code: 1,
          msg: '登录模式放行',
          data: 'mock-token-123456789'
        });
      }

      // 2. 如果是设备列表接口，返回我们定义的列表 Mock
      if (config.url.includes('/api/device/list')) {
        return Promise.resolve(mockDeviceList);
      }

      // 3. 如果是设备详情接口，返回详情 Mock
      if (config.url.includes('/api/device/detail')) {
        return Promise.resolve(mockDeviceDetail);
      }

      // 4. 其他接口通用的空白兜底
      return Promise.resolve({
        code: 1,
        msg: '通用放行',
        data: []
      });
    }

    // 401 踢回登录页逻辑保留
    if (response?.status === 401) {
      message.error('登录已失效，请重新登录');
      localStorage.removeItem('authorization');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default request;