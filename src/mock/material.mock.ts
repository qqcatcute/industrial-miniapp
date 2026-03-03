// src/mock/material.mock.ts
import { Material, MaterialLabel } from '@/pages/Material/typing';

export const mockMaterialLabels: MaterialLabel[] = [
  {
    labelId: 'L_001',
    labelName: '精密行星减速器总成',
    labelParentId: 'root',
    materialLabelHierarchical: 0,
    children: [
      { labelId: 'L_001_1', labelName: '减速器成品', labelParentId: 'L_001', materialLabelHierarchical: 1 },
    ]
  }
];

export const mockMaterials: Material[] = [
  // --- 以下三个是同宗同源的物料 (masterId 相同) ---
  {
    materialId: 'VER-C-003',
    masterId: 'MASTER-PLR-120',
    materialName: '精密行星减速器 (终极版)',
    materialSpecificationModel: 'PLR-120-L3',
    materialSupplier: '自制',
    materialQuantity: 200.0000,
    materialUnit: '台',
    materialVersion: 'C',
    materialDescription: '更换了新型润滑脂，延长寿命'
  },
  {
    materialId: 'VER-B-002',
    masterId: 'MASTER-PLR-120',
    materialName: '精密行星减速器 (改进版)',
    materialSpecificationModel: 'PLR-120-L2',
    materialSupplier: '自制',
    materialQuantity: 50.0000,
    materialUnit: '台',
    materialVersion: 'B',
  },
  {
    materialId: 'VER-A-001',
    masterId: 'MASTER-PLR-120',
    materialName: '精密行星减速器',
    materialSpecificationModel: 'PLR-120-L1',
    materialSupplier: '自制',
    materialQuantity: 0.0000,
    materialUnit: '台',
    materialVersion: 'A',
  },
  // --- 另一个独立的物料 ---
  {
    materialId: 'PART-SUN-001',
    masterId: 'PART-SUN-001',
    materialName: '太阳轮',
    materialSpecificationModel: 'SUN-20T',
    materialSupplier: '内部机加工',
    materialQuantity: 500.0000,
    materialUnit: '件',
    materialVersion: 'A',
  }
];