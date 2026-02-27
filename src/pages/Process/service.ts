// src/pages/Process/service.ts
import { Process, ProcessLabel } from './typing';

// --- Mock 数据库 ---

// 1. 预置工序标签 (分类树)
const mockProcessLabels: ProcessLabel[] = [
  { id: 'LBL-0', processLabelName: '全部工序', processLabelParent: 'NULL', processLabelHierarchical: 0 },
  { id: 'LBL-1', processLabelName: '成型工艺', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-2', processLabelName: '机械加工', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-3', processLabelName: '质量控制', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-4', processLabelName: '仓储物流', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
];

// 2. 预置赛题要求的核心 5 道工序 (满分关键点)
let mockProcesses: Process[] = [
  { 
    id: 'PROC-001', processName: '毛坯制造', labelIds: ['LBL-1'], description: '行星减速器毛坯铸造与锻造',
    productionSteps: '1. 模具预热; 2. 熔炼浇注; 3. 冷却脱模; 4. 切除浇口',
    equipments: '中频感应熔炼炉、锻压机',
    operator: '特种铸造工',
    startTime: '08:00', endTime: '12:00',
    updatedAt: '2026-02-15' 
  },
  { 
    id: 'PROC-002', processName: '粗加工', labelIds: ['LBL-2'], description: '车铣磨初步去除余量',
    productionSteps: '1. 毛坯定位装夹; 2. 粗车外圆及端面; 3. 粗钻中心孔',
    equipments: '卧式数控车床、摇臂钻床',
    operator: '初级数控车工',
    startTime: '13:00', endTime: '15:30',
    updatedAt: '2026-02-15' 
  },
  { 
    id: 'PROC-003', processName: '精加工', labelIds: ['LBL-2'], description: '轴类零件及齿面高精度加工',
    productionSteps: '1. 高精度对刀; 2. 精车外圆/内孔; 3. 齿面滚齿/插齿加工; 4. 表面抛光',
    equipments: '五轴加工中心、高精度滚齿机',
    operator: '高级数控加工中心操作工',
    startTime: '08:00', endTime: '16:00',
    updatedAt: '2026-02-15' 
  },
  { 
    id: 'PROC-004', processName: '检测', labelIds: ['LBL-3'], description: '三坐标尺寸与精度检验',
    productionSteps: '1. 恒温室静置; 2. 探针标定; 3. 关键尺寸与形位公差扫描; 4. 出具质检报告',
    equipments: '三坐标测量机 (CMM)、表面粗糙度仪',
    operator: '专职质检员 (CQE)',
    startTime: '16:00', endTime: '17:00',
    updatedAt: '2026-02-15' 
  },
  { 
    id: 'PROC-005', processName: '入库', labelIds: ['LBL-4'], description: '成品防锈包装与扫码入库',
    productionSteps: '1. 超声波清洗; 2. 涂抹防锈油; 3. 塑封包装; 4. 贴二维码标签; 5. AGV搬运入库',
    equipments: '超声波清洗机、自动打包机、PDA扫码枪',
    operator: '仓储物流专员',
    startTime: '17:00', endTime: '18:00',
    updatedAt: '2026-02-15' 
  },
];

// --- 模拟 API 请求 (延迟 300ms 模拟真实网络) ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const queryProcessLabels = async (): Promise<ProcessLabel[]> => {
  await delay(300);
  return [...mockProcessLabels];
};

export const queryProcesses = async (params: { current?: number; pageSize?: number; keyword?: string; labelId?: string }) => {
  await delay(300);
  let data = [...mockProcesses];

  if (params.keyword) {
    data = data.filter(item => item.processName.includes(params.keyword!) || item.id.includes(params.keyword!));
  }
  if (params.labelId && params.labelId !== 'LBL-0') {
    data = data.filter(item => item.labelIds?.includes(params.labelId!));
  }

  return {
    data,
    total: data.length,
    success: true,
  };
};

export const saveProcess = async (process: Process): Promise<boolean> => {
  await delay(300);
  const index = mockProcesses.findIndex(p => p.id === process.id);
  if (index > -1) {
    mockProcesses[index] = { ...process, updatedAt: new Date().toISOString().split('T')[0] };
  } else {
    mockProcesses.unshift({ ...process, updatedAt: new Date().toISOString().split('T')[0] });
  }
  return true;
};

export const deleteProcess = async (id: string): Promise<boolean> => {
  await delay(300);
  mockProcesses = mockProcesses.filter(p => p.id !== id);
  return true;
};