#!/usr/bin/env node

var pathFn = require('path');
var fs = require('fs');
var razor = require('../');
var util = require('util');

i18n.lang = 'en'; //默认english
var cn = ~ (new Date()).toLocaleString().indexOf("中国标准时间");
if (cn) i18n.lang = "cn";

if (process.argv.length < 3) {
    return console.log(i18n("help"));
}

var paths = getPaths(); // a,b,c
var output = process.argv[3]; // abc.xxx

var dest = '';
if (output) {
    if (output.slice(-1) == '/' || output.slice(-1) == '\\') {
        dest = output + "%s.html";
    }
    else if (output.indexOf('.') === -1) { //razor a,b,c css -> a.css,b.css,c.css
        dest = "%s." + output;
    }
    else {
        dest = output;
    }
}

paths.forEach(function(p) {
    if (!fs.existsSync(p)) {
        return console.log(i18n("file_not_found"), p);
    }

    var result = razor.renderFileSync(p);
    var cur_dest = '';

    if (dest) {
        if (dest.indexOf("%s") > 0)
            cur_dest = util.format(dest, pathFn.basename(p, pathFn.extname(p)));
        else
            cur_dest = dest;
    }
    else {
        //尝试从模板中读取 dest = xxx
        //regex var dest = "abc";
        //"var dest = 'abc';".match(/var\s*?dest\s*?=\s*?['"]([\s\S]+)['"];?/)
        var tmpl = fs.readFileSync(p) + "";
        var arr = tmpl.match(/var\s*?dest\s*?=\s*?['"]([\s\S]+)['"]/); // match group index input

        if (arr && arr[1]) {
            cur_dest = pathFn.join(pathFn.dirname(p), arr[1]);
        };
    }

    if (cur_dest) {
        fs.writeFileSync(cur_dest, result);
        console.log(i18n("success"), cur_dest);
    }
});

function getPaths() {
    var paths = [];
    var path = process.argv[2]; // node razor.js a,b,c

    // a,b.razor,c
    paths = path.split(',').map(function(p) {
        if (pathFn.basename(p).indexOf('.') == '-1' && !fs.existsSync(p)) {
            p += '.razor';
        }
        return pathFn.resolve(p);
    });
    return paths;
}

function i18n(arg) {
    var lang = i18n.lang;
    return (require("./i18n/" + lang))[arg];
}
i18n.lang = 'en'; //默认english