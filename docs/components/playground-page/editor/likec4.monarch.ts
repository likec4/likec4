// Monarch syntax highlighting for the likec4 language.
export default {
    keywords: [
        'BottomTop','LeftRight','RightLeft','TopBottom','autoLayout','browser','color','cylinder','description','element','exclude','extend','include','it','model','muted','of','person','primary','queue','rectangle','secondary','shape','specification','storage','style','tag','technology','this','title','view','views'
    ],
    operators: [
        '.*', '*','->'
    ],
    symbols:  /->|\.\*|\*/,

    tokenizer: {
        initial: [
            { regex: /[0-9]/, action: {"token":"DIGIT"} },
            { regex: /[\t\r\n\v\f]/, action: {"token":"NEWLINE"} },
            { regex: /"[^"]*"|'[^']*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
            { regex: /[^\W\d_]+/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"source"} }} }
        ],
        whitespace: [
            { regex: /[^\S\r\n]/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^\/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[\/\*]/, action: {"token":"comment"} },
        ],
    }
};
