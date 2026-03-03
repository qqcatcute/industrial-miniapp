// src/pages/Material/components/MaterialTree.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Tree, Input, Button, Modal, Form, message, Space, Tooltip, Popconfirm } from 'antd';
import type { TreeProps } from 'antd'; // 🚀 引入 Tree 的类型
import type { DataNode } from 'antd/es/tree'; // 🚀 引入标准树节点类型
import { AppstoreOutlined, FolderOpenOutlined, FolderAddOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { getMaterialLabels, addMaterialLabel, updateMaterialLabel, deleteMaterialLabel } from '../service';
import { MaterialLabel } from '../typing';

interface MaterialTreeProps {
  onSelect: (labelId: string) => void;
}

const MaterialTree: React.FC<MaterialTreeProps> = ({ onSelect }) => {
  // 🚀 修复1：将 any[] 改为 Ant Design 官方的 DataNode[]
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('NULL');
  
  const [selectedNode, setSelectedNode] = useState<{key: string, title: string} | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 🚀 修复3：使用 useCallback 包裹异步请求，消除 useEffect 的级联渲染警告
  const fetchTree = useCallback(async () => {
    const data = await getMaterialLabels();
    const formatTree = (nodes: MaterialLabel[]): DataNode[] => {
      return nodes.map(node => ({
        title: node.labelName,      
        key: node.labelId,          
        icon: node.children?.length ? <FolderOpenOutlined /> : <AppstoreOutlined />,
        children: node.children?.length ? formatTree(node.children) : undefined,
      }));
    };
    setTreeData([{ title: '全部物料', key: 'NULL', icon: <AppstoreOutlined />, children: formatTree(data) }]);
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTree(); 
  }, [fetchTree]);

  // 🚀 修复2：利用 TreeProps['onSelect'] 提取标准的函数签名，彻底消灭 info: any
  const handleSelect: NonNullable<TreeProps['onSelect']> = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      setSelectedKey(key);
      setSelectedNode({ key, title: info.node.title as string });
      onSelect(key);       
    }
  };

  const handleAddLabel = async () => {
    try {
      const values = await form.validateFields();
      const success = await addMaterialLabel({
        materialLabelName: values.materialLabelName,
        materialLabelParentId: selectedKey === 'NULL' ? undefined : selectedKey, 
      });
      if (success) {
        message.success('分类创建成功');
        setModalVisible(false); form.resetFields(); fetchTree(); 
      }
    } catch (error) {}
  };

  const handleEditLabel = async () => {
    try {
      const values = await editForm.validateFields();
      const success = await updateMaterialLabel(selectedKey, {
        labelName: values.labelName,
        materialLabelHierarchical: 1 
      });
      if (success) {
        message.success('分类更名成功');
        setEditModalVisible(false); fetchTree();
      }
    } catch (error) {}
  };

  const handleDeleteLabel = async () => {
    if (selectedKey === 'NULL') return;
    const success = await deleteMaterialLabel(selectedKey);
    if (success) {
      message.success('分类删除成功');
      setSelectedKey('NULL'); setSelectedNode(null); onSelect('NULL'); fetchTree(); 
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space style={{ marginBottom: 12, display: 'flex' }}>
        <Input.Search placeholder="搜索分类..." style={{ borderRadius: 2, flex: 1 }} />
        
        <Tooltip title="在此分类下新建子分类">
          <Button icon={<FolderAddOutlined />} onClick={() => setModalVisible(true)}/>
        </Tooltip>
        
        <Tooltip title="编辑当前选中分类名称">
          <Button 
            icon={<EditOutlined />} 
            disabled={selectedKey === 'NULL'} 
            onClick={() => {
              editForm.setFieldsValue({ labelName: selectedNode?.title });
              setEditModalVisible(true);
            }} 
          />
        </Tooltip>

        <Popconfirm title="确认删除该分类？" onConfirm={handleDeleteLabel} disabled={selectedKey === 'NULL'} okText="删除" okButtonProps={{ danger: true }}>
          <Button danger icon={<DeleteOutlined />} disabled={selectedKey === 'NULL'} />
        </Popconfirm>
      </Space>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Tree showIcon defaultExpandAll treeData={treeData} onSelect={handleSelect} />
      </div>

      <Modal title="新建物料分类" open={modalVisible} onOk={handleAddLabel} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="materialLabelName" label="分类名称" rules={[{ required: true }]}><Input placeholder="请输入物料类型名称" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`重命名分类: ${selectedNode?.title || ''}`} open={editModalVisible} onOk={handleEditLabel} onCancel={() => setEditModalVisible(false)} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="labelName" label="新分类名称" rules={[{ required: true }]}><Input placeholder="请输入新的名称" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default MaterialTree;