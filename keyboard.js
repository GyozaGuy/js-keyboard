(function() {
  const supportsShadowDom =
    !!(/\{\s+\[native code\]\s+\}/).test((HTMLElement.prototype.attachShadow||'').toString());

  class HTMLKey extends HTMLElement {
    constructor() {
      super();
      this._root = this;
      if (supportsShadowDom) {
        this._root = this.attachShadow({mode: 'open'});
      }
    }

    connectedCallback() {
      const position = +this.getAttribute('position');
      const width = +this.getAttribute('width');

      this._root.innerHTML =
        `<style>
          :host {
            box-sizing: border-box;
          }
          .key {
            background-color: #fff;
            border-right: 1px solid #000;
            height: 100%;
            left: ${position}px;
            padding: 1px;
            position: absolute;
            width: ${width}px;
          }
          .key:hover {
            background-color: #888;
            cursor: pointer;
          }
          :host([color='black']) .key {
            background-color: #000;
            height: 65%;
            width: ${width - ((width / 100) * 10)}px;
            z-index: 1;
          }
          :host([color='black']) .key:hover {
            background-color: #888;
            cusor: pointer;
          }
        </style>
        <button class="key"></button>`;
    }
  }

  class HTMLKeyboard extends HTMLElement {
    constructor() {
      super();
      this._root = this;
      if (supportsShadowDom) {
        this._root = this.attachShadow({mode: 'open'});
      }
      this._audioContext = AudioContext && new AudioContext();
      this._osc = this._audioContext.createOscillator();
      this._osc.start(0);
    }

    connectedCallback() {
      this.keyboardWidth = +this.getAttribute('width') || 800;

      this._root.innerHTML =
        `<style>
          :host {
            box-sizing: border-box;
            display: block;
            height: 90px;
            padding: 0;
            position: relative;
            width: ${this.keyboardWidth}px;
          }
        </style>`;
      this.renderKeyboard();

      addEventListener('mousedown', e => {
        if (e.path[0].className === 'key') {
          this._playSound(+e.path[2].getAttribute('frequency'));
        }
      });

      addEventListener('mouseup', e => {
        this._stopSound();
      });
    }

    renderKeyboard() {
      const allNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
      const numKeys = +this.getAttribute('keys') || 88;
      const notes = [];
      for (let i = 0; i < numKeys; i++) {
        notes.push(allNotes[i % 12]);
      }
      const numWhiteKeys = notes.filter(note => !note.includes('#')).length;
      const keys = [];
      const keyWidth = this.keyboardWidth / numWhiteKeys;
      let nextColor = null;
      let nextPosition = null; // NOTE: keeps track of where we are on the keyboard
      let keyPosition = null; // NOTE: where to place the next key, varies between white and black
      notes.forEach((note, i) => {
        nextColor = note.includes('#') ? 'black' : 'white';
        if (nextPosition === null) {
          keyPosition = 0;
          nextPosition = keyPosition;
        } else if (nextColor === 'white') {
          keyPosition = nextPosition + keyWidth;
          nextPosition = keyPosition;
        } else {
          // NOTE: don't move nextPosition since black keys overlay white keys
          keyPosition = nextPosition + keyWidth - (keyWidth / 3);
        }
        keys.push(
          `<html-key color="${nextColor}"
                    frequency="${this._getFrequency(i + 1)}"
                    notename="${notes[i]}"
                    position="${keyPosition}"
                    width="${nextColor === 'white' ? keyWidth : keyWidth / 1.5}">
          </html-key>`
        );
      });
      this._root.innerHTML += keys.join('');
    }

    _getFrequency(keyNum) {
      return (Math.pow(2, (keyNum - 49) / 12)) * 440;
    }

    _playSound(freq) {
      this._osc.frequency.value = freq;
      this._osc.connect(this._audioContext.destination);
    }

    _stopSound() {
      this._osc.disconnect();
    }
  }

  customElements.define('html-key', HTMLKey);
  customElements.define('html-keyboard', HTMLKeyboard);
}());
