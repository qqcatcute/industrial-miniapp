// src/pages/Route/Editor.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, message, Tag, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, BuildOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import request from '@/utils/request'; // 引入网络请求
import PropertyPanel from './components/PropertyPanel';
import ProcessNode from './components/ProcessNode';
import { saveRouteConfig, getRouteConfig } from './service';

const nodeTypes = {
  processNode: ProcessNode,
};

let id = 0;
const getId = () => `step_${id++}`;

// 颜色分配器：让动态获取的工序也能有好看的颜色
const COLORS = ['#1677FF', '#FA8C16', '#13c2c2', '#722ED1', '#EB2F96'];

const EditorCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNode, setSelectedNode] = useState<{id: string, data: any} | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  // 🚀 新增：动态存储左侧的真实基础工序库
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [processLibrary, setProcessLibrary] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // 1. 初始化画布数据 & 动态加载左侧工序库
  useEffect(() => {
    // 拉取历史画布保存的节点
    if (routeId) {
      getRouteConfig(routeId).then(res => {
        if (res.nodes.length > 0) {
          setNodes(res.nodes);
          setEdges(res.edges);
        }
      });
    }

    // 🚀 核心：拉取真实的工序列表填充左侧组件库
    // 🚀 核心：拉取真实的工序列表填充左侧组件库
request.post('/process/list', { pageNum: 1, pageSize: 100 })
  .then(res => {
          const list = res.data || [];
         // 映射为画板需要的格式，并随机分配一个颜色
          const library = list.map((item: any, index: number) => ({
              id: item.processId,
              name: item.processName,
              type: '基础工序', 
              color: COLORS[index % COLORS.length] 
          }));
          setProcessLibrary(library);
      })
      .catch(() => {
         // 柔性降级：请求失败则给一套 Mock 库
          setProcessLibrary([
            { id: 'PROC-001', name: '毛坯制造 (Mock)', type: '成型工艺', color: '#1677FF' },
            { id: 'PROC-002', name: '精加工 (Mock)', type: '机械加工', color: '#FA8C16' }
          ]);
      })
      .finally(() => setLibraryLoading(false));
  }, [routeId, setNodes, setEdges]);

  // 平滑连线逻辑
  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeWithArrow = {
      ...params,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8c8c8c' },
      style: { stroke: '#8c8c8c', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(edgeWithArrow, eds));
  }, [setEdges]);

  const onDragStart = (event: React.DragEvent, nodeType: string, processData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('processData', JSON.stringify(processData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const processDataStr = event.dataTransfer.getData('processData');
      if (typeof type === 'undefined' || !type || !processDataStr) return;

      const processData = JSON.parse(processDataStr);
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

      // 🚀 创建新节点，包含 processId，但不包含 templateId (需要用户在右侧选)
      const newNode = {
        id: getId(),
        type, 
        position,
        data: { 
          label: processData.name, 
          processId: processData.id,     // 记录属于哪个大工序
          processName: processData.name, 
          templateId: undefined,         // 等待用户选择模板！
          workTime: 0,
          workTimeUnit: '分',
          color: processData.color,
          type: processData.type
        }
      };
      setNodes((nds) => nds.concat(newNode));
      
      // 拖拽完成后，自动选中该节点，弹出右侧面板强迫用户选模板
      setSelectedNode(newNode);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = (_event: React.MouseEvent, node: any) => setSelectedNode(node);

  const handleUpdateNode = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, ...newData };
        }
        return node;
      })
    );
    setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, ...newData } }));
  };

  // 保存画布到后端
  const handleSave = async () => {
    if (!routeId) return;
    
    const invalidNodes = nodes.filter(n => !n.data.templateId);
    if (invalidNodes.length > 0) {
      message.error(`有 ${invalidNodes.length} 个步骤未配置执行模板，请在右侧完成选择！`);
      return;
    }

    setLoading(true);
    try {
      await saveRouteConfig(routeId, nodes, edges);
      message.success('工艺路线编排保存成功！所有的模板关联已生效。');
      setTimeout(() => navigate(-1), 800);
    } catch (error) {
      message.error('保存失败，请打开 F12 查看具体的 400 字段错误');
    } finally {
      setLoading(false); // 无论成功失败，取消 loading
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #d9d9d9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>工艺编排画布 - {routeId === 'RT-1001' ? '中心轮零件加工' : '自定义路线'}</span>
          <Tag color="cyan">V 1.0</Tag>
        </div>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>保存工艺路线与模板关系</Button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#fff', borderRight: '1px solid #d9d9d9', padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16, color: '#888', fontSize: 13 }}><BuildOutlined style={{ marginRight: 8 }} />拖拽工序到右侧画板</div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {libraryLoading ? (
               <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载基础工序..." /></div>
            ) : (
               processLibrary.map((item) => (
                 <div
                   key={item.id}
                   onDragStart={(event) => onDragStart(event, 'processNode', item)}
                   draggable
                   style={{
                     padding: '8px 12px', border: `1px solid ${item.color}80`, borderLeft: `4px solid ${item.color}`,
                     borderRadius: 2, background: '#fafafa', cursor: 'grab', fontSize: 13, fontWeight: 500
                   }}
                 >
                   {item.name} <span style={{ float: 'right', color: '#aaa', fontSize: 12 }}>{item.type}</span>
                 </div>
               ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#ccc" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {selectedNode && (
          <PropertyPanel selectedNode={selectedNode} onUpdateNode={handleUpdateNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
};

export default function RouteEditor() {
  return <ReactFlowProvider><EditorCanvas /></ReactFlowProvider>;
}