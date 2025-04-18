console.log('[fade-state-switch] SCRIPT LOADED');

/*
YAML options:

  type: custom:fade-state-switch
  entity: sensor.my_state_entity          # Required
  attribute: my_attribute                 # Optional - use attribute value instead of state
  states:                                 # Required - state-to-card mapping
    state1:
      type: markdown
      content: "State 1"
    state2:
      type: markdown
      content: "State 2"

  animation_in: '2s'                      # Optional - duration for fade-in
  animation_out: '1s'                     # Optional - duration for fade-out
  animation_overlap: true                 # Optional - if true, new state fades in before old fades out

  dimensions:                             # Optional - grouped size settings
    width: '400px'
    height: '200px'
    overflow: 'hidden'

  position:                               # Optional - grouped position settings
    fixed: true
    values:
      top: '50px'
      left: '10px'
      right: 'auto'
      bottom: 'auto'
      z_index: 10

  background:                             # Optional - container background style
    borderRadius: '16px'
    background: 'linear-gradient(...)'
    boxShadow: '0 0 10px rgba(...)'
    padding: '12px'

Supports:
  - Visual Editor support (basic)
  - State or attribute-based switching
  - Smooth fade in/out transitions
  - Optional transition overlap
  - Container customization (size, position, styling)
  - Force card background/image transparency
  - Split animation_in/animation_out
  - Card refresh on state change
  - z-index control
*/

class FadeStateSwitch extends HTMLElement {
  constructor() {
    super();
    this._cards = {};
    this._currentState = null;
  }

  async setConfig(config) {
    if (!config.entity || !config.states) {
      throw new Error("fade-state-switch: 'entity' and 'states' are required.");
    }

    this._config = config;
    this._transitionIn = config.animation_in || '1.5s';
    this._transitionOut = config.animation_out || '1.5s';
    this._animationOverlap = config.animation_overlap || false;

    const dims = config.dimensions || {};
    this._width = dims.width || '100%';
    this._height = dims.height || 'auto';
    this._overflow = dims.overflow || 'visible';

    const pos = config.position || {};
    this._fixedPosition = pos.fixed || false;
    const posVals = pos.values || {};
    this._positionStyles = Object.entries(posVals)
      .map(([key, value]) => {
        if (key === 'z_index') return `z-index: ${value};`;
        return `${key}: ${value};`;
      })
      .join(' ');

    const defaultBackgroundStyles = config.background || {
      borderRadius: '16px',
      background: 'linear-gradient(to right, #0d2135, #441c3c)',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
      padding: config.padding || '0'
    };

    const backgroundStyleString = `
      border-radius: ${defaultBackgroundStyles.borderRadius};
      background: ${defaultBackgroundStyles.background};
      box-shadow: ${defaultBackgroundStyles.boxShadow};
      padding: ${defaultBackgroundStyles.padding};
    `;

    if (!window.cardHelpers) {
      window.cardHelpers = await window.loadCardHelpers();
    }

    this.innerHTML = `
      <style>
        .card-container {
          position: relative;
          min-height: 1px;
          width: ${this._width};
          height: ${this._height};
          overflow: ${this._overflow};
          ${this._fixedPosition ? `position: fixed; ${this._positionStyles}` : ''}
          ${backgroundStyleString}
        }
        .card-wrapper {
          position: absolute;
          top: 0; left: 0; right: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity ${this._transitionOut} ease;
        }
        .card-wrapper.visible {
          opacity: 1;
          pointer-events: auto;
          transition: opacity ${this._transitionIn} ease;
        }
        .card-wrapper ha-card {
          background: none !important;
        }
        .card-wrapper ha-card img {
          background: none !important;
        }
      </style>
      <div class="card-container"></div>
    `;

    this._container = this.querySelector('.card-container');

    for (const [state, cardConfig] of Object.entries(config.states)) {
      const card = await window.cardHelpers.createCardElement(cardConfig);
      card.classList.add('card-wrapper');
      card.style.display = 'block';
      this._cards[state] = card;
      this._container.appendChild(card);
    }

    console.log('[fade-state-switch] Config loaded:', this._config);
    console.log('[fade-state-switch] States defined:', Object.keys(this._cards));

    if (this._hass) {
      this.hass = this._hass;
    } else {
      const firstState = Object.keys(this._cards)[0];
      if (firstState) {
        console.log('[fade-state-switch] Initial fallback state:', firstState);
        this._cards[firstState].classList.add('visible');
        this._currentState = firstState;
      }
    }
  }

  set hass(hass) {
    this._hass = hass;

    const entityId = this._config.entity;
    const attribute = this._config.attribute;
    const entity = hass.states[entityId];

    if (!entity) return;

    let state = attribute ? entity.attributes?.[attribute] : entity.state;
    if (!state || !(state in this._cards)) {
      state = Object.keys(this._cards)[0];
    }

    Object.values(this._cards).forEach(card => {
      card.hass = hass;
    });

    if (state !== this._currentState) {
      const prevCard = this._cards[this._currentState];
      const newCard = this._cards[state];

      if (!newCard) return;

      if (this._animationOverlap) {
        newCard.classList.add('visible');
        prevCard?.classList.remove('visible');
      } else {
        if (prevCard) {
          prevCard.classList.remove('visible');
          setTimeout(() => {
            newCard.classList.add('visible');
          }, parseFloat(this._transitionOut) * 1000);
        } else {
          newCard.classList.add('visible');
        }
      }

      this._currentState = state;
    }
  }

  getCardSize() {
    return 1;
  }
}

customElements.whenDefined('hui-view').then(() => {
  if (!customElements.get('fade-state-switch')) {
    customElements.define('fade-state-switch', FadeStateSwitch);
    console.log('[fade-state-switch] Custom element registered');
  }
});
