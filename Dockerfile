FROM node:18-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json ./
RUN npm ci --production

# 复制源码
COPY main.js weather_alert.js ./

# 运行时通过 -e DD_BOT_TOKEN=xxx -e DD_BOT_SECRET=xxx 传入
CMD ["node", "weather_alert.js"]
