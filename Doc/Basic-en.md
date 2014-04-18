##一 RazorJs Basic Functions

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

#二 Razor Custom
##1.`razor.changeSymbol('~')`
In ASP.NET MVC,when you write a template in a `.cshtml View` , `'@'` is the symbol of the Razor ViewEngine.so use `razor.changeSymbol("~")` to change the symbol you want to use

e.g.

    razor.changeSymbol("~");
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

##2.`razor.changeModelName("model")`
"ViewBag"is default variable you can use in a template to refer passed data,use this function to change default

例子
        
    <script type="text/template" id="template">
        <div>@(model.name)</div>
        <div>@(model.age)</div>
    </script>

    razor.changeModelName("model");
    var html=razor.render($("#template").html(),{
        name : "John" ，
        age ： 18
    });
    
    console.log(html);
    //<div>John</div>
    //<div>18</div>

##3.`razor.enableEmptyValue(true or false)`
in a template,if you set `enableEmptyValue(true)`,when the func accounts a variable whose value is undefined in current context,it will give out the string instead of evaluate it,it's very useful when debug.e.g `@(data)`,if
 the `data` variable is undefined or null,it will give out the string `"data"`,and if you have not set `enableEmptyValue(true)`,the program account an error and exit without result.

##4.`razor.init()`
set the previous custom functions to the default state
    
The default state is

    symbol : '@'
    modelName : 'ViewBag'
    enableEmptyValue : false