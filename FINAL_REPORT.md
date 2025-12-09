# QRNG Secure Vault - 项目总结报告

**日期**: 2025-12-09  
**版本**: 1.0.0  
**仓库**: https://github.com/licctvcctv/qrng-secure-file-system

---

## 📋 项目概述

基于量子随机数（QRNG）的安全文件加密系统，从 React 原型重构为 **Vue 3 + Flask** 全栈应用。

### 技术栈

| 层级 | 技术 |
|:-----|:-----|
| 前端 | Vue 3 + Vite + Tailwind CSS v4 |
| 后端 | Python Flask + SQLAlchemy |
| 数据库 | SQLite |
| 加密 | AES-256-GCM (cryptography) |

---

## ✅ 已实现功能

### 1. 认证与授权
- 用户登录/登出
- 会话管理 (Flask-Session)
- 路由守卫 (前端权限控制)
- 管理员/普通用户角色区分

### 2. 文件加密
- **真实 AES-256-GCM 加密**（密钥 256-bit，IV 96-bit）
- 加密文件落盘存储
- 模拟模式可选
- 加密进度与 API 对齐
- 耗时统计

### 3. 文件解密
- 两步流程自动完成（解密 → 下载）
- Token 机制防止下载错误文件
- 下载后自动清理临时文件

### 4. 管理功能
- **用户管理**: 添加/编辑/锁定/删除
- **设备管理**: 添加/状态切换/删除
- **审计日志**: 按角色隔离（管理员全量，用户仅看自己）

### 5. Dashboard
- 真实统计：加密文件数、存储量、告警数
- 安全评分（规则化）
- QRNG 状态随机波动（熵值、比特率、在线状态）

### 6. 用户体验
- 统一 Toast 提示
- 玻璃态 + 霓虹发光 UI
- 设置页保存资料/修改密码

---

## ⚠️ 已知简化点

| 项目 | 状态 | 说明 |
|:-----|:-----|:-----|
| QRNG 状态 | 模拟 | 随机波动，非真实设备数据 |
| 安全评分 | 简化 | 规则化打分，未接威胁检测 |
| 密钥存储 | 明文 | `key_hex` 存数据库，需主密钥包裹 |
| 加密进度 | 粗对齐 | 前端驱动，未用 SSE/WebSocket |

---

## 🚀 部署步骤

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py  # 输入 yes 确认
python app.py   # 运行在 :5000
```

### 前端

```bash
cd frontend
npm install
npm run dev     # 开发模式 :5173
npm run build   # 生产构建
```

### 环境变量

```bash
# frontend/.env
VITE_API_BASE=http://127.0.0.1:5000/api

# 生产环境需配置
SECRET_KEY=<随机密钥>
SESSION_COOKIE_SECURE=True
```

---

## 📁 目录结构

```
qrng-secure-file-system/
├── backend/
│   ├── app.py              # 应用入口
│   ├── config.py           # 配置
│   ├── models.py           # 数据模型
│   ├── seed.py             # 种子数据
│   └── api/
│       ├── auth.py         # 认证
│       ├── keys.py         # 加密/解密
│       ├── users.py        # 用户管理
│       ├── devices.py      # 设备管理
│       ├── logs.py         # 审计日志
│       └── dashboard.py    # 仪表盘统计
├── frontend/
│   ├── src/
│   │   ├── api/            # API 封装
│   │   ├── components/     # 组件
│   │   ├── views/          # 页面
│   │   ├── router.js       # 路由
│   │   └── store.js        # 状态管理
│   └── index.html
└── PHASE_*.md              # 阶段报告
```

---

## 🔐 安全建议（生产环境）

1. **密钥存储**: 使用 MASTER_KEY 加密 `key_hex` 或接入 KMS
2. **HTTPS**: 配置 SSL 证书，启用 `SESSION_COOKIE_SECURE`
3. **CORS**: 限制为生产域名
4. **密码策略**: 增加复杂度校验
5. **限流**: 添加 Flask-Limiter 防暴力破解

---

## 📊 评分

**完成度**: 8.7/10

- ✅ 核心功能完整
- ✅ 前后端联通
- ✅ UI/UX 达到原型水平
- ⚠️ 部分功能为模拟实现
