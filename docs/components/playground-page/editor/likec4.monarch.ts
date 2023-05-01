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
            { regex: /[\t\r\n\v\f]/, action: {"token":"white"} },
            { regex: /"[^"]*"|'[^']*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /->|\.\*|\*/, action: {"token":" operator"} },
            { regex: /\b[^\W\d_]+\b/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"source"} }} }
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
