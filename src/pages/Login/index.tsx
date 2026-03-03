import React, { useState } from 'react';
import { Form, Input, Button, Tabs, message, theme, Divider, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CodeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // 获取验证码
// 获取验证码 (增加 Mock 降级)
  const handleGetCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      return message.warning('请先输入邮箱地址');
    }
    setCodeLoading(true);
    try {
      await request.get('/user/code', { params: { email } });
      message.success('验证码已发送至您的邮箱');
    } catch (error) {
      // 👇 触发 Mock 降级：假装验证码发送成功
      console.warn('⚠️ 后端未连接，触发获取验证码 Mock 降级');
      message.success('【Mock】验证码已发送，请随意输入6位数字');
    } finally {
      setCodeLoading(false);
    }
  };

  // 提交表单 (登录/注册 - 增加 Mock 降级)
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (activeTab === 'login') {
        const res = await request.post('/user/login', {
          email: values.email,
          password: values.password,
        });
        const userToken = res.data || 'mock-token-for-frontend-only';
        localStorage.setItem('authorization', userToken);
        message.success('登录成功');
        navigate('/');
      } else {
        const res = await request.post('/user/register', {
          email: values.email,
          username: values.username,
          password: values.password,
          inputCode: values.inputCode,
        });
        const userToken = res.data || 'mock-token-for-frontend-only';
        localStorage.setItem('authorization', userToken);
        message.success('注册成功，正在进入系统');
        navigate('/');
      }
    } catch (error) {
      // 👇 触发 Mock 降级：无论后端报什么错，都强制写入假 Token 并跳入首页
      console.warn('⚠️ 后端未连接，触发登录/注册 Mock 降级');
      localStorage.setItem('authorization', 'mock-token-for-frontend-only');
      message.success(`【Mock模式】${activeTab === 'login' ? '登录' : '注册'}成功`);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      /* 👇 核心视觉：改成海平面双层波浪形背景，上方纯白，下方科技青 (#13c2c2) */
      backgroundColor: '#ffffff',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400'%3E%3Cpath fill='%2313c2c2' fill-opacity='0.3' d='M0,100 C480,200, 960,0, 1440,100 L1440,400 L0,400 Z'/%3E%3Cpath fill='%2313c2c2' fill-opacity='1' d='M0,130 C480,30, 960,230, 1440,130 L1440,400 L0,400 Z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom',
      backgroundSize: '100% 45vh', // 波浪固定在底部 45% 的高度
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      
      {/* 顶部 Logo 栏 */}
      <div style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#001529', letterSpacing: 1 }}>
          <span style={{ color: '#13c2c2' }}>ZHIHUI</span> GONG RUAN
        </div>
      </div>

      {/* 中间核心区：双卡片布局 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 32, 
        padding: '0 24px',
        flexWrap: 'wrap', // 兼容小屏幕
        zIndex: 1 // 保证卡片悬浮在波浪之上
      }}>
        
        {/* 左侧卡片：产品宣传语 (参考图左侧) */}
        <div style={{
          width: 380,
          backgroundColor: '#fff',
          padding: '48px 40px',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          alignSelf: 'stretch',
          marginBottom: 32
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 16px 0', color: '#001529' }}>
              开启工业制造<br/>数字化新篇章
            </h1>
            <p style={{ color: '#595959', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              基于华为 xDM-F 数据建模引擎打造。为您提供开箱即用的精密减速器制造全生命周期管理方案。
            </p>
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase' }}>
              核心业务闭环模块
            </div>
            <Space align="start">
              <CheckCircleFilled style={{ color: '#13c2c2', marginTop: 4 }} />
              <div style={{ color: '#262626', fontSize: 14 }}>
                <strong>设备与物料管控</strong>
                <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>全品类 CNC、三坐标台账与动态 BOM 树形管理。</div>
              </div>
            </Space>
            <Space align="start">
              <CheckCircleFilled style={{ color: '#13c2c2', marginTop: 4 }} />
              <div style={{ color: '#262626', fontSize: 14 }}>
                <strong>图形化工序编排</strong>
                <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>全屏沉浸式 React Flow 画布，自由连线定义工艺路线。</div>
              </div>
            </Space>
          </div>
        </div>

        {/* 右侧卡片：登录/注册表单 (参考图右侧) */}
        <div style={{
          width: 440,
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          marginBottom: 32
        }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            tabBarStyle={{ marginBottom: 32 }}
            items={[
              { key: 'login', label: <span style={{ fontSize: 16, fontWeight: 500 }}>账 号 登 录</span> },
              { key: 'register', label: <span style={{ fontSize: 16, fontWeight: 500 }}>账 号 注 册</span> },
            ]}
          />

          <Form
            form={form}
            name="authForm"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false} // 隐藏红星，更极简
          >
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 500, color: '#595959' }}>邮箱</span>}
              rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />} 
                placeholder="请输入邮箱" 
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            {activeTab === 'register' && (
              <Form.Item
                name="username"
                label={<span style={{ fontWeight: 500, color: '#595959' }}>用户名</span>}
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />} 
                  placeholder="请输入用户名" 
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            )}

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 500, color: '#595959' }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} 
                placeholder="请输入密码" 
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            {activeTab === 'register' && (
              <Form.Item
                name="inputCode"
                label={<span style={{ fontWeight: 500, color: '#595959' }}>验证码</span>}
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <Input 
                    prefix={<SafetyCertificateOutlined style={{ color: token.colorTextQuaternary }} />} 
                    placeholder="请输入验证码" 
                    style={{ flex: 1, borderRadius: 6 }} 
                  />
                  <Button onClick={handleGetCode} loading={codeLoading} style={{ borderRadius: 6 }}>
                    获取验证码
                  </Button>
                </div>
              </Form.Item>
            )}

            <Form.Item style={{ marginTop: 32, marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ 
                height: 44,
                borderRadius: 6, 
                backgroundColor: '#13c2c2', // 科技青主色调
                boxShadow: '0 4px 10px rgba(19, 194, 194, 0.3)',
                fontSize: 16,
                fontWeight: 500
              }}>
                {activeTab === 'login' ? '登 录' : '注 册'}
              </Button>
            </Form.Item>

            {activeTab === 'login' && (
              <div style={{ textAlign: 'right' }}>
                <a style={{ color: '#13c2c2', fontSize: 13 }}>忘记密码？</a>
              </div>
            )}
          </Form>
        </div>
      </div>

      {/* 底部 Footer 声明文字 (复刻参考图底部的文字排版) */}
      <div style={{ 
        padding: '32px 48px', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 64, 
        color: 'rgba(255,255,255,0.9)', // 白色半透明文字，与底部深青色背景形成反差
        fontSize: 13,
        zIndex: 1
      }}>
        <div style={{ maxWidth: 300, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>高效管理</div>
          <div style={{ opacity: 0.8 }}>告别传统纸质台账，一键导入设备与物料，实时监控状态，大幅提升车间透明度。</div>
        </div>
        <div style={{ maxWidth: 300, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>模型驱动</div>
          <div style={{ opacity: 0.8 }}>底层对接华为 iDME 引擎，体验原生云端协同，支持海量数据高并发读写。</div>
        </div>
        <div style={{ maxWidth: 300, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>灵活拓展</div>
          <div style={{ opacity: 0.8 }}>支持动态技术参数扩展，无限层级 BOM 嵌套配置，适配各类复杂业务场景。</div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
