// src/pages/Process/components/ProcessDrawer.tsx
import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, message, Space, Collapse } from 'antd';
import { ProcessTemplate, ProcessLabel } from '../typing';
import { saveProcessTemplate } from '../service';

interface ProcessDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRecord: ProcessTemplate | null;
  processId: string; // 必须传入父级工序 ID
  labels: ProcessLabel[];
}

const ProcessDrawer: React.FC<ProcessDrawerProps> = ({ open, onClose, onSuccess, currentRecord, processId, labels }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (currentRecord) {
        form.setFieldsValue(currentRecord);
      } else {
        form.resetFields();
        form.setFieldsValue({ startTime: '08:00', endTime: '17:00' });
      }
    }
  }, [open, currentRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload: ProcessTemplate = {
        ...values,
        processId, // 绑定到当前选中的基础工序下
        templateId: currentRecord?.templateId || '', // 有就是编辑，没有就是新增
      };
      
      await saveProcessTemplate(payload);
      message.success(`${currentRecord ? '更新' : '新建'}模板成功！`);
      onSuccess();
    } catch {
      // 校验失败自动拦截
    }
  };

  return (
    <Drawer
      title={currentRecord ? '编辑执行模板 (Template)' : '新建执行模板 (Template)'}
      width={480} placement="right" onClose={onClose} open={open} styles={{ body: { paddingBottom: 80 } }}
      extra={<Space><Button onClick={onClose}>取消</Button><Button type="primary" onClick={handleSubmit}>保存模板</Button></Space>}
    >
      <Form layout="vertical" form={form} requiredMark="optional">
        <Form.Item name="templateName" label="执行模板名称" rules={[{ required: true, message: '模板名称为必填项' }]}>
          <Input placeholder="例如：高精度车铣复合规范" allowClear />
        </Form.Item>

        {/* 👇 分类实际上存在 JSON 里，但前端看起来就像原生字段 */}
        <Form.Item name="labelIds" label="模板所属分类 (标签)">
          <Select
            mode="multiple" allowClear placeholder="请选择所属分类，将决定左侧树的过滤"
            options={labels.filter(l => l.processLabelParent !== 'NULL').map(l => ({ label: l.processLabelName, value: l.id }))}
          />
        </Form.Item>

        <Form.Item name="templateDescription" label="详细描述">
          <Input.TextArea rows={2} placeholder="描述该执行标准的具体内容..." />
        </Form.Item>

        <Collapse defaultActiveKey={['1']} ghost style={{ marginLeft: -16, marginRight: -16 }}>
          <Collapse.Panel header="标准作业规范 (用于赛题底层核心评分)" key="1">
            <Form.Item name="productionSteps" label="生产步骤">
              <Input.TextArea rows={2} placeholder="例如：1.上料 2.加工 3.下料" />
            </Form.Item>
            
            <Form.Item name="equipments" label="推荐生产/检测设备">
              <Input placeholder="例如：高精度数控车床、三坐标测量仪" />
            </Form.Item>

            <Form.Item name="operator" label="岗位操作人员要求">
              <Input placeholder="例如：高级数控车工" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="startTime" label="标准开始时间" style={{ flex: 1 }}><Input placeholder="08:00" /></Form.Item>
              <Form.Item name="endTime" label="标准结束时间" style={{ flex: 1 }}><Input placeholder="17:00" /></Form.Item>
            </div>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Drawer>
  );
};

export default ProcessDrawer;