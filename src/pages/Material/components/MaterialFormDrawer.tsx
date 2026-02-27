// src/pages/Material/components/MaterialFormDrawer.tsx
import React, { useEffect, useState } from 'react';
import { 
  DrawerForm, 
  ProFormText, 
  ProFormDigit, 
  ProFormSelect, 
  ProFormTextArea,
  ProFormTreeSelect
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
// 💡 修复1：补充了 updateMaterial 的引入
import { getMaterialLabels, addMaterial, updateMaterial } from '../service';
// 💡 修复2：补充了 Material 的引入
import { MaterialLabel, Material } from '../typing';

interface MaterialFormDrawerProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void; 
  defaultLabelId?: string; 
  mode: 'create' | 'edit' | 'upgrade'; 
  record?: Material | null;            
}

const titleMap = {
  create: '新建物料档案',
  edit: '编辑物料档案',
  upgrade: '物料升版 (生成新版本)'
};

const MaterialFormDrawer: React.FC<MaterialFormDrawerProps> = ({ 
  visible, onVisibleChange, onSuccess, defaultLabelId, mode, record
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [treeData, setTreeData] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 💡 修复3：恢复之前不小心删掉的下拉树数据拉取逻辑
  useEffect(() => {
    const fetchTree = async () => {
      const data = await getMaterialLabels();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatTree = (nodes: MaterialLabel[]): any[] => {
        return nodes.map(node => ({
          label: node.materialLabelName,
          value: node.id,
          children: node.children ? formatTree(node.children) : undefined,
        }));
      };
      setTreeData(formatTree(data));
    };
    fetchTree();
  }, []);

useEffect(() => {
    if (visible) {
      if (mode === 'edit' && record) {
        form.setFieldsValue(record);
      } else if (mode === 'upgrade' && record) {
        // 💡 升版模式：完全继承老数据，不再清空 ID，仅把版本号加 1
        form.setFieldsValue({
          ...record,
          version: 'V2.0', // 自动预填新版本
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          version: 'V1.0', 
          materialLabel: defaultLabelId !== 'NULL' ? defaultLabelId : undefined
        });
      }
    }
}, [visible, mode, record, defaultLabelId, form]);
  
  return (
    <DrawerForm
      title={titleMap[mode]}
      form={form}
      open={visible}
      onOpenChange={onVisibleChange}
      drawerProps={{ destroyOnClose: true, maskClosable: false }}
      layout="vertical"
      grid={true} 
      rowProps={{ gutter: [16, 0] }}
      onFinish={async (values) => {
        let success = false;
        if (mode === 'edit') {
          success = await updateMaterial({ ...values, id: record?.id });
        } else if (mode === 'upgrade') {
          success = await addMaterial(values); 
        } else {
          success = await addMaterial(values);
        }

        if (success) {
          message.success(`${titleMap[mode]} 成功！`);
          onSuccess(); 
          return true; 
        }
        return false;
      }}
    >
<ProFormText
        name="id"
        label="物料编码"
        colProps={{ span: 12 }}
        placeholder="请输入唯一编码 (如 PRD-PLR-1000)"
        disabled={mode === 'edit' || mode === 'upgrade'} 
        rules={[
          { required: true, message: '物料编码是必填项！' },
          // 💡 加上这行正则校验：只允许大写字母、数字和中划线！
          { pattern: /^[A-Z0-9-]+$/, message: '编码只能包含大写字母、数字和中划线！' }
        ]}
      />
      <ProFormText
        name="materialName"
        label="物料名称"
        colProps={{ span: 12 }}
        placeholder="例如：精密行星减速器"
        rules={[{ required: true, message: '物料名称是必填项！' }]}
      />
      <ProFormTreeSelect
        name="materialLabel"
        label="所属分类"
        colProps={{ span: 12 }}
        placeholder="请选择物料分类"
        request={async () => treeData}
        rules={[{ required: true, message: '请选择所属分类！' }]}
      />
      <ProFormText
        name="version"
        label="版本号"
        colProps={{ span: 12 }}
        rules={[{ required: true }]}
      />
      <ProFormText
        name="materialSpecificationModel"
        label="规格型号"
        colProps={{ span: 12 }}
        placeholder="例如：PLR-120-L1"
        rules={[{ required: true, message: '赛题要求规格型号必填！' }]}
      />
      <ProFormText
        name="materialSupplier"
        label="供应商"
        colProps={{ span: 12 }}
        placeholder="例如：宝钢股份 / 自制"
        rules={[{ required: true, message: '赛题要求供应商必填！' }]}
      />
      <ProFormDigit
        name="materialQuantity"
        label="初始库存数量"
        colProps={{ span: 12 }}
        min={0}
        fieldProps={{ precision: 4 }} 
        rules={[{ required: true, message: '赛题要求库存数量必填！' }]}
      />
      <ProFormSelect
        name="materialUnit"
        label="库存单位"
        colProps={{ span: 12 }}
        options={[
          { label: '件', value: '件' },
          { label: '台', value: '台' },
          { label: '个', value: '个' },
          { label: '吨', value: '吨' },
          { label: '米', value: '米' },
        ]}
        rules={[{ required: true }]}
      />
      <ProFormText name="materialLocation" label="存放位置" colProps={{ span: 24 }} placeholder="例如：成品仓A区" />
      <ProFormTextArea name="materialDescription" label="物料描述" colProps={{ span: 24 }} placeholder="请输入该物料的技术参数、用途或其他备注信息..." />
    </DrawerForm>
  );
};
export default MaterialFormDrawer;