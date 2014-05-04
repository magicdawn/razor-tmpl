#First if jquery exists and $ == jQuery
##1.`$(selector).render(ViewBag)`
##2.`$(selector).renderToParent(ViewBag)`
##3.`$(selector).renderInParent(ViewBag)`

these 3 methods,use the jQuery instance's `html()` method to get the templateStrings

Note:
1.`renderToParent`this is to render it & append to it's parent,get by `jqInstance.parent()` method
2.`renderInParent`this is to render it & set it's parent's innerHtml to this_Render_result ,the template will be gone ...

#二 Template like AngularJs
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
3. Since it's outer node,the template node contains the template content,not only the innerHtml,so use `$(selector).renderNode(ViewBag)` to render it and make it Visiable.

##2.razor-repeat
e.g.
    
    <div razor-repeat="item in items">
        <div>@(item.age)</div>
    </div>
Note:
1. use `$(selector).renderEach(ViewBag)`to render & show it.
2. you can use the `index` variable in the loop content,`@(index)`