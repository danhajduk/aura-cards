/**
 * Aura Clock Card - A custom Home Assistant card to display a clock with customizable styles.
 * 
 * Features:
 * - 12h/24h time format
 * - Optional seconds display
 * - Blinking colon effect
 * - Customizable fonts, colors, and layout
 * - Background and positioning options
 */

class ClockCard extends HTMLElement {
  constructor() {
    super();
    this._config = {}; // Configuration object for the card
    this.attachShadow({ mode: 'open' }); // Attach shadow DOM for encapsulation
    this._interval = null; // Interval for updating the clock
  }

  /**
   * Sets the configuration for the card and initializes the DOM structure.
   * @param {Object} config - Configuration object passed from YAML.
   */
  setConfig(config) {
    this._config = config;

    // Extract dimensions and positioning from the configuration
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

    // Extract background styles from the configuration
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

    // Extract other configuration options
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

    // Determine layout style (stacked or horizontal)
    const layoutStyle = this._layout === 'horizontal' ? 'row' : 'column';

    // Set up the shadow DOM structure
    this.shadowRoot.innerHTML = `
      <style>
        .clock-container {
          position: relative; /* Set container to relative for absolute positioning of children */
          display: flex;
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
          position: absolute; /* Use absolute positioning */
          top: 35px; /* Position time at the top */
          left: 50%; /* Center horizontally */
          transform: translateX(-50%); /* Adjust for centering */
          font-size: ${this._timeSize} !important;
          color: ${this._colorTime};
        }
        #clock-date {
          position: absolute; /* Use absolute positioning */
          bottom: 5px; /* Position date at the bottom */
          left: 50%; /* Center horizontally */
          transform: translateX(-50%); /* Adjust for centering */
          font-size: ${this._dateSize} !important;
          color: ${this._colorDate};
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

    // Initialize the clock and start the update interval
    this._updateTime();
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => this._updateTime(), 1000);
  }

  /**
   * Updates the time and date displayed on the card.
   */
  _updateTime() {
    const timeElement = this.shadowRoot.getElementById('clock-time');
    const dateElement = this.shadowRoot.getElementById('clock-date');
    if (!timeElement || !dateElement) return;

    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');

    // Format the time string based on configuration
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

    // Format the date string
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString([], dateOptions);
  }

  /**
   * Returns the size of the card for layout purposes.
   * @returns {number} - Card size.
   */
  getCardSize() {
    return 1;
  }

  /**
   * Cleans up the interval when the card is removed from the DOM.
   */
  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
}

// Register the custom element
customElements.define('aura-clock', ClockCard);
console.log('[aura-clock] Custom element registered');
