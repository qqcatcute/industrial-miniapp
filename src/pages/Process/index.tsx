// src/pages/Process/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Popconfirm, message, Tag, Space, Table, Divider, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns, ModalForm, ProFormText, ProFormTreeSelect } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import ProcessDrawer from './components/ProcessDrawer';
import { queryProcesses, queryProcessLabels, deleteProcess, saveProcess, deleteProcessTemplate, bindProcessLabel, unbindProcessLabel, queryProcessTemplates } from './service';
import { Process, ProcessLabel, ProcessTemplate } from './typing';
import ProcessTree from './components/ProcessTree';

// 🚀 1. 给子组件增加 refreshKey 属性
const ExpandedTemplates: React.FC<{ 
  record: Process; 
  refreshKey: number; // <--- 新增
  onAdd: (processId: string) => void;
  onEdit: (processId: string, template: ProcessTemplate) => void;
  onRefreshParent: () => void;
}> = ({ record, refreshKey, onAdd, onEdit, onRefreshParent }) => {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = () => {
    setLoading(true);
    queryProcessTemplates(record.processId).then(data => {
      setTemplates(data);
      setLoading(false);
    });
  };

  // 🚀 2. 将 refreshKey 加入依赖项，只要钥匙变了就重新请求子表格数据
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates(); 
  }, [record.processId, refreshKey]); // <--- 补充 refreshKey

const subColumns = [
    { title: '模板执行名称', dataIndex: 'templateName', key: 'templateName', render: (val: string) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{val}</span> },
    { title: '操作人员（岗位资质）', dataIndex: 'operator', key: 'operator', render: (val: string) => val ? <Tag>{val}</Tag> : '-' },
    
    // 💡 新增的三个展示列
    { title: '消耗物料', dataIndex: 'inputMaterials', key: 'inputMaterials', ellipsis: true },
    { title: '产出物料', dataIndex: 'outputMaterials', key: 'outputMaterials', ellipsis: true },
    { title: '生产步骤（描述）', dataIndex: 'templateDescription', key: 'templateDescription', ellipsis: true },
    
    { title: '生产和检测设备', dataIndex: 'equipments', key: 'equipments', ellipsis: true },
    { title: '开始与结束时间（标准排程）', key: 'time', render: (_: any, t: ProcessTemplate) => <span style={{ color: '#888' }}>{t.startTime || '-'} ~ {t.endTime || '-'}</span> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, t: ProcessTemplate) => (
        <Space split={<Divider type="vertical" />}>
          <a onClick={() => onEdit(record.processId, t)}>编辑</a>
          <Popconfirm title="删除该模板？" onConfirm={async () => { 
            await deleteProcessTemplate([t.templateId]); 
            message.success('删除成功'); 
            fetchTemplates(); 
            onRefreshParent(); 
          }}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin tip="加载执行标准中..." /></div>;

  return (
    <div style={{ padding: '8px 24px 16px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: '#555' }}><NodeIndexOutlined style={{ marginRight: 8, color: '#1677ff' }}/> 下挂执行标准 (模板)</span>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => onAdd(record.processId)}>新建执行模板</Button>
      </div>
      <Table columns={subColumns} dataSource={templates} pagination={false} size="small" rowKey="templateId" bordered={false} locale={{ emptyText: '暂无模板，请先新建' }} />
    </div>
  );
};

const ProcessLibrary: React.FC = () => {
  const tableRef = useRef<ActionType>(null);
  const [labels, setLabels] = useState<ProcessLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('LBL-0');
  const [keyword, setKeyword] = useState<string>('');

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [editProcessId, setEditProcessId] = useState<string | undefined>();
  const [editProcessName, setEditProcessName] = useState('');
  const [editProcessLabels, setEditProcessLabels] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ProcessTemplate | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string>(''); 
  
  // 🚀 3. 新增这把钥匙，用于强制刷新子表格
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0); 

  // 保证标签数据被加载，用于表格回显
  useEffect(() => { queryProcessLabels().then(res => setLabels(res)); }, []);

  const columns: ProColumns<Process>[] = [
    { title: '基础工序 ID', dataIndex: 'processId', width: 200, copyable: true },
    { title: '基础工序大类', dataIndex: 'processName', render: (dom) => <span style={{ fontWeight: 600, fontSize: 15 }}>{dom}</span> },
    // { 
    //   title: '所属工艺分类', 
    //   dataIndex: 'labelIds', 
    //   render: (_, record) => (
    //     <Space size={[0, 4]} wrap>
    //       {record.labelIds?.map(id => <Tag color="blue" key={id} style={{ border: 'none' }}>{labels.find(l => l.id === id)?.processLabelName || '未知分类'}</Tag>)}
    //     </Space>
    //   ) 
    // },
    { title: '包含模板数', key: 'count', width: 150, render: (_, record: any) => <Tag color={record.templateCount ? 'cyan' : 'default'}>{record.templateCount || 0} 个执行标准</Tag> },
    {
      title: '操作', valueType: 'option', width: 150, fixed: 'right',
      render: (_, record) => [
        <Button 
          key="edit" type="link" size="small" icon={<EditOutlined />} 
          onClick={() => { 
            setEditProcessId(record.processId); 
            setEditProcessName(record.processName); 
            setEditProcessLabels(record.labelIds || []);
            setProcessModalOpen(true); 
          }} 
        />,
        <Popconfirm key="del" title="连同模板一起删除？" onConfirm={async () => { await deleteProcess([record.processId]); message.success('已删除'); tableRef.current?.reload(); }}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ContentShell
      breadcrumbItems={[{ title: '工艺库' }, { title: '工序与执行模板' }]} title="工序管理" searchPlaceholder="输入工序名称..."
      onSearch={(val) => { setKeyword(val); tableRef.current?.reload(); }}
      actions={[
        <Button 
          key="create" type="primary" icon={<PlusOutlined />} 
          onClick={() => { 
            setEditProcessId(undefined); setEditProcessName(''); setEditProcessLabels([]); 
            setProcessModalOpen(true); 
          }}
        >
          新建基础工序
        </Button>
      ]}
    >
      <div style={{ display: 'flex', height: '100%', gap: 16 }}>
        <div style={{ width: 220, minWidth: 220, flexShrink: 0, background: '#fff', border: '1px solid #d9d9d9', padding: '16px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          <ProcessTree onSelect={(key) => { setSelectedLabelId(key); tableRef.current?.reload(); }} />
        </div>
        
        <div style={{ flex: 1, border: '1px solid #d9d9d9', background: '#fff' }}>
          <ProTable<Process>
            columns={columns} actionRef={tableRef} rowKey="processId" search={false} options={{ reload: true, setting: false }} size="small"
            request={async (params) => queryProcesses({ current: params.current, pageSize: params.pageSize, keyword: keyword, labelId: selectedLabelId })}
            pagination={{ defaultPageSize: 20 }} scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
            expandable={{ 
              expandRowByClick: true,
              expandedRowRender: (record) => (
                <ExpandedTemplates 
                  record={record} 
                  refreshKey={templateRefreshKey} // 🚀 4. 把钥匙传给子表格
                  onAdd={(pId) => { setCurrentTemplate(null); setActiveProcessId(pId); setDrawerOpen(true); }}
                  onEdit={(pId, t) => { setCurrentTemplate(t); setActiveProcessId(pId); setDrawerOpen(true); }}
                  onRefreshParent={() => tableRef.current?.reload()}
                />
              )
            }}
          />
        </div>
      </div>

      <ModalForm
        title={editProcessId ? '编辑基础工序大类' : '新建基础工序大类'}
        open={processModalOpen}
        onOpenChange={setProcessModalOpen}
        modalProps={{ destroyOnClose: true }}
        initialValues={{ processName: editProcessName, labelIds: editProcessLabels }}
        width={400}
        onFinish={async (values) => {
          const targetId = await saveProcess(values.processName, editProcessId);
          if (targetId) {
              const newLabels = values.labelIds || [];
              const oldLabels = editProcessLabels || [];
              const toBind = newLabels.filter((id: string) => !oldLabels.includes(id));
              const toUnbind = oldLabels.filter((id: string) => !newLabels.includes(id));
              const promises: Promise<any>[] = [];
              toBind.forEach((id: string) => promises.push(bindProcessLabel(targetId, id)));
              toUnbind.forEach((id: string) => promises.push(unbindProcessLabel(targetId, id)));
              await Promise.all(promises);
          }
          message.success('基础工序配置保存成功');
          tableRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="processName" label="工序大类名称" placeholder="例如：打磨、质检" rules={[{ required: true }]} />
        <ProFormTreeSelect 
            name="labelIds" 
            label="下发绑定工艺分类" 
            placeholder="请选择该工序归属的大类标签（可多选）"
            request={async () => {
              const res = await queryProcessLabels();
              return res.filter(n => n.id !== 'LBL-0').map(item => ({
                title: item.processLabelName,
                value: item.id
              }));
            }} 
            fieldProps={{ treeCheckable: true, showCheckedStrategy: 'SHOW_ALL' }}
        />
      </ModalForm>

      <ProcessDrawer 
          open={drawerOpen} onClose={() => setDrawerOpen(false)} 
          onSuccess={() => { 
            setDrawerOpen(false); 
            tableRef.current?.reload(); // 刷新外层主表
            setTemplateRefreshKey(prev => prev + 1); // 🚀 5. 扭动钥匙！抽屉保存成功时强制刷新内层子表格
          }} 
          currentRecord={currentTemplate} processId={activeProcessId} 
      />
    </ContentShell>
  );
};
export default ProcessLibrary;