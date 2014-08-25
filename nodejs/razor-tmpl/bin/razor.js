#!/usr/bin/env node

var pathFn = require('path');
var fs = require('fs');
var razor = require('../');

//razor xxx.razor xxx.html
//razor xxx.razor -o output -> 文件output
//razor xxx.razor -o output/ -> output/xxx.html
//razor xxx.razor -o output.html -> output.html
//razor xxx.razor -no-output

if(process.argv.length < 3){
    return console.log("\n\
    razor file [option]\n\
    option 选项 :\n\
        \n\
        -n|-no|-no-output 不要输出\n\
        -o|-output        输出位置\n\
        \n\
    example : \n\
        razor xxx.razor                 -> xxx.html\n\
        razor xxx.razor -o xxx.abc      -> xxx.abc\n\
        razor xxx.razor -o output_dir/  -> output_dir/xxx.html\n\
        razor xxx.razor -no-output      -> no output\n\
    ");
}


var argv = parseArgv();
var paths = getPaths();

if (argv.no_output) { //不输出内容
    paths.forEach(function(p) {
        var result = razor.renderFileSync(p);
        console.log("已处理文件%s,输出由view自己指定",p);
    });
}
else if (!argv.output) {
    paths.forEach(function(p) {
        var result = razor.renderFileSync(p);
        var dest = pathFn.basename(p, '.razor') + ".html";
        fs.writeFileSync(dest, result);
        console.log("已生成文件%s",dest);
    });
}
else if (argv.output.slice(-1) == '/' || argv.output.slice(-1) == '\\') {
    paths.forEach(function(p) {
        var result = razor.renderFileSync(p);
        var dest = argv.output + pathFn.basename(p, '.razor') + ".html"; // output/index.html
        fs.writeFileSync(dest, result);
        console.log("已生成文件%s",dest);
    });
}
else {
    paths.forEach(function(p) {
        var result = razor.renderFileSync(p);
        var dest = argv.output; // output/index.html
        fs.writeFileSync(dest, result);
        console.log("已生成文件%s",dest);
    });
}


function parseArgv() {
    var argv = {
        paths: []
    };

    var _args = process.argv.slice(3); // node razor.js xxx.razor -no
    var args = [];
    _args.forEach(function(arg) {
        if (arg.indexOf('=') > -1) {
            args.push(arg.split('=')[0]);
            args.push(arg.split('=')[1]);
            return
        }
        args.push(arg);
    })

    for (var i = 0, length = args.length; i < length; i++) {
        var arg = args[i];
        if (arg == "-o" || arg == "-output") {
            try {
                argv.output = args[++i];
                continue;
            }
            catch (e) {
                console.error("missing value for -o|-output ");
                throw e;
            }
        }
        else if (arg == '-n' || arg == '-no' || arg == '-no-output') {
            argv.no_output = true;
        }
    }
    return argv;
}

function getPaths() {
    var paths = [];
    var path = process.argv[2];

    // a,b.razor,c
    paths = path.split(',').map(function(p) {
        if (pathFn.basename(p).indexOf('.') == '-1') {
            p += '.razor';
        }
        return pathFn.resolve(p);
    })
    return paths;
}