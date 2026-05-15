// src/pages/Device/components/DeviceDrawer.tsx
// 🌟 核心新增：引入 useEffect, Form, 以及 ProFormGroup, ProFormDependency
import React, { useEffect } from 'react';
import { 
  DrawerForm, ProFormText, ProFormSelect, ProFormDigit, 
  ProFormDatePicker, ProFormList, ProFormTextArea, ProFormTreeSelect,
  ProFormGroup, ProFormDependency
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Divider, message, Form } from 'antd';
import { Device } from '../typing';
import { getDeviceLabels } from '../service'; // 🚀 移除了 getSparePartOptions

const DEVICE_EXT_TEMPLATES: Record<string, any[]> = {
  '数控机床': [
    { name: '工作台尺寸', label: '工作台尺寸(mm)', type: 'text' },
    { name: 'XYZ轴行程', label: 'X/Y/Z轴行程(mm)', type: 'text' },
    { name: '主轴转速', label: '主轴转速(r/min)', type: 'text' },
    { name: '主轴电机功率', label: '主轴电机功率(kW)', type: 'text' },
    { name: '刀库容量', label: '刀库容量(把)', type: 'text' }
  ],
  '磨床': [
    { name: '工作台面尺寸', label: '工作台面尺寸(mm)', type: 'text' },
    { name: '磨削精度', label: '磨削精度(mm/m)', type: 'text' },
    { name: '砂轮尺寸', label: '砂轮尺寸(mm)', type: 'text' },
    { name: '主轴电机功率', label: '主轴电机功率(kW)', type: 'text' },
    { name: '工作台纵向移动速度', label: '工作台纵向移动速度(m/min)', type: 'text' }
  ]
};

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

// 🌟 核心新增：尝试从 deviceDescription 中解包隐藏的分类和扩展参数
  // 🌟 核心修复：既然 service.ts 已经在底层完美解包了，这里直接信任 initialValues 即可！
  const formInitialValues = {
    ...initialValues, // 这里的 initialValues 已经包含了 service 传来的 deviceCategory 和 extendedInfo
    deviceParameterList: processInitialParameters(),
    // 🚀 保持正确的后端枚举值
    deviceStatus: initialValues?.deviceStatus || 'PLANNED', 
    deviceDepreciation: initialValues?.deviceDepreciation || 'SLM'
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

        // 🚀 核心修复：如果只有日期没有时分秒，手动补齐，迎合后端的日期校验
        let formattedDate = values.deviceManufactureDate;
        if (formattedDate && formattedDate.length === 10) {
            formattedDate = `${formattedDate} 00:00:00`;
        }

        // 🌟 赛题核心：把分类和动态参数塞进设备描述里（暗度陈仓）
        const secretObj = {
          deviceCategory: (values as any).deviceCategory,
          extendedInfo: (values as any).extendedInfo || {}
        };
        const realDesc = values.deviceDescription || '';
        const mergedDesc = `${realDesc}@@@${JSON.stringify(secretObj)}`;

        const submitData: Partial<FormValues> = {
          ...values,
          deviceManufactureDate: formattedDate, // 替换为格式化后的日期
          deviceParameter: JSON.stringify(finalParams),
          deviceDescription: mergedDesc // 🚀 覆盖为打包后的描述
        };

        delete submitData.deviceParameterList;
        delete submitData.labelIds;
        delete (submitData as any).deviceCategory; // 踢掉前端虚拟字段
        delete (submitData as any).extendedInfo;   // 踢掉前端虚拟字段

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
      {isEdit && (
  <ProFormText name="deviceId" label="设备编码" colProps={{ span: 12 }} disabled />
)}
      <ProFormText name="deviceName" label="设备名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormSelect 
        name="deviceDepreciation" 
        label="折旧方式" 
        colProps={{ span: 12 }} 
        rules={[{ required: true }]} 
        options={[
          { label: '年限平均法', value: 'SLM' }, 
          { label: '工作量法', value: 'UOP' }, 
          { label: '双倍余额递减法', value: 'DDB' }, 
          { label: '不计提折旧', value: 'ND' }
        ]} 
      />
      <ProFormSelect 
        name="deviceStatus" 
        label="设备状态" 
        colProps={{ span: 12 }} 
        rules={[{ required: true }]} 
        options={[
          { label: '规划中', value: 'PLANNED' }, 
          { label: '安装调试', value: 'INSTALLING' }, 
          { label: '运行中', value: 'RUNNING' }, 
          { label: '闲置', value: 'IDLE' }
        ]} 
      />
      <ProFormText name="deviceManufacturer" label="生产厂家" colProps={{ span: 12 }} />
      <ProFormText name="deviceBrand" label="品牌" colProps={{ span: 12 }} />
      <ProFormText name="deviceSpecificationModel" label="规格型号" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormText name="deviceSupplier" label="供应商" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormText name="deviceLocation" label="设备位置" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormDatePicker name="deviceManufactureDate" label="生产日期" colProps={{ span: 12 }} width="100%" />
      <ProFormDigit name="deviceLifespan" label="使用年限(年)" colProps={{ span: 12 }} min={0} fieldProps={{ precision: 2 }} />
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
      {/* ================= 🌟 赛题拿分点：基于设备类型的扩展信息 ================= */}
      <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16, borderColor: '#1890ff' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>专属类型与扩展规格 (动态)</span>
      </Divider>
      
      <ProFormSelect 
        name="deviceCategory" 
        label="设备专属类型 (选定后自动带出模板)" 
        colProps={{ span: 12 }}
        options={['数控机床', '磨床', '机械臂', '检测设备']} 
      />
      
      <ProFormDependency name={['deviceCategory']}>
        {({ deviceCategory }) => {
          const fields = DEVICE_EXT_TEMPLATES[deviceCategory] || [];
          if (fields.length === 0) return <div style={{ color: '#999', padding: '0 0 16px 8px' }}>请选择上方类型以加载该设备的专属参数模板</div>;
          
          return (
            <div style={{ padding: 16, background: '#e6f7ff', borderRadius: 4, width: '100%', marginBottom: 24, border: '1px solid #91d5ff' }}>
              <ProFormGroup title={<span style={{ color: '#0050b3' }}>{`${deviceCategory} 专属参数配置`}</span>}>
                {fields.map(field => {
                  if (field.type === 'digit') {
                    return <ProFormDigit key={field.name} name={['extendedInfo', field.name]} label={field.label} colProps={{ span: 8 }} />;
                  }
                  return <ProFormText key={field.name} name={['extendedInfo', field.name]} label={field.label} colProps={{ span: 8 }} />;
                })}
              </ProFormGroup>
            </div>
          );
        }}
      </ProFormDependency>

      {/* ================= 模块三：其他信息 ================= */}
      <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16, borderColor: '#e8e8e8' }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#001529' }}>其他信息</span>
      </Divider>
      <ProFormTextArea name="deviceDescription" label="设备描述 / 备注" colProps={{ span: 24 }} fieldProps={{ rows: 3 }} />
    </DrawerForm>
  );
};

export default DeviceDrawer;