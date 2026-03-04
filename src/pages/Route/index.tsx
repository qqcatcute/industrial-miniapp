// src/pages/Route/index.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button, Tag, Popconfirm, message, Steps, Card,Descriptions, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PartitionOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import ContentShell from '@/components/ContentShell';
import RouteDrawer from './components/RouteDrawer';
import { queryRoutes, deleteRoute, getRouteSteps,getRouteDetail } from './service';
import { Route } from './typing';
import request from '@/utils/request';


// 👇 【核心修复】：将展开内容抽离为一个独立的标准 React 组件
// 👇 【核心修复】：改为直接请求后端的真实步骤流数据
const ExpandedSteps: React.FC<{ record: Route }> = ({ record }) => {
  // 👇 2. 屏蔽 any 警告
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [steps, setSteps] = useState<any[]>([]);
  
  // 👇 3. 核心修复：把 loading 的初始值直接设为 true！
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // 删除了这里的 setLoading(true)，直接发请求
    getRouteSteps(record.id).then(res => {
      setSteps(res);
    }).finally(() => {
      setLoading(false);
    });
  }, [record.id]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin tip="正在加载工艺步骤明细..." /></div>;
  }

  if (steps.length === 0) {
    return <div style={{ margin: '16px', color: '#888' }}>尚未配置工艺步骤，请点击右侧【图形化编排】进入画板进行设计。</div>;
  }

  return (
    <Card size="small" title="工艺步骤明细 SOP" bordered={false} style={{ margin: '8px 16px', backgroundColor: '#fafafa' }}>
      <Steps
        size="small"
        current={steps.length} 
        items={steps.map((step) => ({
          title: <span style={{ fontWeight: 600 }}>{step.processName}</span>,
          description: (
             <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
               <div>操作员: {step.operator || '未指定'}</div>
               <div>预排时间: {step.startTime ? `${step.startTime} ~ ${step.endTime}` : '未指定'}</div>
             </div>
          ),
          icon: <CheckCircleOutlined style={{ color: '#1677FF' }}/> 
        }))}
      />
    </Card>
  );
};

// 展开后的详情卡片组件
// 👇 1. 在参数里增加 materials 字典
const ExpandedRouteDetail: React.FC<{ routeId: string; materials: any[] }> = ({ routeId, materials }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    getRouteDetail(routeId).then(res => {
      setDetail(res.data || {});
      setLoading(false);
    });
  }, [routeId]);

  if (loading) return <Spin size="small" style={{ margin: '20px auto', display: 'block' }} />;
  if (!detail) return <div style={{ padding: 20, color: '#999' }}>暂无详细信息</div>;

  // 👇 2. 查字典：根据 materialId 找到对应的物料对象
  const matchedMaterial = materials.find(m => m.materialId === detail.materialId);

  return (
    <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderRadius: 8, margin: '8px 0' }}>
      <Descriptions title="📄 工艺路线详细档案" size="small" column={3} bordered>
        <Descriptions.Item label="工艺路线名称">{detail.routeName || '--'}</Descriptions.Item>
        <Descriptions.Item label="工艺版本">
          <Tag color="blue">{detail.routeVersion || '--'}</Tag>
        </Descriptions.Item>
        
        {/* 👇 3. 翻译展示：如果有中文名就显示中文名，并附带小号的 ID */}
        <Descriptions.Item label="所属产品 (物料)">
          {matchedMaterial ? (
            <span>
              <span style={{ fontWeight: 600 }}>{matchedMaterial.materialName}</span>
              <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>({detail.materialId})</span>
            </span>
          ) : (
            detail.materialId || '--'
          )}
        </Descriptions.Item>
        
        <Descriptions.Item label="操作人员">{detail.operator || '待统筹'}</Descriptions.Item>
        <Descriptions.Item label="操作时间">{detail.operationTime || '待统筹'}</Descriptions.Item>
        <Descriptions.Item label="设备使用情况">{detail.equipments || '待统筹'}</Descriptions.Item>

        <Descriptions.Item label="工艺描述" span={3}>
          <span style={{ color: '#666' }}>{detail.routeDescription || '暂无工艺描述'}</span>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

// --- 主页面组件 ---
const RouteLibrary: React.FC = () => {
  const tableRef = useRef<ActionType>(null);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
const [currentRecord, setCurrentRecord] = useState<Route | null>(null);

  // 👇 新增：物料字典状态
  const [materials, setMaterials] = useState<any[]>([]);

  // 👇 新增：组件加载时，一次性拉取物料数据作为翻译字典
  useEffect(() => {
    request.post('/material/list', { pageNum: 1, pageSize: 1000 })
      .then(res => setMaterials(res.data || []))
      .catch(() => console.warn('获取物料字典失败'));
  }, []);
  
  const handleDelete = async (id: string) => {
    await deleteRoute(id);
    message.success('工艺路线已删除');
    tableRef.current?.reload();
  };

 const columns: ProColumns<Route>[] = [
    { title: '工艺路线编号', dataIndex: 'id', width: 160, copyable: true },
    { 
      title: '工艺路线名称', 
      dataIndex: 'routeName', 
      width: 220,
      render: (dom) => <span style={{ fontWeight: 600 }}>{dom}</span>
    },
    { 
      title: '版本号', 
      dataIndex: 'version', 
      width: 100,
      render: (val) => <Tag color="cyan">V {val}</Tag>
    },
    // 👇 新增核心列：让评委看到这条路线是为了生产什么物料
{ 
      title: '目标产物', 
      dataIndex: 'materialId', 
      width: 200,
      render: (val) => {
        if (!val) return <span style={{ color: '#999' }}>未绑定</span>;
        
        // 去字典里找对应的物料名称
        const matchedMaterial = materials.find(m => m.materialId === val);
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            {/* 上半部分显示物料名称（加粗） */}
            <span style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>
              {matchedMaterial ? matchedMaterial.materialName : '匹配中...'}
            </span>
            {/* 下半部分显示物料ID（等宽字体，经典蓝） */}
            <span style={{ fontFamily: 'monospace', color: '#1677FF', fontSize: 12 }}>
              ID: {val}
            </span>
          </div>
        );
      } 
    },
    // { title: '工艺描述', dataIndex: 'routeDescription', ellipsis: true },
    // 🚨 删除了 operator、operationTime、updatedAt 这些后端不返回的假数据列
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
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setCurrentRecord(record); setDrawerVisible(true); }} />,
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
          headerTitle="工艺路线图谱"
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
          scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
          // 👇 修复后：直接调用独立组件
 expandable={{ 
            expandedRowRender: (record) => (
              <div style={{ margin: '8px 0', padding: '0 16px' }}>
                {/* 传入 materials 字典进行翻译 */}
                <ExpandedRouteDetail routeId={record.id} materials={materials} />
                
                <ExpandedSteps record={record} />
              </div>
            )
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