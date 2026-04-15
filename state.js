// https://github.com/vim/vim/blob/master/src/README.md#the-main-loop
// add event keypress mapper
(() => {

const states ={
    INSERT: 'Insert',
    //VISUAL: 'Visual',
    NORMAL: 'Normal'
}
// https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#paragraph
let cursorPosition = 0;
let docLength = 0;
let startIndex = 0;
let endIndex = 0;
const docId = window.location.pathname.split('/d/')[1].split('/')[0];

// UI elements to inject
const bar = document.createElement('div');
bar.className='vim-sticky';
let status = document.createElement('p');
status.className='vim-style';
bar.appendChild(status);
document.body.appendChild(bar);

// keyboard events script inject
const script = document.createElement("script");
script.src = chrome.runtime.getURL("page_script.js");
document.documentElement.appendChild(script);

class stateMachine {
    // initialize in normal mode, key buffer is user's key combinations
    constructor(){
        this.mode = states.NORMAL;
        status.textContent=this.mode;
        this.keyBuffer = '';
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
        }
    }

    // command list: https://vim.rtorr.com/
    handleNormalMode(key, event) {
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());
        // mode transitions
        if (key === 'i' || key === 'a') {
            event.preventDefault();
            this.transitionTo(states.INSERT);
            return;
        }
        // key combinations should be intercepted here if more than one in buffer


        // individual keys
        switch (key) {
            case 'j':
                // https://stackoverflow.com/questions/78258654/replace-vertical-tabs-with-line-feeds
                console.log('down');
               // retrieve paragraph element start/end index, index difference from start index to the first \n character from text content is line length,
               // subtract difference to cursor position

                // let lineLength = text.indexOf('\n');
                // if(cursorPosition - lineLength <= startIndex) cursorPosition -= lineLength;
                this.clearBuffer();
                break;
            case 'k':
                console.log('up');
                this.clearBuffer();
                break;
            case 'h':
                console.log('left');
                if(cursorPosition > 0) cursorPosition--;
                this.clearBuffer();
                break;
            case 'l':
                console.log('right');
                if(cursorPosition < docLength) cursorPosition++;
                this.clearBuffer();
                break;
            case 'w': console.log('jump forward start of word'); this.clearBuffer();break;
            case 'b': console.log('jump backward start of word'); this.clearBuffer();break;
            case '0': console.log('jump start of line'); this.clearBuffer();break;
            case '$': console.log('jump end of line'); this.clearBuffer();break;
            case '}': console.log('jump next paragraph'); this.clearBuffer();break;
            case '{': console.log('jump prev paragraph'); this.clearBuffer();break;
        }

        // in case for invalid combos
        if (this.keyBuffer.length > 3) this.clearBuffer();
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

    transitionTo(newMode){
        if(this.mode!== newMode){
            this.mode = newMode;
            this.clearBuffer();

            // TBA: UI should change here
            status.textContent=this.mode;
        }
    }
    clearBuffer() {
        this.keyBuffer = '';
    }
}

const vim = new stateMachine();
let isVimEnabled = true;

chrome.storage.local.get({ enabled: true }, (data) => {
  isVimEnabled = data.enabled;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enabled !== undefined) {
      isVimEnabled = changes.enabled.newValue;

      if (!isVimEnabled) {
          vim.transitionTo(states.NORMAL);
      }
  }
});
// grab the google docs element frame to send events to
const iframe = document.getElementsByTagName('iframe')[0];

iframe.contentDocument.addEventListener('keydown', (e)=> {
    if (!isVimEnabled) return;
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