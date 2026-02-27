// src/pages/Device/components/DeviceKanban.tsx
import React, { useEffect, useState } from 'react';
import { Card, Tag, Spin, Empty, Row, Col } from 'antd';
import { DatabaseOutlined, EnvironmentOutlined, BarcodeOutlined } from '@ant-design/icons';
import { Device } from '../typing';
import { getDevices } from '../service';

interface DeviceKanbanProps {
  selectedLabelId: string;
}

const DeviceKanban: React.FC<DeviceKanbanProps> = ({ selectedLabelId }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedLabelId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 严格调用现有的获取设备接口
      const res = await getDevices({ labelId: selectedLabelId });
      setDevices(res.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      '运行中': '#13c2c2', '闲置': '#d4b106', '保养维护': '#1677ff', '故障维修': '#ff7875', '报废': '#d9d9d9',
    };
    return map[status] || 'default';
  };

  return (
    <div style={{ padding: '16px 24px', height: '100%', overflowY: 'auto', background: '#F5F7FA' }}>
      <Spin spinning={loading}>
        {devices.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该分类下暂无设备" style={{ marginTop: 100 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {devices.map((device) => (
              <Col xs={24} sm={12} md={8} lg={8} xl={6} key={device.id}>
                {/* Odoo 风格极简卡片 */}
                <Card 
                  hoverable 
                  bodyStyle={{ padding: '16px' }}
                  style={{ borderRadius: 2, border: '1px solid #e8e8e8', boxShadow: 'none' }}
                >
                  {/* 顶部：状态标 & 编码 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BarcodeOutlined /> {device.id}
                    </div>
                    <Tag color={getStatusColor(device.deviceStatus)} style={{ margin: 0, borderRadius: 2 }}>
                      {device.deviceStatus}
                    </Tag>
                  </div>

                  {/* 中间：设备名称 & 品牌型号 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {device.deviceName}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DatabaseOutlined style={{ color: '#bfbfbf' }} />
                      {device.deviceBrand} {device.deviceSpecificationModel ? ` | ${device.deviceSpecificationModel}` : ''}
                    </div>
                  </div>

                  {/* 底部：位置信息 */}
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EnvironmentOutlined /> {device.deviceLocation || '位置未填写'}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default DeviceKanban;