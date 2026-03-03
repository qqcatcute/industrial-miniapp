// src/pages/Process/typing.ts

export interface Process {
  processId: string;   // 对应后端 processId
  processName: string; // 工序名称
  
  // 🚀 前端特有扩展：在列表查询时聚合进来的模板列表
  templates?: ProcessTemplate[]; 
}

export interface ProcessTemplate {
  templateId: string;
  processId: string;
  templateName: string; // 模板名称
  templateDescription?: string; // 模板描述
  startTime?: string;
  endTime?: string;
  
  // --- 🚀 偷渡字段（通过 inputJson 存储与解析） ---
  productionSteps?: string; // 生产步骤
  equipments?: string;      // 生产和检测设备
  operator?: string;        // 操作人员 (岗位要求)
  labelIds?: string[];      // 关联的工序类型标签 ID 数组
}

export interface ProcessLabel {
  id: string; 
  processLabelName: string; 
  processLabelParent: string | 'NULL'; 
  processLabelHierarchical: number; 
}