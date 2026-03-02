// src/pages/Device/components/DeviceTree.tsx
import React, { useEffect, useState } from 'react';
import { Tree, Input, Button, Spin, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { SettingOutlined, SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText, ProFormTreeSelect } from '@ant-design/pro-components';
import { getDeviceLabels, addDeviceLabel, updateDeviceLabel } from '../service';
import { DeviceLabel } from '../typing';

interface DeviceTreeProps {
  onSelect: (selectedId: string) => void;
}

const DeviceTree: React.FC<DeviceTreeProps> = ({ onSelect }) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 🚀 修复点 1：把 selectedNode 状态放到组件最顶层！
  const [selectedNode, setSelectedNode] = useState<{key: string, title: string} | null>(null);

  const fetchTreeData = async () => {
    setLoading(true);
    try {
      const data = await getDeviceLabels();
      
      const formatTree = (nodes: DeviceLabel[]): DataNode[] => {
        return nodes.map((node) => ({
          title: node.labelName,
          key: node.labelId,
          children: node.children && node.children.length > 0 ? formatTree(node.children) : undefined,
        }));
      };

      setTreeData([
        { 
          title: '全部设备', 
          key: 'ALL', 
          children: formatTree(data) 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 8px' }}>
      <Input 
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }}/>} 
        placeholder="搜索设备分类..." 
        style={{ marginBottom: 12, borderRadius: 2 }}
      />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Spin spinning={loading}>
          <Tree
            defaultExpandAll
            treeData={treeData}
            // 🚀 修复点 2：在树节点点击时，同时记录节点的 key 和 title (名字)
            onSelect={(selectedKeys, info) => {
              if (selectedKeys.length > 0) {
                const key = selectedKeys[0] as string;
                onSelect(key); // 通知右侧表格刷新
                setSelectedNode({ key, title: info.node.title as string }); // 记下来，供编辑弹窗使用
              } else {
                setSelectedNode(null);
              }
            }}
          />
        </Spin>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        
        {/* 1. 新建分类的 ModalForm (保留原样) */}
        <ModalForm
          title="新建设备分类"
          width={400}
          trigger={
            <Button type="dashed" style={{ flex: 1, borderRadius: 2, fontSize: 12 }} icon={<PlusOutlined />}>
              新建分类
            </Button>
          }
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            const success = await addDeviceLabel({
              deviceLabelName: values.deviceLabelName,
              deviceLabelParentId: (!values.deviceLabelParentId || values.deviceLabelParentId === 'ALL') ? undefined : values.deviceLabelParentId
            });
            if (success) {
              message.success('分类创建成功');
              fetchTreeData(); 
              return true;
            }
            return false;
          }}
        >
          <ProFormText 
            name="deviceLabelName" 
            label="分类名称" 
            placeholder="请输入新分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]} 
          />
          <ProFormTreeSelect
            name="deviceLabelParentId"
            label="上级分类"
            placeholder="请选择上级分类（不选则默认建在最外层）"
            request={async () => treeData[0]?.children || []}
            fieldProps={{
              fieldNames: { label: 'title', value: 'key' },
              treeDefaultExpandAll: true,
              allowClear: true,
            }}
          />
        </ModalForm>

        {/* 🚀 修复点 3：新增“编辑分类”的 ModalForm */}
        <ModalForm
          title={`修改分类: ${selectedNode?.title || ''}`}
          width={400}
          trigger={
            <Button 
              icon={<EditOutlined />} 
              style={{ borderRadius: 2 }} 
              // 如果没选中节点，或者选中的是"全部设备"(根节点不允许改名)，则禁用编辑按钮
              disabled={!selectedNode || selectedNode.key === 'ALL'} 
              title="编辑当前选中的分类"
            />
          }
          modalProps={{ destroyOnClose: true }}
          initialValues={{ labelName: selectedNode?.title }}
          onFinish={async (values) => {
            if (!selectedNode) return false;
            // 传递选中的节点 key 和新填写的名字进行修改
            const success = await updateDeviceLabel(selectedNode.key, {
              labelName: values.labelName,
              deviceLabelHierarchical: 1 // 必填字段，传个默认的层级占位
            });
            if (success) {
              message.success('分类修改成功');
              fetchTreeData(); // 改完之后重新拉取一次左侧树
              return true;
            }
            return false;
          }}
        >
          <ProFormText 
            name="labelName" 
            label="新分类名称" 
            placeholder="请输入新的名称"
            rules={[{ required: true, message: '分类名称不能为空' }]} 
          />
        </ModalForm>

        <Button icon={<SettingOutlined />} style={{ borderRadius: 2 }} />
      </div>
    </div>
  );
};

export default DeviceTree;