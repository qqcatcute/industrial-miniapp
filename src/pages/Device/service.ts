// src/pages/Device/service.ts
import { Device, DeviceLabel, SparePart } from './typing';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 独立的备品备件库 (模拟数据库 SparePart 表)
const mockSpareParts: SparePart[] = [
  { id: 'SP-001', sparePartName: '主轴陶瓷精密轴承', sparePartBrand: 'NSK', sparePartSpecificationModel: '7014C', sparePartQuantity: 12.0000, sparePartUnit: '套' },
  { id: 'SP-002', sparePartName: '全合成切削液', sparePartBrand: '嘉实多 (Castrol)', sparePartSpecificationModel: 'Alusol 41 BF', sparePartQuantity: 500.0000, sparePartUnit: 'L' },
  { id: 'SP-003', sparePartName: '红宝石测针', sparePartBrand: '雷尼绍 (Renishaw)', sparePartSpecificationModel: 'A-5000-3709', sparePartQuantity: 5.0000, sparePartUnit: '根' },
];

let mockDeviceData: Device[] = [
  {
    id: 'EQ-CNC-2026-001',
    deviceName: '卧式五轴加工中心',
    deviceManufacturer: '马扎克 (Mazak)',
    deviceBrand: 'Mazak',
    deviceSpecificationModel: 'HCN-6800',
    deviceSupplier: '马扎克(中国)有限公司',
    deviceManufactureDate: '2025-05-12',
    deviceServiceLife: 10.0,
    deviceDepreciation: '年限平均法',
    deviceLocation: '第一机加车间-A区',
    deviceStatus: '运行中',
    deviceDescription: '用于精密中心轮零件的切削加工，需定期检查主轴轴承状态。',
    
    // 🚀 模拟设备手册后端的真实 URL
    deviceManualUrl: 'https://dummyimage.com/HCN-6800_Manual.pdf',
    
    // 🚀 模拟分类标签的关联数据 (这台机器属于"五轴加工中心" L1-1)
    labelIds: ['L1-1'],
    labels: [
      { id: 'L1-1', deviceLabelName: '五轴加工中心' }
    ],

    // 🚀 模拟 Antd 组件要求的文件列表状态回显
    deviceManual: [
      {
        uid: '-1',
        name: 'HCN-6800_操作手册.pdf',
        status: 'done',
        url: 'https://dummyimage.com/HCN-6800_Manual.pdf', // 点击直接预览
      },
    ],

    deviceParameter: {
      '主轴最高转速': '10000 rpm',
      'X轴行程': '1050 mm'
    },
    spareParts: [mockSpareParts[0], mockSpareParts[1]],
    sparePartIds: ['SP-001', 'SP-002']
  },
  {
    id: 'EQ-CMM-2026-002',
    deviceName: '高精度三坐标测量机',
    deviceManufacturer: '海克斯康 (Hexagon)',
    deviceBrand: 'Hexagon',
    deviceSpecificationModel: 'GLOBAL S 09.15.08',
    deviceSupplier: '海克斯康测量系统',
    deviceManufactureDate: '2024-11-20',
    deviceServiceLife: 8.0,
    deviceDepreciation: '双倍余额递减法',
    deviceLocation: '恒温检测室-01',
    deviceStatus: '闲置',
    deviceParameter: {
      '测量范围(X/Y/Z)': '900/1500/800 mm'
    },
    spareParts: [mockSpareParts[2]],
    sparePartIds: ['SP-003']
  }
];

export const getDeviceLabels = async (): Promise<DeviceLabel[]> => {
  await delay(300);
  return [
    {
      id: 'L1', deviceLabelName: '机械加工设备', deviceLabelParent: 'NULL', deviceLabelHierarchical: 0,
      children: [
        { id: 'L1-1', deviceLabelName: '车削中心', deviceLabelParent: 'L1', deviceLabelHierarchical: 1 },
        { id: 'L1-2', deviceLabelName: '五轴加工中心', deviceLabelParent: 'L1', deviceLabelHierarchical: 1 },
      ],
    },
    { id: 'L2', deviceLabelName: '检测与测量设备', deviceLabelParent: 'NULL', deviceLabelHierarchical: 0 }
  ];
};

export const getDevices = async (params: { labelId?: string; keyword?: string; current?: number; pageSize?: number }) => {
  await delay(300);
  return {
    data: mockDeviceData,
    total: mockDeviceData.length,
    success: true,
  };
};

export const getSparePartOptions = async () => {
  await delay(200);
  return mockSpareParts.map(sp => ({
    label: `${sp.sparePartName} (${sp.sparePartBrand || '无品牌'}) - 库存: ${sp.sparePartQuantity}${sp.sparePartUnit}`,
    value: sp.id
  }));
};

export const addDevice = async (newDevice: Device) => {
  await delay(500); 
  if (newDevice.sparePartIds && newDevice.sparePartIds.length > 0) {
    newDevice.spareParts = mockSpareParts.filter(sp => newDevice.sparePartIds?.includes(sp.id));
  }
  mockDeviceData = [newDevice, ...mockDeviceData]; 
  return true;
};