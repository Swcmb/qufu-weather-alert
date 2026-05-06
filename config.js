require('dotenv').config();

module.exports = {
  weather: {
    url: 'https://assets.msn.cn/service/weather/overview',
    params: {
      apikey: process.env.WEATHER_API_KEY || 'j5i4gDqHL6nGYwx5wi5kRhXjtf2c5qgFX9fzfk0TOo',
      activityId: process.env.WEATHER_ACTIVITY_ID || '69e6e370-d4b6-41e4-b6d3-0503afa6afdb',
      ocid: 'msftweather',
      cm: 'zh-cn',
      it: 'web',
      user: process.env.WEATHER_USER_ID || 'm-0A31553C50CA6EB4070C427E51F16F5C',
      scn: 'ANON',
      units: 'C',
      appId: process.env.WEATHER_APP_ID || '9e21380c-ff19-4c78-b4ea-19558e93a5d3',
      wrapodata: 'false',
      includemapsmetadata: 'true',
      cuthour: 'true',
      lifeDays: '2',
      lifeModes: '18',
      includestorm: 'true',
      includeLifeActivity: 'true',
      lifeSubTypes: '1,3,4,10,26',
      insights: '65536',
      startDate: '-1',
      endDate: '+9',
      discardFutureInsightTimeseries: 'true',
      distanceinkm: '0',
      regionDataCount: '20',
      orderby: 'distance',
      days: '10',
      pageOcid: 'prime-weather::weathertoday-peregrine',
      source: 'weather_csr',
      fdhead: 'PRG-1SW-WXWPDEL,PRG-1SW-WXWPDS,PRG-1SW-WXWPTLI',
      region: 'cn',
      market: 'zh-cn',
      locale: 'zh-cn',
      lat: '35.6016',
      lon: '116.9668'
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.msn.cn/zh-cn/weather/forecast/in-%E6%9B%B2%E9%98%9C%E5%B8%82?loc=eyJsIjoi5puy6Zic5biCIiwiYyI6IuS4reWNjuS6uuawkeWFseWSjOWbvSIsImkiOiJDTiIsIngiOiIxMTYuOTY2OCIsInkiOiIzNS42MDE2In0%3D&weadegreetype=C',
      'Origin': 'https://www.msn.cn',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    }
  },
  dingtalk: {
    token: process.env.DD_BOT_TOKEN || 'c443d4b28d91876cb0d2a36e405b44c525e701e178f41445f09a468f4d453d4f',
    secret: process.env.DD_BOT_SECRET || 'SEC991410be16a0e7156b6a015880d69768df8684a3be80bcd516c872eec032914e'
  },
  log: {
    file: 'weather_alert.log'
  }
};