// src/pages/Dashboard/service.ts
import request from '@/utils/request';

export interface DashboardStats {
  deviceTotal: number;
  deviceRunning: number;
  deviceInstalling: number; 
  deviceIdle: number;
  materialTotal: number; // 🌟 1. 改为物料总数 (原来是 materialWarningCount)
  routeTotal: number; 
}

export const queryDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [deviceRes, materialRes, routeRes] = await Promise.all([
      request.post('/device/list', { pageNum: 1, pageSize: 1000 }),
      request.post('/material/list', { pageNum: 1, pageSize: 1000 }),
      request.get('/route/list', { params: { pageNum: 1, pageSize: 1000 } })
    ]);

    const deviceList = deviceRes.data || [];
    const materialList = materialRes.data || [];
    const routeList = routeRes.data || [];

    let running = 0;
    let installing = 0; 
    let idle = 0;

    deviceList.forEach((device: any) => {
      const status = device.deviceStatus;
      if (status === 'RUNNING' || status === '运行中') {
        running++;
      } else if (status === 'INSTALLING' || status === '安装调试') { 
        installing++;
      } else {
        idle++;
      }
    });

    return {
      deviceTotal: deviceList.length,
      deviceRunning: running,
      deviceInstalling: installing, 
      deviceIdle: idle,
      materialTotal: materialList.length, // 🌟 2. 直接统计数组长度作为总数
      routeTotal: routeList.length,
    };
  } catch (error) {
    console.error('获取 Dashboard 统计数据失败', error);
    return {
      deviceTotal: 0, deviceRunning: 0, deviceInstalling: 0, deviceIdle: 0,
      materialTotal: 0, routeTotal: 0,
    };
  }
};