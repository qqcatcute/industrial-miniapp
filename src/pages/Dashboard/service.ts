// src/pages/Dashboard/service.ts
import request from '@/utils/request';

export interface DashboardStats {
  deviceTotal: number;
  deviceRunning: number;
  deviceInstalling: number; // 🌟 1. 将 deviceFault 改为 deviceInstalling
  deviceIdle: number;
  materialWarningCount: number; 
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

    // --- 1. 设备状态分布统计 ---
    let running = 0;
    let installing = 0; // 🌟 2. 更改变量名
    let idle = 0;

    deviceList.forEach((device: any) => {
      const status = device.deviceStatus;
      if (status === 'RUNNING' || status === '运行中') {
        running++;
      } else if (status === 'INSTALLING' || status === '安装调试') { // 🌟 3. 更改统计口径
        installing++;
      } else {
        // PLANNED, IDLE, SCRAPPED 统一归类为闲置/其他
        idle++;
      }
    });

    const warningCount = materialList.filter((m: any) => Number(m.materialQuantity) < 10).length;

    return {
      deviceTotal: deviceList.length,
      deviceRunning: running,
      deviceInstalling: installing, // 🌟 4. 返回新字段
      deviceIdle: idle,
      materialWarningCount: warningCount,
      routeTotal: routeList.length,
    };
  } catch (error) {
    console.error('❌ 获取 Dashboard 统计数据失败，触发降级兜底', error);
    return {
      deviceTotal: 0,
      deviceRunning: 0,
      deviceInstalling: 0, // 🌟 5. 兜底数据也同步修改
      deviceIdle: 0,
      materialWarningCount: 0,
      routeTotal: 0,
    };
  }
};