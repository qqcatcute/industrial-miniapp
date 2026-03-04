// src/pages/Material/components/MaterialFormDrawer.tsx
import React, { useEffect, useState } from 'react';
import { DrawerForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea, ProFormTreeSelect } from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { getMaterialLabels, addMaterial, updateMaterial, reviseAndUpdateMaterial, bindMaterialLabel, unbindMaterialLabel } from '../service';
import { MaterialLabel, Material } from '../typing';

interface MaterialFormDrawerProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void; 
  defaultLabelId?: string; 
  mode: 'create' | 'edit' | 'upgrade'; 
  record?: Material | null;            
}

const titleMap = { create: '新建物料', edit: '编辑物料', upgrade: '物料升版修订' };

const MaterialFormDrawer: React.FC<MaterialFormDrawerProps> = ({ visible, onVisibleChange, onSuccess, defaultLabelId, mode, record }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if ((mode === 'edit' || mode === 'upgrade') && record) {
        // 💡 ⚠️ 核心防呆：详情接口并未返回物料属于哪个分类，
        // 这里为了体验，我们假定当前左侧树选中的节点就是它的老分类，进行预填。
        form.setFieldsValue({
            ...record,
            materialLabel: defaultLabelId !== 'NULL' ? defaultLabelId : undefined
        });
      } else {
        form.resetFields();
        if (defaultLabelId && defaultLabelId !== 'NULL') {
            form.setFieldsValue({ materialLabel: defaultLabelId });
        }
      }
    }
  }, [visible, mode, record, defaultLabelId, form]);
  
  return (
    <DrawerForm
      title={titleMap[mode]} form={form} open={visible} onOpenChange={onVisibleChange}
      drawerProps={{ destroyOnClose: true, maskClosable: false }}
      layout="vertical" grid={true} rowProps={{ gutter: [16, 0] }}
      onFinish={async (values) => {
        let success = false;
        let currentMaterialId = record?.materialId;
        
        // 1. 分离业务字段与分类标签字段
        const submitData = { ...values };
        const selectedLabel = submitData.materialLabel;
        delete submitData.materialLabel; // 不要把这个传给纯粹的物料实体接口

        // 2. 提交主干数据
        if (mode === 'edit' && currentMaterialId) {
          success = await updateMaterial(currentMaterialId, submitData);
        } else if (mode === 'upgrade') {
          // 🚀 核心修复：直接把 await 的结果（true/false）赋给 success，不再判断 newId
          success = await reviseAndUpdateMaterial({ 
            ...submitData, 
            masterId: record?.masterId,
            materialId: currentMaterialId 
          }); 
        } else {
          const newId = await addMaterial(submitData);
          if (newId) { currentMaterialId = newId; success = true; }
        }

        // 3. 💡 智能编排：处理标签的解绑与绑定
        if (success && currentMaterialId) {
           const oldLabel = defaultLabelId; // 这是它操作前所在的分类
           const newLabel = selectedLabel;  // 这是它在表单里新选的分类

           // 如果更换了分类，且它原本是有真实分类的（不是在'全部'根节点下盲建的）
           if (newLabel && oldLabel && oldLabel !== newLabel && oldLabel !== 'NULL') {
               await unbindMaterialLabel(currentMaterialId, oldLabel);
           }
           // 如果有新标签，且与老的不同，执行绑定（即使原本是'全部'，新建时也需要绑定）
           if (newLabel && newLabel !== oldLabel) {
               await bindMaterialLabel(currentMaterialId, newLabel);
           }
        }

        if (success) { 
            message.success(`${titleMap[mode]} 成功！`); 
            onSuccess(); 
            return true; 
        }
        return false;
      }}
    >
      <ProFormText name="materialName" label="物料名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormTreeSelect 
        name="materialLabel" 
        label="所属分类" 
        colProps={{ span: 12 }} 
        // ✅ 核心修复：直接让 request 掌管数据获取，自动处理 loading 和匹配时序
        request={async () => {
          const data = await getMaterialLabels();
          const formatTree = (nodes: MaterialLabel[]): any[] => {
            return nodes.map(node => ({
              title: node.labelName, // 💡 重点：TreeSelect 默认识别 title 而不是 label
              value: node.labelId,
              children: node.children?.length ? formatTree(node.children) : undefined,
            }));
          };
          return formatTree(data);
        }}
        placeholder="如果不选，物料将在'全部物料'中展示" 
      />
      {/* 🚀 核心修复：把丢失的规格型号加回来！ */}
      <ProFormText 
        name="materialSpecificationModel" 
        label="规格型号" 
        colProps={{ span: 12 }} 
        rules={[{ required: true, message: '请输入规格型号' }]} 
      />
      <ProFormText name="materialSupplier" label="供应商" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormDigit name="materialQuantity" label="库存数量" colProps={{ span: 12 }} min={0} fieldProps={{ precision: 4 }} rules={[{ required: true }]} />
      <ProFormSelect
  name="materialUnit" 
  label="库存单位" 
  colProps={{ span: 12 }}
  showSearch // 建议开启搜索，选项多了方便用户快速查找
  options={[
    // --- 数量/机械类 ---
    { label: '件', value: '件' },
    { label: '个', value: '个' },
    { label: '台', value: '台' },
    { label: '套', value: '套' },
    { label: '根', value: '根' },
    { label: '支', value: '支' },
    { label: '把', value: '把' },
    { label: '片', value: '片' },
    { label: '块', value: '块' },
    { label: '只', value: '只' },
    { label: '双', value: '双' },

    // --- 重量类 ---
    { label: '千克 (kg)', value: '千克' },
    { label: '克 (g)', value: '克' },
    { label: '吨 (t)', value: '吨' },
    
    // --- 长度/面积类 ---
    { label: '米 (m)', value: '米' },
    { label: '厘米 (cm)', value: '厘米' },
    { label: '毫米 (mm)', value: '毫米' },
    { label: '平方米 (㎡)', value: '平方米' },

    // --- 体积/容积/流体类 (常用于润滑油、切削液等) ---
    { label: '升 (L)', value: '升' },
    { label: '毫升 (mL)', value: '毫升' },
    { label: '立方米 (m³)', value: '立方米' },

    // --- 包装形态类 ---
    { label: '箱', value: '箱' },
    { label: '包', value: '包' },
    { label: '卷', value: '卷' },
    { label: '桶', value: '桶' },
    { label: '批', value: '批' },
  ]}
  rules={[{ required: true, message: '请选择库存单位' }]}
/>
      <ProFormTextArea name="materialDescription" label="物料描述" colProps={{ span: 24 }} fieldProps={{ rows: 3 }} />
    </DrawerForm>
  );
};
export default MaterialFormDrawer;