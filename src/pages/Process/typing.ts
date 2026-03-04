// src/pages/Process/typing.ts

export interface Process {
  processId: string;   
  processName: string; 
  labelIds?: string[]; // 🚀 核心纠正：将分类标签数组挂载到工序大类上
  
  templates?: ProcessTemplate[]; 
}

export interface ProcessTemplate {
  templateId: string;
  processId: string;
  templateName: string; 
  templateDescription?: string; 
  startTime?: string;
  endTime?: string;
  
  // --- 🚀 偷渡字段（通过 inputJson 存储与解析） ---
  productionSteps?: string; 
  equipments?: string;      
  operator?: string;        
  // ⛔️ labelIds 已从此处移除，不再让模板层级关心分类
}

export interface ProcessLabel {
  id: string; 
  processLabelName: string; 
  processLabelParent: string | 'NULL'; 
  processLabelHierarchical: number; 
}