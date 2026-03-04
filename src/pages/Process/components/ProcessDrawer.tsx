// src/pages/Process/components/ProcessDrawer.tsx
import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, message, Space, Collapse, Select, Spin, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ProcessTemplate } from '../typing'; 
import { saveProcessTemplate } from '../service';
import request from '@/utils/request';

interface ProcessDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentRecord: ProcessTemplate | any;
  processId: string; 
}

const ProcessDrawer: React.FC<ProcessDrawerProps> = ({ open, onClose, onSuccess, currentRecord, processId }) => {
  const [form] = Form.useForm();
  const [materials, setMaterials] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      // 打开抽屉时拉取真实的物料和设备列表
      setLoadingData(true);
      Promise.all([
        request.post('/material/list', { pageNum: 1, pageSize: 500 }),
        request.post('/device/list', { pageNum: 1, pageSize: 500 })
      ]).then(([matRes, devRes]) => {
        setMaterials(matRes.data || []);
        setDevices(devRes.data || []);
      }).finally(() => {
        setLoadingData(false);
      });

if (currentRecord) {
        // 重要：回显数据时，需要将后端传来的字符串转换为 dayjs 对象
        form.setFieldsValue({
          ...currentRecord,
          startTime: currentRecord.startTime ? dayjs(currentRecord.startTime) : null,
          endTime: currentRecord.endTime ? dayjs(currentRecord.endTime) : null,
        });
      } else {
        form.resetFields();
        // 设置默认值（例如：今天 08:00:00）
        form.setFieldsValue({ 
          startTime: dayjs().set('hour', 8).set('minute', 0).set('second', 0),
          endTime: dayjs().set('hour', 17).set('minute', 0).set('second', 0)
        });
      }
    }
  }, [open, currentRecord, form]);
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 👇 核心逻辑：将选择的 ID 数组组装成后端推荐的 JSON 格式
      const formatMaterialJson = (ids: string[]) => JSON.stringify((ids || []).map(id => {
        const mat = materials.find(m => m.materialId === id) || {};
        // 默认消耗数量给 1.0，单位取真实单位
        return { materialId: id, materialName: mat.materialName || '未知物料', materialQuantity: 1.0, materialUnit: mat.materialUnit || '件' };
      }));

      const formatDeviceJson = (ids: string[]) => JSON.stringify((ids || []).map(id => {
        const dev = devices.find(d => d.deviceId === id) || {};
        return { deviceId: id, deviceName: dev.deviceName || '未知设备' };
      }));

// 在提交给 service 之前，将 dayjs 对象格式化为后端要求的字符串
      const payload = {
        ...values,
        processId,
        templateId: currentRecord?.templateId || '',
        // 关键点：转换时间格式
        startTime: values.startTime ? dayjs(values.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
        endTime: values.endTime ? dayjs(values.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
        
        inputJson: formatMaterialJson(values.inputMaterialIds),
        outputJson: formatMaterialJson(values.outputMaterialIds),
        deviceJson: formatDeviceJson(values.requiredDeviceIds)
      };
      
      await saveProcessTemplate(payload);
      message.success(`${currentRecord ? '更新' : '创建'}成功`);
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer
      title={currentRecord ? '编辑执行模板 (Template)' : '新建执行模板 (Template)'}
      width={520} placement="right" onClose={onClose} open={open} styles={{ body: { paddingBottom: 80 } }}
      extra={<Space><Button onClick={onClose}>取消</Button><Button type="primary" onClick={handleSubmit}>保存模板</Button></Space>}
    >
      <Spin spinning={loadingData} tip="加载系统物料与设备中...">
        <Form layout="vertical" form={form} requiredMark="optional">
          <Form.Item name="templateName" label="执行模板名称" rules={[{ required: true, message: '模板名称为必填项' }]}>
            <Input placeholder="例如：高精度车铣复合规范" allowClear />
          </Form.Item>

          <Collapse defaultActiveKey={['2']} ghost style={{ marginLeft: -16, marginRight: -16 }}>
            <Collapse.Panel header="核心资源统筹 (BOM 与 设备)" key="2">
              <Form.Item name="inputMaterialIds" label="输入物料 (消耗)">
                <Select mode="multiple" placeholder="请选择原料或半成品" options={materials.map(m => ({ value: m.materialId, label: `${m.materialName} (${m.materialSpecificationModel || '无型号'})` }))} />
              </Form.Item>
              <Form.Item name="outputMaterialIds" label="输出物料 (产出)">
                <Select mode="multiple" placeholder="请选择产出的半成品/成品" options={materials.map(m => ({ value: m.materialId, label: m.materialName }))} />
              </Form.Item>
              <Form.Item name="requiredDeviceIds" label="所需设备 (占用)">
                <Select mode="multiple" placeholder="请选择需要的机床设备" options={devices.map(d => ({ value: d.deviceId, label: `${d.deviceName} [${d.deviceId}]` }))} />
              </Form.Item>
            </Collapse.Panel>

            <Collapse.Panel header="标准作业规范 (时间与操作)" key="1">
              <Form.Item name="operator" label="岗位操作人员要求">
                <Input placeholder="例如：高级数控车工" />
              </Form.Item>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Form.Item name="startTime" label="标准开始时间" style={{ flex: 1 }}>
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm:ss" 
                    placeholder="请选择开始时间"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item name="endTime" label="标准结束时间" style={{ flex: 1 }}>
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm:ss" 
                    placeholder="请选择结束时间"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
              <Form.Item name="templateDescription" label="详细描述">
                <Input.TextArea rows={2} placeholder="描述该执行标准的具体内容..." />
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default ProcessDrawer;