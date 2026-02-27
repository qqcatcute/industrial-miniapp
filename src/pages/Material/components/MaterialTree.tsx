// src/pages/Material/components/MaterialTree.tsx
import React, { useEffect, useState } from 'react';
import { Tree, Input, Button, Modal, Form, message, Space, Tooltip, Popconfirm } from 'antd';
import { AppstoreOutlined, FolderOpenOutlined, FolderAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMaterialLabels, addMaterialLabel, deleteMaterialLabel } from '../service';
import { MaterialLabel } from '../typing';

interface MaterialTreeProps {
  onSelect: (labelId: string) => void;
}

const MaterialTree: React.FC<MaterialTreeProps> = ({ onSelect }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [treeData, setTreeData] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('NULL'); // 记录当前选中的节点

  // 新建分类弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchTree = async () => {
    const data = await getMaterialLabels();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatTree = (nodes: MaterialLabel[]): any[] => {
      return nodes.map(node => ({
        title: node.materialLabelName,
        key: node.id,
        icon: node.children ? <FolderOpenOutlined /> : <AppstoreOutlined />,
        children: node.children ? formatTree(node.children) : undefined,
      }));
    };
    setTreeData([{
      title: '全部物料',
      key: 'NULL',
      icon: <AppstoreOutlined />,
      children: formatTree(data)
    }]);
  };

 // 💡 修复 2：为了满足严格模式，把 fetchTree 定义写在 useEffect 内部
  useEffect(() => {
    const fetchTree = async () => {
      const data = await getMaterialLabels();
      // 把 any[] 换掉
      const formatTree = (nodes: MaterialLabel[]): Record<string, any>[] => {
        return nodes.map(node => ({
          title: node.materialLabelName,
          key: node.id,
          icon: node.children ? <FolderOpenOutlined /> : <AppstoreOutlined />,
          children: node.children ? formatTree(node.children) : undefined,
        }));
      };
      setTreeData([{
        title: '全部物料',
        key: 'NULL',
        icon: <AppstoreOutlined />,
        children: formatTree(data)
      }]);
    };
    
    fetchTree();
  }, []); // 依赖项为空，表示只在挂载时执行一次
  // 💡 提交新建分类
  const handleAddLabel = async () => {
    try {
      const values = await form.validateFields();
      const success = await addMaterialLabel({
        materialLabelName: values.materialLabelName,
        materialLabelParent: selectedKey === 'NULL' ? 'NULL' : selectedKey,
        materialLabelHierarchical: selectedKey === 'NULL' ? 0 : 1 // 简化层级处理
      });
      if (success) {
        message.success('分类创建成功');
        setModalVisible(false);
        form.resetFields();
        fetchTree(); // 💡 创建成功后重新拉取树数据
      }
    } catch (error) {
      // 校验失败
      console.error('表单校验失败:', error);
    }
  };
// 💡 提交删除分类
  const handleDeleteLabel = async () => {
    if (selectedKey === 'NULL') {
      message.warning('无法删除根节点');
      return;
    }
    
    try {
      const success = await deleteMaterialLabel(selectedKey);
      if (success) {
        message.success('分类删除成功');
        // 删除后，选中状态退回到全部物料
        setSelectedKey('NULL');
        onSelect('NULL'); 
        fetchTree(); // 重新拉取最新的树数据
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 💡 顶部操作区：搜索 + 新建 + 删除 */}
      <Space style={{ marginBottom: 12, display: 'flex' }}>
        <Input.Search 
          placeholder="搜索分类..." 
          style={{ borderRadius: 2, flex: 1 }} 
        />
        <Tooltip title="在当前选中节点下新建分类">
          <Button 
            icon={<FolderAddOutlined />} 
            onClick={() => setModalVisible(true)}
          />
        </Tooltip>
        
        {/* 💡 新增的删除按钮与气泡确认框 */}
        <Popconfirm
          title="警告：确认删除该分类？"
          description="删除后，该分类下的物料将失去关联！"
          onConfirm={handleDeleteLabel}
          disabled={selectedKey === 'NULL'} // 防呆：没选中或者选的是根节点时禁用
          okText="确认删除"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="删除当前选中的分类">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              disabled={selectedKey === 'NULL'} 
            />
          </Tooltip>
        </Popconfirm>
      </Space>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0) {
              const key = selectedKeys[0] as string;
              setSelectedKey(key); // 记录当前节点，用于新建子节点
              onSelect(key);       // 传给父组件联动表格
            }
          }}
        />
      </div>

      {/* 💡 新建分类弹窗 */}
      <Modal
        title="新建物料分类"
        open={modalVisible}
        onOk={handleAddLabel}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        destroyOnClose
        okText="确认创建"
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="materialLabelName" 
            label="分类名称" 
            rules={[{ required: true, message: '请输入分类名称！' }]}
          >
            <Input placeholder="请输入物料类型名称 (如：传动件)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialTree;