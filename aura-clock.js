/*
Usage Example (YAML):

```yaml
type: custom:aura-clock
use_24h: false
time_size: '2.5em'       # Optional - default size for time
date_size: '1.2em'       # Optional - default size for date
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
      this._timeSize = config.time_size || '2.5em';
      this._dateSize = config.date_size || '1.2em';
  
      this.shadowRoot.innerHTML = `
        <style>
          .clock-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: "Segoe UI", sans-serif;
            color: white;
            width: ${width};
            height: ${height};
            overflow: ${overflow};
            ${fixed ? `position: fixed; ${positionStyles}` : ''}
            ${bgStyles}
          }
          #clock-time {
            font-size: ${this._timeSize} !important;
            padding-top: 5px;
          }
          #clock-date {
            font-size: ${this._dateSize} !important;
            margin-top: 10px;
            margin-bottom: auto;
          }
        </style>
        <div class="clock-container">
          <div class="time" id="clock-time"></div>
          <div class="date" id="clock-date"></div>
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
      const timeOptions = this._use24h
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : { hour: '2-digit', minute: '2-digit', hour12: true };
      const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      timeElement.textContent = now.toLocaleTimeString([], timeOptions);
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
  