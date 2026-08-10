---
title: SSL证书
published: 2026-08-10
#updated: 1970-01-01    # 更新日期，不配置则仅显示发布日期
pinned: false # 是否置顶
description: SSL证书的申请与部署
tags: [Nginx, Web服务器, 自建服务指南, 反向代理, 网站应用]
category: 网站服务
#password: "123456"     # 文章加密，此处设置密码
image: https://www.stackmeow.tech/file/1786283063839_20260809214411977.png # 封面
slug: certified # 自定义URL 配置为 draft 则为草稿
---

# 需求和目的

首先来一张图片。
![](https://www.stackmeow.tech/file/1786283594600_20260809215303042.jpg)
我们大家肯定或多或少都访问过这样的网站，网站没有加密，导致出现安全提醒。如果是你搭建的网站肯定也是不希望你的用户看到这样的界面的，否则可能就会和当时的你一样选择直接关掉网站。
除此之外，我们自用的一些服务也会用到证书，比如说你的Nas的公网访问等等。
那么这篇文章就是用来解决这个问题的。

> [!IMPORTANT] 写在前面
> 证书的申请与部署分为两种方式：终端命令行和WebUI工具。其中命令行工具运行在debian12中，WebUI工具则是基于Docker部署的。 终端命令行工具为 **[acme.sh](https://github.com/acmesh-official/acme.sh)**， WebUI工具为 **[Certimate](https://github.com/certimate-go/certimate)**

> [!INFO] 证书颁发机构
> 目前推荐的免费证书颁发机构只有三个：Let's Encrypt，ZeroSSL，Google Trust Servirce。三家机构颁发证书的区别见文章末尾[附录](#附录)。本文演示的证书颁发机构为Let's Encrypt。

# acme.sh 申请证书

> acme.sh 是一个运行在linux终端的证书申请脚本用来申请免费的SSL证书。

## 安装

1. 如果你的服务器位于中国大陆地区，那么需要先在终端执行下面这行命令，用来修改host。
   ```bash title="zsh"
   echo -e "185.199.111.154 github.githubassets.com\n140.82.113.22 central.github.com\n185.199.108.133 desktop.githubusercontent.com\n185.199.109.133 camo.githubusercontent.com\n185.199.109.133 github.map.fastly.net\n151.101.193.194 github.global.ssl.fastly.net\n140.82.116.3  gist.github.com\n185.199.110.153 github.io\n140.82.116.4  github.com\n140.82.116.5  api.github.com\n185.199.110.133 raw.githubusercontent.com\n185.199.110.133 user-images.githubusercontent.com\n185.199.110.133 favicons.githubusercontent.com\n185.199.109.133 avatars5.githubusercontent.com\n185.199.110.133 avatars4.githubusercontent.com\n185.199.108.133 avatars3.githubusercontent.com\n185.199.108.133 avatars2.githubusercontent.com\n185.199.109.133 avatars1.githubusercontent.com\n185.199.111.133 avatars0.githubusercontent.com\n185.199.111.133 avatars.githubusercontent.com\n140.82.116.10 codeload.github.com\n52.217.229.201  github-cloud.s3.amazonaws.com\n52.216.185.51 github-com\n.s3.amazonaws.com\n52.217.225.81 github-production-release-asset-2e65be.s3.amazonaws.com\n52.217.120.41 github-production-user-asset-6210df.s3.amazonaws.com\n3.5.28.232  github-production-repository-file-5c1aeb.s3.amazonaws.com\n185.199.111.153 githubstatus.com\n185.199.109.133 media.githubusercontent.com\n185.199.108.133 objects.githubusercontent.com\n185.199.109.133 raw.github.com\n138.91.182.224  copilot-proxy.githubusercontent.com" > /etc/hosts
   ```
2. 安装必要软件
   ```bash title="zsh"
   sudo apt install -y cron curl socat openssl git
   ```
3. 通过git下载acme.sh包
   ```bash title="zsh"
   git clone https://github.com/acmesh-official/acme.sh.git
   ```
4. 进入安装目录
   ```bash title="zsh"
   cd ./acme.sh
   ```
5. 执行安装
   ```bash title="zsh"
   ./acme.sh --install -m myemail@example.com      #这里天蝎你自己的邮箱
   ```
6. 重启终端以启用命令
   ````bash title="zsh"
   source ~/.bashrc
   ```
   ````
7. 启用脚本自动更新
   ```bash title="zsh"
   acme.sh --upgrade --auto-upgrade
   ```

## 配置

### 证书颁发机构配置

> [!INFO] 提示
> acme.sh 刚下载好之后默认的证书颁发机构为ZeroSSL，如果希望使用此机构那么不用做修改

切换 acme.sh 请求的证书颁发机构的命令如下：

```bash title="zsh"
acme.sh --set-default-ca --server letsencrypt  #将默认的证书颁发机构改成Let's Encrypt
acme.sh --set-default-ca --server zerossl      #将默认的证书颁发机构改成ZeroSSL
acme.sh --set-default-ca --server google       #将默认的证书颁发机构改成Google Public CA
```

### 为acme.sh证书颁发机构账号认证配置

> [!INFO] 提示
>
> - Let's Encrypt无需账号配置，不需要邮箱或者密钥认证
> - ZeroSSL账号配置（推荐我的这种方式，尽量不要用邮箱）; 需要先到ZeroSSL官网中注册账户，并在Developer中创建EAB Credentials for ACME Clients
> - GTS的证书申请密钥是一次性的，所以要随用随取，不过一旦证书申请成功，自动续期时仍然可用。

1. ZeroSSL

```bash title="zsh"
acme.sh --register-account --server zerossl \
--eab-kid xxxxxxxxxxxx \
--eab-hmac-key xxxxxxxxx
```

2. Google Trust Servirce
   1. 需要先拥有一个Google Cloud Platform（GCP）账号，然后进入控制台左上角新建/选择一个项目
   2. 在顶部搜索栏搜索并进入Public Certificate Authority API 之后点击启用
   3. 再之后点击右上角shell图标进入Cloud Shell使用以下命令获取 EAB 密钥 ID 和 HMAC
   4. 谷歌EAB密钥使用一次或者七天后自动失效，所以每次申请证书的时候都要来获取一次密钥，但续费不用

   ```bash title="GCP Shell-进入项目设置"
   gcloud config set project projectID
   ```

   ```bash title="GCP Shell-申请密钥"
   gcloud publicca external-account-keys create
   ```
   5. 在acme.sh中设置GCP 账号和项目密钥eab-kid是[申请到的 keyId]，eab-hmac-key是[申请到的 b64MacKey]

   ```bash title="zsh"
   acme.sh --register-account -m myemail@example.com --server google \
   --eab-kid xxxxxxx \
   --eab-hmac-key xxxxxxx
   ```

## 申请证书

> [!INFO] 提示
> 申请证书为了方便全都使用dns令牌的方式，以在cloudflare做dns为例。

> [!INFO] 提示
> 可以把dns令牌写入 ~/.acme.sh/account.conf,但我推荐以下方式。Cloudflare的Token申请方式不在本文讲解范围内可自行查询

其他常见dns供应商配置，参见文章末尾[附录](#附录)

1. 在终端中使用全局变量的方式传入你的CFtoken
   ```bash title="zsh"
   export CF_Token="your cf token"
   ```
2. 申请证书
   通配符证书
   ```bash title="zsh"
   acme.sh --issue --dns dns_cf \
   -d *.example.com \
   -d example.com \
   --keylength ec-256
   ```
   单个二级域名证书
   ```bash title="zsh"
    acme.sh --issue --dns dns_cf \
    -d exp.example.com \
    --keylength ec-256
   ```

> [!INFO] 提示
> 默认情况下证书存放在 ~/.acme.sh/example.com/目录下

## 安装/部署证书

> [!INFO] 提示
> 在本地环境中，我一般是使用Nginx作为Web服务器和反向代理的工具，所以此处就以Nginx为例。

使用以下命令将证书与密钥安装到指定目录，并在证书安装后重启Nginx服务
末尾的 `--reloadcmd` 这个参数就是在安装证书之后要执行的命令。

```bash title="zsh"
acme.sh --install-cert -d *.example.com --ecc \
--key-file /etc/nginx/certified/example.com/example.key \
--fullchain-file /etc/nginx/certified/example.com/fullchain.cer \
--reloadcmd "systemctl reload nginx"
```

> [!INFO] 提示
> acme.sh拥有Webhook能力，可以将证书部署到远程服务器，Webhost，CDN平台等能力，具体的远程部署方式和本地部署方式大相径庭，我这里就以七牛云为例。

假设你是要将泛域名证书部署到七牛云，并且你已经在七牛云创建了密钥。那么可以直接执行一下命令。

1. 传入密钥与加速域名的变量
   ```bash title="zsh"
   export QINIU_AK="your AK"
   export QINIU_SK="your SK"
   export QINIU_CDN_DOMAIN="cdn1.example.com cdn2.example.com"
   ```
2. 部署证书
   ```bash title="zsh"
    acme.sh --deploy -d *.example.com --deploy-hook qiniu
   ```

更多平台的部署方式可以参考[官方文档](https://github.com/acmesh-official/acme.sh/wiki/deployhooks)

# Web工具申请证书

> 使用Web工具进行证书管理不是必须的，但是我认为有一定的必要性，所以在文章中简单做一下讲解。

## 必要性

1. 方便操作，WebUI中的操作其实相比较与命令行终端肯定更加方便。
2. 方便控制额度，免费证书颁发机构在GTS中有每个项目1000张证书的限制，而另外两个机构有速率限制，Web管理工具可以很方便的做到本地一张证书部署多个平台，而这个功能在命令行终端的操作比较复杂。
3. 安全性，这也是最重要的一点。现在互联网上有很多扫SSL证书的脚本，这会给攻击者提供便利，直接扫描你的SSL证书申请的IP就能锁定你的源站。而Web管理工具完全可以搭建在自己家里的内网，然后部署到VPS，可以在一定程改上改善被攻击的情况。

## 安装部署Certimate

> [!INFO] 提示
> Certimate不是唯一拥有证书申请和部署的工具，但是它是专注于证书申请、部署和管理的工具。

> [!INFO] 提示
> Certimate最便利的使用方式就是通过Docker安装，我并不推荐二进制安装方式。**Docker的应用与配置不在本文的介绍范围内**。 我这里依然采用命令行终端的方式作为示范。

1. 在你自己配置Docker的目录创建用于存放Certimate的文件夹。并拉取Certimate的镜像。

   ```bash title="zsh"
    mkdir -p /etc/dockerApp/Certimate
   ```

   ```bash title="zsh"
   docker pull certimate/certimate:latest
   ```

2. 在Certimate中创建并编辑`docker-compose.yml`文件
   ```
   nvim docker-compose.yml
   ```
   写入以下docker配置文件
   ```yml
   <!--/etc/dockerApp/Certimate/docker-compose.yml-->
   docker run -d \
   --name certimate \
   --restart unless-stopped \
   -p 8090:8090 \
   -v /etc/localtime:/etc/localtime:ro \
   -v /etc/timezone:/etc/timezone:ro \
   -v $(pwd)/data:/app/pb_data \
   certimate/certimate:latest
   ```

> [!INFO] 提示
> 容器的默认访问端口是8090，创建成功之后在浏览器中输入 http://127.0.0.1:8090 来访问Certimate的Web管理界面。

## 简单配置与使用

访问web地址如果你看到下面的节目那就说明你成功了。
![](https://www.stackmeow.tech/file/1786294797887_20260810005948075.jpg)
填入出事的管理员账号和密码

- 账号 ： admin@certimate.fun
- 密码 ： 1234567890

登陆进来之后首先到**系统设置->账号**
处修改默认的账号和密码。
![](https://www.stackmeow.tech/file/1786295013511_20260810010321749.jpg)

接下来到授权凭据处点击右上角的新建授权，添加你的DNS提供商
![](https://www.stackmeow.tech/file/1786295100094_20260810010450355.jpg)

> [!INFO] 提示
> 在证书颁发机构的授权中如果你依然想要使用Let's Encrypt为你颁发证书，那么此处不同添加证书授权凭据，其他的办法机构按情况添加授权。

添加完授权凭据之后到工作流中新建工作流，选择，标准业务流程。
然后你就会看到下面的界面
![](https://www.stackmeow.tech/file/1786295281085_20260810010750177.jpg)

在**开始**节点选择定时触发，这里会让你写CRON表达式来设定工作流之后每一次出发的时间节点。你可以按照自己的需求写，不会的话可以找AI写表达式

**忽略尝试执行节点**

在**申请证书**节点，选择域名证书；在这里你可以配置多项参数。域名这里我推荐直接写泛域名。大多数参数你按照自己的需求和实际情况填写就行，这里我只说几个需要注意或者我推荐的配置项。

- 质询方式：DNS-01
- 密钥算法：EC256（仅推荐，你要按照你的需求选）
- 阻止 CSR 包含主题通用名称：打开
- 阻止 CNAME 跟随：打开
- 阻止 ARI 续期：打开

在**部署**节点选择你要部署的目标平台。由于不同的目标平台的配置不统一，不再一一列举。不同目标平台的授权凭据与域名选择不在本文的介绍范围内。

至此，Certimate的工作流建立完成。建立完成后，点击右上角的发布更改即可保存，同时不要忘记启用工作流。我这里建议手动运行一次检查是否有配置错误的情况
![](https://www.stackmeow.tech/file/1786295905187_20260810011815364.jpg)

> [!INFO] 提示
> 如果你需要在失败的时候收到通知可以选择通知节点进行配置。

# 附录

##### 证书颁发机构

| **CA名称** | **ZeroSSL(acme.sh默认)**                                                                                                         | **Let's Encrypt(使用最广泛，最推荐)**                                                                                             | **Google Public CA(谷歌提供的免费CA)**                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **特点**   | 90天有效期</br>✅ 通配符支持</br>✅ 无速率限制</br>🚫 通过邮箱或EAB强制验证</br>✅自动续期不占用额度</br>✅单证书验证域名数：100 | 90天有效期</br>✅ 通配符支持</br>🚫速率：50张/域名/</br>✅ 无需账户/邮箱验证</br>✅自动续期不占用额度</br>✅单证书验证域名数：100 | 90天有效期</br>✅ 通配符支持</br>🚫速率：100张/小时</br>🚫 通过GCP项目EAB强制认证</br>✅自动续期不占用额度</br>✅单证书验证域名数：100</br>✅ 集成谷歌云服务</br>🚫项目账户申请证书</br>🚫限制：1000张/项目 |

##### 常见DNS供应商配置

| 机构               | dns参数       | token令牌命令（必须在申请证书之前操作）                                                                                                                   |
| ------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare**     | dns_cf        | CF_Token="your cf token"                                                                                                                                  |
| 腾讯云             | dns_dp        | export DP_Id="123456"</br>export DP_Key="abcdef"                                                                                                          |
| 阿里云             | dns_ali       | export Ali_Key="123456"</br>export Ali_Secret="abcdef"                                                                                                    |
| 华为云             | dns_huawei    | export HUAWEICLOUD_Username="<Your IAM Username>"</br>export HUAWEICLOUD_Password="<Your Password>"</br>export HUAWEICLOUD_DomainName="<Your DomainName>" |
| GoDaddy            | dns_gd        | export GD_Key="<key>"export GD_Secret="<secret>"                                                                                                          |
| DigitalOcean       | dns_dgon      | export DO_API_KEY="<key>”                                                                                                                                 |
| netcup             | dns_netcup    | export NC_Apikey="<Apikey>"</br>export NC_Apipw="<Apipassword>"export NC_CID="<Customernumber>”                                                           |
| Vultr DNS          | dns_vultr     | export VULTR_API_KEY="<Your API key>"                                                                                                                     |
| AWS Route53        | dns_aws       | export AWS_ACCESS_KEY_ID="<key id>"</br>export AWS_SECRET_ACCESS_KEY="<secret>"                                                                           |
| Google Cloud DNS   | dns_gcloud    | export CLOUDSDK_ACTIVE_CONFIG_NAME=default                                                                                                                |
| Namecheap          | dns_namecheap | export NAMECHEAP_USERNAME="..."</br>export NAMECHEAP_API_KEY="..."</br>export NAMECHEAP_SOURCEIP="..." _# 必须添加_                                       |
| Hurricane Electric | dns_he        | export HE_Username="<yourusername>"</br>export HE_Password="<password>"                                                                                   |
| Porkbun            | dns_porkbun   | export PORKBUN_API_KEY="..."</br>export PORKBUN_SECRET_API_KEY="..."                                                                                      |

