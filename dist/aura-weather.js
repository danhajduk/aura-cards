// Aura Weather Card
class AuraWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;

    // Default style groups
    const dims = config.dimensions || {};
    const pos = config.position || {};
    const posVals = pos.values || {};
    const bg = config.background || {};
    const iconSize = config.icon_size || '1.5em';
    const iconStyle = config.icon_style || 'animated';
    const width = dims.width || '100%';
    const height = dims.height || 'auto';
    const overflow = dims.overflow || 'visible';
    const fixed = pos.fixed || false;

    const positionStyles = fixed
      ? `position: fixed; ${Object.entries(posVals).map(([k, v]) => (k === 'z_index' ? `z-index: ${v}` : `${k}: ${v}`)).join(';')};`
      : '';

    const backgroundStyles = `
      border-radius: ${bg.borderRadius || '16px'};
      background: ${bg.background || 'linear-gradient(to right, #0d2135, #441c3c)'};
      box-shadow: ${bg.boxShadow || '0 0 10px rgba(0,0,0,0.3)'};
      padding: ${bg.padding || '12px'};
    `;

    this.shadowRoot.innerHTML = `
      <style>
        .weather-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          color: white;
          width: ${width};
          height: ${height};
          overflow: ${overflow};
          ${positionStyles}
          ${backgroundStyles}
        }
        .weather-header {
          display: flex;
          align-items: center;
          font-size: 1.6em;
          font-weight: bold;
        }
        .weather-icon {
          font-size: ${iconSize};
          margin-right: 12px;
        }
        .weather-metrics {
          margin-top: 8px;
          font-size: 1em;
        }
        .good { color: #8bc34a; }
        .moderate { color: #ffeb3b; }
        .bad { color: #ff5722; }
        img.weather-img {
          width: ${iconSize};
          height: ${iconSize};
          margin-right: 12px;
        }
      </style>
      <div class="weather-container">
        <div class="weather-header">
          <img class="weather-img" id="weather-icon" src="" alt="weather" />
          <div id="summary">Today's Forecast</div>
        </div>
        <div class="weather-metrics" id="metrics"></div>
      </div>
    `;

    this._iconStyle = iconStyle;
    this._updateContent();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateContent();
  }

  _getWeatherIcon(condition) {
    const iconMap = {
      'clear-night': 'night.svg',
      'cloudy': 'cloudy.svg',
      'fog': 'fog.svg',
      'hail': 'hail.svg',
      'lightning': 'thunderstorms.svg',
      'lightning-rainy': 'thunderstorms-rain.svg',
      'partlycloudy': 'partly-cloudy-day.svg',
      'pouring': 'rain.svg',
      'rainy': 'rain.svg',
      'snowy': 'snow.svg',
      'snowy-rainy': 'sleet.svg',
      'sunny': 'clear-day.svg',
      'windy': 'wind.svg',
      'exceptional': 'cloudy-alert.svg'
    };

    const normalized = (condition || '').toLowerCase();
    const fileName = iconMap[normalized];
    if (!fileName) return '';

    const folder = this._iconStyle === 'static' ? 'static' : 'animated';
    return `/hacsfiles/aura-cards/icons/${folder}/${fileName}`;
  }

  _updateContent() {
    if (!this._hass || !this._config) return;
    const el = this.shadowRoot.getElementById('metrics');
    const iconEl = this.shadowRoot.getElementById('weather-icon');
    const get = id => this._config[id] ? this._hass.states[this._config[id]]?.state : undefined;

    const condition = get('curent_weather');
    const tempHigh = get('today_high_temp');
    const tempLow = get('today_low_temp');
    const wind = get('today_wind');
    const uv = parseFloat(get('today_UV_index'));
    const storm = get('today_hunderstorm_probability');
    const aqi = get('today_air_quality');
    const rain = get('today_precipitation_probability');

    iconEl.src = this._getWeatherIcon(condition);

    const color = (val, scale) => {
      if (val === undefined || isNaN(val)) return '';
      if (val < scale[0]) return 'good';
      if (val < scale[1]) return 'moderate';
      return 'bad';
    };

    el.innerHTML = `
      ${tempHigh && tempLow ? `<span class="${color(parseFloat(tempHigh), [65, 80])}">${tempHigh}°F</span> / <span class="${color(parseFloat(tempLow), [40, 60])}">${tempLow}°F</span>` : ''}
      ${wind ? ` | 💨 ${wind}` : ''}
      ${!isNaN(uv) ? ` | ☀️ <span class="${color(uv, [3, 6])}">UV ${uv}</span>` : ''}
      ${rain ? ` | 🌧️ ${rain}%` : ''}
      ${storm ? ` | ⚡ ${storm}%` : ''}
      ${aqi ? ` | 🧪 AQI <span class="${color(parseFloat(aqi), [50, 100])}">${aqi}</span>` : ''}
    `;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('aura-weather-card', AuraWeatherCard);
console.log('[aura-weather-card] Custom element registered');
