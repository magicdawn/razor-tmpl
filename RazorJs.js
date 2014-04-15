/*
    Created BY Magicdawn;
    2014-4-15 12:51:10
**/

//format函数
//"xxx".format(obj1,obj2,obj3);不限参数个数
String.prototype.format = function (obj1, obj2, obj3) {
    var res = this;
    var objs = arguments;

    //构建正则
    var re = null;
    if (arguments.length > 1)
    {
        //2个
        //obj 0~1
        // re=/\{[0-(n-1)]\}/
        re = new RegExp("\\{([0-" + (arguments.length - 1) + "])\\}", 'g');
    }
    else if (arguments.length == 1)
    {
        //一个
        re = /\{(0)\}/g;
    }
    else
    {
        return this;
    }

    res = res.replace(re, function (match, group1, index, input) {
        //匹配到的{n} -> obj[n]
        return objs[group1];
    });
    return res;

    //this.replace不会改变字符串
};

(function (exports) {

    //一个节点的类型
    var ESegmentType = {
        CodeBlock: 0,
        Variable: 1,
        String: 2
    };

    //Segment 构造函数
    function Segment(content, eSegmentType) {
        this.Content = content;
        this.SegmentType = eSegmentType;
    }
    //StringBlockModel构造函数
    function StringBlockModel(template) {
        this.template = template;
        this.processedIndex = -1;
        this.segments = [];
    }

    var Regexs = {
        //\S 是 Symbol='@'
        Loop: /^\Sfor|while\([\s\S]*?\)\s*?\{[\s\S]*?\}/,
        Condition: /^\S(if\([\s\S]*?\)\s*?\{)([\s\S]*?)(\})(?:\s*?(else\s*?\{)([\s\S]*?)(\}))?/
    };

    function simpleMinfy(str) {
        //对模板简单的简化
        return str
            // //comment
            .replace(/\/\/.*$/gm, '')//单行注释

            // /*  */
            .replace(/\/\*[\s\S]*\*\//g, '')//多行注释,.号任意字符不包括\n,用[\s\S]表示任意字符
            .replace(/\n+/g, '') //多个空行转为一个
            .replace(/ +/g, ' '); //对个空格转为一个
    };

    var SegementProcesser = {
        symbol: '@',

        //Segment[] result = SegmentProcesser.process(String template);
        process: function (template) {
            var model = new StringBlockModel(simpleMinfy(template));
            this.processStringBlock(model);
            return model.segments;
        },

        //StringBlock,主循环
        processStringBlock: function (model) {
            var template = model.template;
            for (var index = 0, length = template.length; index < length; index++)
            {
                var current = template[index];
                if (current == this.symbol)//当前为'@'
                {
                    //1. @之前的string
                    this.processString(model, index);

                    //2. @之后的判断
                    var next = template[index + 1];
                    switch (next)
                    {
                        case this.symbol:// //@@
                            index = this.processEscapeSymbol(model, index);
                            break;
                        case '{'://@{code block}
                            index = this.processCodeBlock(model, index);
                            break;
                        case '('://@(var)
                            index = this.processVariable(model, index);
                            break;
                        default://可能有@if @for @while等
                            var remain = model.template.substring(index);
                            if (Regexs.Loop.test(remain))
                            {
                                //是for while
                                index = this.processLoop(model, index);
                            }
                            else if (Regexs.Condition.test(remain))
                            {
                                //@if  (else)?
                                index = this.processCondition(model, index);
                            }
                            break;
                    }
                }
            }
            //for退出后,还有一段string
            var content = model.template.substring(
                model.processedIndex + 1, model.template.length
            ).trim();
            if (content)
            {
                model.segments.push(new Segment(content, ESegmentType.String));
            }
        },

        /*
            processXXX(model,index)
            index为@的位置
    
            应该更新model的processedIndex
            并返回新的index应该位置
        */
        //普通String,如 <div>@(var变量) <div>
        processString: function (model, index) {
            var content = model.template.substring(model.processedIndex + 1, index).trim();
            if (content)
            {
                model.segments.push(new Segment(content, ESegmentType.String));
            }
            model.processedIndex = index - 1;
        },
        processEscapeSymbol: function (model, index) {
            //@@ index index+1
            model.segments.push(new Segment(this.symbol, ESegmentType.String));
            model.processedIndex = index + 1;

            //index指向block最后
            return model.processedIndex;
        },
        processCodeBlock: function (model, index) {
            //@{}
            var secondBraceIndex = this.getSecondBraceIndex(model.template, index + 1);

            var content = model.template.substring(index + 2, secondBraceIndex).trim();
            if (content)
            {
                model.segments.push(new Segment(content, ESegmentType.CodeBlock));
            }

            model.processedIndex = secondBraceIndex;
            return model.processedIndex;
        },
        processVariable: function (model, index) {
            //@(data)
            var secondBraceIndex = this.getSecondBraceIndex(model.template, index + 1);

            var content = model.template.substring(index + 2, secondBraceIndex).trim();
            if (content)
            {
                model.segments.push(new Segment(content, ESegmentType.Variable));
            }
            model.processedIndex = secondBraceIndex;
            return model.processedIndex;
        },
        processLoop: function (model, index) {
            //  @for() {   },@for(必须挨着
            var remain = model.template.substring(index);
            var firstIndex = remain.indexOf('{') + index;
            //在model.template里找匹配的'}'
            var secondInex = this.getSecondBraceIndex(model.template, firstIndex);

            var part1 = model.template.substring(index + 1, firstIndex + 1);    //for(xxx){
            var part2 = model.template.substring(firstIndex + 1, secondInex);   //  <div>@(data)</div>
            var part3 = '}';                                                    //}

            model.segments.push(new Segment(part1, ESegmentType.CodeBlock));

            //part2为StringBlock,意味着if可以 嵌套
            var subSegments = this.process(part2);
            model.segments = model.segments.concat(subSegments);

            model.segments.push(new Segment(part3, ESegmentType.CodeBlock));

            //更新processedIndex和返回index
            model.processedIndex = secondInex;
            return model.processedIndex;
        },
        processCondition: function (model, index) {
            //@if(condition){
            //  <div>@(data)</div>
            //}
            //else
            //{}
            var remain = model.template.substring(index);
            var arr = Regexs.Condition.exec(remain);

            var ifpart1 = arr[1];
            var ifpart2 = arr[2];
            var ifpart3 = arr[3];
            //1.if(abc==abc){
            model.segments.push(new Segment(ifpart1, ESegmentType.CodeBlock));
            //2. <div>@(data)</div>
            var ifInnerSegments = this.process(ifpart2);
            model.segments = model.segments.concat(ifInnerSegments);
            //3.}
            model.segments.push(new Segment(ifpart3, ESegmentType.CodeBlock));

            if (arr[4])
            {
                //存在else块
                var elsepart1 = arr[4];
                var elsepart2 = arr[5];
                var elsepart3 = arr[6];
                //1.else{
                model.segments.push(new Segment(elsepart1, ESegmentType.CodeBlock));
                //2. <div>@data</div>
                var elseInnerSegments = this.process(elsepart2);
                model.segments = model.segments.concat(elseInnerSegments);
                //3.}
                model.segments.push(new Segment(elsepart3, ESegmentType.CodeBlock));
            }

            //@if{}
            model.processedIndex = index + arr[0].length - 1;
            return model.processedIndex;
        },


        getSecondBraceIndex: function (template, firstIndex) {
            //index 是第一个{的Index
            var brace = template.substr(firstIndex, 1);//'{' or '('
            var secondBrace = brace == '{' ? '}' : ')';//右括号
            var count = 1;//firstIndex处是 '{'|'('

            var index = firstIndex + 1;
            var length = template.length;
            for (; index < length; index++)
            {
                var cur = template.substr(index, 1);
                if (cur == brace)
                {
                    count++;
                }
                else if (cur == secondBrace)
                {
                    count--;
                    if (count == 0)
                    {
                        break;
                    }
                }
            }
            return index;
        }
    };

    var SegmentCompiler = {
        modelName: "ViewBag",
        enableEmptyValue: false,//是否允许空值

        //var func=SegmentCompiler.compile(Segment[] segmnets)
        compile: function (segments) {
            var functionContent = [];
            functionContent.push("var result=[];");

            for (var i in segments)
            {
                var data = segments[i].Content;
                switch (segments[i].SegmentType)
                {
                    case ESegmentType.CodeBlock:
                        //@{ var data=10; }
                        functionContent.push(data);
                        break;
                    case ESegmentType.Variable:
                        if (!this.enableEmptyValue)
                        {
                            //不允许空值,就是值不存在的情况下会报错
                            //@(data)
                            //result.push(data);
                            var inner = "result.push(" + data + ");";
                            functionContent.push(inner);
                        }
                        else
                        {
                            //允许空值
                            //@(data)
                            //if(typeof(data) != 'undefined' && data) result.push(data);
                            //else result.push("data");
                            var inner = "if(typeof(data) != 'undefined' && " + data + ") result.push(" + data + ");"
                            inner += "else result.push('" + data + "');";
                            functionContent.push(inner);
                        }
                        break;
                    case ESegmentType.String:
                        //div
                        //result.push('div');
                        var inner = "result.push('" + data + "');";
                        functionContent.push(inner);
                        break;
                    default:
                        break;
                }
            }

            functionContent.push("return result.join('');");

            return new Function(this.modelName, functionContent.join(''));
        }
    };

    var razor = {
        //var func=razor.compile(String template);
        compile: function (template) {
            var segments = SegementProcesser.process(template);
            var func = SegmentCompiler.compile(segments);
            return func;
        },
        //String result=razor.render(String template,Object ViewBag)
        render: function (template, ViewBag) {
            var func = this.compile(template);
            return func(ViewBag);
        },

        //自定义相关
        changeSymbol: function (newSymbol) {
            SegementProcesser.symbol = newSymbol;
        },
        changeModelName: function (newModelName) {
            SegmentCompiler.modelName = newModelName;
        },
        enableEmptyValue: function (boolEnable) {
            SegmentCompiler.enableEmptyValue = boolEnable;
        },
        init: function () {
            this.changeSymbol('@');
            this.changeModelName('ViewBag');
            this.enableEmptyValue(false);
        }
    };
    exports.razor = razor;//绑定到外部window对象上

    //if jquery exists
    //---------------------------------------
    if (typeof ($) != "undefined" && $)
    {
        //隐藏所有的razor-template div
        $(function () {
            $("[razor-template]").hide();
        });

        $.fn.extend({
            //------------------------------------------
            //-----render 表示处理节点的innerHtml
            //------------------------------------------

            //var func = $(selector).compile();
            compile: function () {
                return razor.compile(this.html());
            },
            //String html=$("#id").render(ViewBag)
            render: function (ViewBag) {
                var html = this.html();//this是jquery对象
                return razor.render(html, ViewBag);
            },

            //render到节点的parent
            //$("#template-id").renderToParent(ViewBag)
            renderToParent: function (ViewBag) {
                var html = this.render(ViewBag);
                this.parent().append(html);
            },
            //renderInParent,会清空parent的内容,再append,会覆盖此Script template
            renderInParent: function (ViewBag, keepScriptTemplate) {
                var result = this.render(ViewBag);
                if (keepScriptTemplate)
                {
                    //保留此script template
                    var scriptTemplate = this;
                    this.parent().html("");
                    this.parent().append(this);
                    this.parent().append(result);
                }
                else
                {
                    this.parent().html(result);
                }
            },

            //----------------------------------------------
            //---Node 表示节点上有 要处理的内容
            //---<div razor-template razor-for="var i=0;i<ViewBag.length;i++">
            //-----------------------------------------------
            //var func=$(选择器).compileNode();
            compileNode: function () {
                var segments = [];

                var loop = (
                    function (jqObj) {
                        var loop = {
                            content: null,
                            symbol: null
                        };

                        var attr = jqObj.attr("razor-for") || jqObj.attr("data-razor-for");
                        if (attr)
                        {
                            loop.content = attr;
                            loop.symbol = 'for';
                            return loop;
                        }

                        attr = jqObj.attr("razor-if") || jqObj.attr("data-razor-if");
                        if (attr)
                        {
                            loop.content = attr;
                            loop.symbol = 'if';

                            return loop;
                        }

                        attr = jqObj.attr("razor-while") || jqObj.attr("data-razor-while");
                        if (attr)
                        {
                            loop.content = attr;
                            loop.symbol = 'while';

                            return loop;
                        }
                        return loop;
                    })(this);
                if (loop.symbol)
                {
                    //razor-for="var i =0;i<10;i++"
                    var content = loop.symbol + "(" + loop.content + "){";
                    segments.push(new Segment(content, ESegmentType.CodeBlock));
                }

                //在innerrender
                var innerTemplate = this.attr("razor-template") || this.html();
                var innerSegments = SegementProcesser.process(innerTemplate);
                segments = segments.concat(innerSegments);

                //最后一个}
                if (loop.symbol)
                {
                    segments.push(new Segment('}', ESegmentType.CodeBlock));
                }

                //拿到segments -> compile -> func
                var func = SegmentCompiler.compile(segments);
                return func;
            },
            //void $(选择器).renderNode(ViewBag);//会调用show
            renderNode: function (ViewBag) {
                var func = this.compileNode();
                var result = func(ViewBag);

                //保存innerTemplate
                if (!this.attr("razor-template"))
                {
                    //只在第一次render的时候保存
                    var innerTemplate = this.html().trim();
                    this.attr("razor-template", innerTemplate);
                }

                this.html(result);
                this.show();
            },

            //---------------------------------------
            //---<div razor-repeat='item in items'>
            //---------------------------------------
            //var func = $(selector).compileRepeat(); var html=func(ViewBag);
            compileRepeat: function () {
                var segments = [];

                var repeatAttr =
                    this.attr("razor-repeat").trim() ||
                    this.attr("data-razor-repeat").trim();
                if (repeatAttr)
                {
                    //razor-repeat="不为空"
                    //item in items
                    var inIndex = repeatAttr.indexOf('in');
                    var item = repeatAttr.substring(0, inIndex).trim();//变量item
                    var items = repeatAttr.substring(inIndex + 2).trim();//集合items

                    //1.开头的for
                    var content = "for(var i in {0}){ var {1} = {0}[i];".format(items, item);
                    segments.push(new Segment(content, ESegmentType.CodeBlock));
                }

                //2.中间内容
                var innerTemplate = this.attr("razor-template") || this.html();
                var innerSegments = SegementProcesser.process(innerTemplate);
                segments = segments.concat(innerSegments);

                if (repeatAttr)
                {
                    //3.最后,与1对应的 '}'
                    segments.push(new Segment('}', ESegmentType.CodeBlock));
                }

                //compile : segments -> func
                var func = SegmentCompiler.compile(segments);
                return func;
            },
            //void $(selector).renderRepeat(ViewBag);
            renderRepeat: function (ViewBag) {
                var func = this.compileRepeat();
                var result = func(ViewBag);

                //保存innerTemplate
                if (!this.attr("razor-template"))
                {
                    //只在第一次render的时候保存
                    var innerTemplate = this.html().trim();
                    this.attr("razor-template", innerTemplate);
                }

                this.html(result);
                this.show();
            }
        });
    }
})(window);