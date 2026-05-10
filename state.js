// https://github.com/vim/vim/blob/master/src/README.md#the-main-loop
(() => {
if (window.__VIMDOC_LOADED__) return;
  window.__VIMDOC_LOADED__ = true;

const states ={
    INSERT: 'Insert',
    VISUAL: 'Visual',
    VISUALLINE: 'Visual Line',
    NORMAL: 'Normal',
    MULTI: 'Multiple',
    COMBO: 'Combo',
    COMBO2: 'Combo2'
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

let menuItemElements = {}

let menuItems = {
    copy: { parent: "Edit", caption: "Copy" },
    cut: { parent: "Edit", caption: "Cut" },
    paste: { parent: "Edit", caption: "Paste" },
    redo: { parent: "Edit", caption: "Redo" },
    undo: { parent: "Edit", caption: "Undo" },
    find: { parent: "Edit", caption: "Find" }
}


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
        this.longStringOp = "";
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
            case states.VISUAL:
                console.log('-- VISUAL MODE --');
                this.handleVisualMode(key,event);
                break;
            case states.VISUALLINE:
                console.log('-- VISUAL LINE --');
                this.handleVisualLineMode(key,event);
                break;
            case states.MULTI:
                console.log('-- MULTI MODE --');
                this.handleMultiMode(key,event);
                break;
            case states.COMBO:
                console.log('-- COMBO --');
                this.handleCombo(key,event);
                break;
            case states.COMBO2:
                console.log('-- COMBO2 --');
                this.handleCombo2(key,event);
                break;

        }
    }

    // command list: https://vim.rtorr.com/
    handleNormalMode(key, event) {
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());
        if (key === 'Escape') {
            event.preventDefault();
            this.clearBuffer();
            return;
        }
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
        if(key==='v'){
            this.transitionTo(states.VISUAL);
            return;
        }
        if(key==='V'){
            this.transitionTo(states.VISUALLINE);
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
            case 'e':
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
                sendKeyEvent("down", paragraphMods(false));
                sendKeyEvent("right", {shift:false});
                break;
            case '{':
                console.log('jump prev paragraph');
                this.clearBuffer();
                sendKeyEvent("up", paragraphMods(false));
                break;
            case 'o':
                sendKeyEvent('end');
                sendKeyEvent("enter", { shift: true });
                sendKeyEvent("enter", { shift: true });
                sendKeyEvent('up');
                this.clearBuffer();
                this.transitionTo(states.INSERT);
                break;
            case 'O':
                sendKeyEvent('home');
                sendKeyEvent("enter", { shift: true });
                sendKeyEvent("enter", { shift: true });
                sendKeyEvent('up');
                this.clearBuffer();
                this.transitionTo(states.INSERT);
                break;
            case 'y':
                this.longStringOp = key;
                this.transitionTo(states.COMBO);
                return;
            case 'p':
                this.clearBuffer();
                this.clickMenu(menuItems.paste);
                break
            case 'u':
                this.clearBuffer();
                this.clickMenu(menuItems.undo);
                break;
            case 'r':
                this.clearBuffer();
                this.clickMenu(menuItems.redo);
                break;
            case '/':
                this.clearBuffer();
                this.clickMenu(menuItems.find);
                break;
            case 'x':
                this.clearBuffer();
                sendKeyEvent("delete");
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

    handleVisualMode(key,event){
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());
       if (key === 'Escape') {
           event.preventDefault();
           this.transitionTo(states.NORMAL);
           return;
       }
       event.preventDefault();
        switch (key) {
            case "w":
                sendKeyEvent("left",{control:true})
                sendKeyEvent("right", wordMods());
                sendKeyEvent("right", wordMods(true));
                break;
            case "p":
                sendKeyEvent("up", paragraphMods(true));
                sendKeyEvent("down", paragraphMods(true));
                sendKeyEvent("right", { shift:true });
                break;
        }
        this.clearBuffer();
        this.mode=states.VISUALLINE;
        status.textContent=states.VISUALLINE + " ";
        this.handleVisualLineMode(key,event);
        //this.transitionTo(states.VISUALLINE);

    }

    handleVisualLineMode(key, event){
        this.keyBuffer += key;
        console.log('buffer: ' + this.keyBuffer.toString());

        if (key === 'Escape') {
           event.preventDefault();
           this.transitionTo(states.NORMAL);
           return;
       }
       event.preventDefault();
        switch (key) {
            case "":
                break;
            case "h":
                sendKeyEvent("left", { shift: true });
                break;
            case "j":
                sendKeyEvent("down", { shift: true });
                break;
            case "k":
                sendKeyEvent("up", { shift: true });
                break;
            case "l":
                sendKeyEvent("right", { shift: true });
                break;
            case "p":
                this.clickMenu(menuItems.paste);
                this.transitionTo(states.NORMAL);
                break;
            case "}":
                sendKeyEvent("down", paragraphMods(true));
                sendKeyEvent("right", { shift:true });
                break;
            case "{":
                 sendKeyEvent("up", paragraphMods(true));
                break;
            case "b":
                sendKeyEvent("left", wordMods(true));
                break;
            case "e":
            case "w":
                sendKeyEvent("right", wordMods(true));
                break;
            case "^":
            case "_":
            case "0":
                sendKeyEvent("home",{shift:true});
                break;
            case "$":
                sendKeyEvent("end",{shift:true});
                break;
            case "G":
                if (isMac) {
                    sendKeyEvent("down", { meta: true, shift:true });
                } else {
                    sendKeyEvent("end", { control: true, shift:true })
                }
                break;
            case "g":
                if (isMac) {
                    sendKeyEvent("up", { meta: true, shift:true })
                } else {
                    sendKeyEvent("home", { control: true, shift:true })
                }
                break;
            case "c":
            case "d":
            case "y":
                this.runLongStringOp(key);
                break
            case "i":
            case "a":
                break;
            }
            this.clearBuffer();
    }
    handleCombo(key,event){
        event.preventDefault();
        status.textContent+=key;
        switch(key){
           case "i":
           case "a":
               sendKeyEvent("left");
               break;
           case "w":
               sendKeyEvent("right", wordMods(true));
               this.runLongStringOp();
               break;
           case "p":
               sendKeyEvent("down", paragraphMods(true));
               this.runLongStringOp();
               break;
           case "^":
           case "_":
           case "0":
               sendKeyEvent("home", {shift:true});
               this.runLongStringOp();
               break;
           case "$":
               sendKeyEvent("end", {shift:true});
               this.runLongStringOp();
               break;
           case this.longStringOp:
               // go to start of line, select to end of line
               sendKeyEvent("home");
               sendKeyEvent("end", {shift:true});
               this.runLongStringOp();
               break
           default:
               this.transitionTo(states.NORMAL);
        }
    }

    handleCombo2(key,event){
        event.preventDefault();
        switch (key) {
            case "w":
                sendKeyEvent("left",wordMods());
                this.handleCombo(key);
                break;
            case "p":
                sendKeyEvent("up",paragraphMods(false));
                this.handleCombo(key);
                break;
            default:
                this.transitionTo(states.NORMAL);
                break;
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
            let oldMode = this.mode;
            this.mode = newMode;
            this.clearBuffer();

            // TBA: UI should change here
            switch(this.mode){
                case states.MULTI:
                    status.textContent = this.multiKeys.mode +" "+ this.multiKeys.ct;
                    break;
                case states.NORMAL:
                    if(oldMode == states.VISUALLINE || oldMode == states.COMBO){
                        sendKeyEvent("left");
                    }
                    status.textContent=this.mode + " ";
                    break;
                case states.VISUAL:
                case states.VISUALLINE:
                case states.COMBO:
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

    clickMenu(itemCaption) {
        this.simulateClick(this.getMenuItem(itemCaption));
    }

    clickToolbarButton(captionList) {
        // Sometimes a toolbar button won't exist in the DOM until its parent has been clicked, so we
        // click all of its parents in sequence.
        for (const caption of Array.from(captionList)) {
            const els = document.querySelectorAll(`*[aria-label='${caption}']`);
            if (els.length == 0) {
                console.log(`Couldn't find the element for the button labeled ${caption}.`);
                console.log(captionList);
                return;
            }
            // Sometimes there are multiple elements that have the same label. When that happens, it's
            // ambiguous which one to click, so we log it so it's easier to debug.
            if (els.length > 1) {
                console.log(
                    `Warning: there are multiple buttons with the caption ${caption}. ` +
                    "We're expecting only 1.",
                );
                console.log(captionList);
            }
            this.simulateClick(els[0]);
        }
    }
    // Returns the DOM element of the menu item with the given caption. Prints a warning if a menu
    // item isn't found (since this is a common source of errors in SheetKeys) unless silenceWarning
    // is true.

    getMenuItem(menuItem, silenceWarning = false) {
        const caption = menuItem.caption;
        let el = menuItemElements[caption];
        if (el) return el;
        el = this.findMenuItem(menuItem);
        if (!el) {
            if (!silenceWarning) console.error("Could not find menu item with caption", menuItem.caption);
            return null;
        }
        return menuItemElements[caption] = el;
    }

    findMenuItem(menuItem) {
        this.activateTopLevelMenu(menuItem.parent);
        const menuItemEls = document.querySelectorAll(".goog-menuitem");
        const caption = menuItem.caption;
        const isRegexp = caption instanceof RegExp;
        for (const el of Array.from(menuItemEls)) {
            const label = el.innerText;
            if (!label) continue;
            if (isRegexp) {
                if (caption.test(label)) {
                    return el;
                }
            } else {
                if (label.startsWith(caption)) {
                    return el;
                }
            }
        }
        return null;
    }

    simulateClick(el, x = 0, y = 0) {
        const eventSequence = ["mouseover", "mousedown", "mouseup", "click"];
        for (const eventName of eventSequence) {
            const event = document.createEvent("MouseEvents");
            event.initMouseEvent(
                eventName,
                true, // bubbles
                true, // cancelable
                window, //view
                1, // event-detail
                x, // screenX
                y, // screenY
                x, // clientX
                y, // clientY
                false, // ctrl
                false, // alt
                false, // shift
                false, // meta
                0, // button
                null, // relatedTarget
            );
            el.dispatchEvent(event);
        }
    }

    activateTopLevelMenu(menuCaption) {
        const buttons = Array.from(document.querySelectorAll(".menu-button"));
        const button = buttons.find((el) => el.innerText.trim() == menuCaption);
        if (!button) {
            throw new Error(`Couldn't find top-level button with caption ${menuCaption}`);
        }
        // Unlike submenus, top-level menus can be hidden by clicking the button a second time to
        // dismiss the menu.
        this.simulateClick(button);
        this.simulateClick(button);
    }

    runLongStringOp(operation = this.longStringOp) {
        switch (operation) {
            case "c":
                this.clickMenu(menuItems.cut)
                this.transitionTo(states.INSERT);
                break
            case "d":
                this.clickMenu(menuItems.cut)
                sendKeyEvent('backspace')
                this.transitionTo(states.NORMAL);
                break
            case "y":
                this.clickMenu(menuItems.copy);
                this.transitionTo(states.NORMAL);
                break
            case "p":
                this.clickMenu(menuItems.paste)
                this.transitionTo(states.NORMAL);
                break
            case "v":
                break
            case "g":
                if (isMac) {
                    sendKeyEvent("up", { meta: true, shift:true })
                } else {
                    sendKeyEvent("home", { control: true, shift:true })
                }
                this.longStringOp="";
                break;
        }
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