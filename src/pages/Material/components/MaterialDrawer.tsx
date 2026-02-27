// src/pages/Material/components/MaterialDrawer.tsx
import React, { useState, useEffect } from 'react';
import { Drawer, Tabs, Descriptions, Table, Tag, Typography, Space, Button, Modal, Form, Select, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Material, BOMNode } from '../typing';
import { getMaterials, bindBOMRelation } from '../service'; // 💡 引入获取物料和绑定BOM的接口

const { Title, Text } = Typography;

interface MaterialDrawerProps {
  visible: boolean;
  material: Material | null;
  activeTab: string; 
  onTabChange: (key: string) => void; 
  onClose: () => void;
}

const MaterialDrawer: React.FC<MaterialDrawerProps> = ({ visible, material, activeTab, onTabChange, onClose }) => {
  // 💡 新增：BOM 弹窗的状态与表单
  const [bomModalVisible, setBomModalVisible] = useState(false);
  const [bomForm] = Form.useForm();
  const [materialOptions, setMaterialOptions] = useState<{label: string, value: string}[]>([]);

  // 💡 每次打开弹窗时，拉取最新的物料列表供下拉框选择
  useEffect(() => {
    if (bomModalVisible) {
      getMaterials().then(data => {
        // 过滤掉自己，防止自己绑定自己产生死循环
        const options = data
          .filter(item => item.id !== material?.id)
          .map(item => ({
            label: `${item.materialName} (${item.id})`,
            value: item.id
          }));
        setMaterialOptions(options);
      });
    }
  }, [bomModalVisible, material?.id]);

  if (!material) return null;

  // 💡 提交绑定 BOM
  const handleAddBOM = async () => {
    try {
      const values = await bomForm.validateFields();
      const success = await bindBOMRelation({
        parentId: material.id,
        bomNodes: [{
          childId: values.childId,
          usageQuantity: values.usageQuantity,
          lossRate: values.lossRate || 0
        }]
      });
      
      if (success) {
        message.success('BOM 子件添加成功！');
        setBomModalVisible(false);
        bomForm.resetFields();
        // TODO: 这里在真实对接时，应该重新调用获取 BOM 树的接口刷新当前抽屉数据
      }
    } catch (error) {
      console.error('BOM 校验失败:', error);
    }
  };

  const bomColumns = [
    {
      title: '子件名称',
      dataIndex: 'materialName',
      key: 'materialName',
      render: (text: string, record: BOMNode) => (
        <Space>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>({record.id})</Text>
        </Space>
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'materialSpecificationModel',
      key: 'materialSpecificationModel',
    },
    {
      title: '用量',
      dataIndex: 'usageQuantity',
      key: 'usageQuantity',
      render: (val: number, record: BOMNode) => (
         <Tag color="blue" bordered={false}>{val} {record.materialUnit}</Tag>
      )
    },
    {
      title: '损耗率',
      dataIndex: 'lossRate',
      key: 'lossRate',
      render: (val: number) => val > 0 ? <Text type="danger">{(val * 100).toFixed(1)}%</Text> : '-',
    },
  ];

  const hasBOM = material.children && material.children.length > 0;

  return (
    <>
      <Drawer
        title="物料档案"
        width={760}
        onClose={onClose}
        open={visible}
        styles={{ body: { padding: 0 } }} 
      >
        <div style={{ padding: '24px 24px 12px 24px', background: '#fcfcfc', borderBottom: '1px solid #f0f0f0' }}>
          <Space align="baseline">
            <Title level={4} style={{ margin: 0, color: '#001529' }}>{material.materialName}</Title>
            <Tag color="purple">{material.version}</Tag>
          </Space>
          <div style={{ marginTop: 8, color: '#888' }}>
            编码: {material.id} | 规格: {material.materialSpecificationModel || '无'}
          </div>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={onTabChange} 
          style={{ padding: '0 24px' }}
          items={[
            {
              key: '1',
              label: '基础信息',
              children: (
                <Descriptions column={2} style={{ marginTop: 16 }}>
                  <Descriptions.Item label="库存数量">
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{material.materialQuantity} {material.materialUnit}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="存放位置">{material.materialLocation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="供应商">{material.materialSupplier || '-'}</Descriptions.Item>
                  <Descriptions.Item label="物料描述" span={2}>{material.materialDescription || '暂无描述'}</Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: '2',
              label: 'BOM 结构',
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* 💡 增加顶部操作栏：添加子件按钮 */}
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setBomModalVisible(true)}>
                      添加子件
                    </Button>
                  </div>

                  {hasBOM ? (
                    <Table 
                      columns={bomColumns} 
                      dataSource={material.children as BOMNode[]} 
                      rowKey="id"
                      pagination={false}
                      size="small"
                      bordered
                      expandable={{ childrenColumnName: 'children', defaultExpandAllRows: true }} 
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                       目前没有配置 BOM 子件，请点击右上角按钮添加
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Drawer>

      {/* 💡 新增：添加 BOM 子件的弹窗 */}
      <Modal
        title="添加 BOM 子件"
        open={bomModalVisible}
        onOk={handleAddBOM}
        onCancel={() => {
          setBomModalVisible(false);
          bomForm.resetFields();
        }}
        destroyOnClose
        okText="确认绑定"
      >
        <Form form={bomForm} layout="vertical" initialValues={{ usageQuantity: 1, lossRate: 0 }}>
          <Form.Item 
            name="childId" 
            label="选择子物料" 
            rules={[{ required: true, message: '请选择需要绑定的子物料！' }]}
          >
            <Select 
              showSearch 
              placeholder="搜索并选择子物料..." 
              options={materialOptions} 
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
            />
          </Form.Item>
          
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item 
              name="usageQuantity" 
              label="单台用量" 
              rules={[{ required: true, message: '请输入用量！' }]}
            >
              <InputNumber min={0.0001} precision={4} style={{ width: 180 }} placeholder="例如：1.5" />
            </Form.Item>

            <Form.Item 
              name="lossRate" 
              label="损耗率 (小数)" 
              tooltip="例如输入 0.02 表示 2% 的损耗率"
              rules={[{ required: true, message: '请输入损耗率！' }]}
            >
              <InputNumber min={0} max={1} step={0.01} precision={2} style={{ width: 180 }} placeholder="例如：0.02" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

export default MaterialDrawer;