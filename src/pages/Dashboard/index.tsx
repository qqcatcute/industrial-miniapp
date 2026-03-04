// src/pages/Dashboard/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  Statistic, Row, Col, Button, Space, Typography, Tag, Progress,
  Spin, theme
} from 'antd';
import { 
  DatabaseOutlined, GoldOutlined, PartitionOutlined, ThunderboltOutlined,
  CheckCircleFilled, ArrowRightOutlined
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell'; 
import { queryDashboardStats, DashboardStats } from './service';
import { useGlobalStore } from '@/store';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography; 

const COLORS = {
  running: '#13c2c2',    // 科技青 (运行中)
  idle: '#ffc53d',       // 活泼明黄 (闲置) - 替换了原来的 #d4b106
  installing: '#1677FF', // 品牌蓝 (安装调试) - 对应看板的蓝色
  fault: '#ff7875',      // 柔和红 (故障/报警) - 保留原有的红色
  primary: '#1677FF',    // 全局主色
  bgCard: '#f7f9fc'      // 极淡的灰蓝背景
};

const SimplePieChart = ({ data }: { data: { value: number; color: string; name: string }[] }) => {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  
  const segments = data.map((item, index, arr) => {
    const previousValueSum = arr.slice(0, index).reduce((a, b) => a + b.value, 0);
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const offset = total > 0 ? -(previousValueSum / total) * 100 : 0;
    
    return {
      ...item,
      dashArray: `${percentage} 100`,
      offset
    };
  });

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
        {segments.map((item, index) => (
          <circle
            key={index}
            r="16"
            cx="16"
            cy="16"
            fill="transparent"
            stroke={item.color}
            strokeWidth="32" 
            strokeDasharray={item.dashArray}
            strokeDashoffset={item.offset}
            style={{ transition: 'all 0.3s' }}
          />
        ))}
        {/* 如果总数为 0，给个灰色底圈兜底 */}
        {total === 0 && <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f0f0f0" strokeWidth="32" />}
        <circle r="11" cx="16" cy="16" fill="#fff" />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>总设备</div>
        <div style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'DIN Alternate, Roboto, monospace', color: '#333', lineHeight: 1 }}>{total}</div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentFactory } = useGlobalStore();
  const { token } = theme.useToken();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardStats>({
    deviceTotal: 0, deviceRunning: 0, deviceInstalling: 0, deviceIdle: 0, // 🌟 2. 初始状态同步修改
    materialWarningCount: 0, routeTotal: 0
  });

  useEffect(() => {
    queryDashboardStats().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    queryDashboardStats().then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  const quickActions = [
    { title: '新建设备', icon: <DatabaseOutlined />, path: '/device', desc: '录入台账' },
    { title: '物料入库', icon: <GoldOutlined />, path: '/material', desc: 'BOM管理' },
    { title: '工艺编排', icon: <PartitionOutlined />, path: '/route', desc: '路线设计' },
  ];

  // 计算百分比安全函数，防止 NaN
  const safePercent = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <ContentShell
      breadcrumbItems={[{ title: '首页' }, { title: '生产概览' }]}
      title={
        <Space>
          <span style={{ fontWeight: 600, color: '#1f1f1f' }}>{currentFactory}</span>
          <Tag color="cyan" bordered={false} style={{ color: COLORS.running }}>● 实时同步中</Tag>
        </Space>
      }
      searchPlaceholder="全局搜索生产要素..."
      actions={[
        <Button 
          key="refresh" 
          type="text" 
          icon={<ThunderboltOutlined />} 
          onClick={handleRefresh} 
          loading={loading}
          style={{ color: '#888' }}
        >
          刷新数据
        </Button>
      ]}
    >
      <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ paddingTop: 100, textAlign: 'center' }}>
            <Spin size="large" tip="正在聚合全车间生产数据..." />
          </div>
        ) : (
          <>
            {/* === 核心指标区 === */}
            <ProCard ghost gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <ProCard colSpan={8} layout="center" bordered style={{ height: 110, borderRadius: 4, boxShadow: 'none' }}>
                <Statistic 
                  title={<span style={{fontSize: 13, color: '#888'}}>车间设备 (Total)</span>}
                  value={data.deviceTotal} 
                  valueStyle={{ fontSize: 28, fontFamily: 'Roboto, monospace', fontWeight: 600, color: '#1f1f1f' }}
                  prefix={<DatabaseOutlined style={{ color: COLORS.primary, fontSize: 20, background: '#e6f4ff', padding: 8, borderRadius: '50%' }} />}
                />
              </ProCard>
              
              <ProCard colSpan={8} layout="center" bordered style={{ height: 110, borderRadius: 4, boxShadow: 'none' }}>
                <Statistic 
                  title={<span style={{fontSize: 13, color: '#888'}}>物料数目(Number)</span>}
                  value={data.materialWarningCount} 
                  valueStyle={{ 
                    fontSize: 28, fontFamily: 'Roboto, monospace', fontWeight: 600, 
                    color: data.materialWarningCount > 0 ? COLORS.fault : '#1f1f1f' 
                  }}
                  prefix={<GoldOutlined style={{ color: data.materialWarningCount > 0 ? COLORS.fault : COLORS.running, fontSize: 20, background: data.materialWarningCount > 0 ? '#fff1f0' : '#e6fffb', padding: 8, borderRadius: '50%' }} />}
                />
              </ProCard>

              <ProCard colSpan={8} layout="center" bordered style={{ height: 110, borderRadius: 4, boxShadow: 'none' }}>
                <Statistic 
                  title={<span style={{fontSize: 13, color: '#888'}}>生效工艺 (Routes)</span>}
                  value={data.routeTotal} 
                  valueStyle={{ fontSize: 28, fontFamily: 'Roboto, monospace', fontWeight: 600, color: '#1f1f1f' }}
                  prefix={<PartitionOutlined style={{ color: '#722ed1', fontSize: 20, background: '#f9f0ff', padding: 8, borderRadius: '50%' }} />}
                />
              </ProCard>
            </ProCard>

            <Row gutter={[16, 16]}>
{/* === 左侧：设备状态 === */}
<Col span={16}>
  <ProCard 
    title={<span style={{ fontWeight: 600 }}>设备运行状态</span>}
    bordered 
    headerBordered 
    style={{ height: 320, borderRadius: 4 }}
  >
    <Row align="middle" justify="space-around" style={{ height: '100%' }}>
      <Col span={9} style={{ display: 'flex', justifyContent: 'center' }}>
        <SimplePieChart 
          data={[
            { value: data.deviceRunning, color: COLORS.running, name: '运行中' },
            { value: data.deviceIdle, color: COLORS.idle, name: '闲置' },
            // 🌟 3. 修改环形图第三项数据
            { value: data.deviceInstalling, color: COLORS.installing, name: '安装调试' }, 
          ]} 
        />
      </Col>
      
      <Col span={14} style={{ paddingLeft: 10 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 运行中 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#555' }}>
              <span><span style={{ color: COLORS.running, fontSize: 20, marginRight: 4 }}>•</span> 运行中 (Running)</span>
              <span style={{ fontWeight: 500 }}>{data.deviceRunning} 台</span>
            </div>
            <Progress percent={safePercent(data.deviceRunning, data.deviceTotal)} size="small" strokeColor={COLORS.running} trailColor="#f0f0f0" showInfo={false} strokeWidth={6} />
          </div>
          {/* 闲置 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#555' }}>
              <span><span style={{ color: COLORS.idle, fontSize: 20, marginRight: 4 }}>•</span> 闲置 (Idle)</span>
              <span style={{ fontWeight: 500 }}>{data.deviceIdle} 台</span>
            </div>
            <Progress percent={safePercent(data.deviceIdle, data.deviceTotal)} size="small" strokeColor={COLORS.idle} trailColor="#f0f0f0" showInfo={false} strokeWidth={6} />
          </div>
          
          {/* 🌟 4. 修改第三个进度条：文案、颜色和数据引用 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#555' }}>
              <span><span style={{ color: COLORS.installing, fontSize: 20, marginRight: 4 }}>•</span> 安装调试 (Installing)</span>
              <span style={{ fontWeight: 500 }}>{data.deviceInstalling} 台</span>
            </div>
            <Progress percent={safePercent(data.deviceInstalling, data.deviceTotal)} size="small" strokeColor={COLORS.installing} trailColor="#f0f0f0" showInfo={false} strokeWidth={6} />
          </div>

        </Space>
      </Col>
    </Row>
  </ProCard>
</Col>

              {/* === 右侧：快捷操作 === */}
              <Col span={8}>
                <ProCard 
                  title={<span style={{ fontWeight: 600 }}>快捷操作</span>}
                  bordered 
                  headerBordered 
                  style={{ height: 320, borderRadius: 4 }}
                  bodyStyle={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {quickActions.map((action, idx) => (
                      <div 
                        key={idx}
                        onClick={() => navigate(action.path)}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '12px 16px',
                          background: COLORS.bgCard, 
                          border: '1px solid transparent',
                          borderRadius: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.primary; 
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.background = COLORS.bgCard;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Space size={12}>
                          <div style={{ 
                            width: 36, height: 36, borderRadius: 8, background: '#fff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #eee'
                          }}>
                            <span style={{ fontSize: 18, color: COLORS.primary }}>{action.icon}</span>
                          </div>
                          <div>
                             <div style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>{action.title}</div>
                             <div style={{ fontSize: 12, color: '#999' }}>{action.desc}</div>
                          </div>
                        </Space>
                        <ArrowRightOutlined style={{ fontSize: 12, color: '#ccc' }} />
                      </div>
                    ))}
                  </Space>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '8px 0', 
                    borderTop: '1px dashed #f0f0f0',
                    color: COLORS.running,
                    fontSize: 12,
                    marginTop: 8
                  }}>
                    {/* <Space>
                      <CheckCircleFilled /> 数据与各服务模块通信正常
                    </Space> */}
                  </div>
                </ProCard>
              </Col>
            </Row>
          </>
        )}
      </div>
    </ContentShell>
  );
};

export default Dashboard;