#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
登录测试脚本
"""

import requests
import json

def test_login():
    """测试登录功能"""
    url = "http://127.0.0.1:8088/api/v1/auth/login"
    
    test_users = [
        {"username": "admin", "password": "admin123"},
        {"username": "sales01", "password": "sales123"},
        {"username": "teacher01", "password": "teacher123"},
        {"username": "viewer01", "password": "viewer123"}
    ]
    
    print("🧪 开始测试登录功能")
    print("=" * 50)
    
    for user in test_users:
        try:
            response = requests.post(url, json=user, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {user['username']} 登录成功")
                print(f"   Token: {result.get('access_token', '')[:30]}...")
            else:
                print(f"❌ {user['username']} 登录失败 - {response.status_code}")
                print(f"   错误: {response.text}")
                
        except Exception as e:
            print(f"❌ {user['username']} 测试异常: {e}")
        
        print("-" * 30)

if __name__ == "__main__":
    test_login()
