#!/bin/sh

# 设置默认的后端主机地址
BACKEND_HOST=${BACKEND_HOST:-"backend:5000"}

echo "配置后端地址: $BACKEND_HOST"

# 直接复制已经配置好的 nginx.conf，它已经是正确的配置
cp /etc/nginx/conf.d/nginx-template.conf /etc/nginx/conf.d/default.conf

# 然后用 sed 进行简单的字符串替换
sed -i "s/\${BACKEND_HOST}/$BACKEND_HOST/g" /etc/nginx/conf.d/default.conf

echo "生成的 Nginx 配置:"
cat /etc/nginx/conf.d/default.conf

# 验证 Nginx 配置语法
nginx -t

# 启动 Nginx
exec nginx -g 'daemon off;'