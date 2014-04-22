var fs = require('fs');
var path = require('path');

//razor has
//render/compile (template)
var razor = require("./razor-tmpl.js");

//cache
//从ejs中抄的
var templateCache = {};
razor.clearCache = function () {
    templateCache = {};
};

//express
razor._express = razor.renderFile = function (viewPath, ViewBag, callback) {
    //callback(error,renderedContent)

    if (typeof (ViewBag) === "function" && callback)
    {
        //没有提供ViewBag,但是有callback
        callback = ViewBag;
        ViewBag = {};
    }

    //read template
    try
    {
        //read cache or read file
        var templateString;
        if (templateCache[viewPath])
        {
            templateString = templateCache[viewPath]
        }
        else
        {
            templateCache[viewPath] = templateString = fs.readFileSync(viewPath, "utf8");
        }
        //cache to the ViewBag
        //ViewBag.$chche = templateString;
    }
    catch (e)
    {
        callback(e);
        return;
    }

    //处理 @include(相对路径)
    templateString = templateString.replace(/\Sinclude\(['"]([\s\S]+?)['"]\)/g, function (match, group1, offsetIndex, input) {
        var toBeIncludedRelativePath = group1;//相对路径,可能包含 后缀

        //后缀
        var ext = path.extname(toBeIncludedRelativePath);
        if (!ext) toBeIncludedRelativePath += ".razor";

        var basePath = path.dirname(viewPath);//当前视图 父文件夹
        var toBeIncludedPath = path.join(basePath, toBeIncludedRelativePath);

        return templateCache[toBeIncludedPath] ||
            (templateCache[toBeIncludedPath] = fs.readFileSync(toBeIncludedPath, "utf-8"));
    });
    callback(null, razor.render(templateString, ViewBag));
    //此方法没有返回值,render结果交给callback处理,结果在第二个参数renderedContent
};

//exports >>> renderFile & _express
//app.engine("razor",require("RazorTmpl")._express);
module.exports = razor;