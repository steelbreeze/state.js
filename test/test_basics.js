/**
 * Created by y50-70 on 2015/12/30.
 */
var StateJS = require('../lib/state.com.js');


StateJS.console = console;
var model = StateJS.create({
    states:[{name:'initial',kind:StateJS.PseudoStateKind.Initial},
        {name:'state1',regions:{
            regionA:[
                {name:'initialA',kind:StateJS.PseudoStateKind.Initial},
                {name:'state3'},
                {name:'state8'}
            ],
            regionB:[
                {name:'initialB',kind:StateJS.PseudoStateKind.Initial},
                {name:'state4',regions:{
                    regionBa:[
                        {name:'initialBa',kind:StateJS.PseudoStateKind.Initial},
                        {name:'state6'}
                    ],
                    regionBb:[
                        {name:'initialBb',kind:StateJS.PseudoStateKind.Initial},
                        {name:'state7'}
                    ]
                }},
                {name:'state5'}

            ]
        }},
        {name:'state2'}
    ],
    events:[
        {name:'init',from:'initial',to:'state1'},
        {name:'A_3',from:'initialA',to:'state3'},
        {name:'B_4',from:'initialB',to:'state4'},
        {name:'Ba_6',from:'initialBa',to:'state6'},
        {name:'Bb_7',from:'initialBb',to:'state7'},
        {name:'3_2',from:'state3',to:'state2'},
        {name:'3_8',from:'state3',to:'state8'},
        {name:'7_5',from:'state7',to:'state5'}
    ],
    callbacks: {
        "3_2":{
            when:[function (c) { return c === "event2"; }]
        },
        "3_8":{
            when:[function (c) { return c === "event1"; }]
        },
        "7_5":{
            when:[function (c) { return c === "event2"; },
                function (c) { return c === "event1"; }
            ]
        }
    }
});