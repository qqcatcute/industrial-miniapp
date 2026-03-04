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
    // 🚀 核心修改：直接使用 request.post，Axios 会自动把第二个参数放进 Body
    const res = await request.post('/device/list', {
      pageNum: params.current || 1, 
      pageSize: params.pageSize || 10,
      labelId: params.labelId === 'ALL' ? undefined : params.labelId 
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
    // 🚀 1. 优雅解构：剥离出 deviceId，把剩下的所有属性装进 payload，完美避开 delete 报错
    const { deviceId, ...payload } = newDevice; 
    
    // 🚀 2. 声明 res 类型为 any，接管 Axios 默认推断，并在请求体中传入剥离后的 payload
    const res: any = await request.post('/device/create', payload);
    
    // 🚀 3. 根据接口文档，成功时返回的结构包含 data.deviceId
    return res.data?.deviceId || res.data; 
  } catch (error) {
    // 🚀 4. 将 e 改为 error 并打印出来，消除 unused 警告，也方便排查问题
    console.warn('⚠️ 触发 [新增设备] 柔性降级', error);
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


export const updateDeviceLabel = async (labelId: string, params: { deviceLabelName: string; labelParentId?: string; deviceLabelHierarchical: number }) => {
  try {
    // 💡 修复：将 labelId 也放入请求体，同时迎合后端真实的字段名 deviceLabelName
    await request.post(`/deviceLabel/update/${labelId}`, {
      labelId: labelId,
      ...params
    });
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
// 🔄 拦截器：抹平后端大驼峰到前端小驼峰的差异，同时接收所有扩展字段
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToFrontendSparePart = (data: any): SparePart => {
  // 💡 核心修复 1：海纳百川，兼容后端返回的各种奇葩 ID 命名
  const actualId = data.sparePartId || data.SparePartId || data.id; 
  
  return {
    id: actualId, // 必须有 id，Antd 的 Table rowKey 强依赖它
    sparePartName: data.sparePartName || data.SparePartName,
    sparePartBrand: data.sparePartBrand || data.SparePartBrand,
    sparePartSpecificationModel: data.sparePartSpecificationModel || data.SparePartSpecificationModel,
    sparePartQuantity: data.sparePartQuantity || data.SparePartQuantity,
    sparePartUnit: data.sparePartUnit || data.SparePartUnit,
    sparePartPrice: data.sparePartPrice || data.SparePartPrice || 0,
    sparePartLocation: data.sparePartLocation || data.SparePartLocation || '默认仓库',
    sparePartSupplier: data.sparePartSupplier || data.SparePartSupplier || '默认供应商',
  };
};

// 🚀 拦截器 (后端发送)：彻底拥抱小驼峰
// 🚀 1. 纯净版拦截器：只管转换 Body 数据，不再强行塞入 ID
const mapToBackendSparePart = (data: Partial<SparePart>) => {
  return {
    sparePartName: data.sparePartName,
    sparePartBrand: data.sparePartBrand,
    sparePartSpecificationModel: data.sparePartSpecificationModel,
    sparePartQuantity: data.sparePartQuantity,
    sparePartUnit: data.sparePartUnit,
    // 保留这三个扩展字段，因为之前联调已经证实后端接收小驼峰
    sparePartPrice: data.sparePartPrice || 0,
    sparePartLocation: data.sparePartLocation || '默认仓库',
    sparePartSupplier: data.sparePartSupplier || '默认供应商',
  };
};

// 🚀 2. 恢复你原先正确的写法：deviceId 放在 params 里拼接到 URL 后面
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

// 🚀 3. 恢复你原先正确的写法：sparePartId 放在 params 里拼接到 URL 后面
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