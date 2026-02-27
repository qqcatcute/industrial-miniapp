// src/pages/Process/typing.ts

export interface Process {
  id: string; // 编号（ID）：唯一值，必填
  processName: string; // 名称（ProcessName）：最大长度100字，唯一值，必填
  
  // --- 新增：为满足赛题 xDM-F 建模硬性要求而补齐的字段 ---
  productionSteps?: string; // 生产步骤
  equipments?: string;      // 生产和检测设备
  operator?: string;        // 操作人员 (岗位要求)
  startTime?: string;       // 开始时间 (标准排程参考)
  endTime?: string;         // 结束时间 (标准排程参考)
  // --------------------------------------------------------

  labelIds?: string[]; // 关联的工序类型标签 ID 数组
  description?: string; // 工序描述
  updatedAt?: string;
}

export interface ProcessLabel {
  id: string; 
  processLabelName: string; 
  processLabelParent: string | 'NULL'; 
  processLabelHierarchical: number; 
}