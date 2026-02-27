// src/mock/device.mock.ts

// 模拟后端简要列表返回 (包含你要求后端加的字段)
export const mockDeviceList = {
  code: 1,
  msg: "success",
  data: [
    {
      deviceId: "EQ-CNC-2026-001",
      deviceName: "卧式五轴加工中心",
      deviceBrand: "Mazak",
      deviceStatus: "RUNNING",
      deviceLocation: "1号厂房-A区", // 你让后端加的
      deviceSpecificationModel: "HCN-6800", // 你让后端加的
    },
    {
      deviceId: "EQ-CNC-2026-002",
      deviceName: "立式加工中心",
      deviceBrand: "Siemens",
      deviceStatus: "IDLE",
      deviceLocation: "1号厂房-B区",
      deviceSpecificationModel: "VMC-850",
    }
  ]
};

// 模拟后端详情返回
export const mockDeviceDetail = {
  code: 1,
  msg: "success",
  data: {
    deviceId: "EQ-CNC-2026-001",
    deviceName: "卧式五轴加工中心",
    deviceManufacturer: "宁夏小巨人工厂",
    deviceBrand: "Mazak",
    deviceSpecificationModel: "HCN-6800",
    deviceSupplier: "上海崇明工业服务商",
    deviceManufactureDate: "2024-05-12",
    deviceLifespan: 10, // 对齐后端字段名
    deviceDepreciation: "SLM",
    deviceLocation: "1号厂房-A区",
    deviceStatus: "RUNNING",
    deviceParameter: '{"主轴转速":"18000rpm","进给速度":"60m/min"}', // 后端要求的JSON字符串
    deviceDescription: "该设备用于精密行星减速器箱体的高精度加工。"
  }
};