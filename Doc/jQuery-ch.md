#一 在jquery存在的情况下,有一些更方便的方法可以使用

##`$(selector).render(ViewBag)`
##2.`$(selector).renderToParent(ViewBag)`

这三个方法,使用jquery object的`html()`方法来获取template

`renderToParent`是将render好的html直接`append`到这个template所在位置的`parent()`节点

#二 模仿AugularJS的模板写法
angularjs 写法

    <div ng-repeat="item in items">
        <div>item.xxx</div>
    </div>

这里也可以使用这两种
##1.razor-for razor-while razor-if
    
    <div razor-for="var i = 0; i< ViewBag.list.length; i++" razor-template>
        <div>@(ViewBag.list[i].name)</div>
    </div>
对于这种在div本身有代码的情况,使用`$(selector).render(ViewBag);`,razor-template属性会使它自动隐藏，在render的同时会show出来

##2.razor-each
例如
    
    <div razor-each="person in persons">
        <div>@()
        <div>@(item.age)</div>
    </div>

1. 使用`$(selector).render(ViewBag)`来使它显示出来
2. 在循环体中可以使用`$index`变量,例如`@($index)`,所以不要在循环内部声明`$index`变量,会导致这样的循环不工作