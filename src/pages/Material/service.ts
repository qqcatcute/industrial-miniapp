// src/pages/Material/service.ts
import { Material, MaterialLabel } from './typing';

const mockMaterialLabels: MaterialLabel[] = [
  {
    id: 'L_001',
    materialLabelName: '精密行星减速器总成',
    materialLabelParent: 'NULL',
    materialLabelHierarchical: 0,
    children: [
      { id: 'L_001_1', materialLabelName: '减速器成品', materialLabelParent: 'L_001', materialLabelHierarchical: 1 },
    ]
  }
];

// 💡 注意这里：只有第一个物料包含了 children
const mockMaterials: Material[] = [
  {
    id: 'PRD-PLR-1000',
    materialName: '精密行星减速器',
    materialSpecificationModel: 'PLR-120-L1',
    materialSupplier: '自制',
    materialQuantity: 150.0000,
    materialUnit: '台',
    version: 'V1.0', 
    materialLocation: '成品仓A区',
    children: [
      {
        id: 'PART-SUN-001',
        materialName: '太阳轮',
        materialSpecificationModel: 'SUN-20T',
        materialSupplier: '内部机加工',
        materialQuantity: 500.0000,
        materialUnit: '件',
        version: 'V1.0',
        usageQuantity: 1, 
        lossRate: 0.02,   
      }
    ]
  },
  {
    id: 'PART-SUN-001-B',
    materialName: '太阳轮毛坯',
    materialSpecificationModel: 'SUN-20T-BLANK',
    materialSupplier: '大连铸造厂',
    materialQuantity: 500.0000,
    materialUnit: '件',
    version: 'V1.0',
    // 无 children
  },
  {
    id: 'RAW-STL-42CR',
    materialName: '42CrMo 合金钢圆钢',
    materialSpecificationModel: 'Φ60x6000',
    materialSupplier: '宝钢股份',
    materialQuantity: 50.0000,
    materialUnit: '吨',
    version: 'V1.0',
    // 无 children
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getMaterialLabels = async (): Promise<MaterialLabel[]> => {
  await delay(200);
  return mockMaterialLabels;
};

export const getMaterials = async (params?: { keyword?: string; labelId?: string; }): Promise<Material[]> => {
  await delay(300);
  let result = [...mockMaterials];

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    result = result.filter(item => 
      item.id.toLowerCase().includes(kw) || 
      (item.materialSupplier && item.materialSupplier.toLowerCase().includes(kw))
    );
  }
  return result; // 💡 原封不动返回，保证 Drawer 能拿到 children
};

export const deleteMaterials = async (ids: string[]): Promise<boolean> => {
  await delay(300);
  console.log('被删除的物料IDs:', ids);
  return true;
};

// 2. 找到 addMaterial 接口，修改为如下：
export const addMaterial = async (data: Record<string, any>): Promise<boolean> => {
  await delay(600); 
  console.log('提交的新建物料数据:', data);
  // 💡 核心修复：把新提交的数据插入到 mock 数组的最前面！
  mockMaterials.unshift(data as Material);
  return true;
};

// --- 以下为补齐的 Mock 接口 ---

// 💡 模拟：新建物料分类
export const addMaterialLabel = async (data: Record<string, any>): Promise<boolean> => {
  await delay(400);
  console.log('API调用 -> [POST] /api/v1/material-label', data); // 使用 data
  return true;
};

// 💡 模拟：删除物料分类
export const deleteMaterialLabel = async (id: string): Promise<boolean> => {
  await delay(300);
  console.log(`API调用 -> [POST] /api/v1/material-label/delete (ID: ${id})`);
  return true;
};

// 💡 模拟：绑定 BOM 父子关系（核心难点接口）
export const bindBOMRelation = async (data: { parentId: string; bomNodes: { childId: string; usageQuantity: number; lossRate: number }[] }): Promise<boolean> => {
  await delay(500);
  console.log('API调用 -> [POST] /api/v1/material/bom/bind', data);
  return true;
};

// 💡 模拟：物料版本升级 (升版)
export const upgradeMaterialVersion = async (id: string): Promise<boolean> => {
  await delay(600);
  console.log(`API调用 -> [POST] /api/v1/material/upgrade (ID: ${id})`);
  return true;
};

// 💡 模拟：修改物料信息
export const updateMaterial = async (data: any): Promise<boolean> => {
  await delay(600);
  console.log('API调用 -> [POST] /api/v1/material/update', data);
  // 实际对接时，这里将替换为 axios.post('/api/v1/material/update', data)
  return true;
};