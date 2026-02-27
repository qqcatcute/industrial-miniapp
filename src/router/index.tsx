/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import BasicLayout from '@/layouts/BasicLayout';
import { Spin } from 'antd';

// 懒加载页面
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DeviceManage = lazy(() => import('@/pages/Device'));
const MaterialManage = lazy(() => import('@/pages/Material'));
const ProcessManage = lazy(() => import('@/pages/Process'));
const RouteManage = lazy(() => import('@/pages/Route'));
const RouteEditor = lazy(() => import('@/pages/Route/Editor'));

// 提取 Loading 样式为常量，避开 Fast Refresh 警告
const loadingSpin = (
  <div style={{ paddingTop: 100, textAlign: 'center' }}>
    <Spin size="large" />
  </div>
);

// 👇 【修改】将 JSX.Element 改为了 React.ReactNode，解决类型报错
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authorization');
  if (!token) {
    // 如果没有 token，强制跳转到登录页
    return <Navigate to="/login" replace />;
  }
  // 如果有 token，正常渲染内部组件
  return children;
};

export const router = createBrowserRouter([
  // 登录页路由（独立在外层，不带左侧菜单栏，全屏展示）
  {
    path: '/login',
    element: <Suspense fallback={loadingSpin}><Login /></Suspense>,
  },
  {
    // 这里是带有左侧菜单栏的常规页面
    path: '/',
    element: <RequireAuth><BasicLayout /></RequireAuth>,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <Suspense fallback={loadingSpin}><Dashboard /></Suspense>,
      },
      {
        path: 'device',
        element: <Suspense fallback={loadingSpin}><DeviceManage /></Suspense>,
      },
      {
        path: 'material',
        element: <Suspense fallback={loadingSpin}><MaterialManage /></Suspense>,
      },
      {
        path: 'process',
        element: <Suspense fallback={loadingSpin}><ProcessManage /></Suspense>,
      },
      {
        path: 'route',
        element: <Suspense fallback={loadingSpin}><RouteManage /></Suspense>,
      },
    ],
  },
  // 将编辑器放在外层，脱离 BasicLayout，实现全屏沉浸式体验！
  {
    path: '/route/editor/:id',
    element: <RequireAuth><Suspense fallback={loadingSpin}><RouteEditor /></Suspense></RequireAuth>,
  }
]);
