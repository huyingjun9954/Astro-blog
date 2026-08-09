---
title: Nginx基础指南
published: 2026-08-09
pinned: true
description: 关于Nginx的一些基础概念以及基本的使用
tags:
  - Nginx
  - Web服务器
  - 反向代理
  - 自建服务指南
category: 反向代理
image: https://www.stackmeow.tech/file/1786195906007_20260808213141022.png
slug: NginxBasicsGuide
---
> [!TIP]写在前面
> 仅基于最新版本的Nginx；同时服务器系统是debian12及debian系衍生版本都可以使用，如果是其他发行版可能需要您自行查阅相关个性化命令。

# 简单理解反向代理与Nginx
简单来说，代理就是中介；网络代理自然就是客户端和服务端之前的中介。而反向代理就是运行在服务端中的中介程序。
通俗的讲，反向代理就是一个经典的语文句式：   如果······那么······。 例如：**如果**收到了www.example.com这个请求**那么**返回localhost:8191这个端口号运行的程序。
而Nginx就是负责处理并优化这一句**如果······那么······** 这个句式的一个程序。
> [!NOTE]
> 不过在这里必须说一下，Nginx本身是一个Web服务器，只是它在反向代理方面的卓越性能导致了大家都把它当作反向代理工具来使用的。
# 安装Nginx
> [!IMPORTANT] 必要性
> 各个Linux发行版/Windows中尽量按照官网的操作步骤下载最新的Nginx版本，因为旧版本最大的问题就是存在各种漏洞，而这些漏洞也在最新版本中被恢复。我这里用debian12的系统作为演示。

debian官方软件包仓库的Nginx并非最新版本所以需要通过下列步骤一一下载，其他操作系统可能也存在此类问题，可以在官方文档中查看具体步骤。

1. 下载密钥
```bash title="zsh"
sudo apt install curl gnupg2 ca-certificates lsb-release debian-archive-keyring
```
2. 配置官方存储库
```bash title="zsh"
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/debian `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```
3. 设置固定存储库
```bash title="zsh"
echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx
```
4. 更新软件包然后安装Nginx
```bash title="zsh"
sudo apt update
```

```bash title="zsh"
sudo apt install nginx
```

# 认识Nginx文件夹
如果你也是debian系发行版那么你在刚刚过下载好Nginx的时候，文件结构就应该是下面这个样子：
```bash title="zsh"
/etc/nginx/
├── conf.d
├── fastcgi_params
├── mime.types
├── modules -> /usr/lib/nginx/modules
├── nginx.conf
├── scgi_params
└── uwsgi_params
```
在这里，nginx.conf是Nginx的主配置文件，不过我们一般情况下是不会在这个文件里面去编写我们的反向代理配置，我们依然遵循模块化的原则。  具体配置步骤我会在本文后面讲述。

我们的网站如果需要开启https加密，那么我们就需要证书。 证书的使用在服务器中也是交给Nginx的。  为了方便使用我一般都会选择的Nginx中直接创建一个文件夹用来存放证书。比如：`certificate` 文件夹。
# 配置Nginx
> [!NOTE] 配置中的提前声明
> 在这一部分中，我们模拟有两个本地服务需要我们使用Nginx来部署上线。两个服务分别使用server1 和 server2来作为别名。配置文件中的内容在下一步骤中讲述。

 两个本地服务：
  * server1->server1.conf->直接通过端口访问的服务：localhost:7890
  * server2->server2.conf->通过入口文件来访问的服务：这里以typecho博客来作为演示

 > 配置Nginx有两种方式，哪种都可以具体取决于你的喜好以及你本地的服务数量和管理难度

## 第一种配置文件存放方式。
 第一种配置方式，我们直接在conf.d文件夹中创建我们需要代理的服务的配置文件就可以。 在`/etc/nginx/conf.d`中创建两个服务的配置文件。
 ```bash title="zsh"
touch server1.conf server2.conf 
 ```
 在Nginx根目录中的`nginx.conf`这个配置文件会自动启动/`etc/nginx/conf.d`这个文件夹中的所有配置文件。

## 第二种配置文件存放方式。
 第二种配置文件存放方式是使用sites文件夹配置并搭配软链接的方式进行管理配置文件。
 在Nginx的根目录创建两个配置文件：
 ```bash title="zsh"
 mkdir -p /etc/nginx/sites-available 
 mkdir -p /etc/nginx/sites-enabled
 ```
 编辑Nginx根目录中的`nginx.conf`文件，在`https`块内添加以下内容：
 ```conf {4}
 <!-- /etc/nginx/nginx.conf -->
 http {
    # ... 其他配置 ...
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;  # 添加这一行
}
 ```
 我们需要在`sites-available`这个文件夹中创建配置文件，并通过`ln`命令为其中的配置文件创建软链接到sites-enabled文件夹。
 创建配置文件
 ```bash title="zsh"
 cd /etc/nginx/sites-available
 touch server1.conf server2.conf
 ```
 创建软链接（创建软链接必须使用绝对路径）
 ```bash title="zsh"
 ln -s /etc/nginx/sites-available/server1.conf /etc/nginx/sites-enabled
 ln -s /etc/nginx/sites-available/server2.conf /etc/nginx/sites-enabled
 ```
 > 这两种配置的添加方式都可以正常生效不同的是 如果你有很多项目需要管理，那么第一种方式只能新增或删除，如果将来需要将删除的项目添加回来只能新建，不便于管理。 而sites方式则可以保持原来的项目不动，如果需要删除项目直接在`sites-enabled`中删除，如果将来需要重新添加，那么只需要重新创建软链接即可。

# 配置文件示例
本地服务为通过本地端口直接访问的服务：
```conf {5,14,17,18,32}
# 强制HTTP重定向到HTTPS（Force SSL）
server {
    listen 80;
    listen [::]:80;
    server_name exp.example.com;        # 改为你的域名
    return 301 https://$host$request_uri;  # 自动跳转HTTPS
}

# 主HTTPS服务配置
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;                      #开启http2支持
    server_name exp.example.com;

    # SSL证书配置
    ssl_certificate certificate/example.com/fullchain.cer;     # 替换为你的证书路径
    ssl_certificate_key certificate/example.com/example.key;   # 替换为你的私钥路径
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 安全防护配置（Block common exploits）
    add_header X-Frame-Options "SAMEORIGIN" always;     # 防点击劫持
    add_header X-XSS-Protection "1; mode=block" always; # 防XSS攻击
    add_header X-Content-Type-Options "nosniff" always; # 防MIME嗅探
    add_header Referrer-Policy "strict-origin" always;   # 控制referrer信息泄露
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always; # 强制HTTPS增强
    
    # 主请求代理配置
    location / {
        proxy_pass http://127.0.0.1:3001;   # 自定义后端服务地址
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

```
本地服务为入口文件的方式（直接用我的typecho博客的配置文件）：
使用本地入口文件的方式配置Nginx其实已经有相当大一部分是作为Web服务器的功能来使用了，需要匹配的就是本地入口文件的路径。
> [!WARNING] 注意
> 使用入口文件的方式可能会出现权限问题，如果有此类问题核心思路就是确保Nginx有访问入口文件的权限
```conf {5,6,16,21,22,52,53,54,55,94,108,109,110}
# 强制HTTP重定向到HTTPS（Force SSL）
server {
    listen 80;
    listen [::]:80;
    # 此处注意，如果使用A/AAAA方式配置 IP回源CDN这里要写CDN域名
    server_name exp.example.com;        # 改为您的域名
    return 301 https://$host$request_uri;  # 自动跳转HTTPS
}

# 主HTTPS服务配置
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;                      #开启http2支持
    # 此处注意，如果使用A/AAAA方式配置 IP回源CDN这里要写CDN域名
    server_name exp.example.com;    ## 改为您的域名

    proxy_cookie_path / "/; HTTPOnly; Secure";

    # SSL证书配置
    ssl_certificate certificate/exp.example.com/fullchain.cer;     # 替换为您的证书路径
    ssl_certificate_key certificate/exp.example.com/exp.example.com.key;   # 替换为您的私钥路径
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    server_tokens off;
    autoindex off;

    client_max_body_size 20m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # HSTS（确认 HTTPS 正常后再保留）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 必须单行，避免 HTTP2 协议错误
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" always;

    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

    if ($request_method !~ ^(GET|HEAD|POST)$) {
        return 403;
    }


    # 主请求代理配置
    root /WEB/typecho;
    index index.php index.html;
    charset utf-8;

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(db|sqlite|sqlite3|db3|sql|wal|shm)$ {
        deny all;
    }

    location ~* \.(ini|conf|log|sh|bak|env)$ {
        deny all;
    }

    location ~* /(usr/uploads|uploads|files|backup|temp)/.*\.(php|php5|phtml|phar)$ {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|svg|woff|woff2)$ {
        expires 30d;
        access_log off;

        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~* /(composer\.(json|lock)|package\.json|yarn\.lock|\.git) {
        deny all;
    }

    # =====================================================
    # 日志
    # =====================================================
    access_log /var/log/nginx/site_access.log;
    error_log  /var/log/nginx/site_error.log;

location ~ \.php$ {
    # 开启 PATHINFO 支持
    fastcgi_split_path_info ^(.+?\.php)(/.*)$;
    set $path_info $fastcgi_path_info;

    # 如果文件不存在直接返回404
    try_files $fastcgi_script_name =404;

    # 传递 PHP 脚本给 PHP-FPM
    fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;

    include fastcgi_params;
    
    # 使用cname方式配置cdn那么这里要配置一下cdn域名。
    # 使用a/aaaa方式的IP回源方式的CDN ， CDN域名就是访问域名，要在上面的server_name位置配置
    # fastcgi_param HTTP_HOST cdn.example.com;

    # 传递 PATH_INFO 和 PATH_TRANSLATED
    fastcgi_param PATH_INFO       $path_info;
    fastcgi_param PATH_TRANSLATED $document_root$path_info;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}

    location ~ /\.ht {
        deny all;
    }
}
```

> [!HINT] 回收开头
> 可以仔细查看中类型的配置文件，我们文章开头说过反向代理就是**如果······那么······** 的句式。而在配置文件中他们是这样的：
```
# 强制HTTP重定向到HTTPS（Force SSL）
server {
    listen 80;
    listen [::]:80;
    server_name exp.example.com;        # 改为您的域名
    return 301 https://$host$request_uri;  # 自动跳转HTTPS
}

# 主HTTPS服务配置
server {
    这里就是如果
    
    location / {
		# 这里就是那么
	}
}

```
也就是说 那么是作为如果的一部分进行输出的。 
# 常用命令
```bash
# 检查nginx配置是否有错误
nginx -t

# nginx启动
nginx

# nginx重启
nginx -s reload
```