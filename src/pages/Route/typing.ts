// src/pages/Route/typing.ts

export interface Route {
  id: string; // 编号
  routeName: string; // 工艺路线名称
  routeDescription?: string; // 工艺描述
  materialId?: string; // 所属产品ID (BOM 顶层物料)
  version: string; // 赛题要求的版本号
  updatedAt?: string;
}

// 工艺步骤 (连接工序、设备、物料的桥梁)
export interface RouteStep {
  id: string;
  routeId: string; // 属于哪条路线
  number: number; // 序号
  processId: string; // 绑定的基础工序 ID
  processName: string; // 冗余字段：工序名称
  detailDescription?: string; // 细节描述
  workTime: number; // 工时
  workTimeUnit: '时' | '分' | '秒'; // 工时单位
  
  // 扩展关系 (用于画布右侧属性面板配置)
  inputMaterialIds?: string[]; 
  outputMaterialIds?: string[];
  requiredDeviceIds?: string[];
  
  // 画布坐标 (前端专用，用于 React Flow 渲染)
  positionX?: number;
  positionY?: number;
}