// src/pages/Material/components/MaterialDrawer.tsx
import React from 'react';
import { Drawer, Tabs, Descriptions, Tag, Typography, Space, Badge } from 'antd';
import { Material } from '../typing';

const { Title, Text } = Typography;

interface MaterialDrawerProps {
  visible: boolean;
  material: Material | null;
  activeTab: string; 
  onTabChange: (key: string) => void; 
  onClose: () => void;
}

const MaterialDrawer: React.FC<MaterialDrawerProps> = ({ visible, material, activeTab, onTabChange, onClose }) => {
  if (!material) return null;

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
                {/* 💡 以下渲染的每一个字段，都是基于后端接口文档真实存在的字段 */}
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
                
                {/* 💡 已经删除了刚才写死的“系统创建标识”假数据 */}

                <Descriptions.Item label="物料技术描述" span={2}>
                  <div style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 4, color: '#555', minHeight: 60 }}>
                    {material.materialDescription || '暂无填写的技术描述或备注信息。'}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: '2', label: 'BOM 结构',
            children: (
              <div style={{ marginTop: 16, textAlign: 'center', padding: '60px 0', color: '#999', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                 {/* BOM目前后端确实没有接口，这里保留提示语 */}
                 请等待后端提供 BOM / 结构化树状接口后开启编辑
              </div>
            )
          }
        ]}
      />
    </Drawer>
  );
};
export default MaterialDrawer;