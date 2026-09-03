---
title: PostgresQL 基础搭建与使用配置
published: 2026-08-28
pinned: false
description: 关于postgresql的搭建与基本的使用和配置的简单教程
tags:
  - 数据库
  - PostgresQL
  - Docker
category: 数据库
image: https://www.stackmeow.tech/file/1787847726962_20260828002117320.png
slug: pgsqlBuild
---
# 需求和必要性
其实本文是最基础的postgresql的教程，如果自己已经在开发应用了应该就已经会使用postgresql了，根本不需要本教程，但是还有一些用户其实是自己需要搭建一些应用，而这些应用本身需要连接数据库，比如一些动态博客，或者一些整理工具等。

# 创建PostgresQL
> [! info]
首先我们需要理解一个概念就是PostgresQL是这个程序的名称，它本身不是数据库，他是一个创建管理数据库的软件，本文使用Docker搭建Postgresql，并不是你创建的每一个应用都需要创建一个Postgresql容器，而已创建好Postgresql容器后你可以添加无数个数据库来让你的应用连接它。

> [!INFO]
本文使用Docker-compose搭建PostgreSQL，使用的PostgresQL镜像版本是18.6（只是我喜欢这个版本而已）


使用以下命令来拉取镜像(镜像)：
	
```bash title="zsh"
docker pull postgres:18.6
```
创建一个用于postgresql容器持久化的挂载目录
```bash title="zsh"
docker volume create postgresql_data
```
创建一个属于postgresql的桥接网络(本地的所有docker搭建的应用都要连接这个桥接网络)
```bash title="zsh"
docker network create custom-network
```

编辑docker-compose文件：
```yml
<!--/dockercompose/postgresql/docker-compose.yml-->
services:
  postgres:
    image: postgres:18.6        # 使用官方PostgreSQL 18.6镜像
    container_name: postgreSQL  # 指定容器名称（可选）
    # network_mode: host          # 容器使用宿主机网络（主要为了配置权限远程访问）
    ports:
	    - "127.0.0.1:5432:5432"     # 仅本地回环监听，禁止公网直接访问
	    #- "10.0.0.1:5432:5432"     # 需要远程连接的时候配置私有网络，这里添加私有网络监听
	  restart: unless-stopped     # 容器意外退出时自动重启
    environment:
      POSTGRES_USER: postgres    # 超级管理员用户名，这里是默认的部署的时候要更改
      POSTGRES_PASSWORD: 123456  # 超级用户密码
      POSTGRES_DB: dbname         # 预先创建业务数据库，避免使用默认库
      TZ: Asia/Shanghai
      restart: always
    volumes:
      - postgresql_data:/var/lib/postgresql  # 持久化数据卷
    networks:
      - custom-network  # 自定postgresql桥接网络   
volumes:
  postgresql_data:  # 声明卷，如果不存在会自动创建
    external: true  # 如果卷已提前创建（如上一步），建议设为 true
networks:
  custom-network:  # 在 Compose 文件中使用的网络标识符，可与外部网络名不同，但建议一致
    external: true  # 声明此网络已在外部创建
    name: custom-network  # 重要：指定现有的 Docker 网络的实际名称
```
在同VPS中搭建的其他的需要连接postgresql数据库的服务都需要在docker-compose.yml添加以下配置,以加入postgresql的桥接网络来连接postgresql
```yml
<!--/dockercompose/expcontainer/docker-compose.yml-->
 # servirce部分
        networks:
            - custom-network
# 声明：加入自定义网络
networks:
  custom-network:  # 在 Compose 文件中使用的网络标识符，可与外部网络名不同，但建议一致
    external: true  # 声明此网络已在外部创建
    name: custom-network  # 重要：指定现有的 Docker 网络的实际名称
```
> [!INFO]
因为这是直接使用的生产环境的搭建方式，所以监听的就是本地回环，如果需要在自己的电脑中连接数据库，那么需要使用ssh隧道的方式连接，如果是不同的VPS要连接这个数据库，那么需要使用建立私有网络的方式。
# 操作PostgresQL
> [!INFO]
PostgreSQL并没有一个WEB终端，需要在Linux终端中直接操作PostgreSQL
PostgreSQL中 SQL语句不区分大小写，可以按照自己的习惯来，数据库名称也不区分大小写，所以数据库名称尽量全都使用小写，任何引号里面的内容都区分大小写.

通过docker命令直接连接(需要输入数据库密码)：
```bash title="zsh"
docker exec -it <容器名> psql -U <用户名>
```
或者使用以下命令进入PostgreSQL容器的终端,将PostgreSQL容器的ID替换成你自己的
```bash title="zsh"
docker exec -it mysql_cortainer_id /bin/bash
```
然后使用以下命令连接你的PostgreSQL(以没有配置管理员用户名，采用默认posgtres用户名为例)：
```bash title="zsh"
psql -U postgres -d postgres
```
> [!WARRING]
第一个postgres是用户名，第二个postgres是默认的数据库名，这个命令中数据库名称决定的是你默认连接进去之后连接的是哪个数据库


## 用户基本操作：
创建一个新角色前面是角色名，后面是密码。 一般我的操作是一个数据库对应一个角色，这个用户只能操作这个数据库(与mysql不同这里的角色名不需要双引号)
```bash title="psql bash"
CREATE ROLE dbname_user WITH LOGIN PASSWORD 'dbname_user_password';
```
部分应用连接数据库的时候需要超级管理员可以创建一个新的超级管理员，等初始化好数据库之后再收回超级管理员权限并分配数据库的操作权限
```bash title="psql bash"
CREATE ROLE dbname_user WITH LOGIN PASSWORD 'strong_password' SUPERUSER;
```
收回超级权限
```bash title="psql bash"
ALTER ROLE dbname_user WITH NOSUPERUSER;
```
## 数据库基本操作:
使用纯净模板创建一个数据库
```bash title="psql bash"
CREATE DATABASE dbname TEMPLATE template0;
```
postgresql 会默认给所有角色连接权限,所以需要收掉默认开放 + 给库级 CONNECT与CRECT权限；依次执行下面三条SQL语句，收回所有人可连的默认权限，只给dbname_user连接与创建权限：
```bash title="psql bash"
REVOKE CONNECT ON DATABASE "dbname" FROM PUBLIC;
GRANT CONNECT ON DATABASE "dbname" TO dbname_user;
GRANT CONNECT, CREATE ON DATABASE dbname TO dbname_user;
```

postgresql需要切换到对应的数据库之后来指定某个用户对这个数据库有什么权限
```bash title="psql bash"
\c dbname
```
依次执行下面五条SQL语句授予用户对 public schema 的所有权限（包括现有表和序列）
```bash title="psql bash"
GRANT ALL PRIVILEGES ON SCHEMA public TO dbname_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbname_user; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbname_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dbname_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dbname_user;
```
查看权限
```bash title="psql bash"
\l dbname
```
正确的话应该是输出这个（注意查看数据库用户名）
![](https://www.stackmeow.tech/file/1787849402257_20260828004950761.jpg)

## 在PostgreSQL中有一个独特的用法叫做角色
角色类似于linux中的用户组，创建好的用户加入角色就会继承角色的权限。
创建一个角色(没有登录权限的用户就是角色组)
```bash title="psql bash"
CREATE ROLE role_name WITH NOLOGIN;
```
将一个用户加入一个组
```bash title="psql bash"
GRANT role_name TO dbname_user;
```
将用户从角色中移除
```bash title="psql bash"
REVOKE role_name FROM dbname_user;
```
> [!INFO]
在对于数据库的权限操作中，角色组的权限分配方式与普通用户的权限分配方式的操作相同
# PostgresQL常用命令
>[!INFO]
是PostgresQL的命令，不是SQL语句，本文没有任何针对于SQL语句的教程，只有配置数据库的时候需要用到的SQL语句

```txt
# 连接数据库（从命令行）
psql -U 用户名 -d 数据库名 -h 主机 -p 端口

# 切换当前数据库
\c 数据库名

# 查看当前连接信息
\conninfo

# 退出 psql
\q

# 查看所有数据库
\l

# 创建数据库
CREATE DATABASE 数据库名;

# 删除数据库
DROP DATABASE 数据库名;

# 重命名数据库
ALTER DATABASE 旧名称 RENAME TO 新名称;

# 查看所有用户（角色）
\du

# 创建用户（角色）
CREATE USER 用户名 WITH PASSWORD '密码';

# 删除用户
DROP USER 用户名;

# 修改用户密码
ALTER USER 用户名 WITH PASSWORD '新密码';

# 授予数据库连接权限
GRANT CONNECT ON DATABASE 数据库名 TO 用户名;

# 授予数据库创建权限（允许在库中创建 schema）
GRANT CREATE ON DATABASE 数据库名 TO 用户名;

# 授予 schema 所有权限（例如 public schema）
GRANT ALL ON SCHEMA public TO 用户名;

# 授予已有表的所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO 用户名;

# 授予已有序列的所有权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO 用户名;

# 设置默认权限（未来创建的表自动授权）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO 用户名;

# 查看当前数据库中的所有表
\dt

# 查看表结构
\d 表名

# 创建表
CREATE TABLE 表名 (列定义);

# 删除表
DROP TABLE 表名;

# 清空表数据
TRUNCATE TABLE 表名;

# 修改表结构（添加列）
ALTER TABLE 表名 ADD COLUMN 列名 类型;

# 修改表结构（修改列类型）
ALTER TABLE 表名 ALTER COLUMN 列名 TYPE 新类型;

# 插入数据
INSERT INTO 表名 (列1, 列2) VALUES (值1, 值2);

# 查询数据
SELECT * FROM 表名 WHERE 条件;

# 更新数据
UPDATE 表名 SET 列=新值 WHERE 条件;

# 删除数据
DELETE FROM 表名 WHERE 条件;

# 查看当前用户
SELECT current_user;

# 查看 PostgreSQL 版本
SELECT version();

# 查看当前数据库
SELECT current_database();

# 执行外部 SQL 文件
\i 文件路径

# 开启/关闭查询执行时间
\timing
```