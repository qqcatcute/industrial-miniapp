import { create } from 'zustand';

// 定义全局状态接口
interface GlobalState {
  currentFactory: string; // 当前工厂名称
  isCompactMode: boolean; // 是否紧凑模式
  setFactory: (name: string) => void;
  toggleCompactMode: () => void;
}

// 创建 Store
export const useGlobalStore = create<GlobalState>((set) => ({
  currentFactory: '第一精密加工车间', // 默认上下文
  isCompactMode: true,
  setFactory: (name) => set({ currentFactory: name }),
  toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),
}));