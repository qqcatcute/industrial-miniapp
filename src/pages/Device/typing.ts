import type { UploadFile } from 'antd';

export interface SparePart {
  id: string; // 纯前端Mock，保持原样
  sparePartName: string;
  sparePartBrand?: string;
  sparePartSpecificationModel?: string;
  sparePartQuantity: number;
  sparePartUnit: string;
  // 🚀 新增：丰富备件信息，对齐后端文档的潜在字段
  sparePartPrice?: number;
  sparePartLocation?: string;
  sparePartSupplier?: string;
}

export interface Device {
  deviceId: string; // 🚀 对齐后端主键
  deviceName: string;
  deviceManufacturer?: string;
  deviceBrand?: string;
  deviceSpecificationModel?: string;
  deviceSupplier?: string;
  deviceManufactureDate?: string;
  deviceLifespan?: number; // 🚀 对齐后端使用年限
  deviceDepreciation?: string;
  deviceLocation?: string;
  deviceDescription?: string;
  deviceStatus: string; 
  
  // 🚀 后端要求：无嵌套键值对 JSON 字符串
  deviceParameter?: string; 
  
  // -- 以下为前端 Mock 补充或 UI 专属状态 --
  spareParts?: SparePart[];
  sparePartIds?: string[];
  labels?: { labelId: string; labelName: string }[]; 
  labelIds?: string[]; 
  deviceManualUrl?: string; 
  deviceManual?: UploadFile[]; 
}

export interface DeviceLabel {
  labelId: string; // 🚀 对齐后端标签主键
  labelName: string; // 🚀 对齐后端标签名称
  labelParentId: string | 'root';
  deviceLabelHierarchical: number;
  children?: DeviceLabel[];
}