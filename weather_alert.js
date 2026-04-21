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
  
  let message = `# 曲阜地区天气提醒\n\n`;
  
  // 今天的天气
  message += `## 今天 (${today.date})\n`;
  message += `- 天气状况: ${today.condition}\n`;
  message += `- 温度: ${today.tempLo}°C ~ ${today.tempHi}°C\n`;
  message += `- 体感温度: ${today.feelsLo}°C ~ ${today.feelsHi}°C\n`;
  message += `- 降水概率: ${today.precip}%\n`;
  message += `- 降水量: ${today.rainAmount}mm\n`;
  message += `- 风速风向: ${today.windSpeed} ${today.windDir}\n`;
  message += `- 日出日落: ${today.sunrise} ~ ${today.sunset}\n\n`;
  
  // 明天的天气
  if (tomorrow) {
    message += `## 明天 (${tomorrow.date})\n`;
    message += `- 天气状况: ${tomorrow.condition}\n`;
    message += `- 温度: ${tomorrow.tempLo}°C ~ ${tomorrow.tempHi}°C\n`;
    message += `- 体感温度: ${tomorrow.feelsLo}°C ~ ${tomorrow.feelsHi}°C\n`;
    message += `- 降水概率: ${tomorrow.precip}%\n`;
    message += `- 降水量: ${tomorrow.rainAmount}mm\n`;
    message += `- 风速风向: ${tomorrow.windSpeed} ${tomorrow.windDir}\n`;
    message += `- 日出日落: ${tomorrow.sunrise} ~ ${tomorrow.sunset}\n\n`;
  }
  
  // 降水预警
  message += `## 降水预警\n`;
  
  // 今天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.today) {
    const todayPrecipData = weatherData.hourlyPrecipData.today.filter(item => item.precip > 0);
    if (todayPrecipData.length > 0) {
      message += `### 今天降水时段\n`;
      todayPrecipData.forEach(item => {
        message += `- ${item.hour}:00: 降水概率 ${item.precip}%, 降水量 ${item.rainAmount}mm\n`;
      });
      message += `\n`;
    }
  }
  
  // 明天的每小时降水数据
  if (weatherData.hourlyPrecipData && weatherData.hourlyPrecipData.tomorrow) {
    const tomorrowPrecipData = weatherData.hourlyPrecipData.tomorrow.filter(item => item.precip > 0);
    if (tomorrowPrecipData.length > 0) {
      message += `### 明天降水时段\n`;
      tomorrowPrecipData.forEach(item => {
        message += `- ${item.hour}:00: 降水概率 ${item.precip}%, 降水量 ${item.rainAmount}mm\n`;
      });
    }
  }
  
  // 特别提醒
  if (today.precip > 50) {
    message += `\n> **⚠️ 预警：今天降水概率较高，请携带雨具**\n`;
  }
  
  if (tomorrow && tomorrow.precip > 50) {
    message += `\n> **⚠️ 预警：明天降水概率较高，请携带雨具**\n`;
  }
  
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