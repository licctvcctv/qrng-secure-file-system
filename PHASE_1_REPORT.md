# Phase 1 Transformation Report: Backend Initialization

**日期**: 2025-12-09  
**状态**: ✅ 已完成（含安全修复）

---

## 1. 概述

基于 **Python Flask** 和 **SQLite** 完成了 QRNG Secure Vault 后端初始化。实现了真实 AES-256-GCM 加密、完整 CRUD API、以及多轮安全修复。

---

## 2. 创建/修改的文件

| 文件 | 说明 |
|:-----|:-----|
| `backend/app.py` | 应用入口，CORS 白名单，全局错误处理 |
| `backend/config.py` | 安全配置：Session Cookie、文件上传限制 |
| `backend/extensions.py` | Flask 扩展初始化 |
| `backend/models.py` | SQLAlchemy 模型 |
| `backend/seed.py` | 种子数据脚本（带确认提示） |
| `backend/api/auth.py` | 认证 API |
| `backend/api/keys.py` | **真实加密/解密** API |
| `backend/api/logs.py` | 审计日志 API（权限隔离） |
| `backend/api/users.py` | 用户管理 CRUD |
| `backend/api/devices.py` | 设备管理 CRUD |

---

## 3. API 接口

### 3.1 认证
| 端点 | 方法 | 认证 | 说明 |
|:-----|:-----|:-----|:-----|
| `/api/login` | POST | 否 | 登录 |
| `/api/me` | GET | ✅ | 获取当前用户 |
| `/api/logout` | POST | ✅ | 登出 |

### 3.2 加密/解密（核心）
| 端点 | 方法 | 认证 | 说明 |
|:-----|:-----|:-----|:-----|
| `/api/encrypt` | POST | ✅ | **真实 AES-256-GCM 加密**（multipart，支持 `mode=simulate`） |
| `/api/encrypt/simulate` | POST | ✅ | 模拟加密（仅存元数据） |
| `/api/decrypt` | POST | ✅ | 解密，返回含 `token` 的 `download_url` |
| `/api/download/<key_id>?token=...` | GET | ✅ | 下载解密文件（下载后自动删除） |
| `/api/keys` | GET | ✅ | 密钥列表 |

> **解密两步流程**：
> 1. 调用 `POST /api/decrypt` → 返回 `download_url` 含唯一 `token`
> 2. 调用 `GET /api/download/<key_id>?token=xxx` → 下载文件，**自动删除临时文件**
>
> `token` 用于防止下载旧文件或他人文件，必须使用解密返回的 URL。

### 3.3 管理接口（仅管理员）
| 端点 | 方法 | 说明 |
|:-----|:-----|:-----|
| `/api/users` | GET/POST | 用户列表/创建 |
| `/api/users/<id>` | PUT/DELETE | 更新/删除用户 |
| `/api/devices` | GET/POST | 设备列表/添加 |
| `/api/devices/<id>/status` | PATCH | 信任/撤销设备 |
| `/api/devices/<id>` | DELETE | 删除设备 |

### 3.4 审计日志
| 端点 | 方法 | 认证 | 说明 |
|:-----|:-----|:-----|:-----|
| `/api/logs` | GET | ✅ | **管理员**：查看所有；**用户**：仅查看自己的日志 |
| `/api/logs` | POST | ✅ | 前端上报日志 |
| `/api/reset` | POST | Admin | 清空数据（破坏性！） |

---

## 4. 安全措施

| 功能 | 实现 |
|:-----|:-----|
| **密码哈希** | PBKDF2-SHA256 (`werkzeug.security`) |
| **Session** | `HTTPONLY=True`, `SAMESITE='Lax'`, 生产环境 `SECURE=True` |
| **CORS** | 白名单：`localhost:5173`, `127.0.0.1:5173` |
| **输入校验** | 文件类型白名单、大小限制、必填验证 |
| **HTTP 错误** | 正确返回 404/413 等状态码，非 HTTP 异常才返回 500 |
| **日志权限** | 普通用户只能查看自己的操作日志 |

### ⚠️ 密钥存储警告

> [!CAUTION]
> **当前 `key_hex` 以明文存储在数据库中，仅适用于演示！**
>
> **生产环境必须**：
> 1. 使用 `MASTER_KEY` 对 `key_hex` 进行二次 AES 加密后存储
> 2. 或集成 KMS（密钥管理服务）如 AWS KMS、HashiCorp Vault
> 3. 示例：
>    ```python
>    # 加密存储
>    master_key = os.environ.get('MASTER_KEY')
>    encrypted_key = AESGCM(master_key).encrypt(iv, key, None)
>    # 存储 encrypted_key.hex() 而非 key.hex()
>    ```

---

## 5. 验证

### 5.1 初始化数据库
```bash
source venv/bin/activate
cd backend && python seed.py
# 输入 'yes' 确认，或使用 --force 跳过
```

### 5.2 启动服务
```bash
cd backend && python app.py
# 服务运行在 http://127.0.0.1:5000
```

### 5.3 测试登录
```bash
curl -c cookies.txt -X POST http://127.0.0.1:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 5.4 测试加密
```bash
curl -b cookies.txt -X POST http://127.0.0.1:5000/api/encrypt \
  -F "file=@test.txt" \
  -F "algorithm=AES-256-GCM"
```

### 5.5 测试解密（两步）
```bash
# Step 1: 解密获取 download_url
curl -b cookies.txt -X POST http://127.0.0.1:5000/api/decrypt \
  -H "Content-Type: application/json" \
  -d '{"key_id":"KEY-XXXXXXXX-XXXX"}'

# Step 2: 下载（使用返回的 token）
curl -b cookies.txt -o decrypted.txt \
  "http://127.0.0.1:5000/api/download/KEY-XXXXXXXX-XXXX?token=decrypt_xxx_xxx.txt"
```

---

## 6. 默认账户

| 用户名 | 密码 | 角色 |
|:-------|:-----|:-----|
| `admin` | `admin123` | 管理员 |
| `user` | `user123` | 普通用户 |

> ⚠️ **生产环境请更改默认密码！**

---

## 7. 下一步（Phase 2）

- 初始化 Vue 3 + Vite 前端
- 安装 Tailwind CSS 和 Axios
- 迁移 React 组件到 Vue
