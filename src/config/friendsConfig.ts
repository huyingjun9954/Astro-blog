import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "夏夜流萤",
		imgurl:
			"https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
		desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
		siteurl: "https://blog.cuteleaf.cn",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "年华",
		imgurl:
			"https://tu.520781.xyz/file/blog/1779979945007_a.gif",
		desc: "分享生活和技术。",
		siteurl: "https://blog.amamo.top",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "潇绪空のBlog",
		imgurl:
			"https://reknal.com/assets/images/avatar.avif",
		desc: "共同见证奇迹诞生！",
		siteurl: "https://reknal.com/",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
		{
		title: "Xixmu",
		imgurl:
			"https://xixmu.top/_astro/head_ima.rsW3s28l_1KtIxl.avif",
		desc: "在记忆干枯前描绘",
		siteurl: "https://xixmu.top",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "YuJing的记忆终端",
		imgurl:
			"https://www.yujingblog.top/assets/home/avatar.webp",
		desc: "不怪天气不好，是我心事太多。",
		siteurl: "https://www.yujingblog.top",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "Silvaire's Blog",
		imgurl:
			"https://wsrv.nl/?url=avatars.githubusercontent.com/u/184231508?s=400&u=0a370792ba6bbb95a04d309171b562bcd7283a0f&v=4&mask=circle",
		desc: " ",
		siteurl: "https://silvaire.top",
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},	
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
