// src/pages/Route/components/PropertyPanel.tsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Divider, Button, message, Spin } from 'antd';
import { CloseOutlined, PartitionOutlined } from '@ant-design/icons';
import request from '@/utils/request'; // 引入请求工具

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (id: string, newData: any) => void;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onUpdateNode, onClose }) => {
  const [form] = Form.useForm();
  
  // 🚀 新增：存储当前选中工序下的所有可用模板
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // 当选中的节点变化时，回显表单数据，并去后端拉取该工序的模板！
  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue(selectedNode.data);
      
      const processId = selectedNode.data.processId;
      if (processId) {
        setLoadingTemplates(true);
        // 🚀 核心：调用师兄的接口，获取该 processId 下的所有 template
        request.get('/process/listTemplate', { params: { processId, pageNum: 1, pageSize: 100 } })
          .then(res => {
            setTemplates(res.data?.list || []);
          })
          .catch(() => {
            // 兜底逻辑：如果后端没开，给个假模板保证 UI 能演示
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
    // 如果切换了模板，我们可以根据模板里的 JSON 反解析出设备和人员自动填充（进阶功能）
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
    <div style={{ 
      width: 320, 
      background: '#fff', 
      borderLeft: '1px solid #d9d9d9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #d9d9d9', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
      }}>
        <span style={{ fontWeight: 600 }}>步骤属性配置</span>
        <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} />
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
        <Form 
          form={form} 
          layout="vertical" 
          onValuesChange={handleValuesChange}
          requiredMark="optional"
        >
          <Form.Item label="节点ID" name="id" hidden><Input /></Form.Item>
          
          <Form.Item label="基础工序名称" name="processName">
            <Input disabled style={{ color: '#000', fontWeight: 500 }} />
          </Form.Item>

          {/* 👇 核心改造：完全契合师兄逻辑的模板选择器 */}
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

          <Form.Item label="输入物料 (消耗)" name="inputMaterialIds">
            <Select mode="multiple" placeholder="选择需要的原料/半成品">
              <Select.Option value="MAT-001">太阳轮毛坯 (20CrMnTi)</Select.Option>
              <Select.Option value="MAT-002">润滑油</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="输出物料 (产出)" name="outputMaterialIds">
            <Select mode="multiple" placeholder="选择产出的半成品/成品">
              <Select.Option value="MAT-OUT-01">中心轮半成品</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="所需设备 (占用)" name="requiredDeviceIds">
            <Select mode="multiple" placeholder="选择执行加工的机床">
              <Select.Option value="DEV-CNC-01">卧式加工中心 (DEV-001)</Select.Option>
              <Select.Option value="DEV-CMM-02">三坐标测量仪 (DEV-002)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="作业指导说明" name="detailDescription">
            <Input.TextArea rows={4} placeholder="例如：转速设定在2000rpm，注意冷却液流量..." />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PropertyPanel;