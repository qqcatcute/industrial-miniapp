// src/pages/Device/components/DeviceTable.tsx
import React from 'react';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Popconfirm, Table, Badge } from 'antd'; // 🚀 引入原生 Table 和 Badge
import { Device, SparePart } from '../typing';
import { getDevices } from '../service';
import './OdooTable.css';

// 1. 在 Props 接口里加上 onEdit
interface DeviceTableProps {
  selectedLabelId: string;
  actionRef: React.MutableRefObject<ActionType | undefined>;
  onEdit?: (record: Device) => void; // 🚀 新增接收编辑/查看事件
}

const DeviceTable: React.FC<DeviceTableProps> = ({ selectedLabelId, actionRef, onEdit }) => {
  const columns: ProColumns<Device>[] = [
    { title: '设备编码', dataIndex: 'id', width: 140, copyable: true, fixed: 'left' },
    { title: '设备名称', dataIndex: 'deviceName', width: 160, ellipsis: true },
    { title: '规格型号', dataIndex: 'deviceSpecificationModel', width: 140, ellipsis: true },
    { title: '供应商', dataIndex: 'deviceSupplier', width: 160, ellipsis: true }, // 🚀 新增展示供应商
    { title: '品牌', dataIndex: 'deviceBrand', width: 100 },
    { title: '折旧方式', dataIndex: 'deviceDepreciation', width: 120, search: false },
    { 
      title: '状态', 
      dataIndex: 'deviceStatus', 
      width: 100,
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          '运行中': '#13c2c2', '闲置': '#d4b106', '保养维护': '#1677ff', '故障维修': '#ff7875', '报废': '#d9d9d9',
        };
        return <Tag color={colorMap[record.deviceStatus] || 'default'} style={{ borderRadius: 2 }}>{record.deviceStatus}</Tag>;
      }
    },
    { title: '位置', dataIndex: 'deviceLocation', width: 140, search: false },
// 3. 找到操作列，绑定点击事件并传入当前行的 record
    {
    title: '操作',
    valueType: 'option',
    width: 140,
    fixed: 'right',
    render: (_, record) => [ // 🚀 确保这里有 record 参数
      <a key="view" onClick={() => onEdit && onEdit(record)}>查看</a>,
      <a key="edit" onClick={() => onEdit && onEdit(record)}>编辑</a>,
      <Popconfirm key="delete" title="确定删除吗？" onConfirm={() => {}}>
        <a style={{ color: '#ff4d4f' }}>删除</a>
      </Popconfirm>,
    ],
  },
  ];

  // 🚀 核心：定义子表格 (备品备件清单) 的列
  const expandedRowRender = (record: Device) => {
    if (!record.spareParts || record.spareParts.length === 0) {
      return <div style={{ padding: '16px 32px', color: '#999', background: '#fafbfc' }}>暂未配置关联备件，请在编辑中添加。</div>;
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
            {/* 库存低于10显示红点报警 */}
            <Badge status={sp.sparePartQuantity < 10 ? 'error' : 'success'} /> 
            {sp.sparePartQuantity} {sp.sparePartUnit}
          </span>
        ) 
      },
    ];

    return (
      <div style={{ padding: '12px 24px', background: '#fafbfc' }}>
        <div style={{ marginBottom: 8, fontWeight: 600, color: '#555' }}>📦 适用的备品备件清单：</div>
        <Table 
          columns={spareColumns} 
          dataSource={record.spareParts} 
          rowKey="id"
          pagination={false} 
          size="small" 
          bordered={true}
          style={{ width: '80%' }} // 子表格不要占满全宽，留白更好看
        />
      </div>
    );
  };

  return (
    <div style={{ height: '100%', padding: '0 16px', background: '#fff' }}>
      <ProTable<Device>
        className="odoo-style-table"
        columns={columns}
        actionRef={actionRef}
        cardBordered={false}
        params={{ labelId: selectedLabelId }} 
        request={async (params) => getDevices(params)}
        rowKey="id"
        search={false}
        options={{ setting: { listsHeight: 400 }, reload: false, density: false }}
        bordered={false}
        tableAlertRender={false}
        scroll={{ x: 'max-content', y: 'calc(100vh - 310px)' }} 
        pagination={{ pageSize: 10, size: 'small', showTotal: (total) => `共 ${total} 项` }}
        size="small"
        rowSelection={{}} 
        
        // 🚀 挂载子表格配置
        expandable={{
          expandedRowRender,
          // 只有存在 spareParts 字段才显示前面的 "+" 号 (也可以全显示，没数据的显示空状态)
          rowExpandable: () => true, 
        }}
        
        style={{ margin: 0 }}
      />
    </div>
  );
};

export default DeviceTable;