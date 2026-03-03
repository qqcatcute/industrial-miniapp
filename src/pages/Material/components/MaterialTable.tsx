// src/pages/Material/components/MaterialTable.tsx
import React, { useRef } from 'react';
import { ActionType, ProTable, ProColumns } from '@ant-design/pro-components';
import { Tag, Space, Avatar, Dropdown, Modal, message, Table, Popconfirm, Divider, Typography } from 'antd'; 
import { ProductOutlined, PartitionOutlined, MoreOutlined, ExclamationCircleFilled, CaretRightOutlined, HistoryOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Material } from '../typing';
import { getMaterials, deleteMaterials, deleteLatestVersion } from '../service'; 
import './OdooStyle.css';

const { confirm } = Modal;
const { Link } = Typography;

interface MaterialTableProps {
  labelId: string;
  refreshKey: number;
  onViewDetail: (record: Material, tabKey?: string) => void;
  onEdit: (record: Material) => void; 
  onUpgrade: (record: Material) => void; 
}

const MaterialTable: React.FC<MaterialTableProps> = ({ labelId, refreshKey, onViewDetail, onEdit, onUpgrade }) => {
  const actionRef = useRef<ActionType>(null);

  const handleDeleteAllVersions = (record: Material) => {
    confirm({
      title: '危险操作：彻底销毁该物料族？',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: '这将删除该物料的【所有历史版本】且不可恢复！',
      okText: '确认销毁',
      okType: 'danger',
      onOk: async () => {
        const success = await deleteMaterials([record.masterId]);
        if (success) { message.success('物料已彻底销毁'); actionRef.current?.reload(); }
      },
    });
  };

  const handleRevokeVersion = async (masterId: string) => {
    const success = await deleteLatestVersion(masterId);
    if (success) { message.success('已成功撤销该版本'); actionRef.current?.reload(); }
  };

  // --- 🌟 现代 SaaS 主表格列配置 🌟 ---
  const columns: ProColumns<Material>[] = [
    {
      title: '物料名称', 
      dataIndex: 'materialName', 
      align: 'left', 
      render: (dom, record) => {
        const hasBOM = record.children && record.children.length > 0;
        return (
          <Space size="middle">
            {/* 融入 Dashboard 的科技青色系调子 */}
            <Avatar shape="square" size="small" icon={<ProductOutlined />} style={{ backgroundColor: '#e6fffb', color: '#13c2c2', borderRadius: 4 }} />
            <span style={{ fontWeight: 600, color: '#1f1f1f', fontSize: 14 }}>{dom}</span>
            {hasBOM && <Tag color="cyan" style={{ border: 'none', borderRadius: 2 }}><PartitionOutlined /> BOM</Tag>}
          </Space>
        );
      },
    },
    {
      title: '当前版本', 
      dataIndex: 'materialVersion', 
      width: 100, 
      align: 'center', 
      render: (_, record) => (
        // 使用科技青作为最新版本的强调色
        <Tag color="cyan" style={{ borderRadius: 12, border: 'none', padding: '0 10px', fontWeight: 600, margin: 0 }}>
          V {record.materialVersion}
        </Tag>
      ),
    },
    { 
      title: '规格型号', 
      dataIndex: 'materialSpecificationModel', 
      width: 180, 
      align: 'left', 
      render: (dom) => <span style={{ color: '#555' }}>{dom || '--'}</span> 
    },
    {
      title: '当前库存', 
      dataIndex: 'materialQuantity', 
      width: 140, 
      align: 'right', 
      render: (_, record) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: record.materialQuantity > 0 ? '#1f1f1f' : '#ff4d4f', fontSize: 14 }}>
          {Number(record.materialQuantity).toFixed(4)} <span style={{ color: '#888', marginLeft: 4, fontWeight: 'normal', fontSize: 12 }}>{record.materialUnit}</span>
        </span>
      ),
    },
    { 
      title: '主要供应商', 
      dataIndex: 'materialSupplier', 
      width: 160, 
      align: 'left', 
      render: (dom) => <span style={{ color: '#555' }}>{dom || '--'}</span>
    },
    {
      title: '操作', valueType: 'option', width: 160, fixed: 'right', align: 'center', 
      render: (text, record) => {
        const hasBOM = record.children && record.children.length > 0;
        const menuItems: MenuProps['items'] = [
          { key: 'edit', label: '编辑当前版', onClick: (e) => { e.domEvent.stopPropagation(); onEdit(record); } },
          { key: 'upgrade', label: '版本升级', onClick: (e) => { e.domEvent.stopPropagation(); onUpgrade(record); } },
          { type: 'divider' },
          { key: 'delete', danger: true, label: '销毁物料族', onClick: (e) => { e.domEvent.stopPropagation(); handleDeleteAllVersions(record); } },
        ];
        return (
          // 💡 修复：使用 split 分割线，让操作列对齐不再参差不齐
          <Space split={<Divider type="vertical" />}>
            <Link onClick={(e) => { e.stopPropagation(); onViewDetail(record, '1'); }}>查看</Link>
            {hasBOM ? (
               <Link onClick={(e) => { e.stopPropagation(); onViewDetail(record, '2'); }} style={{ color: '#13c2c2' }}>BOM</Link>
            ) : (
               <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                 <Link onClick={(e) => e.stopPropagation()} style={{ color: '#888' }}><MoreOutlined style={{ fontSize: 16 }} /></Link>
               </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  // --- 🌟 子表格列配置 (保持与父表字段呼应，但弱化色彩) 🌟 ---
  const historyColumns = [
    { title: '历史版本名称', dataIndex: 'materialName', align: 'left' as const, render: (dom: string) => <span style={{ color: '#666' }}>{dom}</span> }, 
    { title: '版本号', dataIndex: 'materialVersion', width: 100, align: 'center' as const, render: (v: string) => <Tag style={{ borderRadius: 12, margin: 0, padding: '0 10px', color: '#888', background: '#f5f5f5', border: 'none' }}>V {v}</Tag> },
    { title: '规格型号', dataIndex: 'materialSpecificationModel', width: 180, align: 'left' as const, render: (dom: string) => <span style={{ color: '#888' }}>{dom || '--'}</span> },
    { title: '历史库存', dataIndex: 'materialQuantity', width: 140, align: 'right' as const, render: (val: any) => <span style={{ fontFamily: 'monospace', color: '#888' }}>{Number(val).toFixed(4)}</span> }, 
    { title: '供应商', dataIndex: 'materialSupplier', width: 160, align: 'left' as const, render: (dom: string) => <span style={{ color: '#888' }}>{dom || '--'}</span> },
    {
      title: '操作', width: 160, align: 'center' as const, 
      render: (_: any, record: Material, index: number) => (
        // 💡 修复：子表操作列使用 split 对齐
        <Space split={<Divider type="vertical" />}>
           <Link onClick={(e) => { e.stopPropagation(); onViewDetail(record, '1'); }} style={{ color: '#888' }}>详情</Link>
           {index === 0 ? (
              <Popconfirm title="确定撤销此历史版本？" onConfirm={(e) => { e?.stopPropagation(); handleRevokeVersion(record.masterId); }}>
                 <Link onClick={(e) => e.stopPropagation()} type="danger">撤销版本</Link>
              </Popconfirm>
           ) : (
             <span style={{ color: '#ccc', fontSize: 12, padding: '0 14px' }}>-</span> // 占位保持对齐
           )}
        </Space>
      )
    }
  ];

  return (
    <ProTable<Material>
      className="modern-saas-table" // 启用新的样式类
      columns={columns} actionRef={actionRef}
      rowKey="materialId" search={false} 
      options={{ density: false, fullScreen: false, reload: true, setting: true }}
      params={{ labelId, refreshKey }} 
      request={async (params) => {
        const data = await getMaterials({ labelId: params.labelId });
        return { data, success: true, total: data.length };
      }}
      pagination={{ defaultPageSize: 20 }} 
      scroll={{ x: 'max-content' }} 
      onRow={(record) => ({ 
        onClick: () => onViewDetail(record, '1'), 
        style: { cursor: 'pointer' } 
      })}
      expandable={{
        // 🌟 修复误触详情的核心：e.stopPropagation()
        expandIcon: ({ expanded, onExpand, record }) =>
          record.historyVersions && record.historyVersions.length > 0 ? (
            <div
              className="expand-hover-btn"
              onClick={(e) => {
                e.stopPropagation(); // 阻止冒泡！不会再触发 onRow 详情抽屉
                onExpand(record, e);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <CaretRightOutlined style={{ color: expanded ? '#13c2c2' : '#bfbfbf', fontSize: 14, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
            </div>
          ) : <span style={{ width: 28, display: 'inline-block' }} />,
        
        expandedRowRender: (record) => {
          if (!record.historyVersions || record.historyVersions.length === 0) return null;
          return (
            // 🌟 现代卡片化嵌套容器
            <div style={{ 
              padding: '16px 24px 20px 48px', 
              background: '#f8f9fb', // 极具质感的冷灰底色
              borderTop: '1px solid #f0f0f0', 
              borderBottom: '1px solid #f0f0f0',
              position: 'relative'
            }}>
              {/* 科技青色的锚点线，呼应 Dashboard */}
              <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: '#e6fffb' }}>
                <div style={{ position: 'absolute', top: 20, left: -2, width: 6, height: 6, borderRadius: '50%', background: '#13c2c2', border: '1px solid #fff' }} />
              </div>
              
              <div style={{ marginBottom: 12, fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <HistoryOutlined style={{ color: '#13c2c2' }}/> 版本流转轴
              </div>
              
              <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #e8e8e8', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
                <Table 
                  className="nested-history-card"
                  columns={historyColumns} dataSource={record.historyVersions} 
                  pagination={false} size="small" rowKey="materialId" 
                  showHeader={true} bordered={false}
                />
              </div>
            </div>
          );
        },
        rowExpandable: (record) => !!record.historyVersions && record.historyVersions.length > 0,
      }}
    />
  );
};
export default MaterialTable;