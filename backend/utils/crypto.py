"""密钥加密工具 - 使用 MASTER_KEY 保护 key_hex"""
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from flask import current_app
import os

def encrypt_key_hex(key_hex: str) -> str:
    """
    使用 MASTER_KEY 加密 key_hex
    如果未配置 MASTER_KEY，返回原始值（向后兼容）
    返回格式: iv_hex:ciphertext_hex
    """
    from config import Config
    master_key = Config.get_master_key_bytes()
    
    if not master_key:
        # 未配置主密钥，返回原始值
        return key_hex
    
    # 生成 IV 并加密
    iv = os.urandom(12)
    aesgcm = AESGCM(master_key)
    ciphertext = aesgcm.encrypt(iv, key_hex.encode('utf-8'), None)
    
    # 返回 iv:ciphertext 格式
    return f"{iv.hex()}:{ciphertext.hex()}"

def decrypt_key_hex(stored_value: str) -> str:
    """
    使用 MASTER_KEY 解密 key_hex
    如果值不是加密格式或未配置 MASTER_KEY，返回原始值
    """
    from config import Config
    master_key = Config.get_master_key_bytes()
    
    # 检查是否是加密格式 (iv:ciphertext)
    if ':' not in stored_value:
        # 旧格式（明文），直接返回
        return stored_value
    
    if not master_key:
        # 是加密格式但未配置主密钥，抛错
        raise ValueError("key_hex 已加密但未配置 MASTER_KEY")
    
    # 解析并解密
    try:
        iv_hex, ciphertext_hex = stored_value.split(':', 1)
        iv = bytes.fromhex(iv_hex)
        ciphertext = bytes.fromhex(ciphertext_hex)
        
        aesgcm = AESGCM(master_key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        return plaintext.decode('utf-8')
    except Exception as e:
        raise ValueError(f"解密 key_hex 失败: {e}")
