// src/pages/Device/index.tsx
import React, { useState, useRef } from 'react';
import { ActionType } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import { Button, Segmented, Radio, Space, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, ImportOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';

import DeviceTree from './components/DeviceTree';
import DeviceTable from './components/DeviceTable';
import DeviceDrawer from './components/DeviceDrawer';
import DeviceKanban from './components/DeviceKanban'; // 🚀 引入我们刚写的看板组件
import { Device } from './typing';
import { getDeviceDetail, addDevice, updateDevice,bindDeviceLabel,deleteDevices } from './service'; // 🚀 引入新的API

const DeviceManage: React.FC = () => {
  const [selectedLabelId, setSelectedLabelId] = useState<string>('ALL');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 🚀 核心状态：控制当前是展示“列表”还是“卡片看板”
  const [viewType, setViewType] = useState<'list' | 'kanban'>('kanban');

  const tableActionRef = useRef<ActionType | undefined>(undefined); 

  // 1. 新增一个状态，存当前点击的行数据
  const [currentRow, setCurrentRow] = useState<Device | undefined>(undefined);

  const handleSubmit = async (values: Device) => {
    let success = false;
    // 尝试获取当前 ID (如果有 deviceId 说明是编辑模式)
    let currentDeviceId = values.deviceId; 

    if (currentDeviceId) {
       // 走编辑接口
        success = await updateDevice(currentDeviceId, values);
    } else {
       // 走新增接口，并拿到师兄刚刚加的那个新生成的 deviceId！
          const newId = await addDevice(values);
        if (newId) {
          currentDeviceId = newId;
          success = true;
        }
    }

    if (success && currentDeviceId) {
      // 🚀 核心逻辑：拿到新 ID 后，默默触发循环绑定标签
      if (values.labelIds && values.labelIds.length > 0) {
        // 遍历所有选中的标签 ID，依次发送绑定请求
        for (const labelId of values.labelIds) {
          await bindDeviceLabel(currentDeviceId, labelId);
        }
      }

      setDrawerVisible(false);
      tableActionRef.current?.reload(); // 刷新表格
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
        <Button 
          key="del" 
          danger 
          icon={<DeleteOutlined />} 
          style={{ borderRadius: 2 }}
          disabled={selectedRowKeys.length === 0} // 没勾选时禁用
          onClick={() => {
            Modal.confirm({
              title: '确认批量删除',
              content: `您确定要删除选中的 ${selectedRowKeys.length} 台设备吗？`,
              onOk: async () => {
                const success = await deleteDevices(selectedRowKeys as string[]);
                if (success) {
                  message.success('批量删除成功');
                  setSelectedRowKeys([]); // 清空勾选
                  tableActionRef.current?.reload(); // 刷新表格
                }
              }
            });
          }}
        >
          批量删除
        </Button>,
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
          onEdit={async (record) => {
            const fullDetail = await getDeviceDetail(record.deviceId);
            setCurrentRow(fullDetail);
            setDrawerVisible(true);
          }}
          // 🚀 重点：把 onChange 传给 Table，收集勾选的 ID
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
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