// src/pages/Device/typing.ts
import type { UploadFile } from 'antd'; // 引入 Antd 的标准文件类型

export interface SparePart {
  id: string;
  sparePartName: string;
  sparePartBrand?: string;
  sparePartSpecificationModel?: string;
  sparePartQuantity: number;
  sparePartUnit: string;
}

export interface Device {
  id: string;
  deviceName: string;
  deviceManufacturer: string;
  deviceBrand: string;
  deviceSpecificationModel: string;
  deviceSupplier: string;
  deviceManufactureDate: string;
  deviceServiceLife: number;
  deviceDepreciation: string;
  deviceLocation: string;
  deviceDescription?: string;
  deviceStatus: string;
  // 🚀 后端要求的简单键值对 JSON 对象
  deviceParameter?: Record<string, string>;
  
  spareParts?: SparePart[];
  sparePartIds?: string[];

  // 🚀 补齐与后端完全一致的“分类标签”关联字段
  labels?: { id: string; deviceLabelName: string }[]; 
  labelIds?: string[]; 

  // 🚀 补齐与后端完全一致的手册 URL 字段
  deviceManualUrl?: string; 
  // (前端 Antd Upload 组件专用的状态，不上报给后端)
  deviceManual?: UploadFile[]; 
}

export interface DeviceLabel {
  id: string;
  deviceLabelName: string;
  deviceLabelParent: string | 'NULL';
  deviceLabelHierarchical: number;
  children?: DeviceLabel[];
}