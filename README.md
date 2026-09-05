# TaskTuner

一个前后端分离的任务与专注管理项目，包含用户注册登录、任务管理、日历、番茄钟、笔记、评论和统计页面。

前端使用 **Vue 3 + Vite + Axios + ECharts**；后端使用 **Express + Sequelize + MySQL**，通过 JWT 处理认证。

## 项目入口

| 目录 | 内容 |
| --- | --- |
| [frontend](frontend/) | 页面、组件、API 客户端与 Vite 构建配置 |
| [backend](backend/) | Express 路由、控制器、数据库模型 |
| [frontend/api-docs](frontend/api-docs/) | 用户、任务、笔记、评论、番茄钟和统计接口文档 |
| [frontend/README.md](frontend/README.md) | 前端详细说明 |
| [backend/.env.example](backend/.env.example) | 本地后端配置模板 |

仓库根目录没有统一的 npm 入口，前后端需要分别安装和启动。

## 本地运行

准备 Node.js、npm 和一个可访问的 MySQL 实例。当前 package.json 未声明 Node 版本范围；依赖安装是否兼容需要在自己的 Node 环境中检查。

### 1. 创建开发数据库

在 MySQL 客户端执行：

```sql
CREATE DATABASE tasktuner_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

为该数据库准备开发账号，并将其填写到后端配置中。后端启动时调用 `sequelize.sync({ alter: true })`，会同步并可能修改表结构；请使用独立开发数据库，已有数据先备份。

### 2. 配置并启动后端

从仓库根目录，在 Windows PowerShell 中执行：

```powershell
cd backend
Copy-Item .env.example .env
# 编辑 .env，填写本地数据库账号和随机生成的 JWT_SECRET
npm ci
npm run dev
```

Linux / macOS 可使用 `cp .env.example .env`。`npm start` 以普通 Node 进程启动，`npm run dev` 使用 nodemon。模板端口为 `8081`，API 路径以 `/api` 开头。

| 变量 | 用途 |
| --- | --- |
| `DB_HOST` / `DB_PORT` | MySQL 地址和端口 |
| `DB_NAME` | 数据库名称 |
| `DB_USER` / `DB_PASSWORD` | 开发数据库账号 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Token 签名密钥和有效期 |
| `PORT` | 后端监听端口 |

### 3. 配置并启动前端

先编辑 [frontend/src/api/config.js](frontend/src/api/config.js)，把 `API_BASE_URL` 改成自己的后端地址，例如：

```js
export const API_BASE_URL = 'http://localhost:8081/api';
```

当前配置写在源码中，并非通过 Vite 环境变量读取。部署后更改地址需要重新构建前端。

另开终端，从仓库根目录执行：

```sh
cd frontend
npm ci
npm run dev
```

访问终端显示的地址，配置端口为 `5173`。Windows PowerShell 如限制 `npm.ps1`，可使用 `npm.cmd`。

## 构建与检查

在 `frontend/` 下执行：

```sh
npm run build
npm run preview
```

构建输出到 `frontend/dist/`；预览仍需要可用的后端和正确的 `API_BASE_URL`。后端没有 `build` 或统一 `test` 命令；现有 `test-*.js` 和数据生成脚本应先阅读配置及写库行为，再对开发数据库运行。

首次联调可依次检查注册登录、任务新建与完成、番茄钟记录及页面刷新后的数据恢复。

## 仓库维护说明

当前版本包含已跟踪的依赖目录、前端构建产物及 `backend/.env`。本地运行应重新安装依赖并使用自己的配置；仅新增 `.gitignore` 无法使已跟踪文件自动退出版本管理。相关清理应单独审阅，避免混入应用功能改动。
