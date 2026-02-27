// src/pages/Route/index.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button, Tag, Popconfirm, message, Steps, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PartitionOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { Node } from 'reactflow'; // 引入节点类型
import ContentShell from '@/components/ContentShell';
import RouteDrawer from './components/RouteDrawer';
import { queryRoutes, deleteRoute, getRouteConfig } from './service';
import { Route } from './typing';


// 👇 【核心修复】：将展开内容抽离为一个独立的标准 React 组件
const ExpandedSteps: React.FC<{ record: Route }> = ({ record }) => {
  const [steps, setSteps] = useState<Node[]>([]);

  useEffect(() => {
    // 动态去 service 取画布保存的数据
    getRouteConfig(record.id).then(res => {
      // 按照节点在画布上的 X 坐标进行从左到右排序
      const sortedNodes = [...res.nodes].sort((a, b) => a.position.x - b.position.x);
      setSteps(sortedNodes);
    });
  }, [record.id]);

  if (steps.length === 0) {
    return <div style={{ margin: '16px', color: '#888' }}>尚未进行工艺编排，请点击右侧【图形化编排】按钮进行设计。</div>;
  }

  return (
    <Card size="small" title="工艺步骤明细 (同步自图形化编排)" bordered={false} style={{ margin: '8px 16px', backgroundColor: '#fafafa' }}>
      <Steps
        size="small"
        current={steps.length} 
        items={steps.map(node => ({
          title: node.data.processName,
          description: `耗时: ${node.data.workTime || 0} ${node.data.workTimeUnit || '分'}`,
          icon: <CheckCircleOutlined style={{ color: '#1677FF' }}/> 
        }))}
      />
    </Card>
  );
};

// --- 主页面组件 ---
const RouteLibrary: React.FC = () => {
  const tableRef = useRef<ActionType>(null);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
const [currentRecord, setCurrentRecord] = useState<Route | null>(null);

  const handleDelete = async (id: string) => {
    await deleteRoute(id);
    message.success('工艺路线已删除');
    tableRef.current?.reload();
  };

  const columns: ProColumns<Route>[] = [
    { title: '路线编号', dataIndex: 'id', width: 120, copyable: true },
    { 
      title: '工艺路线名称', 
      dataIndex: 'routeName', 
      width: 250,
      render: (dom) => <span style={{ fontWeight: 600 }}>{dom}</span>
    },
    { 
      title: '版本号', 
      dataIndex: 'version', 
      width: 100,
      render: (val) => <Tag color="cyan">V {val}</Tag>
    },
    { 
      title: '工艺编制人 (操作人员)', 
      dataIndex: 'operator', 
      width: 180,
      ellipsis: true 
    },
    { 
      title: '预估总工时 (操作时间)', 
      dataIndex: 'operationTime', 
      width: 180,
      ellipsis: true 
    },
    { title: '工艺描述', dataIndex: 'routeDescription', ellipsis: true },
    { title: '最后更新', dataIndex: 'updatedAt', width: 150, valueType: 'date' },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <Button 
          key="design" 
          type="primary" 
          size="small" 
          icon={<PartitionOutlined />} 
          onClick={() => navigate(`/route/editor/${record.id}`)}
        >
          图形化编排
        </Button>,
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} />,
        <Popconfirm key="del" title="确认删除此工艺路线？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ContentShell
      breadcrumbItems={[{ title: '工艺路线' }, { title: '路线管理' }]}
      title="工艺路线列表"
      searchPlaceholder="输入路线名称查询..."
      onSearch={(val) => {
        setKeyword(val);
        tableRef.current?.reload();
      }}
      actions={[
        // 修改新建按钮
// 👇 修改：点击打开抽屉
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRecord(null); setDrawerVisible(true); }}>
          新建路线
        </Button>
      ]}
    >
      <div style={{ background: '#fff', border: '1px solid #d9d9d9', height: '100%' }}>
        <ProTable<Route>
          columns={columns}
          actionRef={tableRef}
          rowKey="id"
          search={false}
          options={{ reload: true, setting: true }}
          size="small"
          request={async (params) => {
            return queryRoutes({
              current: params.current,
              pageSize: params.pageSize,
              keyword: keyword,
            });
          }}
          pagination={{ defaultPageSize: 20 }}
          scroll={{ y: 'calc(100vh - 280px)' }}
          // 👇 修复后：直接调用独立组件
          expandable={{ 
            expandedRowRender: (record) => <ExpandedSteps record={record} /> 
          }}
        />
      </div>
      {/* 👇 挂载抽屉组件 */}
      <RouteDrawer 
        open={drawerVisible} 
        onClose={() => setDrawerVisible(false)} 
        onSuccess={() => { setDrawerVisible(false); tableRef.current?.reload(); }} 
        currentRecord={currentRecord} 
      />
    </ContentShell>
  );
};

export default RouteLibrary;