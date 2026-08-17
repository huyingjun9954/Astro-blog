---
title: Git多账号管理
published: 2026-08-18
#updated: 1970-01-01    # 更新日期，不配置则仅显示发布日期
pinned: false # 是否置顶
description: Git多平台多账号管理简单教程
tags: [Git入门, 代码托管, Git管理, GitHub]
category: Git
#password: "123456"     # 文章加密，此处设置密码
image: https://www.stackmeow.tech/file/1786986969005_20260818011602858.png # 封面
slug: gitManager # 自定义URL 配置为 draft 则为草稿
---

# 需求和必要性
我们在管理自己的代码仓库的时候会遇到这样的情况：自己的代码托管平台有多个：Github、Gitee、GitLab等；我们的工作还会至少有一个Git仓库，甚至于我们需要管理多个同一个平台的不同账号，这就需要用到我们今天这篇文章中的内容。
> [!INFO]
> 文章适用于Mac和Linux 如果是windows需要提前配置一下可使用的终端。为了方便讲解，本文使用GitHub单一平台作为演示

> [!INFO]
> Git与GIthub等平台的用法以及概念及理解不在本文的介绍范围内。

# 在本地电脑上创建密钥对
使用下面的命令创建本地密钥对（一个公钥 一个私钥），你有几个平台几个账号就创建几个。
这个命令会提示你输入本地管理密码，你可以自定义，直接回车就是不设置密码。
user-1@example.com 替换为你实际这个账号使用的邮箱；
user-1 替换为自己能记住的名字 我一般直接使用自己在Git平台的用户名。

```bash title = "zsh"
ssh-keygen -t ed25519 -C "user-1@example.com" -f ~/.ssh/user-1
```

```bash title = "zsh"
ssh-keygen -t ed25519 -C "user-2@company.com" -f ~/.ssh/user-2
```
创建之后在你的 `~/.ssh/` 目录下你应该可以看到两个账户的 公钥文件和私钥文件

```bash title = "zsh"
user-1                 # user-1的私钥
user-1.pub             # user-1的公钥

user-2                 # user-2的私钥
user-2.pub             # user-2的公钥
```
# 在Git平台创建ssh-key
使用你的文本编辑器打开或者直接在终端使用cat命令查看你的公钥文件的内容并将它完整复制出来.
在github官网点击右上角头像→settings→左侧列表里面的SSH and GPG keys.
在打开的页面中 在**SSH Keys**这个部分点击右上角的**New SSH**
> [!INFO]
> 所有账号都需要重复操作上面的流程，注意每个账号的公钥和私钥都是对应的必须从复制对应的公钥在对应的账号创建SSH-Key才能正常使用
# 在本地电脑配置config用来让git命令可以识别
在`~/.ssh/` 这个目录下创建一个名为`config`的文件，文件名就叫config,没有任何后缀

然后编辑它 写入以下内容
```txt
<!--~/.ssh/config-->
# 第一个账号
Host github.com-user-1     # user-1换成你自己自定义的名称，将来是需要在命令中使用的
    HostName github.com    # 不可更改，这里是git平台的官方访问域名（其他平台就写其他平台的访问域名）
    User git               # 不可更改
    IdentityFile ~/.ssh/user-1  # 这里是私钥文件路径，要换成你自己的文件名

# 第二个账号
Host github.com-user-2
    HostName github.com
    User git
    IdentityFile ~/.ssh/user-2
```
使用下面的命令赋予这个文件权限
```bash title = "zsh"
chmod 600 config
```
# Git识别配置
> [!INFO]
> 既然用到了通过SSH的方式为不同的仓库推送代码，那么这种方式肯定有一个识别管理，就是说user-1账号使用user-1的ssh 对user-1的仓库执行 clone push pul等操作 ， user-2账号使用user-2的ssh 对user-2的仓库执行 clone push pul等操作 ；不可能是user-1 完全使用user-1和user-2的SSH执行所有操作，所以我们需要配置一下，可以让git在不同的仓库中使用不同的账号。

1. 使用以下代码移除原来在你的电脑中保存的GitHub的账号信息。也就是用户昵称和邮箱
   ```bash title = "zsh"
   git config --global --unset user.name
   git config --global --unset user.email
   ```
2. 在.gitconfig这个文件的同目录下（一般是根目录：~）创建两个账号自己的config，比如我的习惯是：
   ```bash title = "zsh"
   touch .gitconfig-user1 .gitconfig-user2
   ```
3. 编辑这两个文件分别添加以下代码加入他们的账号信息也就是name和email（需要严格对应你在github的显示名称和邮箱）
   ```txt
   <!--~/.gitconfig-user1-->
   [user]
      name = user.name
      email = user@example.com
   ```
4. 在.gitconfig添加以下代码分别为每个账号指定工作目录，该工作目录下的所有仓库都会使用这个账号进行操作。比如我的Github的工作目录结构是这样的：
   ```bash title = "zsh"
   ~/GitHub
   ├── user1
   │   ├── user1.repo1
   │   └── user1.repo2
   └── user2
        ├── user2.repo1
        └── user2.repo2
   ```
   那么我在.gitconfig中就应该添加以下代码(注意自己的工作目录实际位置，注意自己之前编写的账号配置文件的名称，注意目录必须使用/ /包裹)：
   ```txt
   <!--~/.gitconfig-->
   [includeIf "gitdir:~/GitHub/user1/"]
      path = ~/.gitconfig-user1
   [includeIf "gitdir:~/GitHub/user1/"]
      path = ~/.gitconfig-user2
   ```

# 使用方法
> [!INFO]
> 如果你本地已经使用https的方式克隆过自己的仓库那么所有仓库都要执行一遍；进入该仓库并且使用以下命令切换推送源和推送方式 之后就可以直接使用git push了（注意使用对应的账号别名）
```bash title = "zsh"
# 把官方地址改成你的别名地址（只改这一次）
git remote set-url origin git@github.com-user-1:user-1/myproject.git
```
这个对应的参数是：
```bash title = "zsh"
git remote set-url origin git@github.com-user-1:你的用户名/仓库名.git
```
如果你本地没有克隆过自己的仓库，并且接下来要克隆的仓库也是使用ssh进行管理那么你的clone命令要使用（注意使用对应的账号别名）：
```bash title = "zsh"
git clone git@github.com-user-1:你的用户名/仓库名.git
```

