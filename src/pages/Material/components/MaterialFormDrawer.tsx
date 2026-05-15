// src/pages/Material/components/MaterialFormDrawer.tsx
import React, { useEffect, useState } from 'react';
import { DrawerForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea, ProFormTreeSelect, ProFormList, ProFormGroup, ProFormDependency, ProFormRadio } from '@ant-design/pro-components';
import { Form, message, Divider } from 'antd';
import { getMaterialLabels, addMaterial, updateMaterial, reviseAndUpdateMaterial, bindMaterialLabel, unbindMaterialLabel, unpackMaterialData } from '../service';
import { MaterialLabel, Material } from '../typing';

// 🌟 新增：赛题要求的硬编码字典
const PART_EXT_TEMPLATES: Record<string, any[]> = {
  '伺服电机': [
    { name: '额定功率', label: '额定功率(kW)', type: 'digit' },
    { name: '防护等级', label: '防护等级(IP)', type: 'text' },
    { name: '额定转速', label: '额定转速(rpm)', type: 'digit' },
    { name: '编码器类型', label: '编码器类型', type: 'select', options: ['增量式', '绝对值'] }
  ],
  '齿轮': [
    { name: '模数', label: '模数', type: 'digit' },
    { name: '齿数', label: '齿数', type: 'digit' },
    { name: '材质', label: '材质', type: 'text' },
    { name: '热处理工艺', label: '热处理工艺', type: 'text' }
  ],
  '轴承': [
    { name: '内径', label: '内径(mm)', type: 'digit' },
    { name: '外径', label: '外径(mm)', type: 'digit' },
    { name: '保持架材质', label: '保持架材质', type: 'text' }
  ]
};
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
        let unpackedRecord = { ...record };
        
        // 🌟 终极安全解析方案：拿到带有 @@@ 的描述后，直接在组件内解析并填充表单！
        if (record.materialDescription && record.materialDescription.includes('@@@')) {
          try {
            const parts = record.materialDescription.split('@@@');
            const extData = JSON.parse(parts[1]);
            unpackedRecord = {
              ...record,
              materialDescription: parts[0], 
              partCategory: extData.partCategory, 
              extendedInfo: extData.extendedInfo || {}, 
              bomList: extData.bomList || [],           
              materialVersion: extData.realVersion || record.materialVersion 
            };
          } catch(e) {
            console.error("解包失败", e);
          }
        }

        form.setFieldsValue({
            ...unpackedRecord,
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
        // 🌟 1. 提取所有我们前端虚拟出的字段
        const { materialLabel, partCategory, extendedInfo, bomList, upgradeType, ...restValues } = values;
        const selectedLabel = materialLabel;

        // 🌟 2. 处理双轨版本号 (A.1, A.2, B.1)
        let nextVersion = record?.materialVersion || 'A.1';
        if (mode === 'upgrade') {
            const parts = nextVersion.split('.');
            const major = parts[0] || 'A';
            const minor = parseInt(parts[1] || '1');
            if (upgradeType === 'major') { // 修订：字母+1，数字归1
                nextVersion = `${String.fromCharCode(major.charCodeAt(0) + 1)}.1`;
            } else { // 迭代：字母不变，数字+1
                nextVersion = `${major}.${minor + 1}`;
            }
        }

       // 🌟 3. 暗度陈仓(主战场)：将动态表单塞进描述里
        const secretObj = {
            partCategory,
            extendedInfo: extendedInfo || {},
            bomList: bomList || []
        };
        const realDesc = restValues.materialDescription || '';
        const mergedDesc = `${realDesc}@@@${JSON.stringify(secretObj)}`;

        // 🌟 3.5 暗度陈仓(副战场)：将版本号藏进规格型号里！(保证列表接口能返回)
        const realSpec = restValues.materialSpecificationModel || '';
        const mergedSpec = `${realSpec}@@@${nextVersion}`;

        // 🌟 4. 最终要发给后端的干净数据
        const submitData = { 
            ...restValues, 
            materialDescription: mergedDesc,
            materialSpecificationModel: mergedSpec // 用伪装过的规格型号覆盖
        };

        // 2. 提交主干数据
        if (mode === 'edit' && currentMaterialId) {
          success = await updateMaterial(currentMaterialId, submitData);
        } else if (mode === 'upgrade') {
          // 🌟 核心修复：严谨区分 xDM-F 的大版本修订与小版本迭代！
          if (upgradeType === 'major') {
             // 1. 大版本修订换代 (A -> B)：必须调用 reviseAndUpdate 触发 xDM-F 引擎的修订检出机制
             success = await reviseAndUpdateMaterial({ 
               ...submitData, 
               masterId: record?.masterId,
               materialId: currentMaterialId 
             }); 
          } else {
             // 2. 小版本迭代 (A.1 -> A.2)：调用普通的 update 接口，xDM-F 引擎会自动处理小版本的迭代与履历保存
             success = await updateMaterial(currentMaterialId, submitData);
          }
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

      {/* 🌟 赛题重点 1：版本升降级控制 (仅在升版模式显示) */}
      {mode === 'upgrade' && (
        <ProFormRadio.Group
          name="upgradeType"
          label="版本升级类型"
          colProps={{ span: 24 }}
          initialValue="minor"
          options={[
            { label: `小版本迭代 (例如 ${record?.materialVersion || 'A.1'} -> ${record?.materialVersion?.split('.')[0] || 'A'}.${parseInt(record?.materialVersion?.split('.')[1] || '1') + 1})`, value: 'minor' },
            { label: `大版本修订换代 (例如 ${record?.materialVersion || 'A.1'} -> ${String.fromCharCode((record?.materialVersion?.split('.')[0] || 'A').charCodeAt(0) + 1)}.1)`, value: 'major' },
          ]}
          rules={[{ required: true }]}
        />
      )}

      {/* 🌟 赛题重点 2：基于分类的扩展属性动态表单 */}
      <Divider orientation="left" style={{ margin: '12px 0' }}>扩展属性 (动态)</Divider>
      <ProFormSelect 
        name="partCategory" 
        label="选择具体零部件分类 (自动带出模板)" 
        colProps={{ span: 12 }}
        options={['伺服电机', '齿轮', '轴承']}
      />
      <ProFormDependency name={['partCategory']}>
        {({ partCategory }) => {
          const fields = PART_EXT_TEMPLATES[partCategory] || [];
          if (fields.length === 0) return <div style={{ color: '#999', padding: '0 0 16px 8px' }}>请选择分类以加载扩展属性</div>;
          
          return (
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 4, width: '100%', marginBottom: 24 }}>
              <ProFormGroup title={`${partCategory} 专属参数`}>
                {fields.map(field => {
                  if (field.type === 'digit') {
                    return <ProFormDigit key={field.name} name={['extendedInfo', field.name]} label={field.label} colProps={{ span: 8 }} />;
                  } else if (field.type === 'select') {
                    return <ProFormSelect key={field.name} name={['extendedInfo', field.name]} label={field.label} options={field.options} colProps={{ span: 8 }} />;
                  }
                  return <ProFormText key={field.name} name={['extendedInfo', field.name]} label={field.label} colProps={{ span: 8 }} />;
                })}
              </ProFormGroup>
            </div>
          );
        }}
      </ProFormDependency>

      {/* 🌟 赛题重点 3：显性维护 BOM 结构 */}
      {/* 🌟 赛题重点 3：显性维护 BOM 结构 */}
      <Divider orientation="left" style={{ margin: '12px 0' }}>BOM 物料清单组成</Divider>
      <ProFormList
        name="bomList"
        creatorButtonProps={{ position: 'bottom', creatorButtonText: '添加子项物料' }}
        copyIconProps={false}
        itemRender={({ listDom, action }) => (
          <div style={{ display: 'flex', gap: 16, background: '#fcfcfc', padding: 16, border: '1px dashed #e8e8e8', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>{listDom}</div>
            <div style={{ width: 32 }}>{action}</div>
          </div>
        )}
      >
        <ProFormGroup>
          {/* 🚀 新增了 materialName，并重新分配了 span 宽度 (5+5+3+3+4+4 = 24) */}
          <ProFormText name="materialId" label="子项编码" colProps={{ span: 5 }} rules={[{ required: true }]} placeholder="如: MTR-001" />
          <ProFormText name="materialName" label="子项名称" colProps={{ span: 5 }} rules={[{ required: true }]} placeholder="如: 交流伺服电机" />
          <ProFormDigit name="quantity" label="数量" colProps={{ span: 3 }} min={0} rules={[{ required: true }]} />
          <ProFormText name="unit" label="单位" colProps={{ span: 3 }} placeholder="如: 台" />
          <ProFormText name="tag" label="位号" colProps={{ span: 4 }} placeholder="如: M1" />
          <ProFormText name="remark" label="备注" colProps={{ span: 4 }} placeholder="如: 版本2.0" />
        </ProFormGroup>
      </ProFormList>

    </DrawerForm>
  );
};
export default MaterialFormDrawer;