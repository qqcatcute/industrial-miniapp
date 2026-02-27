// src/pages/Device/index.tsx
import React, { useState, useRef } from 'react';
import { ActionType } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import { Button, Segmented, Radio, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, ImportOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';

import DeviceTree from './components/DeviceTree';
import DeviceTable from './components/DeviceTable';
import DeviceDrawer from './components/DeviceDrawer';
import DeviceKanban from './components/DeviceKanban'; // 🚀 引入我们刚写的看板组件
import { Device } from './typing';
import { addDevice } from './service';

const DeviceManage: React.FC = () => {
  const [selectedLabelId, setSelectedLabelId] = useState<string>('ALL');
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // 🚀 核心状态：控制当前是展示“列表”还是“卡片看板”
  const [viewType, setViewType] = useState<'list' | 'kanban'>('kanban');

  const tableActionRef = useRef<ActionType | undefined>(undefined); 

  // 1. 新增一个状态，存当前点击的行数据
  const [currentRow, setCurrentRow] = useState<Device | undefined>(undefined);

  const handleSubmit = async (values: Device) => {
    const success = await addDevice(values);
    if (success) {
      setDrawerVisible(false);
      // 提交成功后，尝试刷新表格（如果当前在表格视图）
      tableActionRef.current?.reload(); 
      return true;
    }
    return false;
  };

  return (
    <ContentShell
      breadcrumbItems={[{ title: '首页' }, { title: '设备管理' }, { title: '设备台账' }]}
      title={
        <Space size={16}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>设备台账</span>
          <Segmented options={['全部状态', '运行中', '维修中']} defaultValue="全部状态"/>
        </Space>
      }
      searchPlaceholder="输入设备编码/名称搜索..."
      actions={[
        // 🚀 Odoo 风格的视图切换器
        <Radio.Group 
          key="view-switch" 
          value={viewType} 
          onChange={(e) => setViewType(e.target.value)}
          buttonStyle="solid"
          style={{ marginRight: 8 }}
        >
          <Radio.Button value="list"><BarsOutlined /></Radio.Button>
          <Radio.Button value="kanban"><AppstoreOutlined /></Radio.Button>
        </Radio.Group>,

        <Button key="import" icon={<ImportOutlined />} style={{ borderRadius: 2 }}>导入</Button>,
// 2. 修改“新建设备”按钮的点击事件，确保新建时是清空数据的
  <Button 
    key="add" type="primary" icon={<PlusOutlined />} 
    onClick={() => {
      setCurrentRow(undefined); // 确保是空数据
      setDrawerVisible(true);
    }}
  >
    新建设备
  </Button>,
        <Button key="del" danger icon={<DeleteOutlined />} style={{ borderRadius: 2 }}>批量删除</Button>,
      ]}
    >
      <div style={{ display: 'flex', height: '100%', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 2 }}>
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid #f0f0f0' }}>
          <DeviceTree onSelect={setSelectedLabelId} />
        </div>
        
 {/* 3. 把当前行数据传给抽屉，并把设置状态的函数传给表格 */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    {viewType === 'list' ? (
        <DeviceTable 
          selectedLabelId={selectedLabelId} 
          actionRef={tableActionRef} 
         // 🚀 新增：把打开抽屉和传数据的方法传给表格
            onEdit={(record) => {
            setCurrentRow(record);
            setDrawerVisible(true);
          }}
        />
    ) : (
        <DeviceKanban selectedLabelId={selectedLabelId} />
    )}
  </div>
      </div>

// 4. 给抽屉加上 initialValues 属性
  <DeviceDrawer 
    visible={drawerVisible} 
    onVisibleChange={setDrawerVisible}
    initialValues={currentRow}  // 🚀 把当前点击的行数据传给抽屉做回显
    onSubmit={handleSubmit}
  />
    </ContentShell>
  );
};

export default DeviceManage;