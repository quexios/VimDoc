// https://github.com/tirthd16/dockeys/blob/main/page_script.js#L3

const simulateKeyEvent = function(eventType, el, args) {
    // How to do this in Chrome: http://stackoverflow.com/q/10455626/46237
    const event = document.createEvent("KeyboardEvent");
    Object.defineProperty(event, "keyCode", {
        get() {
            return this.keyCodeVal;
        },
    });
    Object.defineProperty(event, "which", {
        get() {
            return this.keyCodeVal;
        },
    });
    const mods = args.mods || {};
    event.initKeyboardEvent(
        eventType, // eventName
        true, // canBubble
        true, //canceleable
        document.defaultView, // view
        "", // keyIdentifier string
        false, // (not sure)
        !!mods.control, // control
        !!mods.alt, // alt
        !!mods.shift, // shift
        !!mods.meta, // meta
        args.keyCode, // keyCode
        args.keyCode, // (not sure)
    );
    event.keyCodeVal = args.keyCode;
    Object.defineProperty(event, "altKey", {
        get() {
            return !!mods.alt;
        },
    });
    Object.defineProperty(event, "metaKey", {
        get() {
            return !!mods.meta;
        },
    });
    el.dispatchEvent(event);
};

const editorEl = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;

window.addEventListener("doc-keys-simulate-keypress", function(event) {
    const args = event.detail
    simulateKeyEvent("keydown", editorEl, args);
    simulateKeyEvent("keyup", editorEl, args);
});