import React, { useEffect, useState } from 'react';
import { Card, Tag, Spin, Empty, Row, Col } from 'antd';
import { DatabaseOutlined, EnvironmentOutlined, BarcodeOutlined } from '@ant-design/icons';
import { Device } from '../typing';
import { getDevices } from '../service';

interface DeviceKanbanProps {
  selectedLabelId: string;
}

// 🚀 核心：恢复你的高级感配色，并映射后端的英文状态
const STATUS_MAP: Record<string, { text: string; color: string }> = {
  // 英文规范（新数据）
  'PLANNED': { text: '规划中', color: '#d9d9d9' },
  'INSTALLING': { text: '安装调试', color: '#1677ff' },
  'IDLE': { text: '闲置', color: '#d4b106' },
  'RUNNING': { text: '运行中', color: '#13c2c2' },
  'MAINTENANCE': { text: '保养维护', color: '#1677ff' },
  'REPAIR': { text: '故障维修', color: '#ff7875' },
  'SCRAPPED': { text: '报废', color: '#d9d9d9' },
  // 🚀 核心修复：兼容以前存进去的中文脏数据，让它们也亮起来！
  '规划中': { text: '规划中', color: '#d9d9d9' },
  '安装调试': { text: '安装调试', color: '#1677ff' },
  '闲置': { text: '闲置', color: '#d4b106' },
  '运行中': { text: '运行中', color: '#13c2c2' },
  '保养维护': { text: '保养维护', color: '#1677ff' },
  '故障维修': { text: '故障维修', color: '#ff7875' },
  '报废': { text: '报废', color: '#d9d9d9' },
};

const DeviceKanban: React.FC<DeviceKanbanProps> = ({ selectedLabelId }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  // 🚀 修复 Hook 依赖报错：把 fetchData 移入 useEffect 内部
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getDevices({ labelId: selectedLabelId });
        setDevices(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLabelId]);

  return (
    <div style={{ padding: '16px 24px', height: '100%', overflowY: 'auto', background: '#F5F7FA' }}>
      <Spin spinning={loading}>
        {devices.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该分类下暂无设备" style={{ marginTop: 100 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {devices.map((device) => {
              // 🚀 匹配字典，如果匹配不到就用默认灰色
              const statusConfig = STATUS_MAP[device.deviceStatus] || { text: device.deviceStatus, color: '#d9d9d9' };
              
              return (
                <Col xs={24} sm={12} md={8} lg={8} xl={6} key={device.deviceId}> {/* 🚀 修复 id 报错 */}
                  <Card 
                    hoverable 
                    bodyStyle={{ padding: '16px' }}
                    style={{ borderRadius: 2, border: '1px solid #e8e8e8', boxShadow: 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BarcodeOutlined /> {device.deviceId} {/* 🚀 修复 id 报错 */}
                      </div>
                      {/* 🚀 恢复你的颜色和中文 */}
                      <Tag color={statusConfig.color} style={{ margin: 0, borderRadius: 2 }}>
                        {statusConfig.text}
                      </Tag>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {device.deviceName}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <DatabaseOutlined style={{ color: '#bfbfbf' }} />
                        {device.deviceBrand} {device.deviceSpecificationModel ? ` | ${device.deviceSpecificationModel}` : ''}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EnvironmentOutlined /> {device.deviceLocation || '位置未填写'}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default DeviceKanban;