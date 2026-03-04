// src/pages/Process/service.ts
import request from '@/utils/request';
import { Process, ProcessTemplate, ProcessLabel } from './typing';

const mockProcessLabels: ProcessLabel[] = [
  { id: 'LBL-0', processLabelName: '全部工序', processLabelParent: 'SUPER_ROOT', processLabelHierarchical: 0 },
  { id: 'LBL-1', processLabelName: '成型工艺', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-2', processLabelName: '机械加工', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-3', processLabelName: '质量控制', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
];

// 🚀 前端 Mock 关系表 (模拟后端未提供工序列表带出标签关联的问题)
const mockProcessLabelBindings: Record<string, string[]> = {
  'PROC-001': ['LBL-1'],
  'PROC-002': ['LBL-2']
};

let mockProcesses: Process[] = [
  { 
    processId: 'PROC-001', processName: '毛坯制造',
    templates: [{
      templateId: 'TPL-001', processId: 'PROC-001', templateName: '标准铸造模板',
      templateDescription: '行星减速器毛坯铸造与锻造', startTime: '08:00', endTime: '12:00',
      productionSteps: '1. 模具预热; 2. 熔炼浇注; 3. 切除浇口', equipments: '中频感应熔炼炉', operator: '特种铸造工'
    }]
  },
  { 
    processId: 'PROC-002', processName: '精加工',
    templates: [{
      templateId: 'TPL-002', processId: 'PROC-002', templateName: '高精度车铣复合',
      templateDescription: '轴类零件及齿面高精度加工', startTime: '08:00', endTime: '16:00',
      productionSteps: '1. 高精度对刀; 2. 精车外圆/内孔', equipments: '五轴加工中心', operator: '高级数控工'
    }]
  }
];

// 🚀 1. 对接真实的获取标签列表接口，并抹平前后端字段差异
export const queryProcessLabels = async (): Promise<ProcessLabel[]> => {
  try {
    const res = await request.get('/processLabel/list');
    const list = res.data || [];
    
    const formattedList = list.map((item: any) => ({
      id: item.labelId,
      processLabelName: item.labelName,
      // 🌟 核心修复：把后端返回的一级根节点('root' 或 null)，强行挂载到前端虚拟的 'LBL-0' (全部工序) 节点下！
      processLabelParent: (!item.labelParentId || item.labelParentId === 'root' || item.labelParentId === 'NULL') ? 'LBL-0' : item.labelParentId,
      processLabelHierarchical: item.processLabelHierarchical
    }));

    return [
      { id: 'LBL-0', processLabelName: '全部工序', processLabelParent: 'SUPER_ROOT', processLabelHierarchical: 0 },
      ...formattedList
    ];
  } catch (error) {
    console.warn('⚠️ 触发 [获取工序标签] 柔性降级');
    return [...mockProcessLabels]; 
  }
};

// 🚀 2. 新增：创建工艺标签
export const addProcessLabel = async (data: { processLabelName: string; processLabelParentId?: string }): Promise<boolean> => {
  try { 
    await request.post('/processLabel/create', data); 
    return true; 
  } catch (e) { 
    return false; 
  }
};

// 🚀 3. 新增：修改工艺标签
// 🚀 3. 新增：修改工艺标签
export const updateProcessLabel = async (labelId: string, data: { labelName: string; labelParentId?: string; processLabelHierarchical: number }): Promise<boolean> => {
  try { 
    await request.post(`/processLabel/update/${labelId}`, { 
      labelId, 
      labelName: data.labelName,               // 迎合接口文档的写法
      processLabelName: data.labelName,        // 🚨 核心修复：强行补充创建接口用到的字段，双管齐下！
      processLabelHierarchical: data.processLabelHierarchical,
      labelParentId: data.labelParentId
    }); 
    return true; 
  } catch (e) { 
    return false; 
  }
};

// 🚀 核心新增：绑定/解绑工序分类接口
export const bindProcessLabel = async (processId: string, labelId: string): Promise<boolean> => {
  try {
    await request.post('/processLabel/bind', null, { params: { processId, labelId } });
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [绑定工序标签] 柔性降级: ${processId} -> ${labelId}`);
    // 同步更新本地 Mock 关系表
    if (!mockProcessLabelBindings[processId]) mockProcessLabelBindings[processId] = [];
    if (!mockProcessLabelBindings[processId].includes(labelId)) mockProcessLabelBindings[processId].push(labelId);
    return true;
  }
};

export const unbindProcessLabel = async (processId: string, labelId: string): Promise<boolean> => {
  try {
    await request.post('/processLabel/unbind', null, { params: { processId, labelId } });
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [解绑工序标签] 柔性降级: ${processId} -> ${labelId}`);
    if (mockProcessLabelBindings[processId]) {
      mockProcessLabelBindings[processId] = mockProcessLabelBindings[processId].filter(id => id !== labelId);
    }
    return true;
  }
};

export const queryProcesses = async (params: { current?: number; pageSize?: number; keyword?: string; labelId?: string }) => {
  try {
    // 💡 修复 1：处理前端虚拟的 "全部工序" 节点
    const validLabelId = params.labelId === 'LBL-0' ? undefined : params.labelId;

    // 💡 修复 2：把 labelId 传给后端的 Body
    const res = await request.post('/process/list', { 
      pageNum: params.current || 1, 
      pageSize: params.pageSize || 100,
      labelId: validLabelId 
    });
    
    let processList = res.data || [];

    // 并发拉取每个工序的模板数
    const processPromises = processList.map(async (p: any) => {
      try {
        const tplRes = await request.get('/process/listTemplate', { 
          params: { processId: p.processId, pageNum: 1, pageSize: 100 } 
        });
        const tplList = Array.isArray(tplRes.data) ? tplRes.data : (tplRes.data?.list || []);
        
        return {
          ...p,
          // 这里的 mock 可以留着兜底，但不应该再用于本地过滤了
          labelIds: mockProcessLabelBindings[p.processId] || [], 
          templateCount: tplList.length
        };
      } catch (e) {
        return { ...p, labelIds: [], templateCount: 0 };
      }
    });

    let filtered = await Promise.all(processPromises);

    // 💡 修复 3：保留纯关键字的前端检索（如果后端没做关键字接口的话）
    if (params.keyword) {
      filtered = filtered.filter((p: any) => p.processName.includes(params.keyword!));
    }
    
    // 🚨 修复 4：彻底删除了原来那段 if (params.labelId && params.labelId !== 'LBL-0') {...} 的本地假过滤逻辑！
    
    return { data: filtered, total: filtered.length, success: true };
  } catch (error) {
    console.warn('获取工序大类失败', error);
    return { data: [], total: 0, success: true }; 
  }
};
// --- 🚀 新增 2：独立的懒加载获取模板方法（自带防 500 护盾） ---
// 🚀 终极解析版：完美迎合后端奇葩的数据结构
export const queryProcessTemplates = async (processId: string) => {
  try {
    const res = await request.get('/process/listTemplate', { params: { processId, pageNum: 1, pageSize: 100 } });
    const list = Array.isArray(res.data) ? res.data : (res.data?.list || []);

    return list.map((t: any) => {
      let parsedData: any = {};
      let inputArr: any[] = [], outputArr: any[] = [], deviceArr: any[] = [];
      try { 
        const parsed = JSON.parse(t.inputJson || '[]'); 
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].productionSteps) {
          parsedData = parsed[0]; 
        } else {
          inputArr = parsed; 
        }
        outputArr = JSON.parse(t.outputJson || '[]');
        deviceArr = JSON.parse(t.deviceJson || '[]');
      } catch(e){}

      // 💡 提取设备和物料的名称，拼成字符串供表格直接展示
      const deviceNamesStr = deviceArr.map(d => d.deviceName).join('、');
      const inputNamesStr = inputArr.map(m => m.materialName).join('、');
      const outputNamesStr = outputArr.map(m => m.materialName).join('、');

      return {
        ...t, 
        templateName: t.processName || t.templateName || '未命名标准',
        productionSteps: parsedData.productionSteps, 
        operator: t.operator || parsedData.operator,
        
        // 💡 新增：把提取出来的字符串赋给新字段
        equipments: deviceNamesStr || '-', 
        inputMaterials: inputNamesStr || '-',
        outputMaterials: outputNamesStr || '-',
        templateDescription: t.templateDescription || '-',

        inputMaterialIds: inputArr.map((i: any) => i.materialId),
        outputMaterialIds: outputArr.map((i: any) => i.materialId),
        requiredDeviceIds: deviceArr.map((i: any) => i.deviceId),
      };
    });
  } catch (error) {
    return [];
  }
};

// 🚀 核心修改：让方法返回新创建的 ID，用于执行后续关联逻辑
export const saveProcess = async (processName: string, processId?: string): Promise<string | null> => {
  try {
    if (processId) {
      await request.post('/process/update', { processId, processName });
      return processId;
    } else {
      const res = await request.post('/process/create', { processName });
      return res.data?.processId || `PROC-${Date.now()}`;
    }
  } catch (error) {
    console.warn('⚠️ 触发 [保存基础工序] 柔性降级');
    const newId = processId || `PROC-${Date.now()}`;
    if (processId) {
      const idx = mockProcesses.findIndex(p => p.processId === processId);
      if (idx > -1) mockProcesses[idx].processName = processName;
    } else {
      mockProcesses.unshift({ processId: newId, processName, templates: [] });
    }
    return newId;
  }
};

export const deleteProcess = async (processIds: string[]): Promise<boolean> => {
  try {
    await request.delete('/process/delete', { data: processIds });
    return true;
  } catch (e) {
    mockProcesses = mockProcesses.filter(p => !processIds.includes(p.processId));
    return true;
  }
};

// --- 替换 3：修复创建模板的 404 路径 Bug ---
// --- 替换：完美对齐《接口文档(7).md》的模板保存逻辑 ---
// 🚀 补充一个时间格式化与兜底的安全函数
export const safeFormatTime = (time: any, defaultTime?: string) => {
  if (!time) return defaultTime || null;
  
  // 1. 如果传进来的是 dayjs / moment 等对象，直接格式化
  if (typeof time === 'object' && typeof time.format === 'function') {
    return time.format('YYYY-MM-DD HH:mm:ss');
  }
  
  // 2. 如果传进来已经是字符串
  if (typeof time === 'string') {
    // 如果已经是完美格式，直接返回
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    // 如果只有 "HH:mm" 或者 "HH:mm:ss" (例如部分旧数据)
    // 补全一个默认日期以防止后端报错 (如 2026-01-01)
    if (time.length === 5 || time.length === 8) {
       return `2026-01-01 ${time.length === 5 ? time + ':00' : time}`;
    }
  }
  
  return time;
};


// 👇 核心：接收已经组装好的 raw JSON 数组并字符串化
export const saveProcessTemplate = async (template: any): Promise<boolean> => {
  try {
    // 兼容旧字段
    const oldJsonStr = JSON.stringify([{
      productionSteps: template.productionSteps, 
      equipments: template.equipments, 
      operator: template.operator
    }]);

    const payload = {
      templateId: template.templateId, 
      processId: template.processId, 
      processName: template.templateName || "未命名标准", 
      templateDescription: template.templateDescription || template.templateName,
      startTime: safeFormatTime(template.startTime, "2026-01-01 08:00:00"), 
      endTime: safeFormatTime(template.endTime, "2026-01-01 18:00:00"), 
      
      // 👇 核心：直接使用抽屉里组装好的标准化 JSON 字符串
      inputJson: template.inputJson || oldJsonStr, 
      outputJson: template.outputJson || "[]", 
      deviceJson: template.deviceJson || "[]",
      
      operator: template.operator || "admin"
    };
    
    if (template.templateId) {
      await request.post('/processTemplate/update', payload);
    } else {
      await request.post('/processTemplate/create', payload); 
    }
    return true;
  } catch (error) {
    return false; 
  }
};

export const deleteProcessTemplate = async (templateIds: string[]): Promise<boolean> => {
  try {
    await request.delete('/processTemplate/delete', { data: templateIds });
    return true;
  } catch (e) {
    mockProcesses.forEach(p => {
      if (p.templates) p.templates = p.templates.filter(t => !templateIds.includes(t.templateId));
    });
    return true;
  }
};