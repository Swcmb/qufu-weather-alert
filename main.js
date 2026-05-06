const axios = require('axios');
const config = require('./config');

async function getWeatherData() {
  try {
    const { url, params, headers } = config.weather;

    const response = await axios.get(url, { params, headers });
    const data = response.data;

    // 尝试提取天气数据
    let weatherData = [];
    
    if (data && data.responses && data.responses.length > 0) {
      // 遍历 responses 数组
      for (let i = 0; i < data.responses.length; i++) {
        const weatherResponse = data.responses[i];
        
        // 检查是否有 weather 属性
        if (weatherResponse.weather) {
          // 检查 weather 对象中的数据
          if (weatherResponse.weather.forecastDays) {
            weatherData = weatherResponse.weather.forecastDays;
            break;
          } else if (weatherResponse.weather.dailyForecasts) {
            weatherData = weatherResponse.weather.dailyForecasts;
            break;
          } else if (weatherResponse.weather.days) {
            weatherData = weatherResponse.weather.days;
            break;
          } else if (weatherResponse.weather.items) {
            weatherData = weatherResponse.weather.items;
            break;
          } else if (weatherResponse.weather.hourlyForecasts) {
            weatherData = weatherResponse.weather.hourlyForecasts;
            break;
          } else if (weatherResponse.weather.forecast) {
            weatherData = weatherResponse.weather.forecast;
            break;
          } else if (weatherResponse.weather.elements) {
            weatherData = weatherResponse.weather.elements;
            break;
          } else {
            // 直接使用 weather 对象作为天气数据
            weatherData = weatherResponse.weather;
            break;
          }
        }
      }
    }

    if (weatherData.length > 0) {
      // 从forecast.days数组中提取今天和明天的天气信息
      const weatherObj = weatherData[0];
      
      if (weatherObj.forecast && weatherObj.forecast.days && Array.isArray(weatherObj.forecast.days)) {
        // 提取今天和明天的天气信息
        const today = weatherObj.forecast.days[0];
        const tomorrow = weatherObj.forecast.days[1];
        
        // 构建返回的数据结构
        const result = {
          today: null,
          tomorrow: null,
          hourlyPrecipData: {
            today: [],
            tomorrow: []
          }
        };
        
        // 处理今天的天气数据
        if (today && today.daily && today.almanac) {
          result.today = {
            date: today.daily.valid,
            condition: today.daily.pvdrCap,
            tempHi: today.daily.tempHi,
            tempLo: today.daily.tempLo,
            feelsHi: today.daily.feelsHi,
            feelsLo: today.daily.feelsLo,
            precip: today.daily.precip,
            rainAmount: today.daily.rainAmount,
            windSpeed: today.daily.pvdrWindSpd,
            windDir: today.daily.pvdrWindDir,
            sunrise: today.almanac.sunrise,
            sunset: today.almanac.sunset
          };
          
          // 处理今天的每小时降水数据
          if (today.hourly) {
            for (let hour = 0; hour < 24; hour++) {
              const hourData = today.hourly[hour.toString()];
              if (hourData) {
                result.hourlyPrecipData.today.push({
                  hour: hour,
                  precip: hourData.precip,
                  rainAmount: hourData.rainAmount
                });
              }
            }
          }
        }
        
        // 处理明天的天气数据
        if (tomorrow && tomorrow.daily && tomorrow.almanac) {
          result.tomorrow = {
            date: tomorrow.daily.valid,
            condition: tomorrow.daily.pvdrCap,
            tempHi: tomorrow.daily.tempHi,
            tempLo: tomorrow.daily.tempLo,
            feelsHi: tomorrow.daily.feelsHi,
            feelsLo: tomorrow.daily.feelsLo,
            precip: tomorrow.daily.precip,
            rainAmount: tomorrow.daily.rainAmount,
            windSpeed: tomorrow.daily.pvdrWindSpd,
            windDir: tomorrow.daily.pvdrWindDir,
            sunrise: tomorrow.almanac.sunrise,
            sunset: tomorrow.almanac.sunset
          };
          
          // 处理明天的每小时降水数据
          if (tomorrow.hourly) {
            for (let hour = 0; hour < 24; hour++) {
              const hourData = tomorrow.hourly[hour.toString()];
              if (hourData) {
                result.hourlyPrecipData.tomorrow.push({
                  hour: hour,
                  precip: hourData.precip,
                  rainAmount: hourData.rainAmount
                });
              }
            }
          }
        }
        
        return result;
      }
    }
    
    return null;

  } catch (error) {
    console.error('获取天气数据失败:', error.message);
    throw error;
  }
}

// 导出函数
module.exports = getWeatherData;




