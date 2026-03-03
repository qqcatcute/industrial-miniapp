// src/pages/Material/typing.ts

export interface MaterialLabel {
  labelId: string;
  labelName: string;
  labelParentId: string | 'root' | 'NULL';
  materialLabelHierarchical: number;
  children?: MaterialLabel[];
}

export interface Material {
  materialId: string; // 特定版本流水号
  masterId: string;   // 物料族/主对象ID
  materialName: string; 
  materialSpecificationModel?: string; 
  materialSupplier?: string; 
  materialQuantity: number; 
  materialUnit: string; 
  materialDescription?: string; 
  materialVersion: string; // 版本号，如 A, B, C
  
  // 💡 前端专属扩展属性：用于承载被折叠的历史版本
  historyVersions?: Material[]; 
  
  children?: BOMNode[]; // 仅当有 BOM 时才存在
}

export interface BOMNode extends Material {
  usageQuantity: number; 
  lossRate: number; 
}