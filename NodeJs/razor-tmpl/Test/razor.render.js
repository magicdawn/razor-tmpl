var razor = require('../index.js');
var assert = require('assert');
var path = require('path');

describe('basic', function () {
    it('render', function () {
        var template = "<div>@(ViewBag.data)</div>";
        var result = razor.render(template, {
            data: 10
        })
        assert(result, "<div>10</div>");
    });

    //render(viewpath,viewbag,root,callback)
    it('renderFile-layout相对路径', function () {
        var file = path.join(__dirname, 'view/index.razor');
        //(viewPath,ViewBag,rootDir)
        var result = razor.renderFile(file, {
            title: 'index',
            hello : 'hello razor'
        }, function (err,result) {
            //if (!err) console.log(result);
            //打log
        });
    });

    it('renderFile-layout-绝对路径',function(){
    	var file = path.join(__dirname,'view/absolute.razor');
    	var result = razor.renderFileSync(file, {
            title: 'index',
            hello : 'hello razor'
        },path.join(__dirname,'view'));
        console.log(result);
    });
});