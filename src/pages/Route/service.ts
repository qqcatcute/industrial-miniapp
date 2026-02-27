// src/pages/Route/service.ts
import { Route, RouteStep } from './typing';
import { Node, Edge } from 'reactflow';
// 预置赛题要求的工艺路线
let mockRoutes: Route[] = [
  {
    id: 'RT-1001',
    routeName: '中心轮零件加工',
    version: '1.0',
    routeDescription: '适用于精密行星减速器中心轮的标准加工流程',
    updatedAt: '2026-02-15'
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const queryRoutes = async (params: { keyword?: string; current?: number; pageSize?: number }) => {
  await delay(300);
  let data = [...mockRoutes];
  if (params.keyword) {
    data = data.filter(item => item.routeName.includes(params.keyword!));
  }
  return {
    data,
    total: data.length,
    success: true,
  };
};

export const deleteRoute = async (id: string) => {
  await delay(300);
  mockRoutes = mockRoutes.filter(r => r.id !== id);
  return true;
};


// 模拟数据库：保存每条工艺路线的 画布节点 和 连线数据
const mockRouteConfigs: Record<string, { nodes: Node[]; edges: Edge[] }> = {};

// 保存画布配置
export const saveRouteConfig = async (routeId: string, nodes: Node[], edges: Edge[]) => {
  await delay(300);
  mockRouteConfigs[routeId] = { nodes, edges };
  return true;
};

// 获取画布配置 (给列表页展开展示用)
export const getRouteConfig = async (routeId: string) => {
  await delay(100);
  return mockRouteConfigs[routeId] || { nodes: [], edges: [] };
};