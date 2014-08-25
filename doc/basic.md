#razor-tmpl Basic Functions

##1.`razor.render(template,ViewBag);`
render function,will change the template to the result

e.g.
    
    //1.prepare the ViewBag data
    var ViewBag = {};
    ViewBag.data=10;
    //2.render
    var result=razor.render("<div>@(ViewBag.data)</div>",ViewBag);
    console.log(result);
    
    //result <div>10</div> 

##2.`razor.compile(template)`
compile function,will compile the template string to a function,assume `var func= razor.compile(template);`then call `func(ViewBag)` will get the same result to render(template,ViewBag)

    var template = "@{ var data = 10;} <div>@(data)</div>";
    var func = razor.compile(template);
    
    //func can receive a parameter : ViewBag
    var result = func({});//ViewBag为空

#Razor Custom
##3.`razor.symbol('~')`
In ASP.NET MVC,when you write a template in a `.cshtml View` , `'@'` is the symbol of the Razor ViewEngine.so use `razor.symbol("~")` to change the symbol you want to use

e.g.

    razor.symbol("~");
    <script type="text/template">
        ~{
            var data= 10;
        }
        ~for(var i=0;i<data;i++)
        {
            <div>~(i)</div>
        }
    </script>
that could work ...

##2.`razor.model("model")`
"ViewBag"is default variable you can use in a template to refer passed data,use this function to change default

e.g.
        
    <script type="text/template" id="template">
        <div>@(model.name)</div>
        <div>@(model.age)</div>
    </script>

    razor.model("model");
    var html=razor.render($("#template").html(),{
        name : "John" ，
        age ： 18
    });
    
    console.log(html);
    //<div>John</div>
    //<div>18</div>

##3.`razor.withViewBag = true|false`
default `razor.withViewBag = true` ,that means you need to specify ViewBag.variable to refer data contains in the `ViewBag` object
Just like
```
//1.prepare template
var tmpl = "@(ViewBag.name)";

//2.prepare ViewBag data
var ViewBag = {};
Viewbag.name = "John";

//3.call render
razor.render(tmpl,ViewBag); => "John"
```
####since you set `razor.withViewBag = false`,`razor-tmpl` this library will help you decalre the `name` variable,just like `var name = ViewBag["name"]`,
```
//1.prepare template
var tmpl = "@(name)";

//2.call render
razor.render(tmpl,{
    name : "John"
}); => "John"
```
Notice that `@(name)` , no `ViewBag`specified
###And `@(= name) or @(=name)` will give the same effect,the `=` assign symbol will attach the `ViewBag.` to `name`,so `@(= name)` is same to @(ViewBag.name)

##4.`razor.init()`
set the previous custom functions to the default state
    
The default state is

    symbol : '@'
    modelName : 'ViewBag'
    withViewBag : true