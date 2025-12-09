# QRNG Secure Vault - 项目重构与实战开发文档

## 1. 项目概述 (Project Overview)

本项目目前是一个基于 React 的纯前端原型演示。根据需求，我们需要将其改造成一个**全栈 Web 应用**，适用于学生毕业设计或课程演示。

**核心目标**：

1. **前端迁移**：从 React 迁移到 **Vue 3** (更易上手，适合演示)。
2. **后端实现**：使用 **Python (Flask)** 搭建后端 API 服务。
3. **数据持久化**：使用 **SQLite** 数据库替代内存 Mock 数据。
4. **功能复刻**：完整保留原型的 UI/UX 效果和所有业务流程（加密传输、密钥管理、审计等）。

---

## 2. 技术栈架构 (Tech Stack)

| 模块               | 原型技术 (Current)    | **目标技术 (Target)**             | 说明                                 |
| :----------------- | :-------------------- | :-------------------------------------- | :----------------------------------- |
| **前端框架** | React 18 + TypeScript | **Vue 3 + JavaScript/TypeScript** | Vue 的单文件组件结构对学生更友好     |
| **构建工具** | Vite                  | **Vite**                          | 保持极速构建体验                     |
| **UI 样式**  | Tailwind CSS          | **Tailwind CSS**                  | 直接复用现有样式类名                 |
| **后端框架** | 无 (纯前端 Mock)      | **Python Flask**                  | 轻量级，代码简洁，适合 Demo          |
| **数据库**   | 无 (React State)      | **SQLite**                        | 单文件数据库，无需安装配置，方便提交 |
| **API 通信** | 无                    | **Axios (RESTful API)**           | 前后端分离标准通信                   |

---

## 3. 数据库设计 (Database Schema)

文件: `database.db` (SQLite)
使用 SQLAlchemy 或原生 SQL 进行管理。

### 3.1 用户表 (`users`)

存储系统用户信息，区分管理员和普通用户。

| 字段名         | 类型       | 说明                             |
| :------------- | :--------- | :------------------------------- |
| `id`         | INTEGER PK | 自增主键                         |
| `username`   | TEXT       | 登录用户名 (Unique)              |
| `password`   | TEXT       | 密码 (演示可用明文或简单 Hash)   |
| `name`       | TEXT       | 显示昵称                         |
| `role`       | TEXT       | 角色:`'admin'` 或 `'user'`   |
| `department` | TEXT       | 部门                             |
| `status`     | TEXT       | 状态:`'active'` / `'locked'` |

### 3.2 密钥记录表 (`key_records`)

存储文件加密记录和密钥元数据。

| 字段名              | 类型     | 说明                                 |
| :------------------ | :------- | :----------------------------------- |
| `id`              | TEXT PK  | 密钥 ID (如 KEY-2023...)             |
| `owner`           | TEXT     | 归属用户名                           |
| `file_name`       | TEXT     | 原始文件名                           |
| `file_size`       | TEXT     | 文件大小字符串                       |
| `algorithm`       | TEXT     | 加密算法 (AES-256-GCM 等)            |
| `key_type`        | TEXT     | `'QRNG-Auto'` 或 `'Custom-Seed'` |
| `created_at`      | DATETIME | 创建时间                             |
| `key_fingerprint` | TEXT     | 密钥指纹                             |
| `decrypt_count`   | INTEGER  | 解密次数                             |

### 3.3 审计日志表 (`audit_logs`)

记录系统所有的关键操作。

| 字段名          | 类型       | 说明                                  |
| :-------------- | :--------- | :------------------------------------ |
| `id`          | INTEGER PK | 自增 ID                               |
| `user`        | TEXT       | 操作用户                              |
| `action_type` | TEXT       | `LOGIN`, `ENCRYPT`, `SYSTEM` 等 |
| `message`     | TEXT       | 日志主要内容                          |
| `detail`      | TEXT       | 详细信息                              |
| `level`       | TEXT       | `info`, `warning`, `error`      |
| `timestamp`   | DATETIME   | 操作时间                              |

### 3.4 设备表 (`devices`)

管理设备鉴权列表。

| 字段名          | 类型    | 说明                                  |
| :-------------- | :------ | :------------------------------------ |
| `id`          | TEXT PK | 设备 ID                               |
| `name`        | TEXT    | 设备名称                              |
| `ip`          | TEXT    | IP 地址                               |
| `status`      | TEXT    | `trusted`, `pending`, `revoked` |
| `last_active` | TEXT    | 最后活跃时间                          |

---

## 4. 后端 API 接口规范 (API Spec)

所有接口统一前缀 `/api`。

### 4.1 认证模块

* `POST /api/login`: 验证用户名密码，返回用户信息。
  * 请求: `{ "username": "admin", "password": "..." }`
  * 响应: `{ "success": true, "user": { ... } }`

### 4.2 核心业务

* `GET /api/dashboard/stats`: 获取控制台统计数据（文件数、存储量、告警）。
* `POST /api/encrypt/simulate`: **[核心演示接口]**
  * 功能：后端模拟加密过程。因为是学生 Demo，不需要真的在后端做耗时加密，可以直接接收文件信息，存入数据库，返回“成功”。
  * 请求: `{ "filename": "test.pdf",  "algorithm": "AES-256-GCM" ... }`
  * 响应: `{ "success": true, "key_id": "KEY-123..." }`
  * *注：前端进度条跑完后调用此接口。*

### 4.3 数据管理 (CRUD)

* `GET /api/keys`: 获取密钥列表 (管理员看所有，用户看自己)。
* `GET /api/users`: 获取用户列表 (仅管理员)。
* `POST /api/users`: 添加新用户。
* `GET /api/logs`: 获取审计日志。
* `POST /api/logs`: 前端上报日志 (用于记录前端发生的交互)。

---

## 5. 前端重构方案 (Frontend Migration: Vue 3)

### 5.1 目录结构对比

```
Current (React)                 Target (Vue 3)
src/                            src/
├── components/                 ├── components/
│   ├── UserDashboard.tsx  -->  │   ├── SystemDashboard.vue
│   └── Sidebar.tsx        -->  │   └── Sidebar.vue
├── views/                      ├── views/
│   ├── TransferView.tsx   -->  │   ├── TransferView.vue
│   └── ...                -->  │   └── ...
├── App.tsx                -->  ├── App.vue (主要布局)
├── main.tsx               -->  ├── main.js
└── types.ts               -->  └── types.js (或保留 .ts)
```

### 5.2 状态管理 (State Management)

原 React 版本使用 `useState` 在 `App.tsx` 集中管理所有数据。
**Vue 方案**：推荐使用 **Pinia** 或简单的 **Reactive Global State**。
考虑到是学生 Demo，可以直接在 `src/store.js` 中使用 `reactive()` 定义一个全局状态对象，简单直观。

```javascript
// src/store.js
import { reactive } from 'vue'

export const store = reactive({
  user: null, // 当前登录用户
  globalConfig: { ... }, // 算法配置
  // 登录方法
  login(username, role) { ... }
})
```

### 5.3 核心组件迁移指南

#### (1) `TransferView` (安全传输页)

* **HTML**: 将 JSX 的 `{condition && <div>}` 改为 Vue 的 `<div v-if="condition">`。
* **Event**: `onClick={func}` 改为 `@click="func"`.
* **Logic**:
  * `startEncryptionProcess` 函数逻辑保持不变，但里面的 `setSteps` 等状态更新改为直接修改 Vue 响应式数据。
  * **关键点**：`wait(ms)` 函数可以直接复用，用于模拟“正在加密”的进度条动画效果，这是演示的精髓。

#### (2) `KeyManagementView` (密钥管理页)

* **List Rendering**: `keys.map(...)` 改为 `<div v-for="key in keys" :key="key.id">`.
* **Filtering**: 使用 Vue 的 `computed` 属性来实现搜索过滤，代码会比 React 的 `const displayKeys = ...` 更简洁。

---

## 6. 开发步骤指南 (Implementation Steps)

### 第一步：初始化后端 (Python)

1. 创建 `backend` 文件夹。
2. 创建虚拟环境 `python -m venv venv`。
3. 安装 Flask: `pip install flask flask-cors`.
4. 创建 `app.py`:
   ```python
   from flask import Flask, jsonify, request
   from flask_cors import CORS
   import sqlite3

   app = Flask(__name__)
   CORS(app) # 允许跨域

   # 初始化数据库 (简单示例)
   def init_db():
       conn = sqlite3.connect('database.db')
       c = conn.cursor()
       c.execute('''CREATE TABLE IF NOT EXISTS users ...''')
       conn.commit()
       conn.close()

   @app.route('/api/login', methods=['POST'])
   def login():
       # 这里写简单的判断逻辑，如果在 users 表里就返回成功
       pass

   if __name__ == '__main__':
       init_db()
       app.run(debug=True, port=5000)
   ```

### 第二步：初始化前端 (Vue)

1. 在项目根目录运行 `npm create vite@latest frontend -- --template vue`。
2. 安装 Tailwind CSS (参考官方 Vue 指南)。
3. 安装 Axios: `npm install axios`。
4. 安装 Lucide Vue 图标库: `npm install lucide-vue-next` (Lucide 的 Vue 版本)。

### 第三步：移植 UI 代码

1. **复制样式**: 将原项目 `index.css` 的内容直接复制到 Vue 项目的 `style.css`。
2. **组件转换**: 按照 5.3 节的指南，逐个将 React 组件重写为 Vue 组件。
   * 重点保证 `TransferView` 的动画效果一致。
3. **对接接口**: 将组件中的 Mock 数据操作（如 `setKeyHistory`）替换为 `axios.post('/api/keys', ...)`。

### 第四步：联调与运行

1. 启动后端: `python app.py` (5000 端口)。
2. 启动前端: `npm run dev` (5173 端口)。
3. 在前端配置代理 (vite.config.js) 或直接调用 `http://localhost:5000`。

---

## 8. 补充检查与优化建议 (Gaps & Quick Wins)

### 8.1 目前文档缺失或需澄清的点

- **鉴权方式未定**: 简化方案推荐基于 `Flask-Login + Flask-Session`（服务端会话）或 `JWT (PyJWT)`，二选一并写入接口规范，避免前后端对接时反复修改。
- **文件流/存储路径**: 如果演示上传真实文件，需决定存储目录（如 `backend/uploads`）及是否限制大小/MIME；若仅模拟，无需存盘但应明确“仅记录元数据”。
- **加密模拟协议**: 建议把“模拟步骤”写进接口响应，例如 `{steps: ["hashing", "qrng", "encrypting"]}`，前端按步骤驱动进度条，避免硬编码。
- **错误码规范**: 增补统一响应格式，例如 `{success: false, code: "AUTH_FAIL", message: "..."}`，便于前端提示与日志记录。
- **审计日志来源**: 目前只定义了 `/api/logs`，需要约定哪些事件必须写日志（登录成功/失败、加密、解密、重置数据、设备信任变更）。
- **初始种子数据**: 可准备一份 `seed.py` 生成初始管理员、示例密钥、设备与日志，以便老师一跑就有数据展示。

### 8.2 后端快速开发选型

- **Flask 组件**:
  - `flask-cors`：跨域，已列出。
  - `Flask-Login` + `Flask-Session`：最少代码实现登录态；若想完全无状态则改用 `PyJWT`。
  - `Flask-RESTful` 或 `Flask-Smorest`：更轻量写 API，带简单的序列化/验证。
  - `SQLAlchemy` + `Flask-Migrate`：SQLite 表定义 + 迁移；若想更快可用 `sqlite3` 原生 + 简单 DAO。
  - `python-dotenv`：加载 `.env`（端口、调试开关、数据库路径）。
  - 可选：`werkzeug.middleware.proxy_fix`（若将来有反向代理）、`Flask-Compress`（前后端同机时可不加）。
- **日志与审计**:
  - Python `logging` 配置一个 JSONFormatter（或简单文本），写入 `logs/app.log`；再用 Flask `before_request/after_request` 钩子自动记录请求摘要（方法、路径、user、status、耗时）。
  - 数据库审计：在业务层对关键操作调用写库函数，保持与文件日志格式一致。

### 8.3 加密/解密实现建议

- **默认真实加密**: 使用 `cryptography` 的 AES-256-GCM，对上传的二进制流加密后写入 `uploads/`，保存 `{key_hex, iv, tag, storage_path}` 到 `key_records`。加密过程仍可向前端返回 `steps` 以驱动进度条。
- **可选“模拟模式”**: 保留后端参数 `mode=simulate`，仅写入元数据，不落盘；方便无文件演示。
- **指纹生成**: `hashlib.sha256(key_bytes).hexdigest()[:16]` 便于 UI 展示。

### 8.4 数据库与模型补充

- `key_records` 可增加 `storage_path`（若启用真实文件存储）、`iv`（真实加密时）字段。
- `audit_logs` 建议增加 `ip` 和 `user_agent` 方便演示“安全审计”。
- 如需设备绑定，可在 `devices` 增加 `os`、`location` 字段以丰富展示数据。

### 8.5 前端对接与开发效率

- **状态管理**: Pinia 足够；若想更快可以用 `provide/inject` + `reactive`，但 Pinia 对调试和持久化更友好。
- **请求封装**: 建议在 `src/api/index.ts` 封装 axios 实例（基地址、拦截器、错误提示），避免组件里散落 URL。
- **UI 库**: 若时间紧，可引入 `Naive UI` 或 `Element Plus` 取代部分手写弹窗/表格，保留现有 Tailwind 仅用于布局/动效。
- **Mock/真实切换**: 在 `.env` 中放 `VITE_API_BASE`，提供一个 `mock` 开关以便离线演示。

### 8.6 最小可交付版本 (一天内可完成)

1. 后端 Flask：`/api/login` (真实校验 + 密码哈希)，`/api/keys` (GET/POST)，`/api/encrypt` (AES-GCM 真实加密 + multipart 上传；支持 `mode=simulate` 切换)，`/api/logs`, `/api/reset`；SQLite 原生或 SQLAlchemy；种子内置 1 个 admin（bcrypt 哈希）。
2. 前端 Vue：保留现有动效，登录后调用真实接口；未登录直接路由到登录页。
3. 审计：登录成功/失败、加密成功/失败都写入 `audit_logs` 与 `app.log`，记录 `ip/user_agent`。
4. 种子脚本：`python seed.py` 生成管理员、示例密钥/设备/日志，README 标明运行步骤。

---

## 9. 现有前端功能梳理与接口对照

- **LoginView**：登录、切换角色 → `POST /api/login`，可选 `GET /api/me`。
- **DashboardView**：统计卡片/近期密钥/登录记录/告警 → `GET /api/dashboard/stats`、`GET /api/keys?limit=5`、`GET /api/auth-sessions?limit=3`、`GET /api/alerts`.
- **TransferView**：上传/下载、加密流程、进度条 → `POST /api/encrypt`（multipart，支持 `mode=simulate` 切换）、`POST /api/decrypt`，成功后写 `/api/keys` 和 `/api/logs`。
- **KeyManagementView**：按角色过滤密钥、展开使用日志 → `GET /api/keys`，可选 `/api/keys/:id/usage`。
- **AccessControlView**（用户管理）：锁定/删除/新增用户、查看登录历史 → `GET/POST/PUT/DELETE /api/users`，`GET /api/auth-sessions?user=xx`。
- **DeviceManagerView**：设备信任/撤销、备注 → `GET /api/devices`，`POST /api/devices`，`PATCH /api/devices/:id/status`。
- **AuditView**：时间线展示审计日志 → `GET /api/logs`（支持 level/user/actionType 过滤）。
- **AlgoConfigView**：算法白名单/配置保存 → `GET /api/config`，`PUT /api/config`。
- **ComplianceView**：合规报告列表/下载 → `GET /api/compliance`（可返回静态数据）。
- **SettingsView**：个人资料更新、头像上传 → `PATCH /api/users/:id`，可选 `POST /api/upload/avatar`。

## 10. 后端目录与模块建议 (Flask)

```
backend/
  app.py                # 入口，注册蓝图与中间件
  extensions.py         # db, cors, login_manager, migrate, logger
  config.py             # 配置类，读取 .env
  models.py             # SQLAlchemy 模型定义
  seed.py               # 初始化种子数据
  api/
    __init__.py
    auth.py             # /api/login, /api/logout, /api/me
    keys.py             # /api/keys, /api/encrypt/simulate
    users.py            # /api/users, /api/auth-sessions
    devices.py          # /api/devices
    logs.py             # /api/logs, /api/reset
    config.py           # /api/config
  services/             # 可选，封装业务逻辑（加密模拟、审计写入）
  utils/
    security.py         # hash/check password, JWT 可选
    crypto.py           # 真实加密实现（如开启）
    responses.py        # 统一响应格式 helper
```

中间件：CORS、请求/响应日志、错误处理（统一返回 `{success:false, code, message}`）。

## 11. 开发节奏建议

1. **Day 1**：起 Flask 项目骨架 + `/api/login`, `/api/keys`(GET/POST), `/api/encrypt/simulate`, `/api/logs`, `/api/reset`；SQLite 初始化 + 种子。
2. **Day 2**：补 `/api/users`, `/api/devices`, `/api/auth-sessions`, `/api/config`; 上线统一错误码、日志记录；前端新建 Vite+Vue 工程，迁移 Sidebar/Layout/Login。
3. **Day 3**：迁移 TransferView 动效与调用、KeyManagement、Dashboard；接好 axios 封装；初步联调。
4. **Day 4**：接入用户管理/设备/审计视图；可选真实加密开关；完善 README、脚本与演示数据。

## 12. 待确认清单

- 登录态选择：Session/Flask-Login vs JWT？（文档需锁定）
- 加密是否需要真实文件存储？如果是：存储目录/大小/MIME 限制？
- 是否需要多租户/多部门隔离？（影响查询过滤条件）
- 演示环境端口/部署方式（单机 5173+5000 或 Docker Compose？）
- 前端是否允许引入 UI 组件库（Naive UI / Element Plus）以加快表格/弹窗开发？

## 13. 真实登录与真实加密落地方案

### 13.1 登录（真实校验，简单可靠）

- **依赖**: `Flask-Login`, `Flask-Session`, `passlib[bcrypt]`（或 `werkzeug.security` 的 `generate_password_hash`/`check_password_hash`）。
- **流程**: `POST /api/login` → 校验用户名 + 哈希密码 → `login_user(user)` 建立服务端会话；`GET /api/me` 返回当前用户；`POST /api/logout` 注销。
- **数据**: `users.password_hash` (bcrypt)；可选 `failed_attempts`、`last_login_ip`、`last_login_at`。
- **安全基础**: Cookie `httponly`, `samesite=lax`；演示可不强制 https；可选 `Flask-Limiter` 做简单防爆破。
- **前端**: 登录表单走真实接口，成功后拉取 `me` 和初始数据（keys/logs/devices）。

### 13.2 真实加密（AES-256-GCM）

- **依赖**: `cryptography`.
- **接口**: `POST /api/encrypt` (multipart form: `file`, `algorithm`, `mode=real|simulate`, `keyMode=auto|custom`, `customSecret` 可选)；`POST /api/decrypt` (multipart: `file`, `key_id` 或 `key_file`/`customSecret`)。
- **流程 (真实模式)**:
  1) 检查文件大小/MIME（可设 20MB 上限）；保存原文件到临时目录。
  2) 生成 `key = AESGCM.generate_key(256)`, `iv = os.urandom(12)`；`ciphertext = AESGCM(key).encrypt(iv, data, None)`。
  3) 写入 `uploads/<uuid>.enc`；保存元数据到 `key_records`：`storage_path`, `iv`, `tag`（GCM tag 在密文尾部，可拆分），`key_hex`, `algorithm`。
  4) 返回 `{success:true, key_id, fingerprint, steps:[...progress labels...]}`。
  5) 审计：写 `audit_logs` (user, action=ENCRYPT, ip, user_agent) + 文件日志。
- **流程 (解密)**: 从 `key_records` 取 `key_hex/iv`，读取 `storage_path`，`AESGCM(key).decrypt(iv, ciphertext, None)`，返回文件流或提示成功（可直接返回下载 URL）。
- **存储与安全取舍（学生版）**: 直接以 hex 存储密钥即可；如需略微加强，可用 `.env` 中的 `MASTER_KEY` 对密钥再包一层 AES 加密后存库。
- **示例代码**:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key = AESGCM.generate_key(bit_length=256)
iv = os.urandom(12)
aesgcm = AESGCM(key)
ciphertext = aesgcm.encrypt(iv, file_bytes, None)  # tag 在结尾
# persist ciphertext to uploads/, save key_hex/iv/tag in DB
```

- **前端对接**: 使用 `FormData` 直接传文件，后端返回 `steps` 数组驱动现有进度条/动画；失败时返回统一错误码。
