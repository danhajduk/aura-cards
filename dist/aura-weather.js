// Aura Weather Card
// A custom Home Assistant card for displaying current and forecast weather with dynamic styling and animations.

class AuraWeatherCard extends HTMLElement {
  /**
   * Initializes the AuraWeatherCard custom element.
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._lastUpdatedMinute = null;
    this._viewMode = 'current'; // View mode: 'current' or 'forecast'
  }

  /**
   * Sets the configuration for the card and renders the initial layout.
   * @param {Object} config - The user-defined configuration for the card.
   */
  setConfig(config) {
    this._config = config;

    // Extract configuration options with defaults
    const dims = config.dimensions || {};
    const pos = config.position || {};
    const posVals = pos.values || {};
    const bg = config.background || {};
    const iconStyle = config.icon_style || 'animated';
    this._useBgImage = config.background_image || false;

    // Extract weather and forecast entities
    this._weatherEntities = config.weather || {};
    this._forecastEntities = config.forcast || {};

    // Dimensions and layout
    const width = dims.width || '100%';
    const height = dims.height || 'auto';
    const overflow = dims.overflow || 'visible';
    const fixed = pos.fixed || false;

    // Calculate dynamic sizes
    const minHeight = 140;
    const parsedHeight = parseInt(height, 10);
    const actualHeight = isNaN(parsedHeight) ? minHeight : Math.max(parsedHeight, minHeight);

    const iconSizePx = Math.floor(actualHeight * 0.85);
    const tempFontSizePx = Math.floor(actualHeight * 0.3);
    const iconOffset = Math.floor(actualHeight * 0.1);
    const metricsFontSize = Math.floor(tempFontSizePx * 0.5);

    // Positioning styles
    const positionStyles = fixed
      ? `position: fixed; ${Object.entries(posVals).map(([k, v]) => (k === 'z_index' ? `z-index: ${v}` : `${k}: ${v}`)).join(';')};`
      : '';

    // Background styles
    const backgroundStyles = `
      border-radius: ${bg.borderRadius || '16px'};
      background: ${bg.background || 'linear-gradient(to right, #0d2135, #441c3c)'};
      box-shadow: ${bg.boxShadow || '0 0 10px rgba(0,0,0,0.3)'};
      padding: ${bg.padding || '12px'};
    `;

    // View mode and toggle settings
    this._viewMode = config.view_mode || 'current'; // 'current', 'forecast', or 'toggle'
    this._toggleIntervalSec = config.toggle_interval || 10; // Interval in seconds for toggling views
    this._fadeTransition = this._viewMode === 'toggle';

    if (this._fadeTransition) {
      this._startToggleTimer();
    }

    // Inject base layout and styles into the shadow DOM
    this.shadowRoot.innerHTML = `
      <style>
        /* Weather container styles */
        .weather-container {
          position: relative; /* Set container to relative for overlay positioning */
          width: ${width};
          height: ${actualHeight}px;
          overflow: ${overflow};
          color: white;
          ${positionStyles}
          ${backgroundStyles}
          background-size: cover;
          background-position: center;
        }

        /* Add a semi-transparent black overlay */
        .weather-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.15); /* 15% black overlay */
          z-index: 0; /* Ensure it is behind the content */
        }

        /* Ensure all content is above the overlay */
        .weather-toggle-container,
        .weather-info,
        .forecast-view {
          position: relative;
          z-index: 1;
        }

        /* Weather icon styles */
        .weather-icon {
          width: ${iconSizePx}px;
          height: ${iconSizePx}px;
          position: relative;
          top: ${iconOffset}px;
          left: ${iconOffset}px;
        }

        /* Current weather information styles */
        .weather-info {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          font-size: ${tempFontSizePx}px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
        }

        /* Header for current weather */
        .weather-header {
          position: absolute;
          top: 15px;
          left: 10px;
        }

        /* Metrics for current weather */
        .weather-metrics {
          position: absolute;
          left: ${iconSizePx + 5}px;
          top: ${actualHeight * 0.58}px;
          transform: translateY(-50%);
        }

        /* Extra weather details */
        .weather-extra {
          position: relative;
          top: ${actualHeight * 0.67}px;
          font-size: ${metricsFontSize}px;
          width: ${width};
          text-align: right;
        }

        /* Color classes for metrics */
        .good { color: #8bc34a; }
        .moderate { color: #ffeb3b; }
        .bad { color: #ff5722; }

        /* Metric icon styles */
        .metric-icon {
          height: ${actualHeight * 0.45}px;
          vertical-align: middle;
          margin-right: 4px;
        }

        /* Weather toggle button */
        .weather-toggle {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          color: white;
          font-size: 1em;
          cursor: pointer;
        }

        /* Forecast view container */
        .forecast-view {
          display: flex;
          height: 100%;
          width: ${width};
        }

        /* Individual forecast day */
        .forecast-day {
          flex-grow: 1; /* Ensure each day takes equal space */
          flex-basis: 20%; /* Set the base width to 20% */
          box-sizing: border-box; /* Include padding and borders in width calculation */
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: ${tempFontSizePx * 0.7}px;
          position: relative;
          border-right: 1px solid rgba(255, 255, 255, 0.2); /* Add a divider */
          top: -11px; /* Adjust position to align with the current weather */
        }

        /* Remove divider for the last forecast day */
        .forecast-day:last-child {
          border-right: none;
        }

        /* Forecast day name */
        .forecast-day-name {
          position: absolute;
          top: 8px;
          left: 6px;
          color: white;
          text-shadow: 1px 1px 2px black;
        }

        /* Forecast day icon */
        .forecast-day img {
          height: ${actualHeight * 0.8}px;
          position: relative;
          top: 15px;
        }

        /* Forecast day temperature */
        .forecast-day-temp {
          font-size: ${Math.floor(tempFontSizePx * 0.6)}px; /* Adjust font size */
          font-weight: bold; /* Make the text bold */
          color: white; /* Set text color */
          margin-top: 15px; /* Add spacing above the temperature */
          text-align: center; /* Center-align the text */
        }

        /* High and low temperature spans */
        .forecast-day-temp span {
          display: inline-block;
          margin: 0 4px; /* Add spacing between high and low temps */
        }

        /* High temperature color */
        .forecast-day-temp .high {
          color: #ff5722;
        }

        /* Low temperature color */
        .forecast-day-temp .low {
          color: #03a9f4;
        }

        /* Weather view container */
        .weather-view {
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
          position: absolute;
          width: 100%;
          height: 100%;
        }

        /* Fade-in visible view */
        .fade-visible {
          opacity: 1;
          z-index: 1;
        }

        /* Fade-out hidden view */
        .fade-hidden {
          opacity: 0;
          z-index: 0;
        }
      </style>
      <div id="weather-container" class="weather-container">
        <div class="weather-toggle-container">
          <div id="current-view" class="weather-view fade-visible"></div>
          <div id="forecast-view" class="weather-view fade-hidden"></div>
        </div>
      </div>
    `;

    this._iconStyle = iconStyle;
    // this._toggleButton = this.shadowRoot.getElementById('toggle');
    // this._toggleButton.addEventListener('click', () => this._toggleView());
    this._updateContent();
  }

  _startToggleTimer() {
    if (this._toggleTimer) clearInterval(this._toggleTimer);
  
    this._toggleTimer = setInterval(() => {
      this._viewMode = this._viewMode === 'current' ? 'forecast' : 'current';
      this._applyFadeTransition();
      setTimeout(() => this._updateContent(), 300); // Matches CSS transition time
    }, this._toggleIntervalSec * 1000);
  }
    /**
   * Called by Home Assistant when the hass object is available.
   * Updates the card content once per minute.
   */
  set hass(hass) {
    this._hass = hass;
    const now = new Date();
    const currentMinute = now.getMinutes();
    if (this._lastUpdatedMinute !== currentMinute) {
      this._lastUpdatedMinute = currentMinute;
      this._updateContent();
    }
  }

  /**
   * Toggles between current and forecast view.
   */
  _toggleView() {
    this._viewMode = this._viewMode === 'current' ? 'forecast' : 'current';
    this._updateContent();
  }

  /**
   * Renders the card content based on the current view mode.
   */
  _updateContent() {
    if (!this._hass || !this._config) return;

    const containerEl = this.shadowRoot.getElementById('weather-container');
    const currentEl = this.shadowRoot.getElementById('current-view');
    const forecastEl = this.shadowRoot.getElementById('forecast-view');

    if (!containerEl || !currentEl || !forecastEl) {
      console.error('[aura-weather-card] Missing container or view elements.');
      return;
    }

    currentEl.innerHTML = this._renderCurrentWeather();
    forecastEl.innerHTML = this._renderForecastWeather();

    this._applyFadeTransition(); // Ensure the correct view is visible
  }

  _applyFadeTransition() {
    const currentEl = this.shadowRoot.getElementById('current-view');
    const forecastEl = this.shadowRoot.getElementById('forecast-view');

    if (this._viewMode === 'current') {
      // Fade out forecast first, then fade in current
      forecastEl.style.transition = 'opacity 0.3s ease-in-out';
      forecastEl.style.opacity = '0';
      setTimeout(() => {
        currentEl.style.transition = 'opacity 0.3s ease-in-out';
        currentEl.style.opacity = '1';
        currentEl.style.zIndex = '1';
        forecastEl.style.zIndex = '0';
      }, 300); // Wait for forecast to fade out
    } else if (this._viewMode === 'forecast') {
      // Fade out current first, then fade in forecast
      currentEl.style.transition = 'opacity 0.3s ease-in-out';
      currentEl.style.opacity = '0';
      setTimeout(() => {
        forecastEl.style.transition = 'opacity 0.3s ease-in-out';
        forecastEl.style.opacity = '1';
        forecastEl.style.zIndex = '1';
        currentEl.style.zIndex = '0';
      }, 300); // Wait for current to fade out
    }
  }
      
  /**
   * Renders the current weather using live data.
   */
  _renderCurrentWeather() {
    const get = id => this._weatherEntities[id] ? this._hass.states[this._weatherEntities[id]]?.state : undefined;
    const condition = get('curent_weather');
    const tempHigh = parseFloat(get('today_high_temp'));
    const tempLow = parseFloat(get('today_low_temp'));
    const wind = get('today_wind');
    const uv = parseFloat(get('today_UV_index'));
    const storm = parseFloat(get('today_hunderstorm_probability'));
    const aqi = get('today_air_quality');
    const rain = parseFloat(get('today_precipitation_probability'));

    const iconEl = `<img class="weather-icon" src="${this._getWeatherIcon(condition)}" alt="weather" />`;

    const metricsHTML =
      tempHigh && tempLow
        ? `<span style="color: white; -webkit-text-stroke: 1px black; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">${tempHigh}°F</span> / 
           <span style="color: white; -webkit-text-stroke: 1px black; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">${tempLow}°F</span>`
        : '';

    const icons = {
      wind: `wind-beaufort-${Math.round(wind / 10)}.svg`,
      uv: `uv-index-${Math.round(uv || 0)}.svg`,
      storm: 'lightning-bolt.svg',
      aqi: typeof aqi === 'string' && aqi.toLowerCase().includes('good') ? 'code-green.svg'
          : aqi.toLowerCase().includes('moderate') ? 'code-yellow.svg'
          : aqi.toLowerCase().includes('unhealthy') ? 'code-orange.svg'
          : aqi.toLowerCase().includes('hazardous') ? 'code-red.svg'
          : 'code-green.svg',
      rain: 'umbrella.svg'
    };

    const staticBase = '/hacsfiles/aura-cards/icons/static';
    const iconTag = (key, label) => `<img src="${staticBase}/${icons[key]}" class="metric-icon" alt="${key}" />${label}`;

    const extraHTML = `
      ${wind ? `${iconTag('wind', wind)}` : ''}
      ${!isNaN(uv) && uv > 0 ? ` | ${iconTag('uv', `UV <span>${uv}</span>`)}` : ''}
      ${!isNaN(rain) && rain > 0 ? ` | ${iconTag('rain', `${rain}%`)}` : ''}
      ${!isNaN(storm) && storm > 0 ? ` | ${iconTag('storm', `${storm}%`)}` : ''}
      ${aqi ? ` | ${iconTag('aqi', `AQI <span>${aqi}</span>`)}` : ''}
    `;

    // Apply background image if enabled
    if (this._useBgImage && condition) {
      const containerEl = this.shadowRoot.getElementById('weather-container');
      const bgImage = `/hacsfiles/aura-cards/weather-backgrounds/${condition}.png`;
      if (containerEl) {
        containerEl.style.backgroundImage = `url('${bgImage}')`;
      }
    }

    return `
      ${iconEl}
      <div class="weather-info">
        <div class="weather-header">Today's Forecast: ${condition?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        <div class="weather-metrics">${metricsHTML}</div>
        <div class="weather-extra">${extraHTML}</div>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this._toggleTimer) clearInterval(this._toggleTimer);
  }
  
  /**
   * Generates the HTML for the 5-day weather forecast.
   */
  _renderForecastWeather() {
    const forecastHTML = ['0', '1', '2', '3', '4'].map(i => {
      const get = key => this._forecastEntities[`${key}_day${i}`] ? this._hass.states[this._forecastEntities[`${key}_day${i}`]]?.state : '';
      const forecast = get('forecast');
      const iconSrc = this._getWeatherIcon(forecast);
      const tempHigh = parseFloat(get('temp_high'));
      const tempLow = parseFloat(get('temp_low'));

      // Get the date label (e.g., "Mon")
      const dayIndex = (new Date().getDay() + parseInt(i)) % 7;
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];

      return `
        <div class="forecast-day">
          <div class="forecast-day-name">${dayName}</div>
          <img src="${iconSrc}" alt="${forecast}" />
          <div class="forecast-day-temp">
            <span style="color: ${this._getTempColor(tempHigh)};">${tempHigh}°</span> / 
            <span style="color: ${this._getTempColor(tempLow)};">${tempLow}°</span>
          </div>
        </div>
      `;
    }).join('');
    return `<div class="forecast-view">${forecastHTML}</div>`;
  }

  /**
   * Determines the color for a temperature value based on a gradient from red (hot) to blue (cold).
   * @param {number} value - The temperature value.
   * @returns {string} The color in hexadecimal format.
   */
  _getTempColor(value) {
    if (isNaN(value)) return '#ffffff'; // Default to white if value is invalid

    // Define temperature range and corresponding colors
    const minTemp = 0; // Coldest temperature
    const maxTemp = 100; // Hottest temperature
    const red = [255, 0, 0]; // Red for hot
    const blue = [0, 0, 255]; // Blue for cold

    // Clamp the value within the range
    const clampedValue = Math.max(minTemp, Math.min(maxTemp, value));

    // Calculate the interpolation factor (0 = cold, 1 = hot)
    const factor = (clampedValue - minTemp) / (maxTemp - minTemp);

    // Interpolate between blue and red
    const r = Math.round(blue[0] + factor * (red[0] - blue[0]));
    const g = Math.round(blue[1] + factor * (red[1] - blue[1]));
    const b = Math.round(blue[2] + factor * (red[2] - blue[2]));

    // Return the color as a hexadecimal string
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Maps a weather condition string to the appropriate icon file name.
   * @param {string} condition - The current weather condition.
   * @returns {string} The icon file path.
   */
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

  /**
   * Determines the color class for a temperature value based on thresholds.
   * @param {number} value - The temperature value.
   * @param {number[]} scale - The thresholds for good, moderate, and bad.
   * @returns {string} The CSS class name for the temperature color.
   */
  _getTempColorClass(value, scale) {
    if (isNaN(value)) return '';
    if (value < scale[0]) return 'good';
    if (value < scale[1]) return 'moderate';
    return 'bad';
  }

  /**
   * Returns the height size of the card in grid rows.
   * @returns {number}
   */
  getCardSize() {
    return 1;
  }
}

customElements.define('aura-weather-card', AuraWeatherCard);
console.log('[aura-weather-card] Custom element registered');
