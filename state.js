
// add event keypress mapper
const states ={
    INSERT: 'Insert',
    VISUAL: 'Visual',
    NORMAL: 'Normal'
}

class stateMachine {
    // initialize in normal mode, key buffer is user's key combinations
    constructor(){
        this.mode = states.Normal;
        this.keyBuffer = '';
    }

    handleKey(event){
        const key = event.key;
        if(key==='Escape'){
            this.transitionTo(states.Normal);
            this.clearBuffer();
            return;
        }
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
    if(e.key==='Shift'||e.key==='Control'||e.key==='Alt') return;
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