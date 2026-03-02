// src/utils/request.ts
import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  // 🚀 配合相对路径，统一挂载基础前缀
  baseURL: '/api/v1',
  timeout: 5000,
});

// 请求拦截器：自动携带 Token
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
    // 直接返回剥离了 code/msg 后的真实 data
    return res;
  },
  (error) => {
    const { config, response } = error;

    // 1. 401 踢回登录页逻辑保留
    if (response?.status === 401) {
      message.error('登录已失效，请重新登录');
      localStorage.removeItem('authorization');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 2. 【核心改造】后端未启动、网关报错或 404/5xx 时的柔性降级分发
    if (!response || response.status === 404 || response.status >= 500) {
      console.warn(`[网络拦截] 检测到后端接口异常，正交由 Service 层触发柔性降级: ${config?.url}`);
      // 🚀 不再全局返回假数据，直接向外抛出错误！让具体的 service 接口去 catch
      return Promise.reject(error); 
    }

    return Promise.reject(error);
  }
);

export default request;