# qufu-weather-alert

曲阜地区自动化天气提醒系统，获取天气预报数据并通过钉钉机器人推送降水预警信息。

## 功能特点

- 实时获取曲阜地区天气预报数据
- 通过钉钉机器人推送天气信息
- 特别关注降水预警信息
- 每天定时自动推送
- 全面的错误处理和日志记录
- 支持 GitHub Actions 定时执行

## 项目结构

```
qufu-weather-alert/
├── main.js                 # 天气数据获取模块
├── weather_alert.js       # 主脚本（数据获取+消息推送）
├── package.json           # 项目配置
├── .github/workflows/
│   └── weather-alert.yml   # GitHub Actions 配置
├── weather_alert.log      # 日志文件
└── README.md
```

## 环境要求

- Node.js 16+
- npm

## 安装

```bash
npm install
```

## 配置

### 钉钉机器人配置

1. 在钉钉群中添加自定义机器人
2. 获取机器人的 Webhook 地址
3. 在 GitHub 仓库的 `Settings > Secrets` 中添加：
   - `DD_BOT_TOKEN`：机器人的 access_token
   - `DD_BOT_SECRET`：机器人的签名密钥

## 使用

### 本地运行

```bash
# 获取天气数据
npm start

# 运行提醒推送
npm run alert
```

### GitHub Actions

项目已配置 GitHub Actions，每天 07:00（北京时间）自动运行。

手动触发：在 GitHub 仓库的 Actions 页面选择 "Weather Alert" workflow 点击 "Run workflow"。

## 消息格式

推送的消息为 Markdown 格式，包含：

### 今天/明天天气
- 天气状况
- 温度范围（最高/最低）
- 体感温度
- 降水概率
- 降水量
- 风速风向
- 日出日落时间

### 降水预警
- 每小时降水概率和降水量
- 降水概率 > 50% 时突出显示警告

## 日志

日志文件 `weather_alert.log` 记录：
- 任务开始/结束时间
- 数据获取状态
- 消息推送状态
- 错误信息

## 扩展

- 修改地区：编辑 `main.js` 中的 `lat` 和 `lon` 参数
- 修改推送时间：编辑 `.github/workflows/weather-alert.yml` 中的 cron 表达式
- 修改消息格式：编辑 `weather_alert.js` 中的 `generateWeatherMessage` 函数

## License

MIT