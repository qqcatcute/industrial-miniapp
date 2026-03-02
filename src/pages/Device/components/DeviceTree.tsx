import React, { useEffect, useState } from 'react';
import { Tree, Input, Button, Spin, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { SettingOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
// 🚀 引入高级表单和刚刚写的 API
import { ModalForm, ProFormText, ProFormTreeSelect } from '@ant-design/pro-components';
import { getDeviceLabels, addDeviceLabel } from '../service';
import { DeviceLabel } from '../typing';

interface DeviceTreeProps {
  onSelect: (selectedId: string) => void;
}

const DeviceTree: React.FC<DeviceTreeProps> = ({ onSelect }) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);

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
            onSelect={(selectedKeys) => {
              if (selectedKeys.length > 0) {
                onSelect(selectedKeys[0] as string);
              }
            }}
          />
        </Spin>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {/* 🚀 核心改造：将普通按钮包裹进 ModalForm */}
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
              // 如果没选上级，或者选了"全部设备"(ALL)，都不传 parentId，当做根节点
              deviceLabelParentId: (!values.deviceLabelParentId || values.deviceLabelParentId === 'ALL') ? undefined : values.deviceLabelParentId
            });
            if (success) {
              message.success('分类创建成功');
              fetchTreeData(); // 创建成功后自动刷新左侧树！
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
            // 🚀 直接复用左侧树已经请求回来的数据，减少一次网络请求
            request={async () => treeData[0]?.children || []}
            fieldProps={{
              fieldNames: { label: 'title', value: 'key' },
              treeDefaultExpandAll: true,
              allowClear: true,
            }}
          />
        </ModalForm>

        <Button icon={<SettingOutlined />} style={{ borderRadius: 2 }} />
      </div>
    </div>
  );
};

export default DeviceTree;