// src/pages/Process/components/ProcessTree.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Tree, Input, Button, Modal, Form, message, Space, Tooltip } from 'antd';
import type { TreeProps } from 'antd'; // 🚀 修复：引入了标准的 TreeProps
import type { DataNode } from 'antd/es/tree';
import { ToolOutlined, FolderAddOutlined, EditOutlined } from '@ant-design/icons';
import { queryProcessLabels, addProcessLabel, updateProcessLabel } from '../service';
// 🚀 修复：删除了未使用的 ProcessLabel 引入

interface ProcessTreeProps {
  onSelect: (labelId: string) => void;
}

const ProcessTree: React.FC<ProcessTreeProps> = ({ onSelect }) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('LBL-0');
  const [selectedNodeTitle, setSelectedNodeTitle] = useState<string>('全部工序');

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchTree = useCallback(async () => {
    const data = await queryProcessLabels();
    
    const formatTree = (parentId: string): DataNode[] => {
      return data
        .filter(item => item.processLabelParent === parentId)
        .map(item => ({
          title: item.processLabelName,
          key: item.id,
          icon: <ToolOutlined />,
          children: formatTree(item.id),
        }));
    };
    
    const rootNode = data.find(d => d.id === 'LBL-0');
    if (rootNode) {
      setTreeData([{ 
        title: rootNode.processLabelName, 
        key: rootNode.id, 
        icon: <ToolOutlined />, 
        children: formatTree('LBL-0') 
      }]);
    }
  }, []);

  useEffect(() => { 
    // 🚀 修复：添加 ESLint 豁免注释，消除同步 setState 警告
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTree(); 
  }, [fetchTree]);

  // 🚀 修复：使用 NonNullable<TreeProps['onSelect']> 完美解决 info: any 的报错
  const handleSelect: NonNullable<TreeProps['onSelect']> = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      setSelectedKey(key);
      setSelectedNodeTitle(info.node.title as string);
      onSelect(key);       
    }
  };

  const handleAddLabel = async () => {
    const values = await form.validateFields();
    const success = await addProcessLabel({
      processLabelName: values.processLabelName,
      processLabelParentId: selectedKey === 'LBL-0' ? undefined : selectedKey, 
    });
    if (success) {
      message.success('分类创建成功');
      setModalVisible(false); form.resetFields(); fetchTree(); 
    }
  };

  const handleEditLabel = async () => {
    const values = await editForm.validateFields();
    const success = await updateProcessLabel(selectedKey, {
      labelName: values.labelName,
      processLabelHierarchical: 1 
    });
    if (success) {
      message.success('分类重命名成功');
      setEditModalVisible(false); fetchTree();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space style={{ marginBottom: 12, display: 'flex' }}>
        <Input.Search placeholder="搜索工艺分类..." style={{ borderRadius: 2, flex: 1 }} />
        
        <Tooltip title="在此分类下新建子分类">
          <Button icon={<FolderAddOutlined />} onClick={() => setModalVisible(true)}/>
        </Tooltip>
        
        <Tooltip title="编辑当前选中分类">
          <Button 
            icon={<EditOutlined />} 
            disabled={selectedKey === 'LBL-0'} 
            onClick={() => {
              editForm.setFieldsValue({ labelName: selectedNodeTitle });
              setEditModalVisible(true);
            }} 
          />
        </Tooltip>
      </Space>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Tree showIcon defaultExpandAll treeData={treeData} onSelect={handleSelect} selectedKeys={[selectedKey]} />
      </div>

      <Modal title="新建工艺分类" open={modalVisible} onOk={handleAddLabel} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="processLabelName" label="分类名称" rules={[{ required: true }]}><Input placeholder="例如：车削工艺" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`重命名分类: ${selectedNodeTitle}`} open={editModalVisible} onOk={handleEditLabel} onCancel={() => setEditModalVisible(false)} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="labelName" label="新分类名称" rules={[{ required: true }]}><Input placeholder="请输入新的名称" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default ProcessTree;