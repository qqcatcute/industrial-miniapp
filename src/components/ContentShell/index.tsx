import React, { ReactNode } from 'react';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  ArrowUpOutlined, 
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Button, Input, Space, Breadcrumb, Divider, theme } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

interface ContentShellProps {
  // 1. 面包屑路径，例如 ['资产管理', '设备台账']
  breadcrumbItems?: { title: string }[];
  
  // 2. 核心操作区：左侧的页签或标题
  title?: ReactNode;
  
  // 3. 核心操作区：右侧的动作按钮 (新建、删除等)
  actions?: ReactNode[];
  
  // 4. 核心操作区：中间或右侧的搜索框
  searchPlaceholder?: string;
  onSearch?: (val: string) => void;

  // 5. 页面主体内容
  children: ReactNode;
}

const ContentShell: React.FC<ContentShellProps> = ({
  breadcrumbItems = [],
  title,
  actions,
  searchPlaceholder = "在此页面搜索...",
  onSearch,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      gap: 16 // 模块间距
    }}>
      {/* === 第一层：模拟 Windows 资源管理器地址栏 (参考线框图顶部) === */}
      <div style={{
        background: '#fff',
        border: '1px solid #d9d9d9',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 2, // 硬朗圆角
      }}>
        {/* 导航按钮组 */}
        <Space size={4}>
          <Button type="text" icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate(-1)} disabled={window.history.length <= 1} />
          <Button type="text" icon={<ArrowRightOutlined />} size="small" disabled />
          <Button type="text" icon={<ArrowUpOutlined />} size="small" />
        </Space>
        
        <Divider type="vertical" style={{ height: 20, margin: 0 }} />

        {/* 刷新按钮 */}
        <Button type="text" icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()} />

        {/* 地址栏 (面包屑) */}
        <div style={{
          flex: 1,
          border: '1px solid #d9d9d9',
          padding: '4px 12px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          height: 30,
          fontSize: 13,
          color: '#555'
        }}>
           <span style={{ color: '#999', marginRight: 8 }}>📍 当前位置:</span>
           <Breadcrumb 
             items={breadcrumbItems.map(item => ({ title: item.title }))} 
             separator=">"
           />
        </div>
      </div>

      {/* === 第二层：业务操作工具栏 (参考线框图中间部分：Tabs + Search + Buttons) === */}
      <div style={{
        background: '#fff',
        border: '1px solid #d9d9d9',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between', // 左侧标题/Tab，右侧按钮
        alignItems: 'center',
        borderRadius: 2,
      }}>
        {/* 左侧：标题或 Tabs */}
        <div style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>
          {title}
        </div>

        {/* 右侧：搜索 + 按钮组 */}
{/* 右侧：搜索 + 按钮组 */}
        <Space size={16}>
          {/* 🚀 修复：改成 Input.Search，并加上 onSearch={onSearch} */}
          <Input.Search 
             prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
             placeholder={searchPlaceholder} 
             onSearch={onSearch} // 👈 这一行最关键！没有它就不会触发网络请求
             enterButton={false} // 保持你原有的极简风格，不显示蓝色的搜索大按钮
             style={{ width: 240, borderRadius: 0 }} 
          />
          
          {/* 操作按钮组 */}
          <Space size={8}>
            {actions}
          </Space>
        </Space>
      </div>

      {/* === 第三层：主体内容 (Canvas) === */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

export default ContentShell;