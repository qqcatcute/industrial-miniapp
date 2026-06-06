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
  // 🌟 新增：用于监听“点击外部关闭”的容器引用
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // 1. 自动滚动到最底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // 2. 🌟 新增：点击弹窗外部区域 或 按 Esc 键关闭窗口
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的区域不在 chatWindowRef 内部，则关闭
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    // 只有在窗口打开时才监听，优化性能
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
      {/* 🌟 新增：定义高级的 AI 思考跳动小圆点动画 */}
      <style>
        {`
          .typing-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 20px;
            gap: 4px;
          }
          .typing-dot {
            width: 6px;
            height: 6px;
            background-color: #13c2c2;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          .typing-dot:nth-child(1) { animation-delay: -0.32s; }
          .typing-dot:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
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
          // 🌟 绑定 ref，用于判定点击区域
          <div ref={chatWindowRef} style={{
            width: 380, // 稍微加宽一点，让文本排版更透气
            height: 560,
            backgroundColor: '#fff',
            borderRadius: 12, // 更大的圆角，更现代
            boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)', // 更深邃高级的弥散阴影
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)' // 加入展开时的平滑过渡感
          }}>
            {/* 头部区 */}
            <div style={{
              height: 56,
              backgroundColor: '#13c2c2',
              padding: '0 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff'
            }}>
              <Space size="middle">
                <RobotOutlined style={{ fontSize: 22 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>智汇智能助手</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>已连接大模型</div>
                </div>
              </Space>
              <Button 
                type="text" 
                icon={<CloseOutlined style={{ color: '#fff', fontSize: 16 }} />} 
                onClick={() => setIsOpen(false)}
                style={{ right: -8 }} // 视觉修正居中
              />
            </div>

            {/* 消息区 */}
            <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
              {messages.map((msg) => {
                const isAi = msg.role === 'ai';
                return (
                  <div key={msg.id} style={{ 
                    display: 'flex', 
                    flexDirection: isAi ? 'row' : 'row-reverse',
                    marginBottom: 20,
                    alignItems: 'flex-start'
                  }}>
                    {/* 头像 */}
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 18, // 圆形头像显得更柔和亲切
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
                      {isAi ? <RobotOutlined style={{ fontSize: 18 }}/> : <UserOutlined style={{ fontSize: 16 }}/>}
                    </div>

                    {/* 气泡 */}
                    <div style={{
                      maxWidth: '78%',
                      padding: '12px 16px',
                      backgroundColor: isAi ? '#fff' : '#e6f4ff',
                      border: isAi ? '1px solid #f0f0f0' : '1px solid #91caff',
                      // 不同角色使用不同的单侧直角视觉语言
                      borderRadius: isAi ? '2px 16px 16px 16px' : '16px 2px 16px 16px',
                      color: '#333',
                      fontSize: 14,
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      {isAi ? (
                        <ReactMarkdown 
                          components={{
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            ul: ({node, ...props}) => <ul style={{ paddingLeft: 20, margin: '4px 0' }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            ol: ({node, ...props}) => <ol style={{ paddingLeft: 20, margin: '4px 0' }} {...props} />,
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            li: ({node, ...props}) => <li style={{ marginBottom: 2 }} {...props} />
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
              
              {/* 🌟 替换：使用高级的波浪圆点动画 */}
              {isTyping && (
                <div style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 12px 0 0', color: '#13c2c2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <RobotOutlined style={{ fontSize: 18 }}/>
                  </div>
                  <div style={{ padding: '14px 18px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '2px 16px 16px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
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
            <div style={{ padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Input
                  placeholder="询问设备状态、参数或工艺..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={handleSend}
                  disabled={isTyping}
                  variant="filled" // 使用更现代的填充态输入框
                  style={{ borderRadius: 20, paddingLeft: 16 }}
                />
                <Button 
                  type="primary" 
                  shape="circle" // 改为纯圆形发送按钮
                  icon={<SendOutlined style={{ marginLeft: -2 }}/>} // 图标微调居中
                  onClick={handleSend}
                  loading={isTyping}
                  size="large"
                  style={{ backgroundColor: '#13c2c2', border: 'none', flexShrink: 0 }}
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
            icon={<MessageOutlined style={{ fontSize: 22 }} />}
            onClick={() => setIsOpen(true)}
            style={{
              width: 60,
              height: 60,
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