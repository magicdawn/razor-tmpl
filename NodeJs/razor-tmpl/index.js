var fs = require('fs');
var path = require('path');
var razor = module.exports = require("./razor-tmpl.js");
var layout = require('./layout.js');

razor.viewEncoding = "utf8";
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

/*
 * 取得模板
 */
//原始模板,就是读取文件
function getTemplate(viewPath, callback) {
    //callback(error,result)
    if (cache_templates[viewPath])
        callback(null, cache_templates[viewPath]);
    else {
        fs.readFile(viewPath, razor.viewEncoding, function(err, result) {
            if (err) callback(err);
            callback(null, cache_templates[viewPath] = result);
        });
    }
}
function getTemplateSync(viewPath) {
    var result = cache_templates[viewPath];
    if (result) return result;

    //read
    try {
        result = cache_templates[viewPath] = fs.readFileSync(viewPath, razor.viewEncoding || 'utf8');
        return result;
    }
    catch (e) {
        throw Error("没有找到文件 : {0}".razorFormat(viewPath));
    }
};

/*
 * 应用了 layout 的模板
 */
function getFullTemplate(viewPath, ViewBag, callback) {
    getTemplate(viewPath, function(err, template) {
        if (err) callback(err);
        var layout_path = (function() {
            if (ViewBag && ViewBag["layout"])
                return ViewBag["layout"];
            else if (cache_layouts && cache_layouts[viewPath])
                return cache_layouts[viewPath];
            else
                return cache_layouts[viewPath] = layout.getLayout(template);
        })();

        if (!layout_path) {
            callback(null, template); //没有layout
            return;
        }

        layout_path = path.join(path.dirname(viewPath), layout_path);

        //now view-layout
        //1.cahce_layouted_templates = {
        //      "d:\xxx.razor" : {
        //          // key 为 layout
        //          "d:\xxx\layouts\layout.razor" : "<html><html>" //full template
        //       },...
        //  }
        //
        //如果 cache[view][layout] 有缓存
        if (cache_layouted_templates[viewPath] && cache_layouted_templates[viewPath][layout_path]) {
            //chche里有
            callback(null, cache_layouted_templates[viewPath][layout_path]);
        }

        //读layout,拼接,存储
        //对模版也是Full,模板嵌套
        getFullTemplate(layout_path, function(err, layout_content) {
            var full_template = layout.fillLayout(layout_content, template);
            //保存到cache
            cache_layouted_templates[viewPath] = cache_layouted_templates[viewPath] || {};
            cache_layouted_templates[viewPath][layout_path] = full_template;
            callback(err, full_template);
        });
    });
}
function getFullTemplateSync(viewPath, ViewBag) {
    var layout_path = '';
    var template = getTemplateSync(viewPath); //view

    //1.ViewBag
    if (ViewBag && ViewBag["layout"])
        layout_path = ViewBag["layout"];

    //2.cache
    else if (cache_layouts && cache_layouts[viewPath])
        layout_path = cache_layouts[viewPath];

    //3.read Template,find layout
    else {
        cache_layouts[viewPath] = layout_path = layout.getLayout(template);
    }

    if (!layout_path) return template; //没有layout
    //有layout,相对路径(../layouts/leyout.razor)
    layout_path = path.join(path.dirname(viewPath), layout_path);

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


/*
 * 对外接口
 */
razor.renderFile = function(viewPath, ViewBag, callback) {
    getFullTemplate(viewPath, ViewBag, function(err, template) {
        if (err) throw err;
        callback(null, razor.render(template, ViewBag));
    });
}
razor.renderFileSync = function(viewPath, ViewBag) {
    var fullTemplate = getFullTemplateSync(viewPath, ViewBag);
    return razor.render(fullTemplate, ViewBag);
}


/*
 * for express
 */
razor._express = function(viewPath, ViewBag, callback) {
    if (typeof(ViewBag) === "function" && callback) {
        //没有提供ViewBag,但是有callback
        callback = ViewBag;
        ViewBag = {};
    }
    //在这里 view.engine = _express,razor指向了这个view
    //无法使用相对路径
    razor.renderFile(viewPath, ViewBag, null, callback);
};