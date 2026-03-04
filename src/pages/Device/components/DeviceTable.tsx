// src/pages/Device/components/DeviceTable.tsx
import React, { useEffect, useState } from 'react';
import { ProTable, ActionType, ProColumns, ModalForm, ProFormText, ProFormDigit } from '@ant-design/pro-components';
import { Tag, Popconfirm, Table, Badge, Spin, Descriptions, Button, message, Space } from 'antd'; 
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TableRowSelection } from 'antd/es/table/interface';
import { Device, SparePart } from '../typing';
// 🚀 引入我们刚刚在 service 里写好的备件全套独立接口
import { getDevices, queryDevices,getDeviceDetail, getDeviceSpareParts, addDeviceSparePart, updateDeviceSparePart, deleteDeviceSpareParts, deleteDevices } from '../service'; 
import './OdooTable.css';

interface DeviceTableProps {
  selectedLabelId: string;
  keyword?: string; // 🚀 新增
  actionRef: React.MutableRefObject<ActionType | undefined>;
  onEdit?: (record: Device) => void;
  rowSelection?: TableRowSelection<Device>; 
}

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
const DEPRECIATION_MAP: Record<string, string> = {
  'SLM': '年限平均法',
  'UOP': '工作量法',
  'DDB': '双倍余额递减法',
  'SYD': '年数总和法',
  'GDM': '组折旧法',
  'CDM': '部件折旧法',
  'ND': '不计提折旧',
  'ODM': '其他折旧方式'
};
// ==========================================
// 🚀 核心重构：内嵌的设备详情与备件 CRUD 管理台
// ==========================================
const ExpandedDetail: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Device | null>(null);
  
  // 备品备件状态与数据
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [spLoading, setSpLoading] = useState(false);

  // 获取基础详情
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

  // 🚀 获取该设备下挂载的备品备件列表
  const fetchSpareParts = async () => {
    setSpLoading(true);
    try {
      const res = await getDeviceSpareParts(deviceId);
      setSpareParts(res.data);
    } finally {
      setSpLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareParts();
  }, [deviceId]);

  if (loading) {
    return <div style={{ padding: '32px 0', textAlign: 'center' }}><Spin tip="正在拉取设备完整档案..." /></div>;
  }

  if (!detail) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>档案加载失败</div>;
  }

  let paramsObj: Record<string, string> = {};
  if (detail.deviceParameter) {
    try {
      let parsed = JSON.parse(detail.deviceParameter);
      if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
      paramsObj = parsed;
    } catch { }
  }

  // 备件表格的列定义
const spareColumns = [
    { title: '备件名称', dataIndex: 'sparePartName', key: 'sparePartName' },
    { title: '品牌', dataIndex: 'sparePartBrand', key: 'sparePartBrand' },
    { title: '规格型号', dataIndex: 'sparePartSpecificationModel', key: 'sparePartSpecificationModel' },
    // 🚀 新增列：展示价格和存放位置
    { 
      title: '参考单价', 
      dataIndex: 'sparePartPrice', 
      key: 'sparePartPrice',
      render: (val: any) => val ? `¥${val}` : '--'
    },
    { title: '存放库位', dataIndex: 'sparePartLocation', key: 'sparePartLocation' },
    { title: '供应商', dataIndex: 'sparePartSupplier', key: 'sparePartSupplier' },
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
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, sp: SparePart) => (
        <Space size="middle">
          {/* 修改备件 ModalForm */}
          <ModalForm<SparePart>
            title="编辑备品备件"
            trigger={<a style={{ color: '#1677ff' }}><EditOutlined /></a>}
            initialValues={sp}
            modalProps={{ destroyOnClose: true }}
            onFinish={async (values) => {
              const success = await updateDeviceSparePart(sp.id, values);
              if (success) {
                message.success('更新成功');
                fetchSpareParts();
                return true;
              }
              return false;
            }}
          >
            <ProFormText name="sparePartName" label="备件名称" rules={[{ required: true }]} />
            <ProFormText name="sparePartBrand" label="品牌" />
            <ProFormText name="sparePartSpecificationModel" label="规格型号" />
            <ProFormDigit name="sparePartQuantity" label="数量" rules={[{ required: true }]} />
            <ProFormText name="sparePartUnit" label="单位" rules={[{ required: true }]} />
            {/* 🚀 新增：编辑时的输入框 */}
            <ProFormDigit name="sparePartPrice" label="参考单价(元)" fieldProps={{ precision: 2 }} />
            <ProFormText name="sparePartLocation" label="存放库位" placeholder="如：A区-01货架" />
            <ProFormText name="sparePartSupplier" label="供应商" />
          </ModalForm>

          <Popconfirm 
            title="确认删除该备件？" 
            onConfirm={async () => {
              const success = await deleteDeviceSpareParts([sp.id]);
              if (success) {
                message.success('删除成功');
                fetchSpareParts();
              }
            }}
          >
            <a style={{ color: '#ff4d4f' }}><DeleteOutlined /></a>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#fafbfc', border: '1px solid #f0f0f0', borderRadius: 4, margin: '8px 16px' }}>
      {/* 1. 基础与扩展信息面板 */}
      {/* 1. 基础与扩展信息面板 */}
      <Descriptions title="📄 设备详细档案" size="small" column={3} bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="设备名称">{detail.deviceName || '--'}</Descriptions.Item>
        <Descriptions.Item label="品牌">{detail.deviceBrand || '--'}</Descriptions.Item>
        <Descriptions.Item label="规格型号">{detail.deviceSpecificationModel || '--'}</Descriptions.Item>
        
        <Descriptions.Item label="生产厂家">{detail.deviceManufacturer || '--'}</Descriptions.Item>
        <Descriptions.Item label="供应商">{detail.deviceSupplier || '--'}</Descriptions.Item>
        <Descriptions.Item label="出厂日期">{detail.deviceManufactureDate || '--'}</Descriptions.Item>
        
        <Descriptions.Item label="设计使用年限">{detail.deviceLifespan ? `${detail.deviceLifespan} 年` : '--'}</Descriptions.Item>
        {/* 翻译折旧方式 */}
        <Descriptions.Item label="折旧方式">
          {detail.deviceDepreciation ? (DEPRECIATION_MAP[detail.deviceDepreciation] || detail.deviceDepreciation) : '--'}
        </Descriptions.Item>
        <Descriptions.Item label="设备位置">{detail.deviceLocation || '--'}</Descriptions.Item>
        
        <Descriptions.Item label="设备描述" span={3}>{detail.deviceDescription || '--'}</Descriptions.Item>
        
        {/* 动态渲染扩展技术参数 (赛题加分项 5分) */}
        {Object.entries(paramsObj).map(([key, value]) => (
          <Descriptions.Item label={key} key={key}>
            <span style={{ color: '#1677ff', fontWeight: 500 }}>{String(value)}</span>
          </Descriptions.Item>
        ))}
      </Descriptions>

      {/* 2. 🚀 独立的备品备件管理区 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, width: '80%' }}>
        <span style={{ fontWeight: 600, color: '#555' }}>📦 专属备品备件清单：</span>
        
        {/* 新增备件 ModalForm */}
        <ModalForm<SparePart>
          title="新增备品备件"
          trigger={<Button type="dashed" size="small" icon={<PlusOutlined />}>添加备件</Button>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            const success = await addDeviceSparePart(deviceId, values);
            if (success) {
              message.success('添加成功');
              fetchSpareParts(); // 自动刷新列表
              return true;
            }
            return false;
          }}
        >
          <ProFormText name="sparePartName" label="备件名称" placeholder="例如：精密轴承" rules={[{ required: true }]} />
          <ProFormText name="sparePartBrand" label="品牌" placeholder="例如：NSK" />
          <ProFormText name="sparePartSpecificationModel" label="规格型号" placeholder="例如：7014C" />
          <ProFormDigit name="sparePartQuantity" label="初始数量" placeholder="输入数量" rules={[{ required: true }]} />
          <ProFormText name="sparePartUnit" label="单位" placeholder="例如：套、件" rules={[{ required: true }]} />
          {/* 🚀 新增：新建时的输入框 */}
          <ProFormDigit name="sparePartPrice" label="参考单价(元)" placeholder="输入单价" fieldProps={{ precision: 2 }} />
          <ProFormText name="sparePartLocation" label="存放库位" placeholder="例如：A区-01货架" />
          <ProFormText name="sparePartSupplier" label="供应商" placeholder="例如：上海五金交电公司" />
        </ModalForm>
      </div>

      <Table 
        loading={spLoading}
        columns={spareColumns} 
        dataSource={spareParts} 
        rowKey="id"
        pagination={false} 
        size="small" 
        bordered={true}
        style={{ width: '80%' }}
        locale={{ emptyText: '暂无关联的备件数据' }}
      />
    </div>
  );
};

// ==========================================
// 主表格组件
// ==========================================
const DeviceTable: React.FC<DeviceTableProps> = ({ selectedLabelId, keyword,actionRef, onEdit, rowSelection }) => {
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
        <Popconfirm 
          key="delete" 
          title="确定删除吗？"
          // 🚀 核心修复：加上确认后触发的事件
          onConfirm={async () => {
            const success = await deleteDevices([record.deviceId]);
            if (success) {
              message.success('删除成功');
              actionRef.current?.reload(); // 删完后自动刷新表格
            }
          }}
        >
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
        params={{ labelId: selectedLabelId === 'ALL' ? undefined : selectedLabelId, keyword }}
        request={async (params) => {
          // 🚀 核心判断：如果有搜索词，走 Query 接口；没有，走普通 List 接口
          if (params.keyword) {
            return queryDevices({ 
              queryType: 'name', // 默认按名称查，也可以根据你的下拉框调整
              keyword: params.keyword, 
              pageNum: params.current, 
              pageSize: params.pageSize 
            });
          }
          return getDevices(params);
        }}
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
          // 这里不变，依然挂载我们刚刚重构的超强扩展详情面板
          expandedRowRender: (record) => <ExpandedDetail deviceId={record.deviceId} />,
          rowExpandable: () => true, 
        }}
        style={{ margin: 0 }}
      />
    </div>
  );
};

export default DeviceTable;