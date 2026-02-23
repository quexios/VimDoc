import { createMachine, assign, createActor } from 'xstate';
// https://stately.ai/docs/machines
// add event keypress mapper

const stateMachine = createMachine({
    id: 'vim',
    initial: 'normal',
    states:{
        normal:{
            on:{
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

            },
        },
        insert:{},
        visual:{},
        replace:{}
    }
});