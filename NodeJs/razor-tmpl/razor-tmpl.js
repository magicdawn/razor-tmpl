/*
    Created BY Magicdawn;
    2014-4-15 12:51:10

    v0.2
    Segments容易修改维护
 */

//usage : var replaced = "xxx".replaceAll("old","new");
String.prototype.replaceAll = function (oldValue, replaceValue) {
    return this.replace(new RegExp(oldValue, 'g'), replaceValue);
};
//usage : "xxx".format(obj0, obj1, obj2); no parameter count limit
String.prototype.format = function (obj0, obj1, obj2) {
    var result = this;
    for (var i in arguments)
    {
        //将{0} -> obj[0]
        //new RegExp("\\{ 0 \\\}",g)
        result = result.replaceAll("\\{" + i + "\\}", arguments[i].toString());
    }
    return result;
};

(function (global) {
    "use strict";

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
        //gloabl 测试remain loop."@if(){} else {} for(){}"非global为true
        Loop: /^\S(for|while)\s*?\([\s\S]*?\)\s*?\{[\s\S]*?\}/g,
        LoopString: "^\\S(for|while)\\s*?\\([\\s\\S]*?\\)\\s*?\\{[\\s\\S]*?\\}",
        LoopFlag: 'g',

        IfElse: /^\Sif\([\s\S]*?\)[\s\S]*?(else)?/g,
        IfElseString: "^\\Sif\\([\\s\\S]*?\\)[\\s\\S]*?(else)?",
        IfElseFlag: "g"
    };

    function simpleMinfy(str, isJsCode) {
        //对模板简单的简化
        if (isJsCode)
        {
            //对codeBlock使用isJsCode = true
            str = str
                .replace(/\/\/.*$/gm, '') //单行注释
                .replace(/\/\*[\s\S]*\*\//g, ''); //多行注释,.号任意字符不包括\n,用[\s\S]表示任意字符
            // <!-- xxx -->
        }
        //普通的去除空行
        return str
            .replace(/@\*[\s\S]*?\*@]/g, '') //去除模板注释
            .replace(/\n+/g, '\n') //多个空行转为一个
            .replace(/ +/g, ' ') //对个空格转为一个
            .replace(/<!--[\s\S]*?-->/g, '')
            .trim();
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
                if (current == this.symbol) //当前为'@'
                {
                    //1. @之前的string
                    this.processString(model, index);

                    //2. @之后的判断
                    var next = template[index + 1];
                    switch (next)
                    {
                        case this.symbol: // //@@
                            index = this.processEscapeSymbol(model, index);
                            break;
                        case '{': //@{code block}
                            index = this.processCodeBlock(model, index);
                            break;
                        case '(': //@(var)
                            index = this.processVariable(model, index);
                            break;
                        case '*': //@* comment *@
                            index = this.processComment(model, index);
                            break;
                        default: //可能有@if @for @while等
                            var remain = model.template.substring(index);
                            if (new RegExp(Regexs.LoopString, Regexs.LoopFlag).test(remain))
                            {
                                //是for while
                                index = this.processLoop(model, index);
                            }
                            else if ((new RegExp(Regexs.IfElseString, Regexs.IfElseFlag)).test(remain))
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
        //普通String,如 <div>@(var变量)中的<div>
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
            var secondBraceIndex = this.getSecondIndex(model.template, index + 1);

            var content = model.template.substring(index + 2, secondBraceIndex).trim();
            if (content)
            {
                content = this.getOriginalFromEscapedCode(content);
                model.segments.push(new Segment(content, ESegmentType.CodeBlock));
            }

            model.processedIndex = secondBraceIndex;
            return model.processedIndex;
        },
        processVariable: function (model, index) {
            //@(data) or @(- data)
            //使用@(- data)来escape,如data="<div>abc</div>"   --> &lt;div&gt;abc
            var secondBraceIndex = this.getSecondIndex(model.template, index + 1);
            var content = model.template.substring(index + 2, secondBraceIndex).trim();

            if (content)
            {
                content = this.getOriginalFromEscapedCode(content); //像@( p.age &gt;= 10)
                if (/^- /g.test(content))
                {
                    //以-空格开头 @(- data) 这种escape
                    content = content.substring(2);

                    //escape 86, non escape 8451
                    //content += ".encodeHtml()"; //速度太慢,不能接受

                    //@(- data) data="&1"

                    //2014-4-19 10:05:27
                    //no escape : 57
                    //escape : 2111
                    //escape no '&' 1657

                    content += ".replace(/&/g,'&amp;')";
                    content += ".replace(/</g,'&lt;')";
                    content += ".replace(/>/g,'&gt;')";
                    content += ".replace(/'/g,'&#39;')";
                    content += '.replace(/"/g,"&#34;")';
                    content += ".replace(/\\//g,'&#47;')";

                    model.segments.push(new Segment(content, ESegmentType.Variable));
                }
                else
                {
                    //@(data)
                    model.segments.push(new Segment(content, ESegmentType.Variable));
                }
            }
            model.processedIndex = secondBraceIndex;
            return model.processedIndex;
        },
        processLoop: function (model, index) {
            //  @for() {   }
            var remain = model.template.substring(index);
            var firstIndex = remain.indexOf('{') + index;
            //在model.template里找匹配的'}'
            var secondInex = this.getSecondIndex(model.template, firstIndex);

            var part1 = model.template.substring(index + 1, firstIndex + 1); //for(xxx){
            var part2 = model.template.substring(firstIndex + 1, secondInex); //  <div>@(data)</div>
            var part3 = '}'; //}

            //1.part1
            part1 = this.getOriginalFromEscapedCode(part1);
            model.segments.push(new Segment(part1, ESegmentType.CodeBlock));

            //2.part2
            //part2为StringBlock,意味着if while for 可以 嵌套
            var subSegments = this.process(part2);
            model.segments = model.segments.concat(subSegments);

            //3.part3
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
            var firstIfBrace = remain.indexOf('{') + index; //'{'
            var secondIfBrace = this.getSecondIndex(model.template, firstIfBrace); //'}'

            var ifpart1 = model.template.substring(index + 1, firstIfBrace + 1);
            var ifpart2 = model.template.substring(firstIfBrace + 1, secondIfBrace);
            var ifpart3 = '}';

            //1.if(abc==abc){
            ifpart1 = this.getOriginalFromEscapedCode(ifpart1);
            model.segments.push(new Segment(ifpart1, ESegmentType.CodeBlock));
            //2. <div>@(data)</div>
            var ifInnerSegments = this.process(ifpart2);
            model.segments = model.segments.concat(ifInnerSegments);
            //3.}
            model.segments.push(new Segment(ifpart3, ESegmentType.CodeBlock));
            model.processedIndex = secondIfBrace;

            //判断有无else块
            remain = model.template.substring(secondIfBrace + 1);
            if (/^\s*else/g.test(remain))
            {
                //存在else块
                var firstElseBrace = remain.indexOf('{') + secondIfBrace + 1; //'{'
                var secondeElseBrace = this.getSecondIndex(model.template, firstElseBrace); //'}'

                //part 1 2 3
                //else {
                //  xxx
                //}
                var elsepart1 = "else{";
                var elsepart2 = model.template.substring(firstElseBrace + 1, secondeElseBrace);
                var elsepart3 = "}"
                //1.else{
                model.segments.push(new Segment(elsepart1, ESegmentType.CodeBlock));
                //2. <div>@data</div>
                var elseInnerSegments = this.process(elsepart2);
                model.segments = model.segments.concat(elseInnerSegments);
                //3.}
                model.segments.push(new Segment(elsepart3, ESegmentType.CodeBlock));

                model.processedIndex = secondeElseBrace;
            }

            //@if{}
            return model.processedIndex;
        },
        processComment: function (model, index) {
            // @* comment *@
            var commentEnd = this.getSecondIndex(model.template, index);
            model.processedIndex = commentEnd;

            return commentEnd;
        },

        getSecondIndex: function (template, firstIndex) {
            //index 是第一个{的Index
            var pair = {
                '{': '}',
                '(': ')'
            };
            pair[this.symbol] = this.symbol; //pair['@']='@';

            var first = template.substr(firstIndex, 1); //'{' or '('
            var second = pair[first];
            var count = 1; //firstIndex处是first            
                
            for (var index = firstIndex + 1,length = template.length; index < length; index++)
            {
                var cur = template.substr(index, 1);
                if (cur == second)
                {
                    //@  --> @ break;
                    count--;
                    if (count == 0)
                    {
                        break;
                    }
                }
                else if (cur == first)
                {
                    count++;
                }
            }
            return index;
        },

        //在浏览器中,html()等方法会将特殊字符encode,导致处理之前是@while(a &gt; 10) { }
        //http://www.w3school.com.cn/html/html_entities.asp
        //'&lt;'    ---->    <
        //'&gt;'    ---->    >
        //'&amp;'   ---->    &
        getOriginalFromEscapedCode: function (variable) {
            return variable.replaceAll('&lt;', '<')
                .replaceAll('&gt;', '>')
                .replaceAll('&amp;', '&');
        }
    };

    var SegmentCompiler = {
        modelName: "ViewBag",
        enableEmptyValue: false, //是否允许空值

        //将 ' => \'
        //将 " => \"
        //将 回车 => \n
        //usage : "xxx".escapeInFunction();
        escapeInFunction: function (str) {
            if (!str) return str;
            return str
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"')
                .replace(/(\r?\n)+/g, "\\n");
        },

        //var func=SegmentCompiler.compile(Segment[] segmnets)
        compile: function (segments) {
            var functionContent = [];
            functionContent.push("var result='';");

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
                            var inner = "result+={0};".format(data);
                            functionContent.push(inner);
                        }
                        else
                        {
                            //允许空值
                            //@(data)
                            //if(typeof(data) != 'undefined' && data) result.push(data);
                            //else result.push("data");
                            var inner = "if(typeof({0}) != 'undefined' && {0}) result+={0}; else result+='{0}';".format(data);
                            functionContent.push(inner);
                        }
                        break;
                    case ESegmentType.String:
                        //div
                        //result+='div';
                        // "div"
                        //result+='\"div\"';
                        var inner = "result+='{0}';".format(
                            this.escapeInFunction(data)
                            //将String直接量中的 ' " 屏蔽
                        );
                        functionContent.push(inner);
                        break;
                    default:
                        break;
                }
            }

            functionContent.push("return result;");
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

    //导出
    if (typeof (module) != "undefined" && module.exports)
    {
        //NodeJS
        //exports.razor = razor; 写成这样,var r = require("xxx.js");则r.razor.render才有作用
        module.exports = razor;
    }
    else
    {
        //Browser
        global.razor = razor; //绑定到外部window对象上
    }

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
                var html = this.html(); //this是jquery对象
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

                var loop = (function (jqObj) {
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
                    var item = repeatAttr.substring(0, inIndex).trim(); //变量item
                    var items = repeatAttr.substring(inIndex + 2).trim(); //集合items

                    //1.开头的for
                    var content = "for(var index in {0}){ var {1} = {0}[index];".format(items, item);
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
})(this);