// src/pages/Material/components/MaterialTable.tsx
import React, { useRef } from 'react';
import { ActionType, ProTable, ProColumns } from '@ant-design/pro-components';
import { Tag, Space, Avatar, Dropdown, Modal, message } from 'antd'; 
import { ProductOutlined, PartitionOutlined, MoreOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Material } from '../typing';
// 💡 修复 1：去掉了没有用到的 upgradeMaterialVersion 引入
import { getMaterials, deleteMaterials } from '../service'; 
import './OdooStyle.css';

const { confirm } = Modal;

// 1. 在 Props 接口里加上 refreshKey：
interface MaterialTableProps {
  labelId: string;
  refreshKey: number; // 💡 新增：接收外层传来的刷新标识
  onViewDetail: (record: Material, tabKey?: string) => void;
  onEdit: (record: Material) => void; 
  onUpgrade: (record: Material) => void; 
}

// 💡 修复 2：这里加上了 onUpgrade ！！！
const MaterialTable: React.FC<MaterialTableProps> = ({ labelId, refreshKey, onViewDetail, onEdit, onUpgrade }) => {
  
  // 💡 修复 3：加上 null 初始值，解决 TS 报错
  const actionRef = useRef<ActionType>(null);

  // 💡 修复 4：我已经帮你把那个报错的、没用的 handleUpgrade 函数整个删掉了！

  // 封装弹窗确认逻辑（删除）
  const handleDelete = (record: Material) => {
    confirm({
      title: '确认删除此物料？',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: '删除后数据无法恢复，请谨慎操作！',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const success = await deleteMaterials([record.id]);
        if (success) {
          message.success('删除成功');
          actionRef.current?.reload();
        }
      },
    });
  };

  const columns: ProColumns<Material>[] = [
    {
      title: '物料编码',
      dataIndex: 'id',
      width: 160,
      align: 'left',
      render: (dom) => <span style={{ fontFamily: 'monospace', color: '#888' }}>{dom}</span>,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 280, 
      align: 'left',
      ellipsis: true,
      render: (dom, record) => {
        const hasBOM = record.children && record.children.length > 0;
        return (
          <Space>
            <Avatar shape="square" size="small" icon={<ProductOutlined />} style={{ backgroundColor: '#f0f2f5', color: '#bfbfbf', borderRadius: 2 }} />
            <span style={{ fontWeight: 600, color: '#001529' }}>{dom}</span>
            {hasBOM && <Tag color="cyan" style={{ border: 'none', borderRadius: 2 }}><PartitionOutlined /> 含 BOM</Tag>}
          </Space>
        );
      },
    },
    {
      title: '版本号',
      dataIndex: 'version',
      width: 100,
      align: 'left',
      render: (_, record) => <Tag color="blue" style={{ borderRadius: 2, border: 'none', background: '#e6f4ff' }}>{record.version}</Tag>,
    },
    {
      title: '规格型号',
      dataIndex: 'materialSpecificationModel',
      width: 180,
      align: 'left',
      ellipsis: true,
      render: (dom) => <span style={{ color: '#555' }}>{dom || '-'}</span>,
    },
    {
      title: '库存数量',
      dataIndex: 'materialQuantity',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {Number(record.materialQuantity).toFixed(4)} 
          <span style={{ color: '#888', marginLeft: 6, fontWeight: 'normal' }}>{record.materialUnit}</span>
        </span>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'materialSupplier',
      width: 160,
      align: 'left',
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140, // 💡 宽度收缩，因为按钮变少了
      fixed: 'right', 
      align: 'center', 
      render: (text, record) => {
        const hasBOM = record.children && record.children.length > 0;

        // 💡 定义折叠菜单内容
        // 2. 找到 columns 里的操作列 render 函数，修改 Dropdown 的 items：
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: (e) => { e.domEvent.stopPropagation(); onEdit(record); }
    },
    {
      key: 'upgrade',
      label: '升版',
      onClick: (e) => { 
        e.domEvent.stopPropagation(); 
        onUpgrade(record); // 💡 直接抛出事件，不再这里弹窗
      }
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: '删除',
      onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(record); }
    },
  ];

        return (
          <Space size="middle">
            <a onClick={(e) => { e.stopPropagation(); onViewDetail(record, '1'); }}>查看</a>
            
            {hasBOM && (
              <a onClick={(e) => { e.stopPropagation(); onViewDetail(record, '2'); }} style={{ color: '#13c2c2' }}>BOM</a>
            )}
            
            {/* 💡 更多操作下拉菜单 */}
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <a onClick={(e) => e.stopPropagation()} style={{ color: '#888' }} title="更多操作">
                <MoreOutlined style={{ fontSize: 16 }} />
              </a>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

return (
    <ProTable<Material>
      className="odoo-minimal-table"
      columns={columns}
      actionRef={actionRef}
      cardBordered={false}
      rowKey={(record) => `${record.id}-${record.version}`}
      search={false}
      options={{ density: false, fullScreen: false, reload: true, setting: true }}
      // 💡 核心修复：把 refreshKey 塞进 params。
      // ProTable 的底层逻辑是：只要 params 里的值发生变化，它就会自动重新请求接口拉取最新数据！
      params={{ labelId, refreshKey }} 
      request={async (params) => {
        const data = await getMaterials({ labelId: params.labelId });
        return { data, success: true, total: data.length };
      }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      rowSelection={{}} 
      scroll={{ x: 1300 }} 
      expandable={{ childrenColumnName: 'DO_NOT_EXPAND_THIS' }}
      onRow={(record) => ({
        onClick: () => onViewDetail(record, '1'),
        style: { cursor: 'pointer' } 
      })}
    />
  );
};

export default MaterialTable;