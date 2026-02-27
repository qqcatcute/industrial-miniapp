// src/pages/Route/components/ProcessNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';

// 自定义节点的 Props 接口
interface ProcessNodeProps {
  data: {
    label: string;
    processName: string;
    workTime: number;
    workTimeUnit: string;
    color: string;
    type: string;
  };
  selected: boolean;
}

const ProcessNode: React.FC<ProcessNodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        width: 180,
        background: '#fff',
        borderRadius: '4px',
        // 选中时有蓝色光晕，平时是很淡的阴影 (符合 Odoo 极简扁平风)
        boxShadow: selected ? '0 0 0 2px #1677FF, 0 2px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      {/* 🎯 左侧输入点 (Target) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ width: 8, height: 8, background: '#555', border: '2px solid #fff' }} 
      />

      {/* 🎨 Odoo 风格左侧色条 */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: data.color || '#1677FF' }} />

      {/* 📋 卡片内容区 */}
      <div style={{ padding: '8px 12px 8px 16px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
          {data.type || '标准工序'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
          {data.processName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e8e8e8', paddingTop: 6 }}>
          <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined />
            {data.workTime > 0 ? `${data.workTime} ${data.workTimeUnit}` : '未配置'}
          </span>
          <SettingOutlined style={{ color: '#bfbfbf' }} />
        </div>
      </div>

      {/* 🎯 右侧输出点 (Source) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ width: 8, height: 8, background: '#1677FF', border: '2px solid #fff' }} 
      />
    </div>
  );
};

export default ProcessNode;