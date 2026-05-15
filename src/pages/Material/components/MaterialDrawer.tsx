// src/pages/Material/components/MaterialDrawer.tsx
import React, { useEffect, useState } from 'react';
import { Drawer, Tabs, Descriptions, Tag, Typography, Space, Badge, Table, Spin, Empty } from 'antd';
import { Material } from '../typing';
import { generateBOMFromRoutes } from '../service'; // 👈 引入聚合函数

const { Title, Text } = Typography;

interface MaterialDrawerProps {
  visible: boolean;
  material: Material | null;
  activeTab: string; 
  onTabChange: (key: string) => void; 
  onClose: () => void;
}

const MaterialDrawer: React.FC<MaterialDrawerProps> = ({ visible, material, activeTab, onTabChange, onClose }) => {
  // BOM 状态管理
  const [bomData, setBomData] = useState<any[]>([]);
  const [bomLoading, setBomLoading] = useState(false);

  // 当切换到 BOM Tab (key='2') 且物料存在时，触发聚合计算
// 当切换到 BOM Tab (key='2') 且物料存在时，触发聚合计算
  useEffect(() => {
    const fetchBomData = async () => {
      // 将 loading 状态移入异步函数中，规避 ESLint 的同步渲染检查
      setBomLoading(true);
      const targetId = material.materialId;
      try {
        const data = await generateBOMFromRoutes(targetId);
        setBomData(data);
      } finally {
        setBomLoading(false);
      }
    };

    if (visible && material && activeTab === '2') {
      fetchBomData();
    }
  }, [visible, material, activeTab]);

  if (!material) return null;

  // BOM 表格列定义
  const bomColumns = [
    { title: '物料编码', dataIndex: 'materialId', key: 'materialId', width: 160 },
    { 
      title: '物料名称', 
      dataIndex: 'materialName', 
      key: 'materialName',
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    { 
      title: '所需消耗总数', 
      key: 'quantity', 
      render: (_: any, record: any) => (
        <span style={{ color: '#1677ff', fontFamily: 'monospace', fontSize: 14 }}>
          {Number(record.materialQuantity).toFixed(4)} <span style={{ fontSize: 12, color: '#888' }}>{record.materialUnit}</span>
        </span>
      )
    }
  ];

  return (
    <Drawer title="物料全景档案" width={800} onClose={onClose} open={visible} styles={{ body: { padding: 0 } }}>
      <div style={{ padding: '24px 24px 16px 24px', background: '#fcfcfc', borderBottom: '1px solid #f0f0f0' }}>
        <Space align="baseline" style={{ marginBottom: 8 }}>
          <Title level={4} style={{ margin: 0, color: '#001529' }}>{material.materialName}</Title>
          <Tag color="purple" style={{ margin: 0 }}>版本: {material.materialVersion}</Tag>
        </Space>
        <div>
           <Text type="secondary" style={{ fontSize: 13, marginRight: 16 }}>流水号: <span style={{ fontFamily: 'monospace' }}>{material.materialId}</span></Text>
           <Text type="secondary" style={{ fontSize: 13 }}>物料族(Master ID): <span style={{ fontFamily: 'monospace' }}>{material.masterId}</span></Text>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} onChange={onTabChange} style={{ padding: '0 24px' }}
        items={[
          {
            key: '1', 
            label: '详细信息', 
            children: (
              <Descriptions column={2} style={{ marginTop: 16 }} bordered size="small">
                <Descriptions.Item label="规格型号" span={2}>
                  <Text strong>{material.materialSpecificationModel || '--'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="当前库存">
                   <Badge status={material.materialQuantity > 0 ? "success" : "error"} />
                   <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 8 }}>{material.materialQuantity}</span> {material.materialUnit}
                </Descriptions.Item>
                <Descriptions.Item label="供应商">
                  {material.materialSupplier || '--'}
                </Descriptions.Item>
                <Descriptions.Item label="物料技术描述" span={2}>
                  <div style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 4, color: '#555', minHeight: 60 }}>
                    {/* 🌟 核心修复：只显示 @@@ 前面的真实描述内容 */}
                    {material.materialDescription?.split('@@@')[0] || '暂无填写的技术描述或备注信息。'}
                  </div>
                </Descriptions.Item>
                
                {/* --- 🌟 新增：动态扩展属性展示区域 --- */}
                {(material as any).partCategory && (
                  <>
                    <Descriptions.Item label="零部件专属分类" span={2}>
                      <Tag color="cyan">{(material as any).partCategory}</Tag>
                    </Descriptions.Item>
                    {Object.entries((material as any).extendedInfo || {}).map(([key, value]) => (
                      <Descriptions.Item label={key} key={key}>
                        {String(value)}
                      </Descriptions.Item>
                    ))}
                  </>
                )}
              </Descriptions>
            )
          },
          {
            key: '2', 
            label: '单层级物料清单 (BOM)',
            children: (
              <div style={{ marginTop: 16 }}>
                {/* 🌟 核心功能：优先展示我们在创建/升版时手动维护的 BOM 数据 */}
                {((material as any).bomList && (material as any).bomList.length > 0) ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>✅ 已手动维护 BOM 清单：</div>
                    <Table
                      size="small"
                      dataSource={(material as any).bomList}
                      pagination={false}
                      bordered
                      rowKey={(record: any, index) => `${record.materialId}-${index}`}
                      columns={[
                        { title: '子项编码', dataIndex: 'materialId', key: 'materialId', width: 150 },
                        { title: '子项名称', dataIndex: 'materialName', key: 'materialName', width: 160 },
                        { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                        { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
                        { title: '位号', dataIndex: 'tag', key: 'tag', width: 100 },
                        { title: '备注', dataIndex: 'remark', key: 'remark' },
                      ]}
                    />
                  </div>
                ) : (
                  // 如果没有手动维护的 BOM，则退回使用你原来写的【逆向推演工艺路线】的逻辑
                  <Spin spinning={bomLoading} tip="正在逆向推演工艺路线并计算所需物料...">
                    {bomData.length > 0 ? (
                      <Table 
                        columns={bomColumns} 
                        dataSource={bomData} 
                        rowKey="materialId" 
                        pagination={false} 
                        size="small"
                        bordered
                      />
                    ) : (
                      <Empty 
                        description={bomLoading ? '' : '当前物料暂无显式手动维护的 BOM，且未配置关联的工艺路线。'} 
                        style={{ margin: '40px 0' }}
                      />
                    )}
                  </Spin>
                )}
              </div>
            )
          }
        ]}
      />
    </Drawer>
  );
};

export default MaterialDrawer;