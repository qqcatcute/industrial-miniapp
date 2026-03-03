// src/pages/Material/index.tsx
import React, { useState } from 'react';
import { Button, message, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ContentShell from '@/components/ContentShell';
import MaterialTree from './components/MaterialTree';
import MaterialTable from './components/MaterialTable';
import MaterialDrawer from './components/MaterialDrawer';
import MaterialFormDrawer from './components/MaterialFormDrawer';
import { Material } from './typing';
import { getMaterialDetail } from './service';

const MaterialManagement: React.FC = () => {
  const [selectedLabelId, setSelectedLabelId] = useState<string>('NULL');
  
  // 💡 用于强制触发表格刷新的 Key
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // 详情抽屉状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');

  // 新建/编辑/升版 表单抽屉状态
  const [formVisible, setFormVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'upgrade'>('create');
  const [currentRecord, setCurrentRecord] = useState<Material | null>(null);
  
// 💡 新增：抽屉全局 Loading 状态
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 💡 核心改造：点击查看时，先拉取完整详情再打开抽屉
  const handleViewDetail = async (record: Material, tabKey: string = '1') => {
    // 先打开抽屉，展示 Loading
    setCurrentMaterial(null);
    setActiveTab(tabKey);
    setDetailVisible(true);
    setLoadingDetail(true);

    try {
      const fullDetail = await getMaterialDetail(record.materialId);
      setCurrentMaterial(fullDetail);
    } catch (error) {
      message.error('获取物料详情失败');
      setDetailVisible(false); // 失败则关闭抽屉
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <ContentShell
      breadcrumbItems={[{ title: '数据管理' }, { title: '物料与 BOM 管理' }]}
      title="物料档案"
      searchPlaceholder="输入物料编码或供应商模糊搜索..."
      actions={[
        <Button key="delete" danger icon={<DeleteOutlined />}>批量删除</Button>,
        <Button 
          key="create" 
          type="primary" 
          icon={<PlusOutlined />} 
          style={{ borderRadius: 2 }}
          onClick={() => {
            setDrawerMode('create');
            setCurrentRecord(null);
            setFormVisible(true);
          }}
        >
          新建物料
        </Button>
      ]}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 左侧树 */}
        <div style={{ width: 220, minWidth: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e8e8', padding: '16px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
          <MaterialTree onSelect={setSelectedLabelId} />
        </div>

        {/* 右侧表格区域 */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', padding: '0 16px' }}>
          <MaterialTable 
            labelId={selectedLabelId} 
            refreshKey={refreshKey} // 💡 完美传入
            onViewDetail={handleViewDetail} 
            onEdit={(record) => {
              setDrawerMode('edit');
              setCurrentRecord(record);
              setFormVisible(true);
            }}
            onUpgrade={(record) => {
              setDrawerMode('upgrade');
              setCurrentRecord(record);
              setFormVisible(true);
            }}
          />
        </div>
      </div>

      <Spin spinning={loadingDetail} tip="正在加载物料详细档案..." fullscreen />
      {/* 💡 修复：详情抽屉回来了！ */}
      <MaterialDrawer 
        visible={detailVisible && !loadingDetail} // 数据加载完才显示内容
        material={currentMaterial} 
        activeTab={activeTab}         
        onTabChange={setActiveTab}    
        onClose={() => setDetailVisible(false)} 
      />

      {/* 💡 修复：表单提交成功后触发表格刷新 */}
      <MaterialFormDrawer
        visible={formVisible}
        onVisibleChange={(v) => {
          setFormVisible(v);
          if (!v) setCurrentRecord(null);
        }}
        mode={drawerMode}
        record={currentRecord}
        defaultLabelId={selectedLabelId}
        onSuccess={() => { 
          setFormVisible(false);
          setRefreshKey(prev => prev + 1); 
        }}
      />
    </ContentShell>
  );
};

export default MaterialManagement;