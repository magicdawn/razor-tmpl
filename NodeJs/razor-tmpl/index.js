var fs = require('fs');
var path = require('path');
var razor = module.exports = require("./razor-tmpl.js");
var layout = require('./layout.js');

//-------------------------------------
//  cache
//  从ejs中抄的
//-------------------------------------
var cache_templates = {}; //原始 内容
var cache_layouts = {}; //存储一个文件的布局,一个view中的layout 运行后不会变
var cache_layouted_templates = {}; //应用了layout的模板

//清除缓存
razor.clearCache = function () {
    cache_templates = {};
    cache_layouts = {};
    cache_layouted_templates = {};
};

//-------------------------------------
//  取得模板
//  @layout
//  @section
//  return string
//-------------------------------------
//原始模板
razor.getTemplate = function (viewPath, encoding, callback) {
    if (typeof encoding === "function")
    {
        //省略encoding
        callback = encoding;
        encoding = 'utf8';
    }

    //callback(error,result)
    if (cache_templates[viewPath])
        callback(null, cache_templates[viewPath]);
    else
    {
        try
        {
            fs.readFile(viewPath, encoding, function (err, result) {
                if (err) throw err;
                callback(null, cache_templates[viewPath] = result);
            });
        }
        catch (e)
        {
            callback(e);
        }
    }
};
razor.getTemplateSync = function (viewPath, encoding) {
    var result = cache_templates[viewPath];
    if (result) return result;

    //read
    try
    {
        result = cache_templates[viewPath] = fs.readFileSync(viewPath, encoding || 'utf8');
        return result;
    }
    catch (e)
    {
        throw Error("没有找到文件 : {0}".razorFormat(viewPath));
    }
};


//
// 应用了 layout 的模板
//
//可省略rootdir
razor.getFullTemplate = function (viewPath, ViewBag, rootDir, callback) {
    ViewBag = ViewBag || {}; //从ViewBag中取layout
    if (typeof rootDir === 'function')
    {
        callback = rootDir; //~代表的根目录
        rootDir = null;
    }

    try
    {
        razor.getTemplate(viewPath, function (err, template) {
            if (err) throw err;
            //template : view文件

            var layout_path = ViewBag["layout"] || cache_layouts[viewPath];
            if (!layout_path)
            {
                //first time parse layout
                //真实layout 或者 "null"
                cache_layouts[viewPath] = layout_path = layout.getLayout(template);
            }

            //no layout found
            if (layout_path === 'null')
            {
                callback(null, template);
                return;
            }

            //reslove the relative(../layouts/) or the direct(~/)
            if (layout_path[0] === '~' || layout_path[0] === '/')
            {
                //绝对路径(~/views/xxx)
                if (!rootDir) throw new Error("不支持mapPath操作,请使用相对路径表示 布局(layout)");
                layout_path = require("./util.js").mapPath(rootDir, layout_path);
            }
            else
            {
                //相对路径(../layouts/leyout.razor)
                layout_path = path.join(path.dirname(viewPath), layout_path);
            }

            if (cache_layouted_templates[viewPath] && cache_layouted_templates[viewPath][layout_path])
            {
                //chche里有
                callback(null, cache_layouted_templates[viewPath][layout_path]);
                return;
            }

            //读layout,拼接,存储,返回,ViewBag为null
            razor.getFullTemplate(layout_path, null, function (err, layout_content) {
                if (err) throw err;

                var full_template = layout.fillLayout(layout_content, template);

                cache_layouted_templates[viewPath] = cache_layouted_templates[viewPath] || {};
                cache_layouted_templates[viewPath][layout_path] = full_template;

                callback(null, full_template);
            });
        });
    }
    catch (e)
    {
        callback(e);
    }
};
//viewBag/rootDir均可省略
razor.getFullTemplateSync = function (viewPath, ViewBag, rootDir) {
    ViewBag = ViewBag || {}; //从ViewBag中取layout

    //1 get layout
    //  yes : read & save
    //  no : return original template
    var template = razor.getTemplateSync(viewPath); //view    
    var layout_path = ViewBag["layout"] || cache_layouts[viewPath];
    if (!layout_path)
    {
        //first time parse layout
        //真实layout 或者 "null"
        cache_layouts[viewPath] = layout_path = layout.getLayout(template);
    }

    //2.1 no layout
    if (layout_path === "null") return template;
    //2.2 with layout
    //  reslove layout&view
    //  save to cahce
    if (layout_path[0] === '~' || layout_path[0] === '/')
    {
        //绝对路径(~/views/xxx)
        if (!rootDir) throw new Error("不支持mapPath操作,请使用相对路径表示 布局(layout)");
        layout_path = require("./util.js").mapPath(rootDir, layout_path);
    }
    else
    {
        //相对路径(../layouts/leyout.razor)
        layout_path = path.join(path.dirname(viewPath), layout_path);
    }

    //now view-layout
    //1.cahce_layouted_templates = {
    //      "d:\xxx.razor" : {
    //          // key 为 layout
    //          "d:\xxx\lauouts\layout.razor" : "<html><html>" //full template 
    //       },...
    //  }
    //
    if (cache_layouted_templates[viewPath] && cache_layouted_templates[viewPath][layout_path])
    {
        //chche里有
        return cache_layouted_templates[viewPath][layout_path];
    }

    //读layout,拼接,存储,返回,对模版也是Full,模板嵌套
    var layout_content = razor.getFullTemplateSync(layout_path);
    var full_template = layout.fillLayout(layout_content, template);
    //cache
    cache_layouted_templates[viewPath] = cache_layouted_templates[viewPath] || {};
    cache_layouted_templates[viewPath][layout_path] = full_template;
    return full_template;
};


//
//抽象
//
//view路径 ViewBag数据 [根路径~] callback(error,result) 
razor.renderFile = function (viewPath, ViewBag, rootDir, callback) {
    if (typeof rootDir === "function")
    {
        //省略了rootDir
        callback = rootDir;
        rootDir = null;
    }
    //callback(error,result)
    try
    {
        razor.getFullTemplate(viewPath, ViewBag, rootDir, function (err, template) {
            if (err) throw err;
            callback(null, razor.render(template, ViewBag));
        });
    }
    catch (e)
    {
        callback(e);
    }
}
razor.renderFileSync = function (viewPath, ViewBag, rootDir) {
    var fullTemplate = razor.getFullTemplateSync(viewPath, ViewBag, rootDir);
    return razor.render(fullTemplate, ViewBag);
}


//---------------------------------------
//  for razor mvc framework
//---------------------------------------
razor._razor = function (viewContext, callback) {
    try
    {
        var template = razor.getCompleteTemplate(
            viewContext.viewPath,
            viewContext.ViewBag,
            viewContext.routeData.values['root']
        );
        var func = razor.compile(template);
        var res = func.call(viewContext, viewContext.ViewBag);
        //assign viewContext as razor in the view
        callback(null, res);
    }
    catch (err)
    {
        callback(err);
    }
};

//------------------------------------------
//  for express
//------------------------------------------
razor.express = function (app) {
    //express中关联.razor
    app.engine(".razor", razor._express);
};
razor._express = function (viewPath, ViewBag, callback) {
    if (typeof (ViewBag) === "function" && callback)
    {
        //没有提供ViewBag,但是有callback
        callback = ViewBag;
        ViewBag = {};
    }
    //在这里 view.engine = _express,razor指向了这个view
    //无法使用相对路径
    razor.renderFile(viewPath, ViewBag, null, callback);
};