var razor = require("./RazorJs.js");

var template_escape = "<div><h1 class='header'>@(- ViewBag.header)</h1><h2 class='header2'>@(- ViewBag.header2)</h2><h3 class='header3'>@(- ViewBag.header3)</h3><h4 class='header4'>@(- ViewBag.header4)</h4><h5 class='header5'>@(- ViewBag.header5)</h5><h6 class='header6'>@(- ViewBag.header6)</h6><ul class='list'>@for (var i = 0, l = ViewBag.list.length; i < l; i++) { <li class='item'>@(- ViewBag.list[i])</li>}</ul></div>";

var template = "<div><h1 class='header'>@(ViewBag.header)</h1><h2 class='header2'>@(ViewBag.header2)</h2><h3 class='header3'>@(ViewBag.header3)</h3><h4 class='header4'>@(ViewBag.header4)</h4><h5 class='header5'>@(ViewBag.header5)</h5><h6 class='header6'>@(ViewBag.header6)</h6><ul class='list'>@for (var i = 0, l = ViewBag.list.length; i < l; i++) { <li class='item'>@(ViewBag.list[i])</li>}</ul></div>";

//make the template bigger
for (var i = 0 ; i < 3 ; i++)
{
    template += template;
    template_escape += template_escape;
}

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
//---razor_str
//-----------------------------------------
console.log("using arr.push() to construct a func ...");
//非escape
var func = razor.compile(template);
//escape
var func_escape = razor.compile(template_escape);

console.log("non escape ...");
console.log("spend time :");
getTime(function () {
    for (var i = 0; i < 100000; i++)
    {
        func(vars);
    }
});

console.log("escape ...");
console.log("spend time :");
getTime(function () {
    for (var i = 0; i < 100000; i++)
    {
        func_escape(vars_escape);
    }
});

/*
    Test Just Like Other Template Engine :
    http://cnodejs.org/topic/4f16442ccae1f4aa27001109
    https://github.com/fengmk2/fengmk2.github.com/tree/master/blog/2011/04/js-template-benchmarks

    Test Result ...
    Environment : {
        Cpu : 2.3 GHz
        Memory : 4GB
    }

    None Escape ...
    144 ms

    Escape
    1304 ms

    
    1.There are two way to construct the 'result' to the fuc
    2.if the template is small,the str+= win
      so I made the for_loop_5 { template+= template; } to make the template*32 big
      under is the result ...
    array.push V.S string+=
    using arr.push() to construct a func ...
        non escape ...
            spend time :
            4717
        escape ...
            spend time :
            61578
    using str+= to construct a func ...
        non escape ...
            spend time :
            2784
        escape ...
            spend time :
            55669

    The str+= wins ...
*/