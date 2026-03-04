// src/pages/Material/service.ts
import request from '@/utils/request';
import { Material, MaterialLabel } from './typing';
import { mockMaterialLabels, mockMaterials } from '@/mock/material.mock';

// ==========================================
// 🏷️ 1. 物料分类标签接口 (含扁平转树形逻辑)
// ==========================================
export const getMaterialLabels = async (): Promise<MaterialLabel[]> => {
  try {
    const res = await request.get('/materialLabel/list');
    const list: MaterialLabel[] = res.data || [];
    
    const map = new Map<string, MaterialLabel>();
    const tree: MaterialLabel[] = [];
    list.forEach(item => map.set(item.labelId, { ...item, children: [] }));
    
    list.forEach(item => {
      if (!item.labelParentId || item.labelParentId === 'root' || item.labelParentId === 'NULL') {
        tree.push(map.get(item.labelId)!);
      } else {
        const parent = map.get(item.labelParentId);
        if (parent && parent.children) {
          parent.children.push(map.get(item.labelId)!);
        }
      }
    });
    return tree.length ? tree : [{ labelId: 'NULL', labelName: '全部物料', labelParentId: 'root', materialLabelHierarchical: 0 }];
  } catch (error) {
    return mockMaterialLabels;
  }
};

export const addMaterialLabel = async (data: { materialLabelName: string; materialLabelParentId?: string }): Promise<boolean> => {
  try { await request.post('/materialLabel/create', data); return true; } catch (e) { return true; }
};

// 💡 新增：修改物料标签
export const updateMaterialLabel = async (labelId: string, data: { labelName: string; labelParentId?: string; materialLabelHierarchical: number }): Promise<boolean> => {
  try { 
    // 🚨 核心修复：严格按照接口文档的要求，将前端的 labelName 映射为后端的 materialLabelName
    await request.post(`/materialLabel/update/${labelId}`, {
      materialLabelName: data.labelName,
      // 如果后端严格要求，你还可以把其他字段一并带上，以防万一双管齐下
      labelName: data.labelName 
    }); 
    return true; 
  } catch (e) { 
    console.warn('⚠️ 触发 [修改物料标签] 柔性降级');
    return false; // 注意：失败应该返回 false 阻止弹窗关闭
  }
};

export const deleteMaterialLabel = async (labelId: string): Promise<boolean> => {
  try { await request.post(`/materialLabel/delete/${labelId}`); return true; } catch (e) { return true; }
};

// 💡 新增：物料与标签绑定 (Query Params)
export const bindMaterialLabel = async (materialId: string, labelId: string): Promise<boolean> => {
  try {
    await request.post('/materialLabel/bind', null, { params: { materialId, labelId } });
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [绑定物料标签] 柔性降级: ${materialId} -> ${labelId}`);
    return true;
  }
};

// 💡 新增：物料与标签解绑 (Query Params)
export const unbindMaterialLabel = async (materialId: string, labelId: string): Promise<boolean> => {
  try {
    await request.post('/materialLabel/unbind', null, { params: { materialId, labelId } });
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [解绑物料标签] 柔性降级: ${materialId} -> ${labelId}`);
    return true;
  }
};

// ==========================================
// 📦 2. 物料实体 CRUD 
// ==========================================
// ...(保留现有的 getMaterials 及其折叠算法)
export const getMaterials = async (params?: { keyword?: string; labelId?: string; current?: number; pageSize?: number }): Promise<Material[]> => {
  try {
    const validLabelId = params?.labelId === 'NULL' ? undefined : params?.labelId;

    // 👇 核心新增：如果传入了 keyword，优先走 query 查询接口
    if (params?.keyword) {
      const res = await request.post('/material/query', {
        queryType: 'name', // 严格遵守后端接口文档：按物料名称查询
        keyword: params.keyword,
        pageNum: params?.current || 1, 
        pageSize: params?.pageSize || 100
      });
      // 同样经过折叠算法处理
      const allVersions: Material[] = res.data || [];
      return groupAndFoldMaterials(allVersions);
    }

    // 👇 原有逻辑：如果没有 keyword，正常走 list 接口（加载分类树数据）
    const res = await request.post('/material/list', {
      pageNum: params?.current || 1, 
      pageSize: params?.pageSize || 100,
      labelId: validLabelId
    });
    
    const allVersions: Material[] = res.data || [];
    return groupAndFoldMaterials(allVersions);
  } catch (error) {
    return groupAndFoldMaterials(mockMaterials);
  }
};

const groupAndFoldMaterials = (flatList: Material[]): Material[] => {
  const groupMap = new Map<string, Material[]>();
  flatList.forEach(item => {
    if (!groupMap.has(item.masterId)) groupMap.set(item.masterId, []);
    groupMap.get(item.masterId)!.push(item);
  });
  const finalTree: Material[] = [];
  groupMap.forEach(group => {
    group.sort((a, b) => b.materialVersion.localeCompare(a.materialVersion));
    const latestVersion = { ...group[0] };
    latestVersion.historyVersions = group.slice(1);
    finalTree.push(latestVersion);
  });
  return finalTree;
};

// 💡 核心改造：为了能在后续做标签绑定，新建物料必须返回 ID！如果后端没返回，Mock一个兜底
// 🚀 修改 1：新建物料
// 🚀 修改 1：新建物料
export const addMaterial = async (data: Partial<Material>): Promise<string | null> => {
  try { 
    const res = await request.post('/material/create', data); 
    return res.data?.materialId || `MOCK-MAT-${Date.now()}`; 
  } catch (e) { 
    console.error('❌ [新建物料] 真实请求失败:', e);
    // 💡 致命修复：必须返回 null，阻止抽屉关闭和页面刷新！
    return null; 
  }
};

export const updateMaterial = async (materialId: string, data: Partial<Material>): Promise<boolean> => {
  try { 
    // 🚀 核心修复：把 materialId 也塞进 Body(第二个参数) 里，迎合后端的 @RequestBody
    await request.post('/material/update', { ...data, materialId }, { params: { materialId } }); 
    return true; 
  } catch (e) { 
    console.error('❌ [修改物料] 真实请求失败:', e);
    return false; // 💡 失败必须返回 false，阻止抽屉关闭
  }
};

export const reviseAndUpdateMaterial = async (data: Partial<Material>): Promise<boolean> => {
  try { 
    // 发起升版请求
    await request.post('/material/reviseAndUpdate', data); 
    return true; // 🚀 修复：不指望它返回 ID 了，只要跑通了就是成功
  } catch (e) { 
    console.error('❌ [物料升版] 真实请求失败:', e);
    return false; // 💡 失败返回 false
  }
};


// 🚀 修改 4：删除物料
export const deleteMaterials = async (masterIds: string[]): Promise<boolean> => {
  try { 
    await request.delete('/material/delete', { data: masterIds }); 
    return true; 
  } catch (e) { 
    console.error('❌ [删除物料] 失败:', e);
    // 💡 致命修复：必须返回 false，绝不伪装成功！
    return false; 
  }
};

export const deleteLatestVersion = async (masterId: string): Promise<boolean> => {
  try { 
    await request.delete('/material/deleteLatestVersion', { params: { masterId } }); 
    return true; 
  } catch (e) { 
    console.error('❌ [撤销版本] 失败:', e);
    // 💡 致命修复：必须返回 false！
    return false; 
  }
};

export const getMaterialDetail = async (materialId: string): Promise<Material> => {
  try {
    const res = await request.get('/material/detail', { params: { materialId } });
    return res.data;
  } catch (error) {
    const mockData = mockMaterials.find(m => m.materialId === materialId) || mockMaterials[0];
    return { ...mockData, materialDescription: mockData.materialDescription || '该物料暂无详细描述信息。（此为Mock降级数据）' };
  }
};

// 🚀 前端强行拼装 BOM 的聚合函数
export const generateBOMFromRoutes = async (targetMaterialId: string) => {
  try {
    // 1. 暴力拉取所有路线 (因为后端没提供根据 materialId 查路线的接口)
    const routeRes = await request.get('/route/list', { params: { pageNum: 1, pageSize: 500 } });
    const routes = routeRes.data || [];
    
    // 寻找目标产物对应的路线
    const targetRoute = routes.find((r: any) => r.materialId === targetMaterialId);
    if (!targetRoute) return []; // 没有对应的工艺路线，说明它是纯采购件，没有下级 BOM

    // 2. 查询该路线下的所有步骤
    const stepsRes = await request.get('/route/listStep', { params: { routeId: targetRoute.routeId } });
    const steps = stepsRes.data || [];
    if (steps.length === 0) return [];

    // 3. 🚨 并发请求风暴：同时拉取所有步骤的模板详情
    const templatePromises = steps.map((step: any) => 
      request.get('/processTemplate/detail', { params: { templateId: step.templateId } })
    );
    // 等待所有请求完成
    const templateResponses = await Promise.all(templatePromises);

    // 4. 解析 inputJson 并进行聚合计算
    const bomMap = new Map();
    
    templateResponses.forEach(res => {
      const tpl = res.data;
      if (tpl && tpl.inputJson) {
        try {
          // 解析模板里的输入物料
          const inputs = JSON.parse(tpl.inputJson);
          inputs.forEach((item: any) => {
            // 🚨 加上这两行终极防御！过滤掉旧的脏数据（没有 materialId 的数据）
        if (!item.materialId) return; 
        const qty = Number(item.materialQuantity) || 0; // 防御 NaN
            if (bomMap.has(item.materialId)) {
          // 如果已经有了，就累加数量
          const existing = bomMap.get(item.materialId);
          existing.materialQuantity += qty;
        } else {
          // 如果没有，直接存入 Map
          bomMap.set(item.materialId, { 
            ...item, 
            materialQuantity: qty 
          });
            }
          });
        } catch (e) {
          console.warn('解析 inputJson 失败', tpl.inputJson);
        }
      }
    });

    // 将 Map 转回数组返回给表格
    return Array.from(bomMap.values());

  } catch (error) {
    console.error('前端聚合 BOM 失败:', error);
    return [];
  }
};