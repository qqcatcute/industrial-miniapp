// 模拟后端返回的数据结构
export interface DashboardStats {
  deviceTotal: number;
  deviceRunning: number;
  deviceFault: number;
  deviceIdle: number;
  materialWarningCount: number; // 库存不足的物料数
  routeTotal: number; // 工艺路线总数
}

export const queryDashboardStats = async (): Promise<DashboardStats> => {
  // 模拟网络延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        // 数据来源：对应 Device 实体
        deviceTotal: 124, 
        deviceRunning: 98,
        deviceFault: 4,
        deviceIdle: 22,
        
        // 数据来源：对应 Material 实体 (Quantity < Threshold)
        materialWarningCount: 15, 
        
        // 数据来源：对应 Route 实体
        routeTotal: 42,
      });
    }, 600);
  });
};