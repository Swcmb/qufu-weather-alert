# 曲阜天气提醒系统 (Qufu Weather Alert)

> 自动获取曲阜地区天气预报数据，通过钉钉机器人推送降水预警信息。

## 技术栈

- **运行时**: Node.js 16+
- **HTTP 客户端**: axios
- **数据源**: MSN Weather API
- **通知渠道**: 钉钉自定义机器人 (Webhook)
- **CI/CD**: GitHub Actions

## 项目结构

```
├── main.js                  # 天气数据获取模块（MSN API）
├── weather_alert.js         # 主脚本：数据获取 + 消息生成 + 钉钉推送
├── package.json             # 项目配置
├── Dockerfile               # Docker 容器化配置
├── .dockerignore            # Docker 构建排除规则
├── .gitignore               # Git 忽略规则
├── .github/workflows/
│   └── weather-alert.yml    # GitHub Actions 定时任务
└── README.md                # 项目文档
```

## 核心模块

### `main.js` — 天气数据获取
- 调用 `https://assets.msn.cn/service/weather/overview` API
- 坐标: 曲阜 (lat: 35.6016, lon: 116.9668)
- 返回今日/明日天气 + 每小时降水数据

### `weather_alert.js` — 主流程
- `generateWeatherMessage()`: 生成 Markdown 格式天气消息
- `sendDingTalkMessage()`: 钉钉机器人签名 + 发送
- `main()`: 主函数，串联数据获取 → 消息生成 → 推送

## 环境变量

| 变量 | 说明 | 必需 |
|:-----|:-----|:-----|
| `DD_BOT_TOKEN` | 钉钉机器人 access_token | ✅ |
| `DD_BOT_SECRET` | 钉钉机器人签名密钥 | ✅ |

## 开发命令

```bash
npm install          # 安装依赖
npm start            # 仅获取天气数据（main.js）
npm run alert        # 运行完整提醒流程（weather_alert.js）
docker build -t weather-alert .   # Docker 构建
docker run --rm weather-alert     # Docker 运行
```

## 架构决策

- 使用 MSN 公开 API，无需申请 API Key
- 钉钉签名使用 HMAC-SHA256，符合钉钉安全规范
- GitHub Actions UTC 23:00 = 北京时间 07:00
