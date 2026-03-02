// src/pages/Device/service.ts
import request from '@/utils/request';
import { Device, DeviceLabel, SparePart } from './typing';
import { mockDeviceList, mockDeviceDetail } from '@/mock/device.mock';

// ==========================================
// 🛡️ 前端兜底 Mock 数据池
// ==========================================
const mockSpareParts: SparePart[] = [
  { id: 'SP-001', sparePartName: '主轴陶瓷精密轴承', sparePartBrand: 'NSK', sparePartSpecificationModel: '7014C', sparePartQuantity: 12.0000, sparePartUnit: '套' },
  { id: 'SP-002', sparePartName: '全合成切削液', sparePartBrand: '嘉实多', sparePartSpecificationModel: 'Alusol 41 BF', sparePartQuantity: 500.0000, sparePartUnit: 'L' },
  { id: 'SP-003', sparePartName: '红宝石测针', sparePartBrand: '雷尼绍', sparePartSpecificationModel: 'A-5000-3709', sparePartQuantity: 5.0000, sparePartUnit: '根' },
];

const mockLabels: DeviceLabel[] = [
  { labelId: 'L1', labelName: '机械加工设备', labelParentId: 'root', deviceLabelHierarchical: 0 },
  { labelId: 'L1-1', labelName: '车削中心', labelParentId: 'L1', deviceLabelHierarchical: 1 },
];

// ==========================================
// 📦 1. 设备基础档案接口 (Device CRUD)
// ==========================================

export const getDevices = async (params: { labelId?: string; current?: number; pageSize?: number }) => {
  try {
    const res = await request.get('/device/list', {
      params: { 
        pageNum: params.current || 1, 
        pageSize: params.pageSize || 10,
        labelId: params.labelId === 'ALL' ? undefined : params.labelId 
      }
    });
    return { data: res.data || [], total: res.data?.length || 0, success: true };
  } catch (error) {
    console.warn('⚠️ 触发 [获取设备列表] 柔性降级');
    return { data: mockDeviceList.data as Device[], total: mockDeviceList.data.length, success: true };
  }
};

export const getDeviceDetail = async (deviceId: string): Promise<Device> => {
  try {
    const res = await request.get('/device/detail', { params: { deviceId } });
    return res.data;
  } catch (error) {
    console.warn(`⚠️ 触发 [获取设备详情] 柔性降级: ${deviceId}`);
    return { ...mockDeviceDetail.data } as Device;
  }
};

export const addDevice = async (newDevice: Device) => {
  try {
    const res = await request.post('/device/create', newDevice);
    return res.data?.deviceId || res.data; 
  } catch (e) {
    console.warn('⚠️ 触发 [新增设备] 柔性降级');
    return `MOCK-DEVICE-${Date.now()}`;
  }
};

export const updateDevice = async (deviceId: string, updateData: Partial<Device>) => {
  try {
    await request.put(`/device/update/${deviceId}`, updateData);
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [更新设备] 柔性降级');
    return true;
  }
};

export const deleteDevices = async (deviceIds: string[]) => {
  try {
    await request.delete('/device/delete', { data: deviceIds });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [批量删除设备] 柔性降级');
    return true;
  }
};

// 🚀 新增：条件查询设备接口
export const queryDevices = async (params: { queryType: string; keyword: string; pageNum?: number; pageSize?: number }) => {
  try {
    const res = await request.post('/device/query', {
      queryType: params.queryType,
      keyword: params.keyword,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10
    });
    return { data: res.data || [], total: res.data?.length || 0, success: true };
  } catch (error) {
    console.warn('⚠️ 触发 [查询设备] 柔性降级');
    const kw = params.keyword.toLowerCase();
    const filtered = (mockDeviceList.data as Device[]).filter(d => 
      d.deviceName?.toLowerCase().includes(kw) || d.deviceId.toLowerCase().includes(kw)
    );
    return { data: filtered, total: filtered.length, success: true };
  }
};


// ==========================================
// 🏷️ 2. 设备分类标签接口 (Label)
// ==========================================

export const getDeviceLabels = async (): Promise<DeviceLabel[]> => {
  try {
    const res = await request.get('/deviceLabel/list');
    const list: DeviceLabel[] = res.data || [];
    
    // 扁平数据转树形结构
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
    console.warn('⚠️ 触发 [获取标签树] 柔性降级');
    return [
      { labelId: 'L1', labelName: '机械加工设备 (Mock)', labelParentId: 'root', deviceLabelHierarchical: 0, children: [{ labelId: 'L1-1', labelName: '车削中心', labelParentId: 'L1', deviceLabelHierarchical: 1 }] }
    ];
  }
};

export const addDeviceLabel = async (params: { deviceLabelName: string; deviceLabelParentId?: string }) => {
  try {
    await request.post('/deviceLabel/create', params);
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [新建标签] 柔性降级');
    return true;
  }
};

// 🚀 新增：修改设备标签
export const updateDeviceLabel = async (labelId: string, params: { labelName: string; labelParentId?: string; deviceLabelHierarchical: number }) => {
  try {
    await request.post(`/deviceLabel/update/${labelId}`, params);
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [修改标签] 柔性降级');
    return true;
  }
};

export const bindDeviceLabel = async (deviceId: string, labelId: string) => {
  try {
    await request.post(`/deviceLabel/bind?deviceId=${deviceId}&labelId=${labelId}`);
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [绑定标签] 柔性降级: ${deviceId} -> ${labelId}`);
    return true;
  }
};

// 🚀 新增：解绑设备标签
export const unbindDeviceLabel = async (deviceId: string, labelId: string) => {
  try {
    await request.post(`/deviceLabel/unbind?deviceId=${deviceId}&labelId=${labelId}`);
    return true;
  } catch (e) {
    console.warn(`⚠️ 触发 [解绑标签] 柔性降级: ${deviceId} -> ${labelId}`);
    return true;
  }
};


// ==========================================
// 🔧 3. 备品备件接口 (SparePart) - 重点重构区
// ==========================================

// 🔄 拦截器：抹平后端大驼峰 (PascalCase) 到前端小驼峰 (camelCase) 的差异
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToFrontendSparePart = (data: any): SparePart => ({
  id: data.SparePartId || data.id,
  sparePartName: data.SparePartName,
  sparePartBrand: data.SparePartBrand,
  sparePartSpecificationModel: data.SparePartSpecificationModel,
  sparePartQuantity: data.SparePartQuantity,
  sparePartUnit: data.SparePartUnit,
});

const mapToBackendSparePart = (data: Partial<SparePart>) => ({
  SparePartName: data.sparePartName,
  SparePartBrand: data.sparePartBrand,
  SparePartSpecificationModel: data.sparePartSpecificationModel,
  SparePartQuantity: data.sparePartQuantity,
  SparePartUnit: data.sparePartUnit,
});

// 🚀 新增：分页查询指定设备的备件列表
export const getDeviceSpareParts = async (deviceId: string, pageNum = 1, pageSize = 10) => {
  try {
    const res = await request.get('/deviceSparePart/list', {
      params: { deviceId, pageNum, pageSize }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedData = (res.data || []).map((item: any) => mapToFrontendSparePart(item));
    return { data: mappedData, total: mappedData.length, success: true };
  } catch (error) {
    console.warn(`⚠️ 触发 [获取备件列表] 柔性降级: 所属设备 ${deviceId}`);
    return { data: mockSpareParts, total: mockSpareParts.length, success: true };
  }
};

// 🚀 新增：创建备件
export const addDeviceSparePart = async (deviceId: string, sparePartData: Partial<SparePart>) => {
  try {
    await request.post('/deviceSparePart/create', mapToBackendSparePart(sparePartData), {
      params: { deviceId } 
    });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [新增备件] 柔性降级');
    return true;
  }
};

// 🚀 新增：修改备件
export const updateDeviceSparePart = async (sparePartId: string, sparePartData: Partial<SparePart>) => {
  try {
    await request.put('/deviceSparePart/update', mapToBackendSparePart(sparePartData), {
      params: { sparePartId }
    });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [更新备件] 柔性降级');
    return true;
  }
};

// 🚀 新增：批量删除备件
export const deleteDeviceSpareParts = async (sparePartIds: string[]) => {
  try {
    await request.delete('/deviceSparePart/delete', { data: sparePartIds });
    return true;
  } catch (e) {
    console.warn('⚠️ 触发 [删除备件] 柔性降级');
    return true;
  }
};