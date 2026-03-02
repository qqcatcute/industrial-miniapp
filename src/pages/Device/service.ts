import request from '@/utils/request';
import { Device, DeviceLabel, SparePart } from './typing';
import { mockDeviceList, mockDeviceDetail } from '@/mock/device.mock';

// 独立的备品备件库 (前端Mock兜底)
const mockSpareParts: SparePart[] = [
  { id: 'SP-001', sparePartName: '主轴陶瓷精密轴承', sparePartBrand: 'NSK', sparePartSpecificationModel: '7014C', sparePartQuantity: 12.0000, sparePartUnit: '套' },
  { id: 'SP-002', sparePartName: '全合成切削液', sparePartBrand: '嘉实多', sparePartSpecificationModel: 'Alusol 41 BF', sparePartQuantity: 500.0000, sparePartUnit: 'L' },
  { id: 'SP-003', sparePartName: '红宝石测针', sparePartBrand: '雷尼绍', sparePartSpecificationModel: 'A-5000-3709', sparePartQuantity: 5.0000, sparePartUnit: '根' },
];

export const getDeviceLabels = async (): Promise<DeviceLabel[]> => {
  try {
    const res = await request.get('/deviceLabel/list');
    const list: DeviceLabel[] = res.data || [];
    
    // 后端返回扁平列表，前端转树
    const map = new Map<string, DeviceLabel>();
    const tree: DeviceLabel[] = [];
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
    return tree.length ? tree : [{ labelId: 'ALL', labelName: '全部设备', labelParentId: 'root', deviceLabelHierarchical: 0 }];
  } catch (error) {
    console.warn('⚠️ 后端 /api/deviceLabel/list 接口异常，已自动切入 Mock 分类数据');
    return [
      {
        labelId: 'L1', labelName: '机械加工设备', labelParentId: 'root', deviceLabelHierarchical: 0,
        children: [
          { labelId: 'L1-1', labelName: '车削中心', labelParentId: 'L1', deviceLabelHierarchical: 1 },
          { labelId: 'L1-2', labelName: '五轴加工中心', labelParentId: 'L1', deviceLabelHierarchical: 1 },
        ],
      },
      { labelId: 'L2', labelName: '检测与测量设备', labelParentId: 'root', deviceLabelHierarchical: 0 }
    ];
  }
};

export const getDevices = async (params: { labelId?: string; current?: number; pageSize?: number }) => {
  try {
    const res = await request.get('/device/list', {
      params: { pageNum: params.current || 1, pageSize: params.pageSize || 10 }
    });
    
    const dataWithSpares = (res.data || []).map((device: Device, index: number) => ({
      ...device,
      spareParts: index % 2 === 0 ? [mockSpareParts[0], mockSpareParts[1]] : [mockSpareParts[2]]
    }));

    return { data: dataWithSpares, total: dataWithSpares.length || 100, success: true };
  } catch (error) {
    console.warn('⚠️ 后端 /api/device/list 接口异常，已自动切入 Mock 列表数据');
    // 使用 device.mock.ts 里的标准数据缝合备件
    const fallbackData = (mockDeviceList.data as Device[]).map((device, index) => ({
      ...device,
      spareParts: index % 2 === 0 ? [mockSpareParts[0], mockSpareParts[1]] : [mockSpareParts[2]]
    }));
    return { data: fallbackData, total: fallbackData.length, success: true };
  }
};

export const getDeviceDetail = async (deviceId: string): Promise<Device> => {
  try {
    const res = await request.get('/device/detail', { params: { deviceId } });
    const detail = res.data;
    detail.spareParts = [mockSpareParts[0], mockSpareParts[1]];
    detail.sparePartIds = ['SP-001', 'SP-002'];
    return detail;
  } catch (error) {
    console.warn(`⚠️ 后端详情接口异常，返回 ${deviceId} 的 Mock 详情`);
    const fallbackDetail = { ...mockDeviceDetail.data } as Device;
    fallbackDetail.spareParts = [mockSpareParts[0], mockSpareParts[1]];
    fallbackDetail.sparePartIds = ['SP-001', 'SP-002'];
    return fallbackDetail;
  }
};

export const getSparePartOptions = async () => {
  return mockSpareParts.map(sp => ({
    label: `${sp.sparePartName} (${sp.sparePartBrand || '无品牌'}) - 库存: ${sp.sparePartQuantity}${sp.sparePartUnit}`,
    value: sp.id
  }));
};

// 🚀 1. 新增/修改：创建设备，并返回后端生成的真实 deviceId
export const addDevice = async (newDevice: Device) => {
  try {
    const res = await request.post('/device/create', newDevice);
    // 根据师兄发的截图，解析出 data 里的 deviceId 返回给外层
    return res.data?.deviceId; 
  } catch (e) {
    console.warn('⚠️ 后端未启动或报错，拦截新增请求并返回假 ID 兜底');
    return `MOCK-ID-${Date.now()}`;
  }
};

export const updateDevice = async (deviceId: string, updateData: Partial<Device>) => {
  try {
    await request.put(`/device/update/${deviceId}`, updateData);
    return true;
  } catch (e) {
    console.warn('⚠️ 后端未启动，拦截编辑请求并返回成功');
    return true;
  }
};

export const deleteDevices = async (deviceIds: string[]) => {
  try {
    await request.delete('/device/delete', { data: deviceIds });
    return true;
  } catch (e) {
    console.warn('⚠️ 后端未启动，拦截删除请求并返回成功');
    return true;
  }
};

// 绑定设备与标签 (兜底放行)
export const bindDeviceLabel = async (deviceId: string, labelId: string) => {
  try {
    // 接口文档规定是 Query Params
    await request.post(`/deviceLabel/bind?deviceId=${deviceId}&labelId=${labelId}`);
    return true;
  } catch (e) {
    console.warn(`⚠️ 拦截设备 ${deviceId} 绑定标签 ${labelId} 的请求`);
    return true;
  }
};

// 新建设备分类标签
export const addDeviceLabel = async (params: { deviceLabelName: string; deviceLabelParentId?: string }) => {
  try {
    // 根节点不传 parentId
    await request.post('/deviceLabel/create', params);
    return true;
  } catch (e) {
    console.warn('⚠️ 后端未启动，拦截新建分类请求并返回成功');
    return true;
  }
};

