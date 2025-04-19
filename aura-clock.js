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
  
      this.shadowRoot.innerHTML = `
        <style>
          .clock-container {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2.5em;
            font-family: "Segoe UI", sans-serif;
            color: white;
            width: ${width};
            height: ${height};
            overflow: ${overflow};
            ${fixed ? `position: fixed; ${positionStyles}` : ''}
            ${bgStyles}
          }
        </style>
        <div class="clock-container" id="clock"></div>
      `;
  
      this._updateTime();
      if (this._interval) clearInterval(this._interval);
      this._interval = setInterval(() => this._updateTime(), 1000);
    }
  
    _updateTime() {
      const clockElement = this.shadowRoot.getElementById('clock');
      if (!clockElement) return;
      const now = new Date();
      clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  customElements.define('aure-clock', ClockCard);
  console.log('[aura-clock] Custom element registered');
  