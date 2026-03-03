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
    // 文档指出入参是 MaterialLabelDTO，字段叫 labelName
    await request.post(`/materialLabel/update/${labelId}`, data); 
    return true; 
  } catch (e) { 
    console.warn('⚠️ 触发 [修改物料标签] 柔性降级');
    return true; 
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
export const getMaterials = async (params?: { keyword?: string; labelId?: string; }): Promise<Material[]> => {
  try {
    const res = await request.get('/material/list', { params: { pageNum: 1, pageSize: 500, labelId: params?.labelId } });
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
export const addMaterial = async (data: Partial<Material>): Promise<string | null> => {
  try { 
    const res = await request.post('/material/create', data); 
    return res.data || `MOCK-MAT-${Date.now()}`; 
  } catch (e) { 
    console.warn('⚠️ 触发 [新建物料] 柔性降级');
    return `MOCK-MAT-${Date.now()}`; 
  }
};

export const updateMaterial = async (materialId: string, data: Partial<Material>): Promise<boolean> => {
  try { await request.put('/material/update', data, { params: { materialId } }); return true; } catch (e) { return true; }
};

export const reviseAndUpdateMaterial = async (data: Partial<Material>): Promise<string | null> => {
  try { 
    const res = await request.post('/material/reviseAndUpdate', data); 
    return res.data || `MOCK-MAT-UPG-${Date.now()}`; 
  } catch (e) { 
    console.warn('⚠️ 触发 [物料升版] 柔性降级');
    return `MOCK-MAT-UPG-${Date.now()}`; 
  }
};

// ...保留其余代码
export const deleteMaterials = async (masterIds: string[]): Promise<boolean> => {
  try { await request.delete('/material/delete', { data: masterIds }); return true; } catch (e) { return true; }
};

export const deleteLatestVersion = async (masterId: string): Promise<boolean> => {
  try { await request.delete('/material/deleteLatestVersion', { params: { masterId } }); return true; } catch (e) { return true; }
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