import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { 
  RobotOutlined, 
  CloseOutlined, 
  SendOutlined, 
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';
import request from '../../utils/request';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      role: 'ai',
      text: '您好！我是智汇小工，您的生产智能助手。请问有什么可以帮您？（例如：查询设备的状态）'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    const newMsgId = `msg-${Date.now()}`;
    
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await request.post('/mcp', 
        { prompt: userMsg }, 
        { timeout: 60000 }
      );
      const aiReply = res.data || '未获取到有效的回复内容。';
      setMessages(prev => [...prev, { id: `msg-ai-${Date.now()}`, role: 'ai', text: aiReply }]);
    } catch (error) {
      console.error('AI 接口通信异常:', error);
      setMessages(prev => [...prev, {
        id: `msg-ai-err-${Date.now()}`,
        role: 'ai',
        text: '智汇助手暂时无法连接，可能是由于网络抖动或模型思考超时，请稍后再试。'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* 打字动画样式 */}
      <style>
        {`
          .typing-indicator { display: flex; align-items: center; justify-content: center; height: 20px; gap: 4px; }
          .typing-dot { width: 6px; height: 6px; background-color: #13c2c2; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
          .typing-dot:nth-child(1) { animation-delay: -0.32s; }
          .typing-dot:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        `}
      </style>

      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}>
        
        {isOpen && (
          <div ref={chatWindowRef} style={{
            width: 480,       // 🚀 核心放大：从 380 变为 480，提供极佳的阅读视野
            height: '70vh',   // 🚀 核心放大：高度自适应屏幕的 70%
            minHeight: 560,   // 保底高度
            maxHeight: 800,   // 上限高度
            backgroundColor: '#fff',
            borderRadius: 12,
            boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)'
          }}>
            {/* 头部区 */}
            <div style={{
              height: 60, // 稍微拉高一点头部，比例更协调
              backgroundColor: '#13c2c2',
              padding: '0 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff'
            }}>
              <Space size="middle">
                <RobotOutlined style={{ fontSize: 24 }} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 1 }}>智汇智能助手</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>已连接大模型协同中枢</div>
                </div>
              </Space>
              <Button 
                type="text" 
                icon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />} 
                onClick={() => setIsOpen(false)}
                style={{ right: -8 }} 
              />
            </div>

            {/* 消息区 */}
            <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
              {messages.map((msg) => {
                const isAi = msg.role === 'ai';
                return (
                  <div key={msg.id} style={{ 
                    display: 'flex', 
                    flexDirection: isAi ? 'row' : 'row-reverse',
                    marginBottom: 24,
                    alignItems: 'flex-start'
                  }}>
                    {/* 头像 */}
                    <div style={{ 
                      width: 38, 
                      height: 38, 
                      borderRadius: 19, 
                      backgroundColor: isAi ? '#fff' : '#1677FF',
                      border: isAi ? '1px solid #e8e8e8' : 'none',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: isAi ? '0 12px 0 0' : '0 0 0 12px',
                      color: isAi ? '#13c2c2' : '#fff',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      {isAi ? <RobotOutlined style={{ fontSize: 20 }}/> : <UserOutlined style={{ fontSize: 18 }}/>}
                    </div>

                    {/* 气泡 */}
                    <div style={{
                      maxWidth: '82%', // 🚀 给气泡更多的可用宽度
                      padding: '12px 18px',
                      backgroundColor: isAi ? '#fff' : '#e6f4ff',
                      border: isAi ? '1px solid #f0f0f0' : '1px solid #91caff',
                      borderRadius: isAi ? '2px 16px 16px 16px' : '16px 2px 16px 16px',
                      color: '#333',
                      fontSize: 14,
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      {isAi ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            p: ({node, ...props}) => <p style={{ margin: 0, marginBottom: 4 }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            ul: ({node, ...props}) => <ul style={{ paddingLeft: 20, margin: '6px 0' }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            ol: ({node, ...props}) => <ol style={{ paddingLeft: 20, margin: '6px 0' }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
                            // 表格样式
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            table: ({node, ...props}) => (
                              <div style={{ overflowX: 'auto', margin: '12px 0', paddingBottom: 4 }}>
                                <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 13 }} {...props} />
                              </div>
                            ),
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            th: ({node, ...props}) => (
                              <th style={{ border: '1px solid #e8e8e8', padding: '8px 14px', backgroundColor: '#fafafa', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }} {...props} />
                            ),
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            td: ({node, ...props}) => (
                              <td style={{ border: '1px solid #e8e8e8', padding: '8px 14px', whiteSpace: 'nowrap' }} {...props} />
                            )
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div style={{ display: 'flex', marginBottom: 24, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 12px 0 0', color: '#13c2c2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <RobotOutlined style={{ fontSize: 20 }}/>
                  </div>
                  <div style={{ padding: '14px 20px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '2px 16px 16px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                     <div className="typing-indicator">
                       <span className="typing-dot"></span>
                       <span className="typing-dot"></span>
                       <span className="typing-dot"></span>
                     </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 底部输入区 */}
            <div style={{ padding: '16px 20px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Input
                  placeholder="询问生产排期、设备参数或工艺..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={handleSend}
                  disabled={isTyping}
                  variant="filled" 
                  style={{ borderRadius: 24, paddingLeft: 18, height: 44, fontSize: 15 }} // 输入框更加丰满
                />
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<SendOutlined style={{ marginLeft: -2 }}/>} 
                  onClick={handleSend}
                  loading={isTyping}
                  style={{ width: 44, height: 44, backgroundColor: '#13c2c2', border: 'none', flexShrink: 0 }}
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                 <Text type="secondary" style={{ fontSize: 12 }}>AI 生成内容仅供参考，请核实后操作</Text>
              </div>
            </div>
          </div>
        )}

        {/* 悬浮按钮 */}
        {!isOpen && (
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined style={{ fontSize: 24 }} />}
            onClick={() => setIsOpen(true)}
            style={{
              width: 64, // 按钮也顺便放大了几像素，显得更有呼吸感
              height: 64,
              backgroundColor: '#13c2c2',
              border: 'none',
              boxShadow: '0 8px 24px rgba(19, 194, 194, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        )}
      </div>
    </>
  );
};

export default ChatBot;