import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Spin, Typography } from 'antd';
import { 
  RobotOutlined, 
  CloseOutlined, 
  SendOutlined, 
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 预设一条 AI 的开场白
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      role: 'ai',
      text: '您好！我是智汇小工，您的生产智能助手。请问有什么可以帮您？（例如：查询设备的状态）'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 每次消息更新时，自动滚动到最底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    const newMsgId = `msg-${Date.now()}`;
    
    // 1. 添加用户消息
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    // 2. 模拟网络请求与 AI 思考时间
    setTimeout(() => {
      let aiReply = '作为一个智能生产助手，我还在持续学习中。您可以尝试询问我关于特定设备的状态或维修记录。';
      
      // 触发预设问答逻辑：识别到 "设备" 或特定编号
      if (userMsg.includes('设备') || userMsg.includes('EQ-CNC-2026-001') || userMsg.includes('状态')) {
        aiReply = '为您查到：规格型号为HCN-6800的设备卧式五轴加工中心当前状态为【运行中】，品牌为马扎克，位置为1号厂房-A区恒温车间。用于精密行星减速器箱体、行星架的高精度加工，支持柔性制造系统联动。';
      }

      setMessages(prev => [...prev, { id: `msg-ai-${Date.now()}`, role: 'ai', text: aiReply }]);
      setIsTyping(false);
    }, 1500); // 延迟 1.5 秒显得真实一点
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 9999, // 确保浮在最上层
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}>
      {/* 展开后的聊天窗口 */}
      {isOpen && (
        <div style={{
          width: 360,
          height: 520,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }}>
          {/* 头部标题区 */}
          <div style={{
            height: 48,
            backgroundColor: '#13c2c2', // 契合智汇工软的主题色
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff'
          }}>
            <Space>
              <RobotOutlined style={{ fontSize: 18 }} />
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>智汇智能助手</span>
            </Space>
            <Button 
              type="text" 
              icon={<CloseOutlined style={{ color: '#fff' }} />} 
              size="small"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* 聊天消息区 */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#F5F7FA' }}>
            {messages.map((msg) => {
              const isAi = msg.role === 'ai';
              return (
                <div key={msg.id} style={{ 
                  display: 'flex', 
                  flexDirection: isAi ? 'row' : 'row-reverse',
                  marginBottom: 16,
                  alignItems: 'flex-start'
                }}>
                  {/* 头像 */}
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 4, 
                    backgroundColor: isAi ? '#fff' : '#1677FF',
                    border: isAi ? '1px solid #e8e8e8' : 'none',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: isAi ? '0 12px 0 0' : '0 0 0 12px',
                    color: isAi ? '#13c2c2' : '#fff',
                    flexShrink: 0
                  }}>
                    {isAi ? <RobotOutlined /> : <UserOutlined />}
                  </div>

                  {/* 气泡框 */}
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    backgroundColor: isAi ? '#fff' : '#e6f4ff',
                    border: isAi ? '1px solid #e8e8e8' : '1px solid #91caff',
                    borderRadius: 4,
                    color: '#333',
                    fontSize: 13,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {/* 加载动画：AI 正在输入 */}
            {isTyping && (
              <div style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: '#fff', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 12px 0 0', color: '#13c2c2' }}>
                  <RobotOutlined />
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#fff', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                   <Spin size="small" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区 */}
          <div style={{ padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="询问设备状态、参数或工艺..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                disabled={isTyping}
                style={{ borderRadius: 2 }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                loading={isTyping}
                style={{ borderRadius: 2, backgroundColor: '#13c2c2', boxShadow: 'none' }}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
               <Text type="secondary" style={{ fontSize: 11 }}>AI 生成内容仅供参考，请核实后操作</Text>
            </div>
          </div>
        </div>
      )}

      {/* 悬浮圆形按钮 */}
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: 20 }} />}
          onClick={() => setIsOpen(true)}
          style={{
            width: 56,
            height: 56,
            backgroundColor: '#13c2c2', // 科技青主色调
            border: 'none',
            boxShadow: '0 8px 20px rgba(19, 194, 194, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}
    </div>
  );
};

export default ChatBot;