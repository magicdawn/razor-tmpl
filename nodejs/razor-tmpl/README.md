#Thanks To [kino.razor](https://github.com/kinogam/kino.razor)
razor-tmpl is a template engine for JavaScript based on kino.razor

#razor-tmpl
razor-tmpl supports browser & node,this README gives the special part of node version,same functions to browser version can be found at :
Git Repository : https://github.com/magicdawn/razor-tmpl

#Install
use `npm install razor-tmpl`,
use `var razor = require("razor-tmpl");`

#use in Normal Node.js Program
once got reference to `razor`,it's same to the browser edition,see github projects
basics like `razor.render(String template,Object ViewBag)`
and `razor.renderFile/renderFileSync`  are also available

#use in express mvc framework
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



#About layout
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

###rule
1. normal contents fill it's layout's renderBody() part
2. @section('header') fill it's layout's renderSection('header') part
3. a layout file can use an other file as it's layout
4. and @include('includes/footer.razor') support

more exmaple see `test/` cases.


#advance
you can use `require` | `__dirname` | `__filename` in the view code
just treat the as a js file,and the `$result` variable stands for the render result

see `/test/高级测试/`
see [my_github_io_blog](http://magicdawn.github.io/2014/08/12/nodejs-module-require/#razor-directRenderSync)
now renderFile/renderFileSync both supports this

###command line tool
Because of this,you got a command line tool `razor`,use
`npm i razor-tmpl -g` , then type `razor` for help

```
C:\Users\Administrator>razor                                  
                                                              
    razor file [option]                                       
    option 选项 :                                               
                                                              
        -n|-no|-no-output 不要输出                                
        -o|-output        输出位置                                
                                                              
    example :                                                 
        razor xxx.razor                 -> xxx.html           
        razor xxx.razor -o xxx.abc      -> xxx.abc            
        razor xxx.razor -o output_dir/  -> output_dir/xxx.html
        razor xxx.razor -no-output      -> no output          
                                                              
```

see `test/bin工具`
















