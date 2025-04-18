/**
Usage Example (YAML):

```yaml
type: custom:aura-clock
use_24h: false
show_seconds: false               # Optional - display seconds if true
blinking_colon: true             # Optional - enable blinking colon effect
font_family: 'Segoe UI, sans-serif'  # Optional - font override
time_size: '2.5em'               # Optional - size for time
date_size: '1.2em'               # Optional - size for date
layout: stacked                  # Optional - 'stacked' or 'horizontal'
icon: mdi:clock-time-four-outline # Optional - icon to show before time
color_time: white                # Optional - color override for time
color_date: white                # Optional - color override for date
background:
  borderRadius: '16px'
  background: 'linear-gradient(to right, #0d2135, #441c3c)'
  boxShadow: '0 0 10px rgba(0,0,0,0.3)'
  padding: '12px'
dimensions:
  width: '100%'
  height: 'auto'
  overflow: 'visible'
position:
  fixed: true
  values:
    top: '50px'
    left: '10px'
    z_index: 10
```
*/

class ClockCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this.attachShadow({ mode: 'open' });
    this._interval = null;
  }

  setConfig(config) {
    this._config = config;

    const dims = config.dimensions || {};
    const width = dims.width || '100%';
    const height = dims.height || 'auto';
    const overflow = dims.overflow || 'visible';

    const pos = config.position || {};
    const fixed = pos.fixed || false;
    const posVals = pos.values || {};
    const positionStyles = Object.entries(posVals).map(([key, value]) => {
      if (key === 'z_index') return `z-index: ${value};`;
      return `${key}: ${value};`;
    }).join(' ');

    const bg = config.background || {
      borderRadius: '16px',
      background: 'linear-gradient(to right, #0d2135, #441c3c)',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
      padding: '12px'
    };

    const bgStyles = `
      border-radius: ${bg.borderRadius};
      background: ${bg.background};
      box-shadow: ${bg.boxShadow};
      padding: ${bg.padding};
    `;

    this._use24h = config.use_24h || false;
    this._showSeconds = config.show_seconds || false;
    this._blinkingColon = config.blinking_colon || false;
    this._fontFamily = config.font_family || 'Segoe UI, sans-serif';
    this._timeSize = config.time_size || '2.5em';
    this._dateSize = config.date_size || '1.2em';
    this._layout = config.layout || 'stacked';
    this._icon = config.icon || '';
    this._colorTime = config.color_time || 'white';
    this._colorDate = config.color_date || 'white';

    const layoutStyle = this._layout === 'horizontal' ? 'row' : 'column';

    this.shadowRoot.innerHTML = `
      <style>
        .clock-container {
          display: flex;
          flex-direction: ${layoutStyle};
          justify-content: center;
          align-items: center;
          font-family: ${this._fontFamily};
          width: ${width};
          height: ${height};
          overflow: ${overflow};
          ${fixed ? `position: fixed; ${positionStyles}` : ''}
          ${bgStyles}
        }
        .clock-icon {
          margin-right: ${this._layout === 'horizontal' ? '10px' : '0'};
          font-size: ${this._dateSize};
        }
        #clock-time {
          font-size: ${this._timeSize} !important;
          color: ${this._colorTime};
          padding-top: 5px;
        }
        #clock-date {
          font-size: ${this._dateSize} !important;
          color: ${this._colorDate};
          margin-top: auto;
          margin-bottom: 5px;
        }
        .colon {
          animation: ${this._blinkingColon ? 'blink 1s step-start infinite' : 'none'};
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      </style>
      <div class="clock-container">
        ${this._icon ? `<ha-icon class="clock-icon" icon="${this._icon}"></ha-icon>` : ''}
        <div class="clock-content">
          <div class="time" id="clock-time"></div>
          <div class="date" id="clock-date"></div>
        </div>
      </div>
    `;

    this._updateTime();
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => this._updateTime(), 1000);
  }

  _updateTime() {
    const timeElement = this.shadowRoot.getElementById('clock-time');
    const dateElement = this.shadowRoot.getElementById('clock-date');
    if (!timeElement || !dateElement) return;
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');

    let colon = this._blinkingColon ? '<span class="colon">:</span>' : ':';
    let timeString = '';

    if (this._use24h) {
      timeString = `${hours.toString().padStart(2, '0')}${colon}${minutes}`;
      if (this._showSeconds) {
        timeString += `${colon}${seconds}`;
      }
    } else {
      const displayHours = ((hours + 11) % 12 + 1);
      timeString = `${displayHours}${colon}${minutes}`;
      if (this._showSeconds) {
        timeString += `${colon}${seconds}`;
      }
      timeString += ` ${(hours >= 12) ? 'PM' : 'AM'}`;
    }

    timeElement.innerHTML = timeString;

    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString([], dateOptions);
  }

  getCardSize() {
    return 1;
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
}

customElements.define('aura-clock', ClockCard);
console.log('[aura-clock] Custom element registered');
