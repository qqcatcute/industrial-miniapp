import React, { useEffect, useState } from 'react';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Popconfirm, Table, Badge, Spin, Descriptions } from 'antd'; // 🚀 引入了 Spin 和 Descriptions
import { TableRowSelection } from 'antd/es/table/interface';
import { Device, SparePart } from '../typing';
import { getDevices, getDeviceDetail } from '../service'; // 🚀 引入获取详情的 API
import './OdooTable.css';

interface DeviceTableProps {
  selectedLabelId: string;
  actionRef: React.MutableRefObject<ActionType | undefined>;
  onEdit?: (record: Device) => void;
  rowSelection?: TableRowSelection<Device>; 
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  'PLANNED': { text: '规划中', color: '#d9d9d9' },
  'INSTALLING': { text: '安装调试', color: '#1677ff' },
  'IDLE': { text: '闲置', color: '#d4b106' },
  'RUNNING': { text: '运行中', color: '#13c2c2' },
  'MAINTENANCE': { text: '保养维护', color: '#1677ff' },
  'REPAIR': { text: '故障维修', color: '#ff7875' },
  'SCRAPPED': { text: '报废', color: '#d9d9d9' },
};

// ==========================================
// 🚀 核心新增：独立的异步展开子组件
// ==========================================
const ExpandedDetail: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Device | null>(null);

  // 组件挂载时，去拉取这台设备的完整详情
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getDeviceDetail(deviceId);
        setDetail(data);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [deviceId]);

  if (loading) {
    return <div style={{ padding: '32px 0', textAlign: 'center' }}><Spin tip="正在拉取设备完整档案..." /></div>;
  }

  if (!detail) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>档案加载失败</div>;
  }

  // 尝试解析后端恶心的 JSON 字符串为对象，以便优美展示
  let paramsObj: Record<string, string> = {};
  if (detail.deviceParameter) {
    try {
      let parsed = JSON.parse(detail.deviceParameter);
      if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
      paramsObj = parsed;
    } catch {
      // 解析失败则留空
    }
  }

  const spareColumns = [
    { title: '备件名称', dataIndex: 'sparePartName', key: 'sparePartName' },
    { title: '品牌', dataIndex: 'sparePartBrand', key: 'sparePartBrand' },
    { title: '规格型号', dataIndex: 'sparePartSpecificationModel', key: 'sparePartSpecificationModel' },
    { 
      title: '当前库存', 
      key: 'stock', 
      render: (_: unknown, sp: SparePart) => (
        <span>
          <Badge status={sp.sparePartQuantity < 10 ? 'error' : 'success'} /> 
          {sp.sparePartQuantity} {sp.sparePartUnit}
        </span>
      ) 
    },
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#fafbfc', border: '1px solid #f0f0f0', borderRadius: 4, margin: '8px 16px' }}>
      {/* 1. 优美的基础与扩展信息面板 */}
      <Descriptions title="📄 设备详细档案" size="small" column={3} bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="生产厂家">{detail.deviceManufacturer || '--'}</Descriptions.Item>
        <Descriptions.Item label="出厂日期">{detail.deviceManufactureDate || '--'}</Descriptions.Item>
        <Descriptions.Item label="设计使用年限">{detail.deviceLifespan ? `${detail.deviceLifespan} 年` : '--'}</Descriptions.Item>
        <Descriptions.Item label="设备描述" span={3}>{detail.deviceDescription || '--'}</Descriptions.Item>
        
        {/* 动态渲染所有的 JSON 扩展技术参数 */}
        {Object.entries(paramsObj).map(([key, value]) => (
          <Descriptions.Item label={key} key={key}>
            <span style={{ color: '#1677ff', fontWeight: 500 }}>{String(value)}</span>
          </Descriptions.Item>
        ))}
      </Descriptions>

      {/* 2. 原来的备品备件清单 */}
      <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>📦 适用的备品备件清单：</div>
      {(!detail.spareParts || detail.spareParts.length === 0) ? (
        <div style={{ color: '#999', padding: '8px 0' }}>暂未配置关联备件，请在编辑中添加。</div>
      ) : (
        <Table 
          columns={spareColumns} 
          dataSource={detail.spareParts} 
          rowKey="id"
          pagination={false} 
          size="small" 
          bordered={true}
          style={{ width: '80%' }}
        />
      )}
    </div>
  );
};


// ==========================================
// 主表格组件
// ==========================================
const DeviceTable: React.FC<DeviceTableProps> = ({ selectedLabelId, actionRef, onEdit, rowSelection }) => {
  const columns: ProColumns<Device>[] = [
    { title: '设备编码', dataIndex: 'deviceId', width: 140, copyable: true, fixed: 'left' },
    { title: '设备名称', dataIndex: 'deviceName', width: 160, ellipsis: true },
    { title: '规格型号', dataIndex: 'deviceSpecificationModel', width: 140, ellipsis: true },
    { title: '品牌', dataIndex: 'deviceBrand', width: 100 },
    { 
      title: '状态', 
      dataIndex: 'deviceStatus', 
      width: 100,
      render: (_, record) => {
        const statusConfig = STATUS_MAP[record.deviceStatus] || { text: record.deviceStatus, color: '#d9d9d9' };
        return <Tag color={statusConfig.color} style={{ borderRadius: 2 }}>{statusConfig.text}</Tag>;
      }
    },
    { title: '位置', dataIndex: 'deviceLocation', width: 140, search: false },
    {
      title: '操作', valueType: 'option', width: 140, fixed: 'right',
      render: (_, record) => [
        <a key="edit" onClick={() => onEdit && onEdit(record)}>编辑</a>,
        <Popconfirm key="delete" title="确定删除吗？">
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div style={{ height: '100%', padding: '0 16px', background: '#fff' }}>
      <ProTable<Device>
        className="odoo-style-table"
        columns={columns}
        actionRef={actionRef}
        cardBordered={false}
        params={{ labelId: selectedLabelId === 'ALL' ? undefined : selectedLabelId }}
        request={async (params) => getDevices(params)}
        rowKey="deviceId"
        search={false}
        options={{ setting: { listsHeight: 400 }, reload: false, density: false }}
        bordered={false}
        tableAlertRender={false}
        scroll={{ x: 'max-content', y: 'calc(100vh - 310px)' }} 
        pagination={{ pageSize: 10, size: 'small', showTotal: (total) => `共 ${total} 项` }}
        size="small"
        rowSelection={rowSelection} 
        expandable={{
          // 🚀 核心修改：使用刚才定义的异步子组件来渲染展开行
          expandedRowRender: (record) => <ExpandedDetail deviceId={record.deviceId} />,
          rowExpandable: () => true, 
        }}
        style={{ margin: 0 }}
      />
    </div>
  );
};

export default DeviceTable;