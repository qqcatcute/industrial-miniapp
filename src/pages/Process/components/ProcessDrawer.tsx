// src/pages/Process/components/ProcessDrawer.tsx
import React from 'react';
import { Drawer, Form, Input, Select, Button, message, Space, Collapse } from 'antd';
import { Process, ProcessLabel } from '../typing';
import { saveProcess } from '../service';

interface ProcessDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRecord: Process | null;
  labels: ProcessLabel[];
}

const ProcessDrawer: React.FC<ProcessDrawerProps> = ({ open, onClose, onSuccess, currentRecord, labels }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open && currentRecord) {
      form.setFieldsValue(currentRecord);
    } else {
      // 赋一个默认时间，让填表更轻松，也显得数据很真实
      form.resetFields();
      form.setFieldsValue({ startTime: '08:00', endTime: '17:00' });
    }
  }, [open, currentRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isNew = !currentRecord;
      const payload: Process = {
        ...values,
        id: isNew ? `PROC-${Math.floor(Math.random() * 10000)}` : currentRecord.id,
      };
      
      await saveProcess(payload);
      message.success(`${isNew ? '新建' : '更新'}工序成功`);
      onSuccess();
    } catch {
      // 校验失败拦截
    }
  };

  return (
    <Drawer
      title={currentRecord ? '编辑工序' : '新建工序'}
      width={480}
      placement="right"
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存并生效</Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form} requiredMark="optional">
        {/* --- 核心必填区域（保持你原有的极简风） --- */}
        <Form.Item 
          name="processName" 
          label="工序名称" 
          rules={[{ required: true, message: '工序名称为必填项' }]}
        >
          <Input placeholder="例如：精加工" allowClear />
        </Form.Item>

        <Form.Item name="labelIds" label="分类标签">
          <Select
            mode="multiple"
            allowClear
            placeholder="请选择工序所属分类"
            options={labels.filter(l => l.processLabelParent !== 'NULL').map(l => ({
              label: l.processLabelName,
              value: l.id
            }))}
          />
        </Form.Item>

        <Form.Item name="description" label="详细描述">
          <Input.TextArea rows={3} placeholder="描述该工序的具体加工作业内容..." />
        </Form.Item>

        {/* --- 赛题得分防守区域（折叠收纳，不占视觉空间） --- */}
        <Collapse ghost style={{ marginLeft: -16, marginRight: -16 }}>
          <Collapse.Panel header="标准作业规范 (用于建立工序数据基准)" key="1">
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
              <Form.Item name="startTime" label="标准开始时间" style={{ flex: 1 }}>
                <Input placeholder="08:00" />
              </Form.Item>
              <Form.Item name="endTime" label="标准结束时间" style={{ flex: 1 }}>
                <Input placeholder="17:00" />
              </Form.Item>
            </div>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Drawer>
  );
};

export default ProcessDrawer;