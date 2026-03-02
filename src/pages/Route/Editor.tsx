// src/pages/Route/Editor.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, message, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, BuildOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyPanel from './components/PropertyPanel';
// 👇 引入我们刚才写的牛逼节点
import ProcessNode from './components/ProcessNode';
import { saveRouteConfig, getRouteConfig } from './service';

// 👇 注册自定义节点类型
const nodeTypes = {
  processNode: ProcessNode,
};

const PROCESS_LIBRARY = [
  { id: 'PROC-001', name: '毛坯制造', type: '成型工艺', color: '#1677FF' },
  { id: 'PROC-002', name: '粗加工', type: '机械加工', color: '#FA8C16' },
  { id: 'PROC-003', name: '精加工', type: '机械加工', color: '#FA8C16' },
  { id: 'PROC-004', name: '检测', type: '质量控制', color: '#52C41A' },
  { id: 'PROC-005', name: '入库', type: '仓储物流', color: '#722ED1' },
];

let id = 0;
const getId = () => `step_${id++}`;

const EditorCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<{key: string, title: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id: routeId } = useParams();

  // 页面加载时，尝试获取已保存的画布数据
  useEffect(() => {
    if (routeId) {
      getRouteConfig(routeId).then(res => {
        if (res.nodes.length > 0) {
          setNodes(res.nodes);
          setEdges(res.edges);
        }
      });
    }
  }, [routeId, setNodes, setEdges]);

  // 连线逻辑 (平滑连线 + 箭头)
  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeWithArrow = {
      ...params,
      type: 'smoothstep', // 工业风常用的直角平滑折线
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

      const newNode = {
        id: getId(),
        type, // 这里会接收到 'processNode'
        position,
        data: { 
          label: processData.name, 
          processId: processData.id,
          processName: processData.name,
          workTime: 0,
          workTimeUnit: '分',
          color: processData.color,
          type: processData.type
        }
      };
      setNodes((nds) => nds.concat(newNode));
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

  // 👇 真实保存逻辑
  const handleSave = async () => {
    if (!routeId) return;
    setLoading(true);
    await saveRouteConfig(routeId, nodes, edges);
    message.success('工艺路线编排保存成功！');
    setLoading(false);
    setTimeout(() => {
      navigate(-1);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #d9d9d9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>工艺编排画布 - {routeId === 'RT-1001' ? '中心轮零件加工' : '未命名路线'}</span>
          <Tag color="blue">V 1.0</Tag>
        </div>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>保存并发布</Button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#fff', borderRight: '1px solid #d9d9d9', padding: 16 }}>
          <div style={{ marginBottom: 16, color: '#888', fontSize: 13 }}><BuildOutlined style={{ marginRight: 8 }} />拖拽工序卡片到右侧画布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PROCESS_LIBRARY.map((item) => (
              <div
                key={item.id}
                // 👇 注意这里，拖拽出去的类型变成了咱们自定义的 processNode
                onDragStart={(event) => onDragStart(event, 'processNode', item)}
                draggable
                style={{
                  padding: '8px 12px', border: `1px solid ${item.color}80`, borderLeft: `4px solid ${item.color}`,
                  borderRadius: 2, background: '#fafafa', cursor: 'grab', fontSize: 13, fontWeight: 500
                }}
              >
                {item.name} <span style={{ float: 'right', color: '#aaa', fontSize: 12 }}>{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes} // 👇 注入自定义节点解析
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