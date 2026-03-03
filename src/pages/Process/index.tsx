// src/pages/Process/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Popconfirm, message, Tag, Tree, Space, Table, Modal, Input, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ToolOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import ProcessDrawer from './components/ProcessDrawer';
import { queryProcesses, queryProcessLabels, deleteProcess, saveProcess, deleteProcessTemplate } from './service';
import { Process, ProcessLabel, ProcessTemplate } from './typing';

const ProcessLibrary: React.FC = () => {
  const tableRef = useRef<ActionType>(null);
  const [labels, setLabels] = useState<ProcessLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('LBL-0');
  const [keyword, setKeyword] = useState<string>('');

  // 基础工序 Modal 状态
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [editProcessId, setEditProcessId] = useState<string | undefined>();
  const [editProcessName, setEditProcessName] = useState('');

  // 模板 Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ProcessTemplate | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string>(''); // 记录当前要在哪个工序下建模板

  useEffect(() => { queryProcessLabels().then(res => setLabels(res)); }, []);

  const treeData = labels.filter(l => l.processLabelParent === 'NULL').map(parent => ({
    title: parent.processLabelName, key: parent.id, icon: <ToolOutlined />,
    children: labels.filter(l => l.processLabelParent === parent.id).map(c => ({ title: c.processLabelName, key: c.id }))
  }));

  // 🚀 核心：展开的子表（展示模板）
  const expandedRowRender = (record: Process) => {
    const subColumns = [
      { title: '模板执行名称', dataIndex: 'templateName', key: 'templateName', render: (val: string) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{val}</span> },
      { title: '岗位资质', dataIndex: 'operator', key: 'operator', render: (val: string) => val ? <Tag>{val}</Tag> : '-' },
      { title: '推荐设备', dataIndex: 'equipments', key: 'equipments', ellipsis: true },
      { title: '标准排程', key: 'time', render: (_: any, t: ProcessTemplate) => <span style={{ color: '#888' }}>{t.startTime || '-'} ~ {t.endTime || '-'}</span> },
      { title: '所属分类', dataIndex: 'labelIds', key: 'labelIds', render: (ids: string[]) => ids?.map(id => <Tag color="blue" key={id}>{labels.find(l => l.id === id)?.processLabelName}</Tag>) },
      {
        title: '操作', key: 'action', width: 120,
        render: (_: any, t: ProcessTemplate) => (
          <Space split={<Divider type="vertical" />}>
            <a onClick={() => { setCurrentTemplate(t); setActiveProcessId(record.processId); setDrawerOpen(true); }}>编辑</a>
            <Popconfirm title="删除该模板？" onConfirm={async () => { await deleteProcessTemplate([t.templateId]); message.success('删除成功'); tableRef.current?.reload(); }}>
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ padding: '8px 24px 16px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 600, color: '#555' }}><NodeIndexOutlined style={{ marginRight: 8, color: '#1677ff' }}/> 下挂执行标准 (模板)</span>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => { setCurrentTemplate(null); setActiveProcessId(record.processId); setDrawerOpen(true); }}>新建执行模板</Button>
        </div>
        <Table columns={subColumns} dataSource={record.templates} pagination={false} size="small" rowKey="templateId" bordered={false} locale={{ emptyText: '暂无模板，请先新建' }} />
      </div>
    );
  };

  const columns: ProColumns<Process>[] = [
    { title: '基础工序 ID', dataIndex: 'processId', width: 200, copyable: true },
    { title: '基础工序大类', dataIndex: 'processName', render: (dom) => <span style={{ fontWeight: 600, fontSize: 15 }}>{dom}</span> },
    { title: '包含模板数', key: 'count', width: 150, render: (_, record) => <Tag color={record.templates?.length ? 'cyan' : 'default'}>{record.templates?.length || 0} 个标准模板</Tag> },
    {
      title: '操作', valueType: 'option', width: 150, fixed: 'right',
      render: (_, record) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditProcessId(record.processId); setEditProcessName(record.processName); setProcessModalOpen(true); }} />,
        <Popconfirm key="del" title="连同模板一起删除？" onConfirm={async () => { await deleteProcess([record.processId]); message.success('已删除'); tableRef.current?.reload(); }}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ContentShell
      breadcrumbItems={[{ title: '工艺库' }, { title: '工序与执行模板' }]} title="工序管理" searchPlaceholder="输入工序或模板名称..."
      onSearch={(val) => { setKeyword(val); tableRef.current?.reload(); }}
      actions={[<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setEditProcessId(undefined); setEditProcessName(''); setProcessModalOpen(true); }}>新建基础工序</Button>]}
    >
      <div style={{ display: 'flex', height: '100%', gap: 16 }}>
        <div style={{ width: 220, minWidth: 220, flexShrink: 0, background: '#fff', border: '1px solid #d9d9d9', padding: '16px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          <Tree defaultExpandAll treeData={treeData} selectedKeys={[selectedLabelId]} onSelect={(keys) => { if (keys.length > 0) { setSelectedLabelId(keys[0] as string); tableRef.current?.reload(); } }} showIcon titleRender={(nodeData) => (<span style={{ whiteSpace: 'nowrap' }}>{nodeData.title as string}</span>)} />
        </div>
        <div style={{ flex: 1, border: '1px solid #d9d9d9', background: '#fff' }}>
          <ProTable<Process>
            columns={columns} actionRef={tableRef} rowKey="processId" search={false} options={{ reload: true, setting: false }} size="small"
            request={async (params) => queryProcesses({ current: params.current, pageSize: params.pageSize, keyword, labelId: selectedLabelId })}
            pagination={{ defaultPageSize: 20 }} scroll={{ y: 'calc(100vh - 280px)' }}
            expandable={{ expandedRowRender, expandRowByClick: true }}
          />
        </div>
      </div>

      {/* 弹窗：新建/编辑 基础工序名称 */}
      <Modal title={editProcessId ? '编辑基础工序' : '新建基础工序大类'} open={processModalOpen} onCancel={() => setProcessModalOpen(false)} onOk={async () => { if (!editProcessName) return message.warning('请输入名称'); await saveProcess(editProcessName, editProcessId); message.success('保存成功'); setProcessModalOpen(false); tableRef.current?.reload(); }} destroyOnClose>
        <div style={{ padding: '24px 0' }}><Input value={editProcessName} onChange={e => setEditProcessName(e.target.value)} placeholder="例如：焊接、精加工..." size="large"/></div>
      </Modal>

      {/* 抽屉：承载复杂的 模板表单 */}
      <ProcessDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={() => { setDrawerOpen(false); tableRef.current?.reload(); }} currentRecord={currentTemplate} processId={activeProcessId} labels={labels} />
    </ContentShell>
  );
};
export default ProcessLibrary;