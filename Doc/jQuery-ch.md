#一 在jquery存在的情况下,有一些更方便的方法可以使用

##1.`$(selector).render(ViewBag)`
##2.`$(selector).renderToParent(ViewBag)`
##3.`$(selector).renderInParent(ViewBag)`

这三个方法,使用jquery object的`html()`方法来获取template

1.`renderToParent`是将render好的html直接`append`到这个template所在位置的`parent()`节点
2.`renderInParent`是parent()节点 把html结果作为innerHTML,这样做会覆盖这个template节点

#二 另一种 模仿AugularJS的模板写法
angularjs 写法

    <div ng-repeat="item in items">
        <div>item.xxx</div>
    </div>

这里也可以使用这两种
##1.razor-for razor-while razor-if
    
    <div razor-for="var i = 0; i< ViewBag.list.length; i++" razor-template>
        <div>@(ViewBag.list[i].name)</div>
    </div>
对于这种在div本身有代码的情况,区别于上面render的是,上面是去html()方法,即innerHTML,这种在div上有attribute。使用`$(selector).renderNode(ViewBag);`,razor-template属性会使它自动隐藏，在render的同时会show出来

##2.razor-repeat
例如
    
    <div razor-repeat="person in persons">
        <div>@()
        <div>@(item.age)</div>
    </div>

因为使用了item in items这样特殊的语法，js只能识别for(var index in items)这样的语法，故这种需分开处理
1. 使用`$(selector).renderRepeat(ViewBag)`来使它显示出来
2. 在循环体中可以使用`$index`变量,例如`@($index)`,所以不要在循环内部声明`$index`变量,会导致这样的循环不工作