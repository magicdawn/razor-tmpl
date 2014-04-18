##中文文档请看[README-ch.md](https://github.com/magicdawn/RazorJs/blob/master/README-ch.md) 或 csdn code RazorJs

#Thanks To [kino.razor](https://github.com/kinogam/kino.razor)

#RazorJs
###RazorJs is a `elegant` front-end template engine,it's algorithm is based on `kino.razor`,and I rewrite it to extend more convenient functions

#1.First Look

    var template = "@{var data ='Hello Razor'; }";
    template+="@(data)";
    
    //use RazorJs
    var result = razor.render(template);
    console.log(result);
    //result : Hello RazorJs
#2.Use in browsers

    <script src="....RazorJs.js"></script>
###Note that : RazorJs can be used with no dependency, but if `jQuery` exists ,you will got more convenient functions ...
So if you used jquery in your site, you should load this(RazorJs) after `jQuery`
###Without jquery , you can use the `razor` object , see [Doc/Basic-en.md](https://github.com/magicdawn/RazorJs/blob/master/Doc/Basic-en.md)
###With jquery , the short-elegant functions ,see [Doc/jquery-en.md](https://github.com/magicdawn/RazorJs/blob/master/Doc/jquery-en.md)

#3.Use In NodeJs
    var razor = require("./RazorJs.js");
    var html = razor.render(template_string_here);
###Now you get access to the razor Object , see [Doc/Basic-en.md](https://github.com/magicdawn/RazorJs/blob/master/Doc/Basic-en.md)

#4.Why to use it,because it's elegant
There are other template engines,like doT tengine ejs(in nodejs express) bla...
They can be very fast , and full support to for/while/if ...
but you need to write template like brlow while use them

    <div><% for(var i xxx){ %></div>
        loop content
    <% }%>

    or

    <div>{{ for(var i xxx){ }}</div>
        loop content
    {{ } }}
or other contacts
Now let's see what you need to write a for loop in RazorJs
    
    @for(var i = 0 ;i <100 ; i++)
    {
        <div>@(i)</div>
    }
    //this will give the result ...
    //<div>1</div>
    //<div>2</div>
    //...
    //<div>99</div>
The razor style,cool isn't it ...
###How To write template

    <script type="text/template">
		@{
			//code block
			var hello = "hello world";			
			var varBool=true;
		}
        
		<div>@(hello)</div>
		@if(varBool)
		{
			<div>@(hello)</div>
            //@(variable or sentence) //means to evaluate it
            //use ViewBag to refer the data passed by render(template,ViewBag)
		}        
	</script>

more template style,see [template-en.md](https://github.com/magicdawn/RazorJs/blob/master/Doc/Template-en.md)

#5.Render speed
See [benchmark.js](https://github.com/magicdawn/RazorJs/blob/master/benchmark.js),run with node JS , the data will tell the truth.