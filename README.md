# ClaudeMatch (linQ) 微信小程序

AI 驱动的匹配平台 — 商务合作、约会交友、本地伙伴。

Web 版: https://claudematch.com | 仓库: https://github.com/zhangcheng0688/claudematch

## 技术栈

- 微信小程序原生框架
- Supabase Auth (邮箱 + OTP 验证码)
- TanStack Server Functions (后端 API, 已就绪)

## 项目结构

```
├── app.js                 # 应用入口
├── app.json               # 全局配置 + tabBar
├── app.wxss               # 全局样式 (linQ dark theme)
├── utils/
│   └── request.js         # HTTP 请求封装 + OTP 认证
├── pages/
│   ├── index/             # 首页 (落地页 + 等候名单)
│   ├── auth/              # 登录 (邮箱 + 6位OTP)
│   ├── start/             # 引导填写AI画像
│   ├── match/             # AI匹配结果列表
│   ├── match-detail/      # 匹配详情 + 会面计划
│   ├── settings/          # 偏好设置 (dating/business/partner)
│   └── profile/           # 个人中心
└── images/                # Tab 图标
```

## 页面映射

| Web 路由 | 小程序页面 | 状态 |
|---------|-----------|------|
| `/` | `pages/index/index` | ✅ |
| `/auth` | `pages/auth/auth` | ✅ |
| `/start` | `pages/start/start` | ✅ |
| `/profile` | `pages/profile/profile` | ✅ |
| `/match` | `pages/match/match` | ✅ |
| `/match/[id]` | `pages/match-detail/match-detail` | ✅ |
| `/settings` | `pages/settings/settings` | ✅ |

## 开发步骤

1. 微信开发者工具 → 导入项目
2. 在 `app.json` 中替换 `appid` 为正式小程序ID
3. 在微信公众平台添加 request 合法域名：
   - `https://claudematch.com`
   - `https://lmhnvrxhwyahjpspavuf.supabase.co`
4. Tab 图标使用占位颜色方块，需替换为正式图标

## 配色 (Dark Theme)

- 背景: `#0f172a`
- 卡片: `#1e293b`
- 主色: `#6366f1` (indigo)
- 强调: `#f472b6` (pink)
- 文字: `#f8fafc` / `#94a3b8` / `#64748b`

## 登录流程

邮箱输入 → 发送OTP → 输入6位码 → Supabase验证 → 存储Token → 跳转引导页
