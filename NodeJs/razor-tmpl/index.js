var fs = require('fs');
var path = require('path');
var razor = module.exports = require("./razor-tmpl.js");
var layout = require('./layout.js');

//-------------------------------------
//  cache
//  从ejs中抄的
//-------------------------------------
var cache_templates = {};//原始 内容
var cache_layouts = {};//存储一个文件的布局,一个view中的layout 运行后不会变
var cache_layouted_templates = {};//应用了layout的模板

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
razor.getTemplate = function (viewPath, encoding) {
    try
    {
        //read cache or read file
        var result = cache_templates[viewPath];
        if (!result)
        {
            result = cache_templates[viewPath] = fs.readFileSync(viewPath, encoding || 'utf8');
        }
        return result;
    }
    catch (e)
    {
        throw new Error("没有找到文件 : {0}".razorFormat(viewPath));
    }
};

//
// 应用了 layout 的模板
//
razor.getFullTemplate = function (viewPath, ViewBag, rootDir) {
    //1 get layout
    //  yes : read & save
    //  no : return original template
    var template = this.getTemplate(viewPath);//view    
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

    //读layout,拼接,存储,返回
    var layout_content = this.getTemplate(layout_path);
    var full_template = layout.fillLayout(layout_content, template);
    //cache
    cache_layouted_templates[viewPath] =cache_layouted_templates[viewPath] || {};
    cache_layouted_templates[viewPath][layout_path] = full_template;
    return full_template;
};

//
//抽象
//
//view路径 ViewBag数据 [根路径~] callback(error,result) 
razor.renderFile = function (viewpath, ViewBag, rootDir, callback) {
    if (typeof rootDir === "function")
    {
        //省略了rootDir
        callback = rootDir;
        rootDir = null;
    }
    //callback(error,result)
    try
    {
        callback(null,
            this.render(this.getFullTemplate(viewpath, ViewBag, rootDir),
            ViewBag));
    }
    catch (e)
    {
        callback(e);
    }
}
razor.renderFileSync = function (viewPath, ViewBag, rootDir) {
    var fullTemplate = this.getFullTemplate(viewPath, ViewBag, rootDir);
    return this.render(fullTemplate, ViewBag);
}


//---------------------------------------
//  for razor mvc framework
//---------------------------------------
razor._razor = function (viewContext, callback) {
    try
    {
        var template = this.getCompleteTemplate(
            viewContext.viewPath,
            viewContext.ViewBag,
            viewContext.routeData.values['root']
        );
        var func = razor.compile(template);
        var res = func.call(viewContext, viewContext.ViewBag);
        //assign viewContext as this in the view
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
razor._express = function (viewPath, ViewBag, callback) {
    if (typeof (ViewBag) === "function" && callback)
    {
        //没有提供ViewBag,但是有callback
        callback = ViewBag;
        ViewBag = {};
    }

    //在这里 view.engine = _express,this指向了这个view
    razor.renderFile(viewPath, ViewBag, null, callback);
};