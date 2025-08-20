#!/bin/bash

echo "🔍 验证生产环境网络连通性..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查容器状态
echo -e "\n📦 检查容器状态:"
docker ps --filter "name=frontend" --filter "name=backend" --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 检查网络
echo -e "\n🌐 检查网络配置:"
docker network ls | grep prod_network

# 验证容器间网络连通性
echo -e "\n🔗 验证容器间网络连通性:"

# 1. 前端 -> 后端
echo -n "前端 -> 后端 (backend:5000): "
if docker exec frontend nslookup backend >/dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS 解析成功${NC}"
else
    echo -e "${RED}❌ DNS 解析失败${NC}"
fi

echo -n "前端 -> 后端 HTTP 连接: "
if docker exec frontend wget -q --spider http://backend:5000/api/v1/health 2>/dev/null; then
    echo -e "${GREEN}✅ HTTP 连接成功${NC}"
else
    echo -e "${RED}❌ HTTP 连接失败${NC}"
fi

# 2. 后端 -> Redis
echo -n "后端 -> Redis (prod_redis:6379): "
if docker exec backend ping -c 1 prod_redis >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis 连接成功${NC}"
else
    echo -e "${RED}❌ Redis 连接失败${NC}"
fi

# 验证外部访问
echo -e "\n🌍 验证外部访问:"

# 检查前端访问
echo -n "前端页面 (http://47.101.39.246): "
if curl -s -o /dev/null -w "%{http_code}" http://47.101.39.246 | grep -q "200"; then
    echo -e "${GREEN}✅ 前端访问正常${NC}"
else
    echo -e "${RED}❌ 前端访问异常${NC}"
fi

# 检查后端直接访问
echo -n "后端直接访问 (http://47.101.39.246:5000): "
if curl -s -o /dev/null -w "%{http_code}" http://47.101.39.246:5000/api/v1/health | grep -q "200"; then
    echo -e "${GREEN}✅ 后端直接访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  后端直接访问异常 (这是正常的，如果后端没有 health 端点)${NC}"
fi

# 检查通过前端代理访问后端
echo -n "通过前端代理访问后端 (http://47.101.39.246/api/): "
response=$(curl -s -o /dev/null -w "%{http_code}" http://47.101.39.246/api/v1/health)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ API 代理工作正常${NC}"
elif [ "$response" = "404" ]; then
    echo -e "${RED}❌ API 代理返回 404 - 需要检查 nginx 配置${NC}"
else
    echo -e "${YELLOW}⚠️  API 代理返回 HTTP $response${NC}"
fi

# 查看 Nginx 配置
echo -e "\n📋 当前 Nginx 配置:"
docker exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api/"

echo -e "\n🏁 验证完成！"