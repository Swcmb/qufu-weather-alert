const getWeatherData = require('./main');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 钉钉机器人配置
const { token: DD_BOT_TOKEN, secret: DD_BOT_SECRET } = config.dingtalk;

// 日志文件路径
const LOG_FILE = path.join(__dirname, config.log.file);

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
  message += `       今  天      明  天\n`;
  message += `    ┌───────────┐┌───────────┐\n`;
  message += `最高│${today.tempHi.toString().padStart(4)}°C    ││${(tomorrow ? tomorrow.tempHi : '--').toString().padStart(4)}°C    │\n`;
  message += `    │           ││           │\n`;
  message += `    │     🌞    ││     🌤️    │\n`;
  message += `    │           ││           │\n`;
  message += `最低│${today.tempLo.toString().padStart(4)}°C    ││${(tomorrow ? tomorrow.tempLo : '--').toString().padStart(4)}°C    │\n`;
  message += `    └───────────┘└───────────┘\n`;
  message += `\`\`\`\n\n`;

  // 降水预警
  message += `## 💧 降水预警\n\n`;

  function generatePrecipChart(precipData, title) {
    let chart = `### 📊 ${title}每小时降水概率\n\n`;
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const maxPrecip = Math.max(...precipData.map(item => item.precip || 0), 100);
    
    chart += `\`\`\`\n`;
    chart += `     降水概率 (%)\n`;
    chart += `    100 ┼\n`;
    chart += `     80 ┼${getBarLine(precipData, hours, 80)}\n`;
    chart += `     60 ┼${getBarLine(precipData, hours, 60)}\n`;
    chart += `     40 ┼${getBarLine(precipData, hours, 40)}\n`;
    chart += `     20 ┼${getBarLine(precipData, hours, 20)}\n`;
    chart += `      0 ┼${getBarLine(precipData, hours, 0)}\n`;
    chart += `         ┼────────────────────────────────────────\n`;
    chart += `         0  3  6  9 12 15 18 21 时间 (时)\n`;
    chart += `\`\`\`\n`;
    
    const significantPrecip = precipData.filter(item => item.precip > 20);
    if (significantPrecip.length > 0) {
      chart += `> 主要降水时段:\n`;
      significantPrecip.forEach(item => {
        const icon = item.precip >= 70 ? '🔴' : (item.precip >= 50 ? '🟠' : '🟡');
        chart += `> ${icon} ${item.hour.toString().padStart(2, '0')}:00 - 降水概率 ${item.precip}%, 降水量 ${item.rainAmount}mm\n`;
      });
    } else {
      chart += `> ${title}无明显降水\n`;
    }
    chart += `\n`;
    
    return chart;
  }
  
  function getBarLine(precipData, hours, threshold) {
    let line = '';
    for (let i = 0; i < hours.length; i += 3) {
      const hourData = precipData.find(item => item.hour === hours[i]);
      const precip = hourData ? hourData.precip : 0;
      if (precip > threshold) {
        line += ' █';
      } else if (precip === threshold) {
        line += ' ■';
      } else {
        line += '  ';
      }
    }
    return line;
  }

  // 今天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.today) {
    const todayPrecipData = weatherData.hourlyPrecipData.today;
    if (todayPrecipData.length > 0) {
      message += generatePrecipChart(todayPrecipData, '今天');
    }
  }

  // 明天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.tomorrow) {
    const tomorrowPrecipData = weatherData.hourlyPrecipData.tomorrow;
    if (tomorrowPrecipData.length > 0) {
      message += generatePrecipChart(tomorrowPrecipData, '明天');
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