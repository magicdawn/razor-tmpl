var fs = require('fs');
var path = require('path');
var razor = module.exports = require("./razor-tmpl.js");
var layout = require('./layout.js');

//-------------------------------------
//  cache
//  从ejs中抄的
//-------------------------------------
var templates = {};//原始 内容
var layouted_templates = {};//应用了模版
razor.clearCache = function () {
    contentCache = {};
    templateCache = {};
};

//-------------------------------------
//  取得模板
//  @layout
//  @section
//  return string
//-------------------------------------
razor.getTemplate = function (viewPath, encoding) {
    try
    {
        //read cache or read file
        var result = templates[viewPath];
        if (!result)
        {
            result = templates[viewPath] = fs.readFileSync(viewPath, encoding || 'utf8');
        }
        return result;
    }
    catch (e)
    {
        throw new Error("没有找到文件 : {0}".razorFormat(viewPath));
    }
};
razor.getCompleteTemplate = function (viewPath, ViewBag, rootDir) {
    //1. read cache
    var complete_template = layouted_templates[viewPath];
    if (complete_template) return complete_template;

    //2. not cached,find if exist layout
    var template_no_layout = this.getTemplate(viewPath);
    var layout_path = layout.getLayout(template_no_layout, ViewBag);

    //2.1 if no layout
    if (!layout_path) return template_no_layout;

    //2.2 with layout    
    //  reslove layout&view
    //  save to cahce

    //绝对路径(~/views/xxx) 或 相对路径(leyout.razor)
    if (layout_path[0] === '~' || layout_path[0] === '/')
    {
        if (!rootDir) throw new Error("不支持mapPath操作,请使用相对路径表示 布局(layout)");
        layout_path = require("./util.js").mapPath(rootDir, layout_path);
    }
    else
    {
        layout_path = path.join(path.dirname(viewPath, layout_name));
    }
    var layout_content = this.getTemplate(layout_path);
    var complete_template = layouted_templates[viewPath] = layout.fillLayout(layout_content, template_no_layout);
    return complete_template;
};

//---------------------------------------
//  for razor mvc framework
//---------------------------------------
razor.view = function (viewContext, callback) {
    try
    {
        var template = this.getCompleteTemplate(
            viewContext.viewPath,
            viewContext.ViewBag,
            viewContext.routeData.values['root']
        );
        var func = razor.compile(template);
        var res = func.call(viewContext, viewContext.ViewBag);//assign viewContext as this in the view
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
    //callback(error,renderedContent)
    if (typeof (ViewBag) === "function" && callback)
    {
        //没有提供ViewBag,但是有callback
        callback = ViewBag;
        ViewBag = {};
    }
    //read template
    var template = '';
    try
    {
        template = this.getCompleteTemplate(viewPath, viewPath);
        callback(null, razor.render(template, viewBag));
    }
    catch (e)
    {
        callback(e);
    }
};