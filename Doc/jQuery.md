#First if jquery exists and $ == jQuery
1. `$(selector).render(ViewBag)`
2. `$(selector).renderToParent(ViewBag)`

these methods,acess the template by the `jqInstance.html()`
Rule:
1. if the template is written in a `<script type='text/template>'`tag, u can use the render/renderToParent,render the template to the result;and renderToParent will append the render result to it's(it means the script tag) parent.
2. if the template is written in a div tag like `<div razor-template razor-each='p in ViewBag.persons'>` , the `razor-template` attribute will make it hide,this require the jquery. And call the render method on a div tag,it will set it's innerHTML to the render result and show it.

#Template syntax like AngularJs
the angularjs template like this

    <div ng-repeat="item in items">
        <div>item.xxx</div>
    </div>

in razor-tmpl,can be write like 
##1.razor-for razor-while razor-if
e.g.
   
    <div razor-for="var i = 0; i< ViewBag.list.length; i++" razor-template>
        <div>@(ViewBag.list[i].name)</div>
    </div>
Note:
1. use `razor-template` attribute to make this hide when dom is ready,this attribute must be empty,it will store it's innerHtml as the template for you can `callRenderNode` more than one
2. use `razor-for/while/if` to store the condition

##2.razor-each
e.g.
    
    <div razor-each="item in items">
        <div>@(item.age)</div>
    </div>
Note:
2. you can use the `$index` variable in the loop content,`@($index)`