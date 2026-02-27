// src/pages/Route/components/RouteDrawer.tsx
import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, Divider } from 'antd';
import { Route } from '../typing';

interface RouteDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRecord: Route | null;
}

const RouteDrawer: React.FC<RouteDrawerProps> = ({ open, onClose, onSuccess, currentRecord }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (currentRecord) {
        form.setFieldsValue(currentRecord);
      } else {
        // 新建时，默认给出赛题要求的版本号，并为操作时间等给出占位提示
        form.resetFields();
        form.setFieldsValue({ version: '1.0' }); 
      }
    }
  }, [open, currentRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('发给后端的工艺路线(WorkingPlan)数据:', values);
      message.success('工艺路线保存成功！请前往图形化编排配置工序与设备/物料关系。');
      onSuccess();
    } catch (error) {}
  };

  return (
    <Drawer 
      title={currentRecord ? '编辑工艺路线 (WorkingPlan)' : '新建工艺路线 (WorkingPlan)'} 
      width={520} 
      placement="right" 
      onClose={onClose} 
      open={open} 
      extra={<Space><Button onClick={onClose}>取消</Button><Button type="primary" onClick={handleSubmit}>保存</Button></Space>}
    >
      <Form layout="vertical" form={form} requiredMark="optional">
        <Divider orientation="left" plain>基础信息</Divider>
        
        <Form.Item name="routeName" label="工艺名称" rules={[{ required: true, message: '工艺名称必填' }]}>
          <Input placeholder="例如：中心轮零件加工工艺" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="materialId" label="所属产品 (目标物料)" style={{ flex: 2 }} rules={[{ required: true }]}>
            <Select placeholder="请选择目标产品">
              <Select.Option value="MAT-001">中心轮毛坯</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="version" label="工艺版本" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Input placeholder="1.0" />
          </Form.Item>
        </div>

        <Form.Item name="routeDescription" label="工艺描述">
          <Input.TextArea rows={2} placeholder="描述该工艺路线的加工特征..." />
        </Form.Item>

        {/* --- 赛题要求 (4) 核心体现区 --- */}
        <Divider orientation="left" plain style={{ color: '#1677FF' }}>执行统筹配置</Divider>
        
        <Form.Item name="operator" label="操作人员 / 工艺编制人">
          <Input placeholder="例如：高级工艺工程师 / 第一班组" />
        </Form.Item>

        <Form.Item name="operationTime" label="操作时间 / 标准总工时">
          <Input placeholder="例如：单件加工总操作时间 12 小时" />
        </Form.Item>

        <Form.Item name="equipmentStatus" label="设备使用情况 / 产线占用预估">
          <Input.TextArea rows={2} placeholder="例如：需统筹协调卧式数控车床、三坐标测量机等设备" />
        </Form.Item>

      </Form>
    </Drawer>
  );
};

export default RouteDrawer;