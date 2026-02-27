// src/pages/Device/components/DeviceTree.tsx
import React, { useEffect, useState } from 'react';
import { Tree, Input, Button, Spin } from 'antd';
import type { DataNode } from 'antd/es/tree'; // 🚀 引入 Antd 官方的树节点类型
import { PlusOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons';
import { getDeviceLabels } from '../service';
import { DeviceLabel } from '../typing'; // 🚀 引入我们自己定义的业务类型

interface DeviceTreeProps {
  onSelect: (selectedId: string) => void;
}

const DeviceTree: React.FC<DeviceTreeProps> = ({ onSelect }) => {
  // 🚀 修复点 1：把 any[] 替换为 DataNode[]
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);

  // 🚀 修复点 2：把 fetchTreeData 的定义挪到 useEffect 前面
  const fetchTreeData = async () => {
    setLoading(true);
    try {
      const data = await getDeviceLabels();
      
      // 🚀 修复点 3：给转换函数加上严格的入参和出参类型，彻底消灭 any
      const formatTree = (nodes: DeviceLabel[]): DataNode[] => {
        return nodes.map((node) => ({
          title: node.deviceLabelName,
          key: node.id,
          children: node.children ? formatTree(node.children) : undefined,
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
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

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
        <Button type="dashed" block icon={<PlusOutlined />} style={{ borderRadius: 2, fontSize: 12 }}>
          新建分类
        </Button>
        <Button icon={<SettingOutlined />} style={{ borderRadius: 2 }} />
      </div>
    </div>
  );
};

export default DeviceTree;