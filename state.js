// https://github.com/vim/vim/blob/master/src/README.md#the-main-loop
(() => {
if (window.__VIMDOC_LOADED__) return;
  window.__VIMDOC_LOADED__ = true;

const states ={
    INSERT: 'Insert',
    //VISUAL: 'Visual',
    NORMAL: 'Normal',
    MULTI: 'Multiple'
}

// to send to simulate key event
const keyCodes = {
    backspace: 8,
    enter: 13,
    esc: 27,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    "delete": 46,
};

const isMac = /Mac/.test(navigator.platform || navigator.userAgent);
const wordModifierKey = isMac ? 'alt' : 'control'
const paragraphModifierKey = isMac ? 'alt' : 'control'

// https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#paragraph
let cursorPosition = 0;
let docLength = 0;
let startIndex = 0;
let endIndex = 0;
const docId = window.location.pathname.split('/d/')[1].split('/')[0];


// UI elements to inject
const bar = document.createElement('div');
bar.className='vim-bar';
let status = document.createElement('p');
status.className='vim-style';
bar.appendChild(status);
document.body.appendChild(bar);

// keyboard events script inject
const script = document.createElement("script");
script.src = chrome.runtime.getURL("page_script.js");
document.documentElement.appendChild(script);

function wordMods(shift = false) {
    return { shift, [wordModifierKey]: true }
}

function paragraphMods(shift = false) {
    return { shift, [paragraphModifierKey]: true }
}

function sendKeyEvent(key, mods = {}) {
    const keyCode = keyCodes[key]
    const defaultMods = { shift: false, control: false, alt: false, meta: false }
    window.dispatchEvent(new CustomEvent("doc-keys-simulate-keypress", { detail: { keyCode, mods: { ...defaultMods, ...mods } } }));
}

class stateMachine {
    // initialize in normal mode, key buffer is user's key combinations
    constructor(){
        this.mode = states.NORMAL;
        status.textContent=this.mode + ' ';
        this.keyBuffer = '';
        this.multiKeys={ct:0, mode:states.NORMAL};
    }

    handleKey(event){
        const key = event.key;
        if(key==='Escape'){
            console.log('-- NORMAL MODE --');
            this.transitionTo(states.NORMAL);
            console.log('buffer: ' + this.keyBuffer.toString());
            this.clearBuffer();
            return;
        }
        switch (this.mode) {
            case states.NORMAL:
                console.log('-- NORMAL MODE --');
                this.handleNormalMode(key, event);
                break;
            case states.INSERT:
                console.log('-- INSERT MODE --');
                this.handleInsertMode(key,event);
                break;
            case states.MULTI:
                console.log('-- MULTI MODE --')
                this.handleMultiMode(key,event);
                break;

        }
    }

    // command list: https://vim.rtorr.com/
    handleNormalMode(key, event) {
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());

        event.preventDefault();
        // repeated motion (3w, 2b, etc.)
        if (/[0-9]/.test(key)) {
            this.clearBuffer();
            this.multiKeys.ct=Number(key);
            this.multiKeys.mode=states.NORMAL;
            this.transitionTo(states.MULTI);
            return;
        }
        // mode transitions
        if (key === 'i' || key === 'a') {
            this.transitionTo(states.INSERT);
            return;
        }
        // key combinations should be intercepted here if more than one in buffer
        // individual keys
        switch (key) {
            case 'j':
                // https://stackoverflow.com/questions/78258654/replace-vertical-tabs-with-line-feeds
                console.log('down');
                sendKeyEvent('down');
               // retrieve paragraph element start/end index, index difference from start index to the first \n character from text content is line length,
               // subtract difference to cursor position

                // let lineLength = text.indexOf('\n');
                // if(cursorPosition - lineLength <= startIndex) cursorPosition -= lineLength;
                this.clearBuffer();
                break;
            case 'k':
                console.log('up');
                sendKeyEvent('up');
                this.clearBuffer();
                break;
            case 'h':
                console.log('left');
                sendKeyEvent('left');
                if(cursorPosition > 0) cursorPosition--;
                this.clearBuffer();
                break;
            case 'l':
                console.log('right');
                sendKeyEvent('right');
                if(cursorPosition < docLength) cursorPosition++;
                this.clearBuffer();
                break;
            case 'w':
                console.log('jump forward start of word');
                sendKeyEvent("right", wordMods());
                this.clearBuffer();
                break;
            case 'b':
                console.log('jump backward start of word');
                this.clearBuffer();
               sendKeyEvent("left", wordMods());
                break;
            case '0':
                console.log('jump start of line');
                this.clearBuffer();
                sendKeyEvent("home");
                break;
            case '$':
                console.log('jump end of line');
                sendKeyEvent("end");
                this.clearBuffer();
                break;
            case '}':
                console.log('jump next paragraph');
                this.clearBuffer();
                sendKeyEvent("down", paragraphMods(shift));
                sendKeyEvent("right", {shift});
                break;
            case '{':
                console.log('jump prev paragraph');
                this.clearBuffer();
                sendKeyEvent("up", paragraphMods(shift));
                break;
            case 'g':
                sendKeyEvent("home", {control:true});
                this.clearBuffer();
                break;
            case 'G':
                sendKeyEvent("end", {control:true});
                this.clearBuffer();
                break;
            default: status.textContent+=key;
        }

        // in case for invalid combos
        if (this.keyBuffer.length > 3) {
            this.clearBuffer();
            status.textContent=this.mode + " ";
        }
    }
    handleInsertMode(key, event){
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());
        // mode transitions
        if (key === 'Escape') {
            event.preventDefault();
            this.transitionTo(states.NORMAL);
            return;
        }
        // key combinations should be intercepted here if more than one in buffer


        // individual keys
        switch (key) {

        }


    }
    handleMultiMode(key, event){
        event.preventDefault();
        if (/[0-9]/.test(key)) {
            // multi digit (e.g. 11, 222)
            status.textContent+=key;
            this.multiKeys.ct = Number(String(this.multiKeys.ct)+key);
            return;
        }
        switch(this.multiKeys.mode){
            case states.NORMAL:
                this.repeat(key, this.multiKeys.ct, this.handleNormalMode, event);
                break;
        }
        this.transitionTo(this.multiKeys.mode);
    }

    transitionTo(newMode){
        if(this.mode!== newMode){
            this.mode = newMode;
            this.clearBuffer();

            // TBA: UI should change here
            switch(this.mode){
                case states.MULTI:
                    status.textContent = this.multiKeys.mode +" "+ this.multiKeys.ct;
                    break;
                case states.NORMAL:
                case states.INSERT:
                   status.textContent=this.mode + " ";
                   break;
            }

        }
    }
    clearBuffer() {
        this.keyBuffer = '';
    }

    repeat(key, times, motion, event){
        for(let i=0; i<times; i++) motion.call(this,key,event);
    }
}

const vim = new stateMachine();
let isVimEnabled = true;


chrome.storage.local.get({ enabled: true }, (data) => {
  isVimEnabled = data.enabled;
  if(!isVimEnabled) bar.classList.add("hide");
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enabled !== undefined) {
      isVimEnabled = changes.enabled.newValue;

      if (!isVimEnabled) {
          vim.transitionTo(states.NORMAL);
          bar.classList.add("hide");
      } else{
          bar.classList.remove("hide");
      }
  }
});
// grab the google docs element frame to send events to
const iframe = document.getElementsByTagName('iframe')[0];

iframe.contentDocument.addEventListener('keydown', (e)=> {
    if (!isVimEnabled) return;
    bar.classList.remove("hide");
    if(e.key==='Shift'||e.key==='Control'||e.key==='Alt'||e.key==='Tab'||e.key==='Meta') return;
    vim.handleKey(e);
}, true);})();
                // i - insert before cursor (state change)
                // I - insert beginning of line (state change)
                // a - append after cursor
                // A - append end of line
                // o - open new line below (state change)
                // O - open new line above (state change)
                // d - delete
                // cc - change line
                // C - change to end line
                // v - visual (state change)
                // r - replace (state change)
                // y - yank
                // j - cursor down
                // k - cursor up
                // l - cursor right
                // h - cursor left
                // w - jump start of word
                // e - jump end of word
                // b - jump back start of word
                // 0 - jump to start of line
                // $ - jump to end of line
                // } - jump next paragraph
                // { - jump prev paragraph
                // u - undo
                // U - restore
                // s - delete character substitute text (state change)
                // S - delete line substitute text (state change)