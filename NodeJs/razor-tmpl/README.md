#致谢 [kino.razor](https://github.com/kinogam/kino.razor)

#razor-tmpl
Git Repository : https://code.csdn.net/magicdawn/razor-tmpl
###razor-tmpl是一款模板引擎,基于kino.razor,并且我扩展了一些容易使用的方法

##使用
npm安装,使用 `npm install razor-tmpl`
使用 `var razor = require("razor-tmpl");`

1. 在node程序中使用,`razor.render(template,ViewBag)`
2. 在express mvc中使用
    

    //1.在app.js中注册.razor扩展名
    app.engine(".razor",require("razor-tmpl")._express);
    //2.在回发请求的时候,指定扩展名
    //例如在routes\index.js中
    module.exports = function(req,res){
        //get /
        res.render("index.razor",{
            //ViewBag 数据
        });
    }

###可以访问`razor对象了`,用法见[Doc/Basic-ch.md](https://code.csdn.net/magicdawn/razor-tmpl/tree/master/Doc/Basic-ch.md)

##模板语法 & 渲染速度
比较速度什么的,看这个http://cnodejs.org/topic/4f16442ccae1f4aa27001109 以及这个库的benchmark.js
模板

    @for(var i = 0 ;i <100 ; i++)
    {
        <div>@(i)</div>
    }
    //结果
    //<div>1</div>
    //<div>2</div>
    //...
    //<div>99</div>
razor的牛B,不是我说出来的,那个C#版的razor-engine也是开源的,可以找来看看
模板咋写,看看这个

	<script type="text/template">
		@{
			//代码块
			var hello = "hello world";			
			var varBool=true;
		}
		<div>@(hello)</div>
		@if(varBool)
		{
			<div>@(hello)</div>
            //对于变量来@(变量)
            //使用ViewBag,引用render传进来的数据
		}
        //for while if 等都可以支持	
	</script>
更详细的请看 [Doc/template-ch.md](https://code.csdn.net/magicdawn/razor-tmpl/tree/master/Doc/Template-ch.md)