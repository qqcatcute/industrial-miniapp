// src/pages/Process/service.ts
import request from '@/utils/request';
import { Process, ProcessTemplate, ProcessLabel } from './typing';

// ==========================================
// 🛡️ 前端兜底 Mock 数据池 (兼容 1 对 N 架构)
// ==========================================
const mockProcessLabels: ProcessLabel[] = [
  { id: 'LBL-0', processLabelName: '全部工序', processLabelParent: 'NULL', processLabelHierarchical: 0 },
  { id: 'LBL-1', processLabelName: '成型工艺', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-2', processLabelName: '机械加工', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
  { id: 'LBL-3', processLabelName: '质量控制', processLabelParent: 'LBL-0', processLabelHierarchical: 1 },
];

let mockProcesses: Process[] = [
  { 
    processId: 'PROC-001', processName: '毛坯制造',
    templates: [{
      templateId: 'TPL-001', processId: 'PROC-001', templateName: '标准铸造模板',
      templateDescription: '行星减速器毛坯铸造与锻造', startTime: '08:00', endTime: '12:00',
      productionSteps: '1. 模具预热; 2. 熔炼浇注; 3. 切除浇口', equipments: '中频感应熔炼炉', operator: '特种铸造工', labelIds: ['LBL-1']
    }]
  },
  { 
    processId: 'PROC-002', processName: '精加工',
    templates: [{
      templateId: 'TPL-002', processId: 'PROC-002', templateName: '高精度车铣复合',
      templateDescription: '轴类零件及齿面高精度加工', startTime: '08:00', endTime: '16:00',
      productionSteps: '1. 高精度对刀; 2. 精车外圆/内孔', equipments: '五轴加工中心', operator: '高级数控工', labelIds: ['LBL-2']
    }]
  }
];

// ==========================================
// 🚀 1. 基础工序接口 (主表)
// ==========================================

export const queryProcessLabels = async (): Promise<ProcessLabel[]> => {
  return [...mockProcessLabels]; // 后端没给接口，左侧树直接用本地数据死撑
};

export const queryProcesses = async (params: { current?: number; pageSize?: number; keyword?: string; labelId?: string }) => {
  try {
    // 第一步：调真实接口拿基础工序列表
    const res = await request.get('/process/list', { params: { pageNum: 1, pageSize: 100 } });
    const processList = res.data || [];

    // 第二步：通过 Promise.all 并发请求每个工序下的模板，并解析偷渡的 JSON
    const processesWithTemplates = await Promise.all(processList.map(async (p: any) => {
      try {
        const tRes = await request.get('/process/listTemplate', { params: { processId: p.processId, pageNum: 1, pageSize: 100 } });
        const templates = (tRes.data?.list || []).map((t: any) => {
          let parsed: any = {};
          try { parsed = JSON.parse(t.inputJson || '{}'); } catch(e){}
          return {
            ...t,
            templateName: t.templateName || t.processName || '未命名模板',
            productionSteps: parsed.productionSteps,
            equipments: parsed.equipments,
            operator: parsed.operator,
            labelIds: parsed.labelIds || []
          };
        });
        return { ...p, templates };
      } catch (error) {
        return { ...p, templates: [] }; // 如果模板查询失败，返回空数组
      }
    }));

    // 第三步：在前端进行搜索和左侧树分类过滤
    let filtered = processesWithTemplates;
    if (params.keyword) {
      filtered = filtered.filter(p => p.processName.includes(params.keyword!));
    }
    if (params.labelId && params.labelId !== 'LBL-0') {
      // 只要该工序下有任意一个模板属于该分类，就展示该工序
      filtered = filtered.filter(p => p.templates.some((t: ProcessTemplate) => t.labelIds?.includes(params.labelId!)));
    }
    return { data: filtered, total: filtered.length, success: true };
  } catch (error) {
    console.warn('⚠️ 后端查询工序异常，触发 Mock 柔性降级');
    let filtered = [...mockProcesses];
    if (params.keyword) filtered = filtered.filter(p => p.processName.includes(params.keyword!));
    if (params.labelId && params.labelId !== 'LBL-0') {
      filtered = filtered.filter(p => p.templates?.some(t => t.labelIds?.includes(params.labelId!)));
    }
    return { data: filtered, total: filtered.length, success: true };
  }
};

export const saveProcess = async (processName: string, processId?: string): Promise<boolean> => {
  try {
    if (processId) {
      await request.post('/process/update', { processId, processName });
    } else {
      await request.post('/process', { processName });
    }
    return true;
  } catch (error) {
    console.warn('⚠️ 触发 [保存基础工序] 柔性降级');
    if (processId) {
      const idx = mockProcesses.findIndex(p => p.processId === processId);
      if (idx > -1) mockProcesses[idx].processName = processName;
    } else {
      mockProcesses.unshift({ processId: `PROC-${Date.now()}`, processName, templates: [] });
    }
    return true;
  }
};

export const deleteProcess = async (processIds: string[]): Promise<boolean> => {
  try {
    await request.delete('/process/delete', { data: processIds });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [删除基础工序] 柔性降级');
    mockProcesses = mockProcesses.filter(p => !processIds.includes(p.processId));
    return true;
  }
};


// ==========================================
// 🚀 2. 工序执行模板接口 (子表)
// ==========================================

export const saveProcessTemplate = async (template: ProcessTemplate): Promise<boolean> => {
  try {
    // 💡 核心：把前端要求的扩展字段，偷渡打包进 inputJson！
    const inputJsonStr = JSON.stringify({
      productionSteps: template.productionSteps,
      equipments: template.equipments,
      operator: template.operator,
      labelIds: template.labelIds
    });

    const payload = {
      templateId: template.templateId, // 如果是新建，这里为空，后端会忽略
      processId: template.processId,
      templateName: template.templateName,
      processName: template.templateName, // 防止后端文档混用字段
      templateDescription: template.templateDescription,
      startTime: template.startTime,
      endTime: template.endTime,
      inputJson: inputJsonStr,
      outputJson: "{}"
    };

    if (template.templateId) {
      await request.post('/processTemplate/update', payload);
    } else {
      await request.post('/processTemplate', payload);
    }
    return true;
  } catch (error) {
    console.warn('⚠️ 触发 [保存工艺模板] 柔性降级');
    const parent = mockProcesses.find(p => p.processId === template.processId);
    if (parent) {
      if (template.templateId) {
        const idx = parent.templates!.findIndex(t => t.templateId === template.templateId);
        if (idx > -1) parent.templates![idx] = template;
      } else {
        parent.templates!.push({ ...template, templateId: `TPL-${Date.now()}` });
      }
    }
    return true;
  }
};

export const deleteProcessTemplate = async (templateIds: string[]): Promise<boolean> => {
  try {
    await request.delete('/processTemplate/delete', { data: templateIds });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [删除工艺模板] 柔性降级');
    mockProcesses.forEach(p => {
      if (p.templates) p.templates = p.templates.filter(t => !templateIds.includes(t.templateId));
    });
    return true;
  }
};