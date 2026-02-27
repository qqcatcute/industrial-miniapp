// src/pages/Material/typing.ts

export interface MaterialLabel {
  id: string;
  materialLabelName: string;
  materialLabelParent: string | 'NULL';
  materialLabelHierarchical: number;
  children?: MaterialLabel[];
}

export interface Material {
  id: string;
  materialName: string; 
  materialSpecificationModel?: string; 
  materialSupplier?: string; 
  materialQuantity: number; 
  materialUnit: string; 
  materialLocation?: string; 
  materialDescription?: string; 
  version: string; 
  children?: BOMNode[]; // 仅当有 BOM 时才存在
}

export interface BOMNode extends Material {
  usageQuantity: number; 
  lossRate: number; 
}