// src/pages/Device/components/DeviceDrawer.tsx
import React from 'react';
import { 
  DrawerForm, ProFormText, ProFormSelect, ProFormDigit, 
  ProFormDatePicker, ProFormList, ProFormTextArea, ProFormTreeSelect
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Divider, message } from 'antd';
import { Device } from '../typing';
import { getDeviceLabels } from '../service'; // 🚀 移除了 getSparePartOptions

interface DeviceDrawerProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: Partial<Device>;
  onSubmit: (values: Device) => Promise<boolean>;
}

type FormValues = Device & { 
  deviceParameterList?: { name: string; value: string; unit?: string }[] 
};

const DeviceDrawer: React.FC<DeviceDrawerProps> = ({ visible, onVisibleChange, initialValues, onSubmit }) => {
  const isEdit = !!initialValues?.deviceId;

  const processInitialParameters = () => {
    if (!initialValues?.deviceParameter) return [];
    try {
      let parsed = JSON.parse(initialValues.deviceParameter);
      if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
      
      return Object.entries(parsed).map(([name, fullValue]) => {
        const strVal = String(fullValue);
        const parts = strVal.trim().split(' ');
        const value = parts[0];
        const unit = parts.length > 1 ? parts.slice(1).join(' ') : ''; 
        return { name, value, unit };
      });
    } catch{ return []; }
  };

  const formInitialValues = {
    ...initialValues,
    deviceParameterList: processInitialParameters(),
    deviceStatus: initialValues?.deviceStatus || '规划中',
    deviceDepreciation: initialValues?.deviceDepreciation || '年限平均法'
  };

  return (
    <DrawerForm<FormValues>
      title={isEdit ? '编辑设备档案' : '新建设备档案'}
      width={860}
      open={visible}
      onOpenChange={onVisibleChange}
      initialValues={formInitialValues}
      layout="vertical"
      drawerProps={{
        destroyOnClose: true, maskClosable: false,
        styles: { header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }, body: { background: '#fff', padding: '24px 32px' } }
      }}
      submitter={{ searchConfig: { submitText: '保存', resetText: '取消' }, submitButtonProps: { style: { borderRadius: 2 } }, resetButtonProps: { style: { borderRadius: 2 } } }}
      onFinish={async (values) => {
        const finalParams: Record<string, string> = {};
        values.deviceParameterList?.forEach((item) => {
          if (item.name && item.value) {
            finalParams[item.name] = item.unit ? `${item.value} ${item.unit}` : item.value;
          }
        });

        const submitData: Partial<FormValues> = {
          ...values,
          deviceParameter: JSON.stringify(finalParams)
        };

        delete submitData.deviceParameterList;
        delete submitData.labelIds;            
        // 🚀 删除了处理 sparePartIds 的逻辑，因为表单里已经没有这个字段了

        const success = await onSubmit({
            ...submitData,
            labelIds: values.labelIds, 
        } as Device);

        if (success) { message.success('操作成功'); return true; }
        return false;
      }}
    >
      {/* ================= 模块一：基础档案 ================= */}
      <Divider orientation="left" style={{ marginTop: 0, marginBottom: 16, borderColor: '#e8e8e8' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>基础档案</span>
      </Divider>
      <ProFormText name="deviceId" label="设备编码" colProps={{ span: 12 }} rules={[{ required: true }]} disabled={isEdit} />
      <ProFormText name="deviceName" label="设备名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormSelect name="deviceDepreciation" label="折旧方式" colProps={{ span: 12 }} rules={[{ required: true }]} options={[{ label: '年限平均法', value: '年限平均法' }, { label: '工作量法', value: '工作量法' }, { label: '双倍余额递减法', value: '双倍余额递减法' }, { label: '不计提折旧', value: '不计提折旧' }]} />
      <ProFormSelect name="deviceStatus" label="设备状态" colProps={{ span: 12 }} rules={[{ required: true }]} options={[{ label: '规划中', value: '规划中' }, { label: '安装调试', value: '安装调试' }, { label: '运行中', value: '运行中' }, { label: '闲置', value: '闲置' }]} />
      <ProFormText name="deviceManufacturer" label="生产厂家" colProps={{ span: 12 }} />
      <ProFormText name="deviceBrand" label="品牌" colProps={{ span: 12 }} />
      <ProFormText name="deviceSpecificationModel" label="规格型号" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormText name="deviceSupplier" label="供应商" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormText name="deviceLocation" label="设备位置" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormDatePicker name="deviceManufactureDate" label="生产日期" colProps={{ span: 12 }} width="100%" />
      <ProFormDigit name="deviceServiceLife" label="使用年限(年)" colProps={{ span: 12 }} min={0} fieldProps={{ precision: 2 }} />
      <ProFormTreeSelect
        name="labelIds"
        label="所属分类标签"
        colProps={{ span: 24 }}
        request={getDeviceLabels}
        fieldProps={{ treeCheckable: true, showCheckedStrategy: 'SHOW_ALL', placeholder: '请选择该设备所属的分类（可多选）', fieldNames: { label: 'labelName', value: 'labelId' } }}
        rules={[{ required: true, message: '必须为设备选择至少一个分类！' }]}
      />

      {/* ================= 模块二：扩展属性 ================= */}
      <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16, borderColor: '#e8e8e8' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>扩展属性</span>
      </Divider>
      <ProFormList 
        name="deviceParameterList" 
        colProps={{ span: 24 }}
        creatorButtonProps={{ position: 'bottom', type: 'dashed', icon: <PlusOutlined />, style: { borderRadius: 2 } }} 
        creatorRecord={{ name: '', value: '', unit: '' }} 
        copyIconProps={false} 
        itemRender={({ listDom, action }) => (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16, background: '#fafafa', padding: '16px', borderRadius: 4, border: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1, display: 'flex', gap: 16 }}>{listDom}</div>
            <div style={{ marginTop: 4 }}>{action}</div>
          </div>
        )}
      >
        <ProFormText name="name" placeholder="参数名 (如: 主轴转速)" formItemProps={{ style: { marginBottom: 0, flex: 2 } }} rules={[{ required: true }]} />
        <ProFormText name="value" placeholder="数值 (如: 10000)" formItemProps={{ style: { marginBottom: 0, flex: 2 } }} rules={[{ required: true }]} />
        <ProFormText name="unit" placeholder="单位 (如: rpm)" formItemProps={{ style: { marginBottom: 0, flex: 1 } }} />
      </ProFormList>
      
      {/* 🚀 彻底移除了这里的 sparePartIds 选择器 */}

      {/* ================= 模块三：其他信息 ================= */}
      <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16, borderColor: '#e8e8e8' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>其他信息</span>
      </Divider>
      <ProFormTextArea name="deviceDescription" label="设备描述 / 备注" colProps={{ span: 24 }} fieldProps={{ rows: 3 }} />
    </DrawerForm>
  );
};

export default DeviceDrawer;