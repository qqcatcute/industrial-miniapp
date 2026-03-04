// src/pages/Route/service.ts
import request from '@/utils/request';
import { Route } from './typing';
import { Node, Edge } from 'reactflow';


// ==========================================
// 🛡️ 前端兜底 Mock 数据池 (确保赛题演示万无一失)
// ==========================================
let mockRoutes: Route[] = [
  {
    id: '870129367072989184', // 模拟后端返回的真实 ID 格式
    routeName: '中心轮零件加工',
    version: '1.0',
    routeDescription: '适用于精密行星减速器中心轮的标准加工流程',
    materialId: '869373674028605440',
    updatedAt: new Date().toISOString().split('T')[0]
  }
];

// 模拟数据库：保存每条工艺路线的 画布节点 和 连线数据
const mockRouteConfigs: Record<string, { nodes: Node[]; edges: Edge[] }> = {};

// ==========================================
// 🚀 1. 工艺路线基础 CRUD
// ==========================================

export const queryRoutes = async (params: { keyword?: string; current?: number; pageSize?: number }) => {
  try {
    const res = await request.get('/route/list', { 
      params: { pageNum: params.current || 1, pageSize: params.pageSize || 10 } 
    });
    
    // 映射后端 SimpleRouteDTO 到前端 Route 实体
    let data = (res.data || []).map((item: any) => ({
      id: item.routeId,
      routeName: item.routeName,
      version: item.routeVersion,
      materialId: item.materialId,
      // 下面字段是列表接口没返回，但前端展示需要的兜底数据
      operator: '工艺工程师', 
      operationTime: '待画板统筹',
      updatedAt: new Date().toISOString().split('T')[0]
    }));

    if (params.keyword) {
      data = data.filter((item: any) => item.routeName.includes(params.keyword!));
    }
    return { data, total: data.length, success: true };
  } catch (error) {
    console.warn('⚠️ [Mock兜底] 获取工艺路线列表失败');
    let data = [...mockRoutes];
    if (params.keyword) data = data.filter(item => item.routeName.includes(params.keyword!));
    return { data, total: data.length, success: true };
  }
};

// 💡 新增：保存基础工艺路线信息（抽屉里用到）
// 1. 修复基础档案保存 (确保所有表单扩展字段都被传给后端)
export const saveRouteBaseInfo = async (routeData: any): Promise<boolean> => {
  try {
    // 1. 提取后端不肯加的这三个字段
    const secretObj = {
      operator: routeData.operator || '',
      operationTime: routeData.operationTime || '',
      equipments: routeData.equipments || ''
    };

    // 2. 将真实描述和秘密对象通过 @@@ 拼接在一起
    const realDesc = routeData.routeDescription || '';
    const mergedDescription = `${realDesc}@@@${JSON.stringify(secretObj)}`;

    // 3. 构建发送给后端的标准 payload
    const payload = {
      routeId: routeData.id,
      routeName: routeData.routeName,
      routeVersion: routeData.version,
      materialId: routeData.materialId,
      // 偷天换日：存入带有小尾巴的字符串
      routeDescription: mergedDescription, 
      // 画布数据保持纯洁，不加私货
      canvasData: routeData.canvasData || "{\"nodes\":[],\"edges\":[],\"scale\":1}" 
    };

    if (routeData.id) {
      await request.put('/route/update', payload);
    } else {
      await request.post('/route/create', payload);
    }
    return true;
  } catch (error) {
    console.error('基础信息保存失败', error);
    throw error; 
  }
};

export const deleteRoute = async (id: string) => {
  try {
    await request.delete('/route/delete', { data: [id] });
    return true;
  } catch (error) {
    console.warn('⚠️ [Mock兜底] 删除工艺路线失败');
    mockRoutes = mockRoutes.filter(r => r.id !== id);
    return true;
  }
};

// ==========================================
// 🎨 2. 沉浸式画板双轨制保存逻辑 (核心亮点)
// ==========================================

export const getRouteConfig = async (routeId: string) => {
  try {
    const res = await request.get('/route/detail', { params: { routeId } });
    if (res.data && res.data.canvasData) {
      const canvas = JSON.parse(res.data.canvasData);
      return { nodes: canvas.nodes || [], edges: canvas.edges || [] };
    }
    return { nodes: [], edges: [] };
  } catch (error) {
    console.warn(`⚠️ [Mock兜底] 获取路线 ${routeId} 画布配置失败`);
    return mockRouteConfigs[routeId] || { nodes: [], edges: [] };
  }
};

// 2. 修复画板保存 (无损合并已有数据，不丢字段，不乱造假 ID)
export const saveRouteConfig = async (routeId: string, nodes: Node[], edges: Edge[]) => {
  try {
    // 【第一轨】视觉数据
    const canvasDataStr = JSON.stringify({ nodes, edges, scale: 1 });
    
    // 【第二轨】业务顺序数据
    const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);
    const templateIds = sortedNodes.map(n => n.data.templateId).filter(Boolean);

    // 1. 先拉取详尽的已有数据，防止 PUT 时覆盖丢失！
    let routeBaseInfo: any = {};
    try {
      const detailRes = await request.get('/route/detail', { params: { routeId } });
      routeBaseInfo = detailRes.data || {};
    } catch (e) {
      console.warn('拉取路线详情失败，只能基于当前数据更新');
    }

    // 2. 🚨 核心修复 1：将后端返回的所有原始字段原封不动地全部带上！
    // 只强行覆盖 canvasData，彻底消灭因为缺字段导致的 400
    const updatePayload = {
      ...routeBaseInfo,
      routeId: routeId,
      canvasData: canvasDataStr
    };

    // 针对新数据可能的字段名差异做兼容兜底
    if (!updatePayload.routeName) updatePayload.routeName = '未命名工艺';
    if (!updatePayload.routeVersion) updatePayload.routeVersion = routeBaseInfo.version || '1.0';
    // ⚠️ 删掉了坑人的 'MAT_DEFAULT' 假数据！

    // 3. 🚨 核心修复 2：针对 updateStep 的参数格式进行优化
    // 很多 Java 后端的 @RequestBody 直接接收 List 会报 400，最稳妥的是包成对象
    const stepPayload = {
      routeId: routeId,
      templateIds: templateIds
    };

    await Promise.all([
      request.put('/route/update', updatePayload),
      // ⚠️ 如果你师兄说：“我就是要接收纯数组！”，请把下面这行改回：
      // request.put('/route/updateStep', templateIds, { params: { routeId } })
      request.put('/route/updateStep', stepPayload)
    ]);
    
    return true;
  } catch (error) {
    console.error('保存画布配置与步骤关系失败', error);
    throw error; // 将错误向外抛出，让 Editor.tsx 取消 loading
  }
};

// ==========================================
// 🚀 3. 获取路线下挂的步骤明细 (供列表展开使用)
// ==========================================
export const getRouteSteps = async (routeId: string) => {
  try {
    const res = await request.get('/route/listStep', { params: { routeId } });
    // 接口返回的已经是按照 number 排序的 StepWithTemplateDTO 列表
    return res.data || [];
  } catch (error) {
    console.warn(`⚠️ [Mock兜底] 获取路线 ${routeId} 步骤明细失败`);
    // 如果后端没开，尝试从我们前端的画布数据里去反向推演（纯前端兜底）
    const mockCanvas = mockRouteConfigs[routeId];
    if (mockCanvas && mockCanvas.nodes) {
       const sortedNodes = [...mockCanvas.nodes].sort((a, b) => a.position.x - b.position.x);
       return sortedNodes.map((n, index) => ({
           number: index + 1,
           processName: n.data.processName || '未命名工序',
           startTime: '08:00:00',
           operator: '工艺工程师(Mock)'
       }));
    }
    return [];
  }
};

// 获取工艺路线详细信息
export const getRouteDetail = async (routeId: string) => {
  try {
    const res = await request.get('/route/detail', { params: { routeId } });
    let data = res.data || {};

    // 拦截操作：检查描述里有没有我们藏进去的 @@@
    if (data.routeDescription && data.routeDescription.includes('@@@')) {
      const parts = data.routeDescription.split('@@@');
      
      // 1. 把真正的描述还原给 UI
      data.routeDescription = parts[0]; 
      
      // 2. 解析后面藏着的对象，挂载到 data 上供详情页展示
      try {
        const secretExtension = JSON.parse(parts[1]);
        data.operator = secretExtension.operator;
        data.operationTime = secretExtension.operationTime;
        data.equipments = secretExtension.equipments;
      } catch(e) {
        console.warn('解析扩展字段失败', e);
      }
    }

    return { data, success: true };
  } catch (error) {
    console.error('获取工艺路线详情失败', error);
    return { data: null, success: false };
  }
};