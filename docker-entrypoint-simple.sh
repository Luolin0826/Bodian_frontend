#!/bin/sh

# 设置默认的后端主机地址
BACKEND_HOST=${BACKEND_HOST:-"backend:5000"}

echo "配置后端地址: $BACKEND_HOST"

# 创建 nginx 配置文件
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name _;

    # API 代理到后端服务
    location /api/ {
        proxy_pass http://${BACKEND_HOST}/;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # 超时配置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 禁用缓存确保 API 请求实时性
        proxy_buffering off;
        proxy_cache off;
        
        # CORS 头部 (如果需要)
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header Access-Control-Expose-Headers 'Content-Length,Content-Range' always;
        
        # 处理 OPTIONS 预检请求
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin \$http_origin;
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # 前端静态文件 - 支持 Vue Router 的 history 模式
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 防止缓存 index.html
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
}
EOF

echo "生成的 Nginx 配置:"
cat /etc/nginx/conf.d/default.conf

# 验证 Nginx 配置语法
nginx -t

# 启动 Nginx
exec nginx -g 'daemon off;'