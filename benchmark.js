var razor = require("./razor-tmpl.js");
razor.debuging = true;

var template_escape = "\n\
<div>\n\
    <h1 class='header'>@(=- header)</h1>\n\
    <h2 class='header2'>@(-= header2)</h2>\n\
    <h3 class='header3'>@(-= header3)</h3>\n\
    <h4 class='header4'>@(=-    header4)</h4>\n\
    <h5 class='header5'>@(- ViewBag.header5)</h5>\n\
    <h6 class='header6'>@(- ViewBag.header6)</h6>\n\
    <ul class='list'>\n\
        @ for (var i = 0, l = ViewBag.list.length; i < l; i++) { \n\
            <li class='item'>@(- ViewBag.list[i])</li>\n\
        }\n\
    </ul>\n\
</div>";

var template = "\n\
<div>\n\
    <h1 class='header'>@(=header)</h1>\n\
    <h2 class='header2'>@(= header2)</h2>\n\
    <h3 class='header3'>@(ViewBag.header3)</h3>\n\
    <h4 class='header4'>@(ViewBag.header4)</h4>\n\
    <h5 class='header5'>@(ViewBag.header5)</h5>\n\
    <h6 class='header6'>@(ViewBag.header6)</h6>\n\
    <ul class='list'>@for (var i = 0, l = ViewBag.list.length; i < l; i++) {\n\
        <li class='item'>@(= list[i])</li>\n\
    }\n\
    </ul>\n\
</div>";

//make the template bigger
//for (var i = 0 ; i < 3 ; i++)
//{
//    template += template;
//    template_escape += template_escape;
//}

var vars = {
    header: "Header",
    header2: "Header2",
    header3: "Header3",
    header4: "Header4",
    header5: "Header5",
    header6: "Header6",
    list: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

var vars_escape = {
    header: "<Header>",
    header2: "<Header2>",
    header3: "<Header3>",
    header4: "<Header4>",
    header5: "<Header5>",
    header6: "<Header6>",
    list: ['&1', '&2', '&3', '&4', '&5', '&6', '&7', '&8', '&9', '&10']
};

//get The time to execute the function
//usgae : getTime(function(){});
var getTime = function (f) {
    var start = new Date();
    f();
    console.log(new Date() - start);
};

//-----------------------------------------
//---razor
//-----------------------------------------
//非escape
var func = razor.compile(template);
//escape
var func_escape = razor.compile(template_escape);

console.log("---------------------------------");
console.log("non escape ...");
console.log(func(vars));
console.log("spend time :");
getTime(function () {
    for (var i = 0; i < 100000; i++)
    {
        func(vars);
    }
});
console.log("---------------------------------");


console.log("---------------------------------");
console.log("escape ...");
console.log(func_escape(vars_escape));
console.log("spend time :");
getTime(function () {
    for (var i = 0; i < 100000; i++)
    {
        func_escape(vars_escape);
    }
});
console.log("---------------------------------");


/*
    Other Template Engines :
    http://cnodejs.org/topic/4f16442ccae1f4aa27001109
    https://github.com/fengmk2/fengmk2.github.com/tree/master/blog/2011/04/js-template-benchmarks

    Test Result ...
    Environment : {
        Cpu : 2.3 GHz
        Memory : 4GB
    }

    None Escape ...
    125

    Escape
    2005
*/