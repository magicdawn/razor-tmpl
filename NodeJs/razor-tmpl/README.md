#Thanks to Projec [kino.razor](https://github.com/kinogam/kino.razor)

#razor-tmpl
Git Repository : https://github.com/magicdawn/razor-tmpl
###razor-tmpl is a template-engine based on kino.razor for JavaScript

##1.Install
use `npm install razor-tmpl` it's depend on `razor-string`
variable `var razor = require("razor-tmpl");`

##2.use in Normal Node.js Program
once got reference to `razor`,it's same to the browser edition,see github projects
basics like `razor.render(String template,Object ViewBag)`
and `razor.renderFile/renderFileSync`  are also available

##3.use in express mvc framework
1. register `.razor` ext to the razor-tmpl engine
```
app.engine(".razor",require('razor-tmpl')._express);
```
2. call res.render
```
app.get("/",function(req,res){
    var ViewBag = {}; //it's ViewBag Data
    ViewBag.layout = '';//specify the layout
    res.render('index.razor',ViewBag)
});
```



##4.*About layout*
in express ,you can specify `layout` in ViewBag or in the view file
```
/views/
    layouts/
        layout.razor
    index.razor
```
the index.razor content
```
@{
    layout = 'layouts/layout.razor';
}
<div id="test1">test1</div>
@section("header"){
    <div id='header'>bla bla</div>
}
<div> out of section, contents belogs to the body section</div>
```
the view\layouts\layout.razor content
```
<html>
<head>
    <title>
        @(ViewBag.title)
    </title>
</head>
<body>
    <div>@renderSection('header')</div>
    @renderBody()
</body>
</html>
```
this will give result like this
```
<html>
<head>
    <title>
        title_data
    </title>
</head>
<body>
    <div>
        <div id='header'>bla bla</div>
    </div>
    <div id="test1">test1</div>
    <div> out of section, contents belogs to the body section</div>
</body>
</html>
```
##5.Other functions
other things is same to the browser edition
see git repository : https://github.com/magicdawn/razor-tmpl