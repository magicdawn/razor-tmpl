###中文文档请看[code.csdn.net/magicdawn/razor-tmpl-doc](https://code.csdn.net/magicdawn/razor-tmpl-doc)

#Thanks To [kino.razor](https://github.com/kinogam/kino.razor)

#razor-tmpl
###razor-tmpl is a template engine for JavaScript based on kino.razor
    
#1.Use in browsers

    <script src="....razor-tmpl.js"></script>
1. Note that : razor-tmpl can be used with no dependency, but if `jQuery` exists ,there will be more convenient functions ...
2. So if you used jquery in your site, 1.first load `jquery` 2.then this-razor-tmpl
###Without jquery , you can use the `razor` object , see [Doc/Basic.md](https://github.com/magicdawn/razor-tmpl/blob/master/Doc/Basic.md)
###With jquery,convenient ways,see [Doc/jquery.md](https://github.com/magicdawn/razor-tmpl/blob/master/Doc/jQuery.md)

#3.Use In NodeJs
`npm install razor-tmpl` see [npm module page](https://npmjs.org/package/razor-tmpl)

#4.Template Syntax
    <script type="text/template">
		@{
			//code block
			var hello = "hello world";			
			var varBool=true;
            var num = 10;
            var persons = [
                { name : 'zhangsan' ,age : 18 },
                { name : 'lisi' , age : 19 }
            ];
		}
        
        @* razor comment,contents below is html content *@
		<div>@(hello)</div>

		@if(varBool)
		{
            @* if conditional statement *@
			<div>@(hello)</div>
            to evaluate a variable or expression use @(variable)
            use the @(Viewbag.blabla) to reference 
            the Viewbag passed by razor.render(template,ViewBag)
		}
        
        @* for while if no problem *@
        @while(num)
        {
            @{ num-- ;}
            <div>@(num)</div>
        }

        @* use each expression to iterate *@
        @* no meed to use "var p" to declare *@
        @each(p in persons)
        {
            name : @(p.name) <br/>
            age : @(p.age)</br>
            ---</br>
        }
	</script>
see more [Doc/Template.md](https://github.com/magicdawn/razor-tmpl/blob/master/Doc/Template.md)

#4.render speed
Comparsion : http://cnodejs.org/topic/4f16442ccae1f4aa27001109
Result : [benchmark.js](https://github.com/magicdawn/razor-tmpl/blob/master/benchmark.js)
