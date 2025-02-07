# DeepSeek SiliconCloud Chat

一个基于 SiliconCloud API 的 DeepSeek-R1 模型聊天应用。本项目旨在解决 DeepSeek 官网服务器繁忙的问题，利用 SiliconCloud 平台提供的免费额度，为个人和朋友提供稳定的 AI 对话服务。

[English](./README_EN.md) | 简体中文

## 特性

- 🚀 基于 SiliconCloud API 的 DeepSeek-R1 模型调用
- 💭 支持查看模型思考过程
- 🔄 长时间响应自动保存
- 📝 历史记录永久保存
- 🌙 深色模式支持
- 🎨 简洁优雅的界面设计
- 🔒 邀请码注册机制

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS + shadcn/ui
- **状态管理**: Zustand
- **数据库**: MongoDB Atlas (免费版)
- **部署**: Vercel (免费版)
- **API**: SiliconCloud API
- **动画**: Framer Motion
- **认证**: NextAuth.js

## 在线体验

访问: [https://your-domain.vercel.app](https://your-domain.vercel.app)

## 本地开发

### 前置要求

- Node.js 18+
- MongoDB Atlas 账号
- SiliconCloud API Key

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/yourusername/deepseek-siliconcloud.git
cd deepseek-siliconcloud
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
```
编辑 `.env.local` 文件:
```env
MONGODB_URI=your_mongodb_uri
SILICONFLOW_API_KEY=your_api_key
NEXTAUTH_SECRET=your_secret
```

4. 运行开发服务器
```bash
npm run dev
```

### 项目结构

```
deepseek-siliconcloud/
├── src/
│   ├── app/                 # Next.js 应用路由
│   ├── components/          # React 组件
│   ├── lib/                 # 工具函数和配置
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式
├── public/                 # 静态资源
└── package.json           # 项目配置
```

### 核心功能实现

1. **消息处理流程**
```mermaid
graph LR
    A[用户发送消息] --> B[创建消息记录]
    B --> C[触发 Edge Function]
    C --> D[流式处理响应]
    D --> E[实时更新数据库]
    E --> F[前端轮询展示]
```

2. **数据模型**
```typescript
// 消息模型
interface Message {
  _id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
}
```

3. **API 路由**
- `/api/chat`: 创建新消息
- `/api/chat/process`: 处理消息（Edge Function）
- `/api/messages/[messageId]`: 获取消息状态

## 部署

### Vercel 部署

1. Fork 本项目
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### MongoDB Atlas 设置

1. 创建免费集群
2. 创建数据库用户
3. 获取连接 URI
4. 配置网络访问

## 常见问题

Q: 为什么选择 MongoDB Atlas？
A: MongoDB Atlas 提供免费的 512MB 存储空间，足够个人使用。

Q: 如何处理长时间运行的对话？
A: 使用 Edge Function 处理长时间运行的任务，并通过轮询机制更新前端显示。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 开源协议

MIT License

## 技术细节

### 1. 消息处理机制

消息处理采用三层架构：
1. 前端发送请求
2. API 路由创建消息记录
3. Edge Function 处理长时间运行的任务

### 2. 数据持久化

使用 MongoDB 实现数据持久化，主要包含三个集合：
- users: 用户信息
- conversations: 对话会话
- messages: 消息记录

### 3. 实时更新

采用轮询机制实现实时更新：
1. 初始轮询间隔：1秒
2. 消息完成后停止轮询
3. 页面切换时保持处理

### 4. 错误处理

实现了完整的错误处理机制：
1. API 调用错误
2. 网络连接错误
3. 数据库操作错误

### 5. 性能优化

- 使用 Edge Function 处理长任务
- 实现消息缓存
- 优化轮询策略

## 后续规划

1. [ ] 添加多会话支持
2. [ ] 实现消息导出功能
3. [ ] 添加系统提示词管理
4. [ ] 优化移动端体验
```

```typescript
// .env.example
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database
SILICONFLOW_API_KEY=your-api-key
NEXTAUTH_SECRET=your-secret
```