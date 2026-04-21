const getWeatherData = require('./main');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 钉钉机器人配置
const DD_BOT_TOKEN = process.env.DD_BOT_TOKEN || 'c443d4b28d91876cb0d2a36e405b44c525e701e178f41445f09a468f4d453d4f';
const DD_BOT_SECRET = process.env.DD_BOT_SECRET || 'SEC991410be16a0e7156b6a015880d69768df8684a3be80bcd516c872eec032914e';

// 日志文件路径
const LOG_FILE = path.join(__dirname, 'weather_alert.log');

// 日志记录函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage, 'utf8');
}

// 发送钉钉消息
async function sendDingTalkMessage(title, content) {
  try {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${DD_BOT_SECRET}`;
    const hmac = crypto.createHmac('sha256', DD_BOT_SECRET);
    hmac.update(stringToSign);
    const sign = encodeURIComponent(hmac.digest('base64'));

    const url = `https://oapi.dingtalk.com/robot/send?access_token=${DD_BOT_TOKEN}&timestamp=${timestamp}&sign=${sign}`;

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: title,
        text: content
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.errcode === 0) {
      log('钉钉消息发送成功');
      return true;
    } else {
      log(`钉钉消息发送失败: ${response.data.errmsg}`);
      return false;
    }
  } catch (error) {
    log(`发送钉钉消息时出错: ${error.message}`);
    return false;
  }
}

// 生成天气消息内容
function generateWeatherMessage(weatherData) {
  if (!weatherData || !weatherData.today) {
    return '无法获取天气数据';
  }

  const today = weatherData.today;
  const tomorrow = weatherData.tomorrow;

  // 格式化日期，只显示日期部分
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return dateStr.split('T')[0];
  };

  // 格式化时间，只显示时间部分
  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    const match = timeStr.match(/T(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : timeStr;
  };

  let message = `# 曲阜地区天气提醒\n\n`;

  // 天气概览卡片
  message += `## 🌤️ 天气概览\n\n`;

  // 今天的天气
  message += `### 📅 今天 (${formatDate(today.date)})\n`;
  message += `| 项目 | 详情 |\n`;
  message += `|------|------|\n`;
  message += `| 天气状况 | ${today.condition} |\n`;
  message += `| 温度范围 | ${today.tempLo}°C ~ ${today.tempHi}°C |\n`;
  message += `| 体感温度 | ${today.feelsLo}°C ~ ${today.feelsHi}°C |\n`;
  message += `| 降水概率 | ${today.precip}% |\n`;
  message += `| 降水量 | ${today.rainAmount}mm |\n`;
  message += `| 风速风向 | ${today.windSpeed} ${today.windDir} |\n`;
  message += `| 日出日落 | ${formatTime(today.sunrise)} ~ ${formatTime(today.sunset)} |\n\n`;

  // 明天的天气
  if (tomorrow) {
    message += `### 📅 明天 (${formatDate(tomorrow.date)})\n`;
    message += `| 项目 | 详情 |\n`;
    message += `|------|------|\n`;
    message += `| 天气状况 | ${tomorrow.condition} |\n`;
    message += `| 温度范围 | ${tomorrow.tempLo}°C ~ ${tomorrow.tempHi}°C |\n`;
    message += `| 体感温度 | ${tomorrow.feelsLo}°C ~ ${tomorrow.feelsHi}°C |\n`;
    message += `| 降水概率 | ${tomorrow.precip}% |\n`;
    message += `| 降水量 | ${tomorrow.rainAmount}mm |\n`;
    message += `| 风速风向 | ${tomorrow.windSpeed} ${tomorrow.windDir} |\n`;
    message += `| 日出日落 | ${formatTime(tomorrow.sunrise)} ~ ${formatTime(tomorrow.sunset)} |\n\n`;
  }

  // 气温趋势图（使用ASCII图表）
  message += `## 🌡️ 气温趋势\n\n`;
  message += `\`\`\`\n`;
  message += `       今早    明早\n`;
  message += `       ${today.tempLo}°C    ${tomorrow ? tomorrow.tempLo : '--'}°C\n`;
  message += `        ↓        ↓\n`;
  message += `       ${today.tempHi}°C    ${tomorrow ? tomorrow.tempHi : '--'}°C\n`;
  message += `        ↑        ↑\n`;
  message += `\`\`\`\n\n`;

  // 降水预警
  message += `## 💧 降水预警\n\n`;

  // 今天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.today) {
    const todayPrecipData = weatherData.hourlyPrecipData.today;
    if (todayPrecipData.length > 0) {
      message += `### 📊 今天每小时降水概率\n\n`;

      // 生成ASCII降水概率图表（改进版，每列固定宽度）
      message += `时间:  0  2  4  6  8 10 12 14 16 18 20 22\n`;
      message += `\`\`\`\n`;
      message += `降水: `;

      for (let hour = 0; hour < 24; hour += 2) {
        const hourData = todayPrecipData.find(item => item.hour === hour);
        const precip = hourData ? hourData.precip : 0;
        const barLen = Math.floor(precip / 10);
        message += '█'.repeat(barLen).padEnd(10, ' ');
      }
      message += `\n\`\`\`\n`;

      // 详细降水数据
      const significantPrecip = todayPrecipData.filter(item => item.precip > 20);
      if (significantPrecip.length > 0) {
        message += `> 今天主要降水时段:\n`;
        significantPrecip.forEach(item => {
          const icon = item.precip >= 70 ? '🔴' : (item.precip >= 50 ? '🟠' : '🟡');
          message += `> ${icon} ${item.hour}:00 - 降水概率 ${item.precip}%, 降水量 ${item.rainAmount}mm\n`;
        });
      } else {
        message += `> 今天无明显降水\n`;
      }
      message += `\n`;
    }
  }

  // 明天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.tomorrow) {
    const tomorrowPrecipData = weatherData.hourlyPrecipData.tomorrow;
    if (tomorrowPrecipData.length > 0) {
      message += `### 📊 明天每小时降水概率\n\n`;

      // 生成ASCII降水概率图表（改进版，每列固定宽度）
      message += `时间:  0  2  4  6  8 10 12 14 16 18 20 22\n`;
      message += `\`\`\`\n`;
      message += `降水: `;

      for (let hour = 0; hour < 24; hour += 2) {
        const hourData = tomorrowPrecipData.find(item => item.hour === hour);
        const precip = hourData ? hourData.precip : 0;
        const barLen = Math.floor(precip / 10);
        message += '█'.repeat(barLen).padEnd(10, ' ');
      }
      message += `\n\`\`\`\n`;

      // 详细降水数据
      const significantPrecip = tomorrowPrecipData.filter(item => item.precip > 20);
      if (significantPrecip.length > 0) {
        message += `> 明天主要降水时段:\n`;
        significantPrecip.forEach(item => {
          const icon = item.precip >= 70 ? '🔴' : (item.precip >= 50 ? '🟠' : '🟡');
          message += `> ${icon} ${item.hour}:00 - 降水概率 ${item.precip}%, 降水量 ${item.rainAmount}mm\n`;
        });
      } else {
        message += `> 明天无明显降水\n`;
      }
    }
  }

  // 特别提醒
  message += `\n## ⚠️ 预警信息\n\n`;

  if (today.precip > 50) {
    message += `> 🔴 **暴雨预警：今天降水概率 ${today.precip}%，请携带雨具，注意出行安全！**\n\n`;
  } else if (today.precip > 30) {
    message += `> 🟡 **小雨预警：今天降水概率 ${today.precip}%，建议携带雨具**\n\n`;
  }

  if (tomorrow && tomorrow.precip > 50) {
    message += `> 🔴 **暴雨预警：明天降水概率 ${tomorrow.precip}%，请携带雨具，注意出行安全！**\n\n`;
  } else if (tomorrow && tomorrow.precip > 30) {
    message += `> 🟡 **小雨预警：明天降水概率 ${tomorrow.precip}%，建议携带雨具**\n\n`;
  }

  // 结束语
  message += `## 📅 更新时间\n`;
  message += `> ${new Date().toLocaleString('zh-CN')}`;

  return message;
}

// 主函数
async function main() {
  log('开始执行天气提醒任务');

  try {
    // 获取天气数据
    log('正在获取天气数据');
    const weatherData = await getWeatherData();

    if (!weatherData) {
      log('未获取到天气数据');
      return;
    }

    log('天气数据获取成功');

    // 生成消息内容
    const messageContent = generateWeatherMessage(weatherData);

    // 发送钉钉消息
    log('正在发送钉钉消息');
    const sendResult = await sendDingTalkMessage('曲阜天气提醒', messageContent);

    if (sendResult) {
      log('天气提醒任务执行成功');
    } else {
      log('天气提醒任务执行失败');
    }
  } catch (error) {
    log(`执行天气提醒任务时出错: ${error.message}`);
    // 发送错误通知
    await sendDingTalkMessage('天气提醒任务错误', `执行天气提醒任务时出错: ${error.message}`);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

// 导出函数
module.exports = { main, getWeatherData, sendDingTalkMessage, generateWeatherMessage };