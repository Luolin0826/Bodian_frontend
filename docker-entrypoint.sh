#!/bin/sh

echo "启动前端静态文件服务..."
echo "前端将直接使用配置的API地址: http://47.101.39.246:5000"

# 显示当前的 Nginx 配置
echo "当前 Nginx 配置:"
cat /etc/nginx/conf.d/default.conf

# 验证 Nginx 配置语法
echo "验证 Nginx 配置..."
nginx -t

# 启动 Nginx
echo "启动 Nginx..."
exec nginx -g 'daemon off;'