import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router } from './router'
import './index.css' // 确保包含 Tailwind 或全局样式重置

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Ant Design 全局中文配置 */}
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677FF' } }}>
       <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>,
)