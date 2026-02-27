// src/layouts/BasicLayout.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import {
  AppstoreOutlined,
  DatabaseOutlined,
  GoldOutlined,
  ToolOutlined,
  PartitionOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  SearchOutlined,
  DeploymentUnitOutlined // 👆 新增的高级工业感 Logo Icon
} from '@ant-design/icons';
import { Input, Dropdown, theme, Spin, Space, Badge, ConfigProvider } from 'antd';
import { queryCurrentUser, CurrentUser } from '@/services/userService';

const { compactAlgorithm } = theme;

const routeConfig = {
  route: {
    path: '/',
    routes: [
      { path: '/dashboard', name: '首页概览', icon: <AppstoreOutlined /> },
      { path: '/device', name: '设备管理', icon: <DatabaseOutlined /> },
      { path: '/material', name: '物料管理', icon: <GoldOutlined /> },
      { path: '/process', name: '工序库', icon: <ToolOutlined /> },
      { path: '/route', name: '工艺路线', icon: <PartitionOutlined /> },
    ],
  },
};

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queryCurrentUser().then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ paddingTop: 100, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: compactAlgorithm,
        token: {
          borderRadius: 2, 
          fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
          colorBgLayout: '#F5F7FA', // 定义全局 Layout 背景色 (工业灰)
        }
      }}
    >
      <div style={{ height: '100vh' }}>
        <ProLayout
          title="智汇工软"
          // 👇 替换掉了丑陋的默认图片，换成了科技青颜色的节点 Icon
          logo={<DeploymentUnitOutlined style={{ color: '#13c2c2', fontSize: 28 }} />}
          {...routeConfig}
          location={{ pathname: location.pathname }}
          
          // 👇 布局模式与主题：强力褪黑，开启全白极简工业风
          layout="mix"
          navTheme="light" 
          splitMenus={false}
          fixSiderbar
          fixedHeader
          siderWidth={180} // 保持瘦身状态

          // 👇 去除臃肿的阴影，加入硬朗的 1px 细线边框切割
          headerStyle={{
            boxShadow: 'none',
            borderBottom: '1px solid #e8e8e8' 
          }}
          siderStyle={{
            borderRight: '1px solid #e8e8e8' 
          }}

          // 👇 彻底重写 Token：告别传统后台大黑块
          token={{
            header: { 
              colorBgHeader: '#ffffff', 
              heightLayoutHeader: 48, 
            },
            sider: {
              colorMenuBackground: '#ffffff',     // 纯白背景
              colorTextMenu: '#5c6b77',           // 菜单默认字体：冷灰色
              colorTextMenuSelected: '#1677FF',   // 选中字体：工业蓝
              colorBgMenuItemSelected: '#F0F5FF', // 选中背景：极淡的蓝色，提供高级呼吸感
            },
            pageContainer: {
              paddingBlockPageContainerContent: 16,
              paddingInlinePageContainerContent: 16,
            }
          }}

          avatarProps={{
            src: user?.avatar,
            size: 'small',
            title: (
              <Space size={4} style={{ color: '#555' }}>
                <span style={{ fontWeight: 600 }}>{user?.name}</span>
                <span style={{ 
                  fontSize: 10, 
                  background: '#e6f4ff', 
                  color: '#1677FF', 
                  padding: '1px 4px', 
                  borderRadius: 2,
                  border: '1px solid #91caff'
                }}>
                  {user?.role === 'admin' ? 'ADMIN' : 'USER'}
                </span>
              </Space>
            ),
            render: (props, dom) => (
              <Dropdown
                menu={{
                  items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
                }}
              >
                <div style={{ cursor: 'pointer', padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center' }}>
                  {dom}
                </div>
              </Dropdown>
            ),
          }}

          actionsRender={(props) => {
            if (props.isMobile) return [];
            return [
              <div key="search-box" style={{ 
                display: 'flex', alignItems: 'center', 
                background: '#f1f3f5', border: '1px solid #d9d9d9',
                borderRadius: 2, padding: '4px 8px', width: 260,
                marginRight: 12, height: 32 
              }}>
                <SearchOutlined style={{ color: '#999', marginRight: 8 }} />
                <Input bordered={false} placeholder="搜索 (Ctrl+K)" style={{ padding: 0, fontSize: 13, background: 'transparent' }} />
              </div>,
              
              <div key="notify" style={{ padding: '0 12px', cursor: 'pointer', borderLeft: '1px solid #f0f0f0' }}>
                 <Badge count={5} size="small" offset={[2, -2]}>
                   <BellOutlined style={{ fontSize: 16, color: '#555' }} />
                 </Badge>
              </div>,
              <QuestionCircleOutlined key="help" style={{ fontSize: 16, color: '#555', padding: '0 12px' }} />,
            ];
          }}
          
          menuItemRender={(item, dom) => (
            <div
              onClick={() => navigate(item.path || '/dashboard')}
              style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }}
            >
              {dom}
            </div>
          )}
        >
          {/* 这里是内容区容器，确保背景色为 #F5F7FA */}
          <div style={{ 
            minHeight: 'calc(100vh - 48px)', 
            background: '#F5F7FA',
            padding: '16px'
          }}>
             <Outlet />
          </div>
        </ProLayout>
      </div>
    </ConfigProvider>
  );
};

export default BasicLayout;