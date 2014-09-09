var fs = require('fs');
var pathFn = require('path');
var vm = require('vm');
var util = require('util');
var razor = module.exports = require("./razor-tmpl.js");
var layout = require('./layout.js');

razor.viewEncoding = "utf8";
//razor.debuging = false;在razor-tmpl已设

/*
 * cache
 * 从ejs中抄的
 */
var cache_templates = {}; //原始 内容
var cache_layouts = {}; //存储一个文件的布局,一个view中的layout 运行后不会变
var cache_layouted_templates = {}; //应用了layout的模板

//清除缓存
razor.clearCache = function() {
    cache_templates = {};
    cache_layouts = {};
    cache_layouted_templates = {};
};
razor.clearCache._doc = "clear the template cache";


function getTemplate(viewPath, callback) {
    //callback(error,result)
    if (cache_templates[viewPath])
        return callback(null, cache_templates[viewPath]);

    fs.readFile(viewPath, razor.viewEncoding, function(err, result) {
        if (err) return callback(err);
        callback(null, cache_templates[viewPath] = result);
    });
}

function getTemplateSync(viewPath) {
    if (cache_templates[viewPath]) return cache_templates[viewPath];

    //read
    try {
        return cache_templates[viewPath] = fs.readFileSync(viewPath, razor.viewEncoding);
    }
    catch (e) {
        throw new Error("File Not Found : {0}".razorFormat(viewPath));
    }
};
//应用了 layout 的模板
function getFullTemplate(viewPath, ViewBag, callback) {
    ViewBag = ViewBag || {};
    callback = callback || function() {};

    getTemplate(viewPath, function(err, template) {
        if (err) return callback(err);
        template = handleInclude(viewPath, template);

        var layout_path = (function() {
            if (ViewBag["layout"])
                return ViewBag["layout"];
            else if (cache_layouts && cache_layouts[viewPath])
                return cache_layouts[viewPath];
            else
                return cache_layouts[viewPath] = layout.getLayout(template);
        })();

        if (!layout_path) return callback(null, template); //no layout

        layout_path = pathFn.join(pathFn.dirname(viewPath), layout_path);

        //now view-layout
        //1.cahce_layouted_templates = {
        //      "d:\xxx.razor" : {
        //          // key 为 layout
        //          "d:\xxx\layouts\layout.razor" : "<html><html>" //full template
        //       },...
        //  }
        //
        //如果 cache[view][layout] 有缓存
        if (cache_layouted_templates[viewPath] && cache_layouted_templates[viewPath][layout_path])
            return callback(null, cache_layouted_templates[viewPath][layout_path]);

        //读layout,拼接,存储
        //对模版也是Full,模板嵌套
        getFullTemplate(layout_path, null, function(err, layout_content) {
            if (err) return callback(err);

            var full_template = layout.fillLayout(layout_content, template);
            //保存到cache
            cache_layouted_templates[viewPath] = cache_layouted_templates[viewPath] || {};
            cache_layouted_templates[viewPath][layout_path] = full_template;
            //callback value
            callback(err, full_template);
        });
    });
}

function getFullTemplateSync(viewPath, ViewBag) {
    ViewBag = ViewBag || {};

    var layout_path = '';
    var template = getTemplateSync(viewPath); //view
    template = handleInclude(viewPath, template); //@include('abc')

    //1.ViewBag
    if (ViewBag["layout"])
        layout_path = ViewBag["layout"];

    //2.cache
    else if (cache_layouts && cache_layouts[viewPath])
        layout_path = cache_layouts[viewPath];

    //3.read Template,find layout
    else {
        cache_layouts[viewPath] = layout_path = layout.getLayout(template);
    }

    if (!layout_path) return template; //没有layout
    //有layout,相对路径(../layouts/layout.razor)
    layout_path = pathFn.join(pathFn.dirname(viewPath), layout_path);

    //now view-layout
    //1.cahce_layouted_templates = {
    //      "d:\xxx.razor" : {
    //          // key 为 layout
    //          "d:\xxx\lauouts\layout.razor" : "<html><html>" //full template
    //       },...
    //  }
    //
    if (cache_layouted_templates[viewPath] && cache_layouted_templates[viewPath][layout_path]) {
        //chche里有
        return cache_layouted_templates[viewPath][layout_path];
    }

    //读layout,拼接,存储,返回,对模版也是Full,模板嵌套
    var layout_content = getFullTemplateSync(layout_path);
    var full_template = layout.fillLayout(layout_content, template);
    //cache
    cache_layouted_templates[viewPath] = cache_layouted_templates[viewPath] || {};
    cache_layouted_templates[viewPath][layout_path] = full_template;
    return full_template;
}

function handleInclude(viewPath, template) {
    var base = pathFn.dirname(viewPath);
    return template.replace(new RegExp(razor.symbol() + "include\\(([\\s\\S]*?)\\);?", 'ig'), function(match, group) {
        var to = group.trim(); //to be included
        if (to[0] == '"' || to[0] == "'") {
            to = to.slice(1, -1).trim(); //去头去尾
        }
        to = pathFn.join(base, to);

        return getFullTemplateSync(to); //to再次include 其他的
    });
}


razor.renderFile = function(viewPath, ViewBag, callback) {
    if (razor.debuging) razor.clearCache();

    viewPath = pathFn.resolve(viewPath);
    if (typeof ViewBag === "function") { //两个参数
        callback = ViewBag;
        ViewBag = {};
    }
    else if (typeof(ViewBag) === "undefined") { //一个参数
        throw new Error("must pass a callback,usage renderFile(viewPath,[ViewBag],callback)");
    }

    getFullTemplate(viewPath, ViewBag, function(err, template) {
        if (err)
            return callback(err);
        callback(null, advanceRender(viewPath, ViewBag, template));
    });
};
razor.renderFile._doc = "usage : razor.renderFile(viewPath,[ViewBag],callback)";

razor.renderFileSync = function(viewPath, ViewBag) {
    if (razor.debuging) razor.clearCache();

    viewPath = pathFn.resolve(viewPath);
    ViewBag = ViewBag || {};

    var template = getFullTemplateSync(viewPath, ViewBag);
    return advanceRender(viewPath, ViewBag, template);
};
razor.renderFileSync._doc = "usage : razor.renderFileSync(viewPath,[ViewBag])";


razor._express = function() {
    razor.renderFile.apply(razor, arguments);
};
razor._express._doc = "\n\
    interface for Express Framework:\n\
    \n\
    var app = express();\n\
    ...\n\
    app.engine('.razor',require('razor-tmpl')._express);\n\
";

//支持require,支持__dirname,支持__filename
function advanceRender(viewPath, ViewBag, template) {
    ViewBag = ViewBag || {};

    var adv = razor._advance;
    var code = adv.toCode(adv.toTokens(template));

    var func = new Function(razor.model(), "require", "__dirname", "__filename", code);
    var _require = require('./getRequire.js')(viewPath);
    var _dirname = pathFn.dirname(viewPath);
    var _filename = viewPath;
    return func(ViewBag, _require, _dirname, _filename);
}