// src/pages/Route/components/RouteDrawer.tsx
import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, Divider, Spin } from 'antd';
import { Route } from '../typing';
import { saveRouteBaseInfo } from '../service';
import request from '@/utils/request'; // 👈 1. 引入封装好的请求工具

interface RouteDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRecord: Route | null;
}

const RouteDrawer: React.FC<RouteDrawerProps> = ({ open, onClose, onSuccess, currentRecord }) => {
  const [form] = Form.useForm();
  
  // 👈 2. 新增状态：存储物料列表和加载状态
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    if (open) {
      if (currentRecord) {
        form.setFieldsValue(currentRecord);
      } else {
        // 新建时，默认给出赛题要求的版本号，并为操作时间等给出占位提示
        form.resetFields();
        form.setFieldsValue({ version: '1.0' }); 
      }

      // 👈 3. 每次打开抽屉时，去后台拉取最新的真实物料列表
      setLoadingMaterials(true);
      // 注意：接口文档中获取物料列表是 POST 请求
      request.post('/material/list', { pageNum: 1, pageSize: 500 })
        .then(res => {
          setMaterials(res.data || []);
        })
        .catch(() => {
          // 柔性降级或者忽略，因为 request 拦截器已经报过错了
          console.warn('获取物料下拉列表失败');
        })
        .finally(() => {
          setLoadingMaterials(false);
        });
    }
  }, [open, currentRecord, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 发起真实网络请求 (传入表单数据和当前编辑的 ID)
      await saveRouteBaseInfo({ ...values, id: currentRecord?.id });
      
      message.success('工艺路线基础档案保存成功！请点击图形化编排设计工序。');
      onSuccess();
    } catch (error) {
      // Form校验失败拦截
    }
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
          {/* 👇 4. 核心改造：完全动态渲染下拉框，并加上 Loading 和友好提示 */}
          <Form.Item name="materialId" label="所属产品 (目标物料)" style={{ flex: 2 }} rules={[{ required: true, message: '必须指定产出物料' }]}>
            <Select 
              placeholder="请选择目标产品" 
              loading={loadingMaterials}
              notFoundContent={loadingMaterials ? <Spin size="small" /> : '暂无可用物料，请先去物料管理添加'}
              showSearch // 开启搜索功能，方便物料多的时候查找
              filterOption={(input, option) =>
                (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={materials.map(m => ({
                value: m.materialId, // 传给后端真实的物料 ID
                // 拼接物料名称和型号，显得更专业
                label: `${m.materialName} ${m.materialSpecificationModel ? `(${m.materialSpecificationModel})` : ''}`
              }))}
            />
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

        <Form.Item name="equipments" label="设备使用情况 / 产线占用预估">
          <Input.TextArea rows={2} placeholder="例如：需统筹协调卧式数控车床、三坐标测量机等设备" />
        </Form.Item>

      </Form>
    </Drawer>
  );
};

export default RouteDrawer;