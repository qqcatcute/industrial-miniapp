// src/pages/Process/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Popconfirm, message, Tag, Tree, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ToolOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import ContentShell from '@/components/ContentShell';
import ProcessDrawer from './components/ProcessDrawer';
import { queryProcesses, queryProcessLabels, deleteProcess } from './service';
import { Process, ProcessLabel } from './typing';

const ProcessLibrary: React.FC = () => {
  const tableRef = useRef<ActionType>(null);
  
  // 状态管理
  const [labels, setLabels] = useState<ProcessLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('LBL-0');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Process | null>(null);
  const [keyword, setKeyword] = useState<string>('');

  // 初始化获取标签树
  useEffect(() => {
    queryProcessLabels().then(res => setLabels(res));
  }, []);

  // 组装 TreeData
  const treeData = labels
    .filter(l => l.processLabelParent === 'NULL')
    .map(parent => ({
      title: parent.processLabelName,
      key: parent.id,
      icon: <ToolOutlined />,
      children: labels
        .filter(l => l.processLabelParent === parent.id)
        .map(child => ({
          title: child.processLabelName,
          key: child.id,
        })),
    }));

  // 删除操作
  const handleDelete = async (id: string) => {
    await deleteProcess(id);
    message.success('工序已删除');
    tableRef.current?.reload();
  };

  // 表格列定义
  const columns: ProColumns<Process>[] = [
    { title: '工序编号', dataIndex: 'id', width: 120, copyable: true },
    { 
      title: '工序名称', 
      dataIndex: 'processName', 
      width: 180,
      render: (dom, record) => (
        <a onClick={() => { setCurrentRow(record); setDrawerOpen(true); }} style={{ fontWeight: 500 }}>
          {dom}
        </a>
      )
    },
    
  { 
    title: '岗位资质 (操作人员)', 
    dataIndex: 'operator', 
    width: 180,
    ellipsis: true,
    render: (val) => val ? <Tag color="blue">{val}</Tag> : <span style={{color:'#ccc'}}>未配置</span>
  },
  { 
    title: '推荐设备', 
    dataIndex: 'equipments', 
    width: 200,
    ellipsis: true 
  },
  { 
    title: '标准排程时间', 
    key: 'timeRange',
    width: 160,
    render: (_, record) => {
      if (record.startTime && record.endTime) {
        return <span style={{ color: '#888' }}>{record.startTime} - {record.endTime}</span>;
      }
      return <span style={{color:'#ccc'}}>未配置</span>;
    }
  },
 
    {
      title: '工序分类',
      dataIndex: 'labelIds',
      width: 200,
      render: (_, record) => (
        <>
          {record.labelIds?.map(id => {
            const label = labels.find(l => l.id === id);
            return <Tag color="blue" key={id}>{label?.processLabelName || '未知'}</Tag>;
          })}
        </>
      ),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '最后更新', dataIndex: 'updatedAt', width: 120, valueType: 'date' },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setCurrentRow(record); setDrawerOpen(true); }} />,
        <Popconfirm key="del" title="确定要删除此工序吗？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ContentShell
      breadcrumbItems={[{ title: '工序库' }, { title: '工序数据管理' }]}
      title="工序列表"
      searchPlaceholder="输入工序名称或编号查询..."
      onSearch={(val) => {
        setKeyword(val);
        tableRef.current?.reload();
      }}
      actions={[
        <Button 
          key="create" 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => { setCurrentRow(null); setDrawerOpen(true); }}
        >
          新建工序
        </Button>
      ]}
    >
      <div style={{ display: 'flex', height: '100%', gap: 16 }}>
        {/* 左树容器 */}
        <div style={{ 
          width: 220, 
          minWidth: 220,     // 【新增】最小宽度锁死
          flexShrink: 0,     // 【新增】flex-shrink: 0 代表绝对不允许被右侧挤压
          background: '#fff', 
          border: '1px solid #d9d9d9', 
          padding: '16px 8px', // 左右 padding 稍微改小一点，让文字更宽裕
          overflowY: 'auto',
          overflowX: 'hidden'  // 【新增】隐藏底部可能出现的丑陋横向滚动条
        }}>
          <Tree
            defaultExpandAll
            treeData={treeData}
            selectedKeys={[selectedLabelId]}
            onSelect={(keys) => {
              if (keys.length > 0) {
                setSelectedLabelId(keys[0] as string);
                tableRef.current?.reload();
              }
            }}
            showIcon
            // 【新增】强制树节点文字不换行
            titleRender={(nodeData) => (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nodeData.title as string}
              </span>
            )}
          />
        </div>

        {/* 右表容器 */}
        <div style={{ flex: 1, border: '1px solid #d9d9d9', background: '#fff' }}>
          <ProTable<Process>
            columns={columns}
            actionRef={tableRef}
            rowKey="id"
            search={false} // 关闭自带的高级搜索表单，使用外壳的统一 Search
            options={{ reload: true, setting: true, density: false }}
            size="small"
            request={async (params) => {
              return queryProcesses({
                current: params.current,
                pageSize: params.pageSize,
                keyword: keyword,
                labelId: selectedLabelId
              });
            }}
            pagination={{ defaultPageSize: 20, showSizeChanger: true }}
            scroll={{ y: 'calc(100vh - 280px)' }} // 适应屏幕高度防透字
            rowSelection={{}}
            tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
              <Space size={24}>
                <span>已选 {selectedRowKeys.length} 项</span>
                <a onClick={onCleanSelected}>取消选择</a>
              </Space>
            )}
            tableAlertOptionRender={() => (
              <Space size={16}>
                <a>批量修改分类</a>
                <a style={{ color: 'red' }}>批量删除</a>
              </Space>
            )}
          />
        </div>
      </div>

      {/* 抽屉组件 */}
      <ProcessDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false);
          tableRef.current?.reload();
        }}
        currentRecord={currentRow}
        labels={labels}
      />
    </ContentShell>
  );
};

export default ProcessLibrary;