import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import { 
  DesktopOutlined, 
  ApartmentOutlined, 
  NodeIndexOutlined, 
  SettingOutlined,
  DashboardOutlined 
} from '@ant-design/icons';

// --- 临时占位组件 (等会儿让 AI 填肉) ---
const Dashboard = () => <div style={{padding: 24}}><h2>欢迎使用精密行星减速器生产管理系统</h2></div>;
const DevicePage = () => <div style={{padding: 24}}><h2>设备管理模块 (待生成)</h2></div>;
const MaterialPage = () => <div style={{padding: 24}}><h2>物料与BOM模块 (待生成)</h2></div>;
const ProcessPage = () => <div style={{padding: 24}}><h2>工序库管理 (待生成)</h2></div>;
const RoutePage = () => <div style={{padding: 24}}><h2>工艺路线编排 (待生成)</h2></div>;

// --- 基础布局 ---
const BasicLayout = () => {
  const location = useLocation();
  return (
    <ProLayout
      title="工业 miniAPP"
      logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
      layout="mix"
      splitMenus={false}
      location={{ pathname: location.pathname }}
      menuDataRender={() => [
        { path: '/', name: '首页', icon: <DashboardOutlined /> },
        { path: '/device', name: '设备管理', icon: <DesktopOutlined /> },
        { path: '/material', name: '物料管理', icon: <ApartmentOutlined /> },
        { path: '/process', name: '工序库', icon: <SettingOutlined /> },
        { path: '/route', name: '工艺路线', icon: <NodeIndexOutlined /> },
      ]}
      menuItemRender={(item, dom) => (
        <Link to={item.path || '/'}>{dom}</Link>
      )}
      style={{ height: '100vh' }}
      fixSiderbar
    >
      <Outlet />
    </ProLayout>
  );
};

// --- 路由配置 ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BasicLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="device" element={<DevicePage />} />
          <Route path="material" element={<MaterialPage />} />
          <Route path="process" element={<ProcessPage />} />
          <Route path="route" element={<RoutePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;