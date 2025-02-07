# DeepSeek SiliconCloud Chat

基于 SiliconCloud API 的 DeepSeek-R1 模型聊天应用。

## 功能特点

- 🚀 基于 Next.js 14 和 React 构建
- 🎨 使用 Tailwind CSS 和 shadcn/ui 构建现代化 UI
- 🔒 通过 Clerk 实现安全的身份验证
- 💾 使用 Vercel KV 存储对话历史和邀请码状态
- 🎯 支持流式响应
- 🌙 支持深色/浅色主题切换
- 🎫 邀请码注册系统
- 🔄 实时对话状态更新

## 环境要求

- Node.js 18+
- pnpm 8+
- Vercel KV (用于数据存储和邀请码验证)
- Clerk 账号 (用于身份验证)
- SiliconCloud API 密钥

## 本地开发

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/deepseek-siliconcloud.git
cd deepseek-siliconcloud
```

2. 安装依赖：

```bash
pnpm install
```

3. 配置环境变量：

创建 `.env.local` 文件并添加以下配置：

```env
# SiliconCloud API 配置
SILICONFLOW_API_KEY=your_api_key

# Clerk 配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Vercel KV 配置
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 邀请码配置
INVITE_CODES=code1,code2,code3
```

4. 启动开发服务器：

```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

## 部署

### Vercel 部署

1. Fork 此仓库
2. 在 Vercel 中导入项目
3. 在 Vercel 控制台中创建并配置 KV 数据库
4. 配置环境变量
5. 部署

### 手动部署

1. 清理并重新安装依赖：

```bash
pnpm clean
pnpm install
```

2. 构建应用：

```bash
pnpm build
```

3. 启动生产服务器：

```bash
pnpm start
```

## 技术栈

- [Next.js 14](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Clerk](https://clerk.dev/)
- [Vercel KV](https://vercel.com/storage/kv)
- [SiliconCloud API](https://www.siliconflow.com/)

## 许可证

MIT
