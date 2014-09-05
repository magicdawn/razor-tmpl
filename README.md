<script src="jquery-1.7.1.min.js"></script>
<script src="razor-tmpl.js"></script>

###中文 [CSDN](https://code.csdn.net/magicdawn/razor-tmpl-doc)

#Thanks To [kino.razor](https://github.com/kinogam/kino.razor)
razor-tmpl is a template engine for JavaScript based on kino.razor


#Install
for browser
```html
<script src="https://rawgit.com/magicdawn/razor-tmpl/master/razor-tmpl.js"></script>
```
for nodejs
```shell
$ npm i razor-tmpl
```

#Tips
1
---
I add `_doc` property for every function,as python `__doc__`does,you can use it in console,like
```shell
> razor = require('razor-tmpl'); // or in browser,no need to require
> console.log(razor.render._doc) // will show the basic usage of razor.render
```

2
---
gulp plugin available : [gulp-razor-tmpl](https://github.com/magicdawn/gulp-razor-tmpl)


3
---
Sublime Text 3 Editor support,use `Package Control` search `razor-tmpl`

![](https://raw.githubusercontent.com/magicdawn/razor-tmpl.sublime-package/master/razor.tmLanguage.screenshot.jpg)




#Get Started

##a case in browser
```html
<script type="text/template" id="test">
	<!-- put the template in a script tag with type="text/template" -->
    <div>
    	@each(p in persons)
        {
        	<div data-age="@(p.age)">
                name : @(p.name) <br/>
                age : @(p.age)<br />
                ---<br />
            </div>
        }
        
        <!--
         and persons looks like
         	persons : [
                { name : 'zhangsan' ,age : 18 },
                { name : 'lisi' , age : 19 }
        	];
        -->
    </div>
</script>
```
then use
```js
razor.render(test.innerHTML,{
	persons : [
        { name : 'zhangsan' ,age : 18 },
        { name : 'lisi' , age : 19 }
    ];
})
```
this will get
```html
<div>
	<div data-age="18">
    	name : zhangsan <br/>
        age : 18<br />
        ---<br />
    </div>
    <div data-age="19">
    	name : lisi <br/>
        age : 19<br />
        ---<br />
    </div>    
</div>
```
*use `$index`* to refer the index in the `each` loop,it's implemented with
```js
for(var $index = 0,$length=persons.length;$index<$length;$index++){
	var p = persons[$index];
```
that's each help you done,and you can use for `@for(){ ... }` as you like.
and template can also specified in the view,see `doc/template.md`

##a case in nodejs & express

views\index.razor
```html
<div>
    @(ViewBag.body)
</div>
```
views\layout\layout.razor
```html
<!doctype html>
<html>
    <head>
        <title>
            @(ViewBag.title)
        </title>
    </head>
    <body>
        <div class="container">
            @renderBody()
        </div>
    </body>
</html>
```

use
```js
razor.renderFileSync('index.razor',{
    title: "this is title",
    body: 'this is body',
    layout: 'layout/layout.razor',
}
```
get result like
```html
<!doctype html>
<html>
    <head>
        <title>
            this is title
        </title>
    </head>
    <body>
        <div class="container">
            <div>
    this is body
</div>
        </div>
    </body>
</html>
```
so that's it.
type `console.log(razor._express._doc)`,you got this
```
> console.log(razor._express._doc)                        
                                                          
    interface for Express Framework:                      
                                                          
    var app = express();                                  
    ...                                                   
    app.engine('.razor',require('razor-tmpl')._express);
                                                          
undefined                                                 
>                                                         
```
that's the usage,`app.engine('.razor',require('razor-tmpl')._express);`



#Features
- razor way templating,see `doc/template.md`
- it's all customed,use symbol to change '@',use model to change 'ViewBag'
- support if/else if/else if/......else/swith case , even no one may use that
- with jquery functions, render/renderToParent,template canbe written not only in a SCRIPT tag,and renderToParent is extreme convinent. see `doc/jquery.md`
- for node,i found a way that makes the template to access file system,database... possible,just call `razor.renderFile[Sync]`,the view can require data,no need to pass through,see `doc/advance.md`

#Speed
Comparsion : http://cnodejs.org/topic/4f16442ccae1f4aa27001109
Result : [benchmark.js](https://github.com/magicdawn/razor-tmpl/blob/master/benchmark.js)