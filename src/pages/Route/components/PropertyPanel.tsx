// src/pages/Route/components/PropertyPanel.tsx
import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Divider, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (id: string, newData: any) => void;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onUpdateNode, onClose }) => {
  const [form] = Form.useForm();

  // 当选中的节点变化时，回显表单数据
  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue(selectedNode.data);
    }
  }, [selectedNode, form]);

  if (!selectedNode) return null;

  const handleValuesChange = (_changedValues: any, allValues: any) => {
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
          <Form.Item label="节点ID" name="id" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item label="工序名称" name="processName">
            <Input disabled style={{ color: '#000', fontWeight: 500 }} />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item label="加工工时">
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

{/* 修复：加上 name="inputMaterialIds" */}
<Form.Item label="输入物料 (消耗)" name="inputMaterialIds">
  <Select mode="multiple" placeholder="选择需要的原料/半成品">
    <Select.Option value="MAT-001">太阳轮毛坯 (20CrMnTi)</Select.Option>
    <Select.Option value="MAT-002">润滑油</Select.Option>
  </Select>
          </Form.Item>
          
          {/* 新增：赛题总设计文档里的输出物料关系 */}
<Form.Item label="输出物料 (产出)" name="outputMaterialIds">
  <Select mode="multiple" placeholder="选择产出的半成品/成品">
    <Select.Option value="MAT-OUT-01">中心轮半成品</Select.Option>
  </Select>
          </Form.Item>
          

     {/* 修复：加上 name="requiredDeviceIds" */}
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