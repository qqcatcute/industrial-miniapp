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
  const [treeData, setTreeData] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchTree = async () => {
      const data = await getMaterialLabels();
      const formatTree = (nodes: MaterialLabel[]): any[] => {
        return nodes.map(node => ({
          label: node.labelName, value: node.labelId,
          children: node.children?.length ? formatTree(node.children) : undefined,
        }));
      };
      setTreeData(formatTree(data));
    };
    fetchTree();
  }, []);

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
          const newId = await reviseAndUpdateMaterial({ ...submitData, masterId: record?.masterId }); 
          if (newId) { currentMaterialId = newId; success = true; }
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
      <ProFormTreeSelect name="materialLabel" label="所属分类" colProps={{ span: 12 }} request={async () => treeData} placeholder="如果不选，物料将在'全部物料'中展示" />
      <ProFormText name="materialSpecificationModel" label="规格型号" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormText name="materialSupplier" label="供应商" colProps={{ span: 12 }} rules={[{ required: true }]} />
      <ProFormDigit name="materialQuantity" label="库存数量" colProps={{ span: 12 }} min={0} fieldProps={{ precision: 4 }} rules={[{ required: true }]} />
      <ProFormSelect
        name="materialUnit" label="库存单位" colProps={{ span: 12 }}
        options={[{ label: '件', value: '件' }, { label: '台', value: '台' }, { label: '个', value: '个' }, { label: '吨', value: '吨' }]}
        rules={[{ required: true }]}
      />
      <ProFormTextArea name="materialDescription" label="物料描述" colProps={{ span: 24 }} fieldProps={{ rows: 3 }} />
    </DrawerForm>
  );
};
export default MaterialFormDrawer;