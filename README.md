# QRNG Secure Vault

基于量子随机数（QRNG）的安全文件加密系统 - Vue 3 + Flask 全栈应用

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![Vue](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 功能特性

- 🔐 **AES-256-GCM 真实加密**：文件加密落盘存储
- 🎲 **QRNG 模拟**：量子随机数状态波动模拟
- 👥 **用户管理**：CRUD + 角色权限
- 📱 **设备管理**：信任/撤销状态控制
- 📊 **审计日志**：按角色隔离查看
- 🎨 **现代 UI**：玻璃态 + 霓虹发光效果

---

## 🚀 快速开始

### 环境要求

- Python 3.9+
- Node.js 18+
- npm 9+

### 1. 克隆仓库

```bash
git clone https://github.com/licctvcctv/qrng-secure-file-system.git
cd qrng-secure-file-system
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（输入 yes 确认）
python seed.py

# 启动服务
python app.py
```

后端运行在 http://127.0.0.1:5000

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev
```

前端运行在 http://localhost:5173

---

## 🔑 演示账号

| 角色 | 用户名 | 密码 |
|:-----|:-------|:-----|
| 管理员 | admin | admin123 |
| 普通用户 | user | user123 |

---

## ⚙️ 环境变量

### 后端 (backend/.env)

```bash
# 必须：生产环境请使用随机密钥
SECRET_KEY=your-random-secret-key-here

# 可选：密钥加密主密钥（生产环境强烈建议配置）
MASTER_KEY=your-32-byte-master-key-base64

# 可选：CORS 允许的源
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# 可选：调试模式（生产环境设为 False）
FLASK_DEBUG=False
```

### 前端 (frontend/.env)

```bash
# API 地址
VITE_API_BASE=http://127.0.0.1:5000/api
```

---

## 📁 项目结构

```
qrng-secure-file-system/
├── backend/
│   ├── app.py              # Flask 应用入口
│   ├── config.py           # 配置管理
│   ├── models.py           # SQLAlchemy 模型
│   ├── extensions.py       # Flask 扩展
│   ├── seed.py             # 数据库初始化脚本
│   └── api/
│       ├── auth.py         # 认证 API
│       ├── keys.py         # 加密/解密 API
│       ├── users.py        # 用户管理 API
│       ├── devices.py      # 设备管理 API
│       ├── logs.py         # 审计日志 API
│       └── dashboard.py    # 仪表盘统计 API
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API 封装
│   │   ├── components/     # Vue 组件
│   │   ├── views/          # 页面视图
│   │   ├── composables/    # 组合式函数
│   │   ├── router.js       # 路由配置
│   │   └── store.js        # 状态管理
│   └── index.html
├── PHASE_1_REPORT.md       # 后端阶段报告
├── PHASE_2_REPORT.md       # 前端阶段报告
└── FINAL_REPORT.md         # 项目总结报告
```

---

## 🔒 安全说明

### 当前实现（适合演示）

- key_hex 明文存储（设置 MASTER_KEY 后会自动加密）
- SECRET_KEY 有默认值（生产环境必须覆盖）
- /api/reset 需要管理员权限 + DEBUG 模式

### 生产环境建议

1. 配置随机 SECRET_KEY（32+ 字符）
2. 配置 MASTER_KEY 加密密钥数据
3. 启用 HTTPS，设置 `SESSION_COOKIE_SECURE=True`
4. 限制 CORS_ORIGINS 为实际域名
5. 禁用 DEBUG 模式

---

## 📊 API 端点

### 认证
- `POST /api/login` - 登录
- `POST /api/logout` - 登出
- `GET /api/me` - 当前用户信息

### 加密/解密
- `GET /api/keys` - 密钥列表
- `POST /api/encrypt` - 加密文件
- `POST /api/decrypt` - 解密文件
- `GET /api/download/<key_id>` - 下载解密文件

### 管理
- `GET/POST/PUT/DELETE /api/users` - 用户管理
- `GET/POST/PATCH/DELETE /api/devices` - 设备管理
- `GET /api/logs` - 审计日志
- `GET /api/dashboard/stats` - 仪表盘统计

---

## 🧪 测试

```bash
# 后端测试
cd backend
python -m pytest tests/ -v

# 前端构建检查
cd frontend
npm run build
```

---

## 📄 许可证

MIT License
