// src/pages/Material/components/MaterialTable.tsx
import React, { useRef } from 'react';
import { ActionType, ProTable, ProColumns } from '@ant-design/pro-components';
import { Tag, Space, message, Table, Popconfirm, Divider } from 'antd'; 
import { CaretRightOutlined, HistoryOutlined } from '@ant-design/icons';
import { Material } from '../typing';
import { getMaterials, deleteMaterials, deleteLatestVersion } from '../service'; 
// 🗑️ 核心改动 1：彻底移除了 OdooStyle.css，回归 Ant Design 标准清爽样式

interface MaterialTableProps {
  labelId: string;
  keyword?: string;
  refreshKey: number;
  onViewDetail: (record: Material, tabKey?: string) => void;
  onEdit: (record: Material) => void; 
  onUpgrade: (record: Material) => void; 
  rowSelection?: any; 
}

const MaterialTable: React.FC<MaterialTableProps> = ({ labelId, keyword,refreshKey, onViewDetail, onEdit, onUpgrade, rowSelection }) => {
  const actionRef = useRef<ActionType>(null);

  const handleRevokeVersion = async (masterId: string) => {
    const success = await deleteLatestVersion(masterId);
    if (success) { message.success('已成功撤销该版本'); actionRef.current?.reload(); }
  };

  // --- 🌟 极简主表格列配置 (对齐设备页) 🌟 ---
  const columns: ProColumns<Material>[] = [
    {
      title: '物料编码',
      dataIndex: 'materialId',
      width: 160,
      copyable: true, // 加上可复制的小图标，显得更专业
    },
    {
      title: '物料名称', 
      dataIndex: 'materialName', 
      width: 180,
      fixed: 'left',
      render: (dom) => <span style={{ fontWeight: 600, color: '#333' }}>{dom}</span>,
    },
    {
      title: '当前版本', 
      dataIndex: 'materialVersion', 
      width: 100, 
      align: 'center', 
      render: (val) => <Tag color="blue" style={{ borderRadius: 2 }}>V {val}</Tag>,
    },
    { 
      title: '规格型号', 
      dataIndex: 'materialSpecificationModel', 
      width: 160, 
    },
    {
      title: '当前库存', 
      dataIndex: 'materialQuantity', 
      width: 140, 
      render: (_, record) => (
        <span style={{ color: record.materialQuantity > 0 ? '#333' : '#ff4d4f', fontFamily: 'monospace', fontSize: 14 }}>
          {Number(record.materialQuantity).toFixed(4)} <span style={{ fontSize: 12, color: '#888', fontFamily: 'sans-serif' }}>{record.materialUnit}</span>
        </span>
      ),
    },
    { 
      title: '主要供应商', 
      dataIndex: 'materialSupplier', 
      width: 180, 
    },
    {
      title: '操作', valueType: 'option', width: 220, fixed: 'right', 
      render: (_, record) => (
        <Space split={<Divider type="vertical" />}>
          <a onClick={(e) => { e.stopPropagation(); onViewDetail(record, '1'); }}>查看</a>
          <a onClick={(e) => { e.stopPropagation(); onEdit(record); }}>编辑</a>
          <a onClick={(e) => { e.stopPropagation(); onUpgrade(record); }}>升级</a>
          <Popconfirm 
            title="确定彻底销毁该物料族吗？" 
            description="删除后所有历史版本均不可恢复！"
            onConfirm={async (e) => {
              e?.stopPropagation(); 
              const targetId = record.masterId || record.materialId;
              const success = await deleteMaterials([targetId]);
              if (success) { 
                message.success('物料已彻底销毁'); 
                actionRef.current?.reload(); 
              }
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <a style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- 🌟 嵌套子表列配置 (标准化，防文字竖排挤压) 🌟 ---
  const historyColumns = [
    { title: '历史版本', dataIndex: 'materialName', render: (dom: string) => <span style={{ color: '#666' }}>{dom}</span> }, 
    { title: '版本号', dataIndex: 'materialVersion', width: 90, render: (v: string) => <Tag bordered={false} color="default">V {v}</Tag> },
    { title: '规格型号', dataIndex: 'materialSpecificationModel', render: (dom: string) => <span style={{ color: '#888' }}>{dom || '--'}</span> },
    { title: '历史库存', dataIndex: 'materialQuantity', render: (val: any) => <span style={{ fontFamily: 'monospace', color: '#888' }}>{Number(val).toFixed(4)}</span> }, 
    { title: '供应商', dataIndex: 'materialSupplier', render: (dom: string) => <span style={{ color: '#888' }}>{dom || '--'}</span> },
    {
      title: '操作', width: 140, 
      render: (_: any, record: Material, index: number) => (
        <Space split={<Divider type="vertical" />}>
           <a onClick={(e) => { e.stopPropagation(); onViewDetail(record, '1'); }} style={{ color: '#888' }}>详情</a>
           {index === 0 ? (
              <Popconfirm 
                title="确定撤销此历史版本？" 
                onConfirm={(e) => { e?.stopPropagation(); handleRevokeVersion(record.masterId || record.materialId); }}
                onCancel={(e) => e?.stopPropagation()}
              >
                 <a style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()}>撤回</a>
              </Popconfirm>
           ) : (
             <span style={{ color: '#ccc', fontSize: 12, padding: '0 10px' }}>-</span>
           )}
        </Space>
      )
    }
  ];

  return (
    <ProTable<Material>
      columns={columns} 
      actionRef={actionRef}
      rowSelection={rowSelection} 
      rowKey="materialId" 
      search={false}
      options={{ density: false, fullScreen: false, reload: true, setting: true }}
      // 👇 3. 把 keyword 放到 params 里，只要它变了就会自动触发 request
      params={{ labelId, refreshKey, keyword }}
      request={async (params) => {
        const data = await getMaterials({ labelId: params.labelId, keyword: params.keyword });
        return { data, success: true, total: data.length };
      }}
      pagination={{ defaultPageSize: 20 }} 
      scroll={{ x: 'max-content' }} 
      onRow={(record) => ({ 
        onClick: () => onViewDetail(record, '1'), 
        style: { cursor: 'pointer' } 
      })}
      expandable={{
        expandIcon: ({ expanded, onExpand, record }) =>
          record.historyVersions && record.historyVersions.length > 0 ? (
            <CaretRightOutlined 
              style={{ 
                color: expanded ? '#1677FF' : '#bfbfbf', 
                fontSize: 14, 
                transition: 'transform 0.2s', 
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                cursor: 'pointer',
                padding: '4px'
              }}
              onClick={(e) => {
                e.stopPropagation(); 
                onExpand(record, e);
              }}
            />
          ) : <span style={{ width: 28, display: 'inline-block' }} />,
        
        expandedRowRender: (record) => {
          if (!record.historyVersions || record.historyVersions.length === 0) return null;
          return (
            // 🌟 核心改动：去掉沉重的灰色背景盒和外边框，改用极淡的底层留白，拉开左侧间距
            <div style={{ padding: '16px 32px 16px 64px', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
              
              {/* 标题带点主题色，起到画龙点睛的作用 */}
              <div style={{ marginBottom: 16, fontSize: 13, color: '#1677ff', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <HistoryOutlined /> 历史版本追溯
              </div>
              
              <Table 
                columns={historyColumns} 
                dataSource={record.historyVersions} 
                pagination={false} 
                size="small" 
                rowKey="materialId" 
                // 🌟 核心改动：关闭内部实线边框！依靠 Ant Design 默认的极淡下划线区分行，瞬间通透
                bordered={false} 
              />
            </div>
          );
        },
        rowExpandable: (record) => !!record.historyVersions && record.historyVersions.length > 0,
      }}
    />
  );
};
export default MaterialTable;