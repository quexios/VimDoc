
// add event keypress mapper
const states ={
    INSERT: 'Insert',
    //VISUAL: 'Visual',
    NORMAL: 'Normal'
}

class stateMachine {
    // initialize in normal mode, key buffer is user's key combinations
    constructor(){
        this.mode = states.NORMAL;
        this.keyBuffer = '';
    }

    handleKey(event){
        const key = event.key;
        if(key==='Escape'){
            this.transitionTo(states.NORMAL);
            this.clearBuffer();
            return;
        }
        switch (this.mode) {
            case states.NORMAL:
                console.log('-- NORMAL MODE --');
                this.handleNormalMode(key, event);
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
            case 'j': console.log('down'); this.clearBuffer();break;
            case 'k': console.log('up'); this.clearBuffer();break;
            case 'h': console.log('left'); this.clearBuffer();break;
            case 'l': console.log('right'); this.clearBuffer();break;
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

    transitionTo(newMode){
        if(this.mode!== newMode){
            this.mode = newMode;
            this.clearBuffer();

            // TBA: UI should change here
        }
    }
    clearBuffer() {
        this.keyBuffer = '';
    }
}

const vim = new stateMachine();

window.addEventListener('keydown', (e)=> {
    // ignore key modifiers
    if(e.key==='Shift'||e.key==='Control'||e.key==='Alt'||e.key==='Tab') return;
    vim.handleKey(e);
}, true);
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