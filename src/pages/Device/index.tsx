// src/pages/Device/index.tsx
import React, { useState, useRef } from 'react';
import { ActionType } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import { Button, Segmented, Radio, Space, message, Popconfirm} from 'antd';
import { PlusOutlined, DeleteOutlined, ImportOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';

import DeviceTree from './components/DeviceTree';
import DeviceTable from './components/DeviceTable';
import DeviceDrawer from './components/DeviceDrawer';
import DeviceKanban from './components/DeviceKanban'; 
import { Device } from './typing';
// 🚀 引入了 unbindDeviceLabel
import { getDeviceDetail, addDevice, updateDevice, bindDeviceLabel, unbindDeviceLabel, deleteDevices } from './service'; 

const DeviceManage: React.FC = () => {
  const [selectedLabelId, setSelectedLabelId] = useState<string>('ALL');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [viewType, setViewType] = useState<'list' | 'kanban'>('kanban');

  // 🚀 新增：存储搜索框的关键字
  const [keyword, setKeyword] = useState<string>('');

  const tableActionRef = useRef<ActionType | undefined>(undefined); 
  const [currentRow, setCurrentRow] = useState<Device | undefined>(undefined);

  const handleSubmit = async (values: Device) => {
    let success = false;
    let currentDeviceId = values.deviceId; 
    const isEditMode = !!currentDeviceId; // 判断是新增还是编辑

    if (isEditMode) {
        success = await updateDevice(currentDeviceId, values);
    } else {
        const newId = await addDevice(values);
        if (newId) {
          currentDeviceId = newId;
          success = true;
        }
    }

    if (success && currentDeviceId) {
      // 🚀 核心逻辑：智能对比并处理 Bind / Unbind
      const newLabelIds = values.labelIds || [];
      // 如果是编辑模式，获取它原本绑定的旧标签 (如果 currentRow 没记录，默认为空数组)
      const oldLabelIds = isEditMode ? (currentRow?.labelIds || []) : [];

      // 1. 找出需要【新增绑定】的标签 (新的有，旧的没有)
      const toBind = newLabelIds.filter(id => !oldLabelIds.includes(id));
      // 2. 找出需要【解除绑定】的标签 (旧的有，新的没有)
      const toUnbind = oldLabelIds.filter(id => !newLabelIds.includes(id));

      // 并发执行绑定和解绑请求
      const promises: Promise<any>[] = [];
      toBind.forEach(labelId => promises.push(bindDeviceLabel(currentDeviceId, labelId)));
      toUnbind.forEach(labelId => promises.push(unbindDeviceLabel(currentDeviceId, labelId)));
      
      await Promise.all(promises);

      setDrawerVisible(false);
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
      searchPlaceholder="输入设备名称模糊搜索..."
      // 🚀 假设你的 ContentShell 支持 onSearch 回调，将关键字存入状态并刷新表格
      onSearch={(val) => {
        setKeyword(val);
        tableActionRef.current?.reload();
      }}
      actions={[
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
        <Button 
          key="add" type="primary" icon={<PlusOutlined />} 
          onClick={() => {
            setCurrentRow(undefined); 
            setDrawerVisible(true);
          }}
        >
          新建设备
        </Button>,
        <Popconfirm 
          key="del" 
          title="确认批量删除"
          description={`您确定要删除选中的 ${selectedRowKeys.length} 台设备吗？`}
          disabled={selectedRowKeys.length === 0}
          onConfirm={async () => {
            // 🚀 加上这行打印，让你清清楚楚看到传给后端的 ID 数组！
            console.log("准备发送批量删除请求，勾选的 ID 数组为:", selectedRowKeys); 
            
            const success = await deleteDevices(selectedRowKeys as string[]);
            if (success) {
              message.success('批量删除成功');
              setSelectedRowKeys([]); // 清空勾选
              tableActionRef.current?.reload(); // 刷新表格
            }
          }}
        >
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            style={{ borderRadius: 2 }} 
            disabled={selectedRowKeys.length === 0} 
          >
            批量删除
          </Button>
        </Popconfirm>,,
      ]}
    >
      <div style={{ display: 'flex', height: '100%', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 2 }}>
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid #f0f0f0' }}>
          <DeviceTree onSelect={setSelectedLabelId} />
        </div>
        
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {viewType === 'list' ? (
              <DeviceTable 
                selectedLabelId={selectedLabelId} 
                keyword={keyword} // 🚀 传给 Table
                actionRef={tableActionRef} 
                onEdit={async (record) => {
                  const fullDetail = await getDeviceDetail(record.deviceId);
                  setCurrentRow(fullDetail);
                  setDrawerVisible(true);
                }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
                }}
              />
          ) : (
              // Kanban 也应该支持 keyword，如有需要也可传入并修改内部请求
              <DeviceKanban selectedLabelId={selectedLabelId} /> 
          )}
        </div>
      </div>

      <DeviceDrawer 
        visible={drawerVisible} 
        onVisibleChange={setDrawerVisible}
        initialValues={currentRow}  
        onSubmit={handleSubmit}
      />
    </ContentShell>
  );
};

export default DeviceManage;