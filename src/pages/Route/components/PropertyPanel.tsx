// src/pages/Route/components/PropertyPanel.tsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Divider, Button, message, Spin } from 'antd';
import { CloseOutlined, PartitionOutlined } from '@ant-design/icons';
import request from '@/utils/request';

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (id: string, newData: any) => void;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onUpdateNode, onClose }) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue(selectedNode.data);
      
      const processId = selectedNode.data.processId;
      if (processId) {
        setLoadingTemplates(true);
        request.get('/process/listTemplate', { params: { processId, pageNum: 1, pageSize: 100 } })
          .then(res => {
            // 🚨 核心修复 1：后端可能直接返回数组，不要硬取 .list
            const list = Array.isArray(res.data) ? res.data : (res.data?.list || []);
            
            // 🚨 核心修复 2：后端的模板名称实际上叫 processName，前端这里强行映射
            const formattedList = list.map((t: any) => ({
              ...t,
              templateId: t.templateId,
              templateName: t.processName || t.templateName || '未命名标准'
            }));
            
            setTemplates(formattedList);
          })
          .catch(() => {
            // 兜底假数据
            setTemplates([{ templateId: `TPL-MOCK-${processId}`, templateName: '默认执行标准 (Mock)' }]);
          })
          .finally(() => {
            setLoadingTemplates(false);
          });
      }
    }
  }, [selectedNode, form]);

  if (!selectedNode) return null;

  const handleValuesChange = (_changedValues: any, allValues: any) => {
    if (_changedValues.templateId) {
       const selectedTpl = templates.find(t => t.templateId === _changedValues.templateId);
       if (selectedTpl) {
           message.success(`已应用模板：${selectedTpl.templateName}`);
       }
    }
    // 实时更新节点数据 (包括最重要的 templateId)
    onUpdateNode(selectedNode.id, allValues);
  };

  return (
    <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #d9d9d9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #d9d9d9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
        <span style={{ fontWeight: 600 }}>步骤属性配置</span>
        <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} />
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange} requiredMark="optional">
          <Form.Item label="节点ID" name="id" hidden><Input /></Form.Item>
          
          <Form.Item label="基础工序名称" name="processName">
            <Input disabled style={{ color: '#000', fontWeight: 500 }} />
          </Form.Item>

          <div style={{ background: '#e6fffb', padding: '12px 12px 4px 12px', borderRadius: 6, border: '1px solid #87e8de', marginBottom: 16 }}>
            <Form.Item 
              label={<span><PartitionOutlined style={{ marginRight: 6 }}/>选择执行标准 (模板)</span>} 
              name="templateId" 
              rules={[{ required: true, message: '必须选择一个工序模板！' }]}
            >
              <Select 
                placeholder="请选择具体要执行的模板" 
                loading={loadingTemplates}
                notFoundContent={loadingTemplates ? <Spin size="small" /> : '该工序下暂无模板，请先去工序库创建'}
                options={templates.map(t => ({ label: t.templateName, value: t.templateId }))}
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item label="单件加工工时估算">
            <Input.Group compact>
              <Form.Item name="workTime" noStyle>
                <InputNumber style={{ width: '65%' }} placeholder="输入时长" min={0} />
              </Form.Item>
              <Form.Item name="workTimeUnit" noStyle initialValue="分">
                <Select style={{ width: '35%' }}>
                  <Select.Option value="时">小时</Select.Option>
                  <Select.Option value="分">分钟</Select.Option>
                  <Select.Option value="秒">秒</Select.Option>
                </Select>
              </Form.Item>
            </Input.Group>
          </Form.Item>

          {/* ... 下方的物料和设备等纯展示用的字段保持原样即可 ... */}
          <Form.Item label="作业指导说明" name="detailDescription">
            <Input.TextArea rows={4} placeholder="例如：转速设定在2000rpm，注意冷却液流量..." />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PropertyPanel;