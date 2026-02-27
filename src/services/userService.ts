// 定义用户数据接口（按照 xDM-F 可能的返回结构设计）
export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'operator';
  department?: string;
}

// 模拟异步请求
export const queryCurrentUser = async (): Promise<CurrentUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'user-001',
        name: 'Admin', // 赛题要求的用户名
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', // 赛题要求的头像
        role: 'admin',
        department: '生产管理部',
      });
    }, 500); // 模拟网络延迟
  });
};