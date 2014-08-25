/*
 Created BY Magicdawn;
 */

//usage : var replaced = "xxx".razorReplaceAll("old","new");
String.prototype.razorReplaceAll = function (oldValue, replaceValue) {
    return this.replace(new RegExp(oldValue, 'g'), replaceValue);
};
//usage : "xxx".razorFormat(obj0, obj1, obj2); no parameter count limit
String.prototype.razorFormat = function (obj0, obj1, obj2) {
    var result = this;
    for (var i in arguments)
    {
        //将{0} -> obj[0]
        //new RegExp("\\{ 0 \\\}",g)
        result = result.razorReplaceAll("\\{" + i + "\\}", arguments[i].toString());
    }
    return result;
};

(function (global) {
    var version = '0.7.0';
    var update_date = '2014-6-8';
    "use strict";

    //-----------------------------------------
    //---工具函数
    //-----------------------------------------
    //简化模板
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
    //复制出一个regex
    function cloneRegex(regex) {
        var flag = regex.global ? 'g' : '';
        flag += regex.multiline ? 'm' : '';
        flag += regex.ignoreCase ? 'i' : '';

        return new RegExp(regex.source, flag);
    };

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
        ForWhile: /^\S(for|while)\s*?\([\s\S]*?\)\s*?\{[\s\S]*?\}/g,

        IfElse: /^\Sif\([\s\S]*?\)[\s\S]*?(else)?/g,

        //@each(item in items){}
        Each: /^\Seach\s*?\([\s\S]+?\)\s*?\{[\s\S]*?\}/g
    };

    var SegementProcesser = {
        symbol: '@',

        //Segment[] result = SegmentProcesser.process(String template);
        process: function (template) {
            var model = new StringBlockModel(template);
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
                            if (cloneRegex(Regexs.ForWhile).test(remain))
                            {
                                //是for while
                                index = this.processForWhile(model, index);
                            }
                            else if (cloneRegex(Regexs.Each).test(remain))
                            {
                                //@each
                                index = this.processEach(model, index);
                            }
                            else if (cloneRegex(Regexs.IfElse).test(remain))
                            {
                                //@if  (else)?
                                index = this.processIfElse(model, index);
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
                if (/^-/g.test(content))
                {
                    //以-空格开头 @(- data) 这种escape
                    content = content.substring(1).trim();

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
                else if (/^=/g.test(content))
                {
                    //@(=name) => @(ViewBag.name)
                    content = content.substring(1).trim(); //@(=name) || @(= name)
                    content = SegmentCompiler.modelName + "." + content;
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
        processForWhile: function (model, index) {
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
        processEach: function (model, index) {
            //$index引用 index索引值
            //处理@each(item in items) { <div>@(item)</div> }
            var remain = model.template.substring(index);
            //'(' ')'
            var firstSmallIndex = remain.indexOf('(') + index;
            var secondSmallIndex = this.getSecondIndex(
                model.template, firstSmallIndex);
            //'{' '}'
            var firstBigIndex = remain.indexOf('{') + index;
            var secondBigIndex = this.getSecondIndex(model.template, firstBigIndex);

            //1.for(var i in items){ item = items[i];
            //item in items
            var loop = model.template.substring(firstSmallIndex + 1, secondSmallIndex).trim();
            var inIndex = loop.indexOf('in');
            var item = loop.substring(0, inIndex).trim()
            var items = loop.substring(inIndex + 2).trim();

            //循环体
            var loopCode = "for(var $index = 0,length = {1}.length;$index < length;$index++) { var {0} = {1}[$index];".razorFormat(item, items);
            model.segments.push(new Segment(loopCode, ESegmentType.CodeBlock));

            //2.循环体
            //{ <div>@(data)</div> }
            var loopContent = model.template.substring(
                firstBigIndex + 1, secondBigIndex).trim();
            var innerSegments = this.process(loopContent);
            model.segments = model.segments.concat(innerSegments);

            //3.}
            model.segments.push(new Segment('}', ESegmentType.CodeBlock));

            //更新processedIndex 返回index 该有的位置
            model.processedIndex = secondBigIndex;
            return secondBigIndex;
        },
        processIfElse: function (model, index) {
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
            var remain = model.template.substring(index);
            var xingIndex = remain.indexOf('*' + this.symbol);
            if (xingIndex > -1)
            {
                //存在*@
                var commentEnd = xingIndex + index + 1;
                model.processedIndex = commentEnd;
                return commentEnd;
            }
            else
            {
                //只有@* 没有*@
                return index;
            }
        },

        getSecondIndex: function (template, firstIndex) {
            //index 是第一个{的Index
            var pair = {
                '{': '}',
                '(': ')'
            };

            var first = template.substr(firstIndex, 1); //'{' or '('
            var second = pair[first];
            var count = 1; //firstIndex处是first

            for (var index = firstIndex + 1, length = template.length; index < length; index++)
            {
                var cur = template.substr(index, 1);
                if (cur == second)
                {
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
            return variable.razorReplaceAll('&lt;', '<')
                .razorReplaceAll('&gt;', '>')
                .razorReplaceAll('&amp;', '&');
        }
    };

    var SegmentCompiler = {
        modelName: "ViewBag",

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
            functionContent.push("var $result='';");
            //在code中可以使用 $result 变量增加输出内容            
            try
            {
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
                            //不允许空值,就是值不存在的情况下会报错
                            //@(data)
                            //result.push(data);
                            var inner = "$result+={0};".razorFormat(data);
                            functionContent.push(inner);
                            break;
                        case ESegmentType.String:
                            //div
                            //result+='div';
                            // "div"
                            //result+='\"div\"';
                            var inner = "$result+='{0}';".razorFormat(
                                this.escapeInFunction(data)
                                //将String直接量中的 ' " 屏蔽
                            );
                            functionContent.push(inner);
                            break;
                        default:
                            break;
                    }
                }
                functionContent.push("return $result;");//return $result;
                return new Function(this.modelName, functionContent.join('\n'));
            }
            catch (e)
            {
                console.log("new Function出错,请检查 模板语法 ...");
                console.log(e);
                return new Function("return '';");
            }
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
            if (!this.withViewBag)
            {
                var codeDef = "";
                for (var key in ViewBag)
                {
                    codeDef += "var {0} = ViewBag['{0}'];".razorFormat(key);
                }
                template = "@{" + codeDef + "}" + template;
            }

            var func = this.compile(template);
            return func(ViewBag);
        },

        //自定义相关
        withViewBag: true,
        symbol: function (newSymbol) {
            // get
            if (!newSymbol) return SegementProcesser.symbol;

            // set
            SegementProcesser.symbol = newSymbol;
            return this;
        },
        model: function (newModelName) {
            // get
            if (!newModelName) return SegmentCompiler.modelName;

            //2 set
            SegmentCompiler.modelName = newModelName;
            return this;
        },
        init: function () {
            this.withViewBag = true;
            return this.symbol('@').model('ViewBag');
        },

        version: version,
        update_date: update_date,

        //工具
        encodeHtml: function (str) {
            //在@(- data)不用这个因为速度太慢
            //content += ".replace(/&/g,'&amp;')";
            //content += ".replace(/</g,'&lt;')";
            //content += ".replace(/>/g,'&gt;')";
            //content += ".replace(/'/g,'&#39;')";
            //content += '.replace(/"/g,"&#34;")';
            //content += ".replace(/\\//g,'&#47;')";
            return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, "&#34;")
            .replace(/\//g, '&#47;');
        },
        decodeHtml: function (str) {
            return SegementProcesser.getOriginalFromEscapedCode(str);
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

        //"for(var xxx=xxx){" = getLoopHeader(jqObj)
        var getLoopHeader = function (jqObj) {
            var attr = jqObj.attr("razor-for") || jqObj.attr("data-razor-for");
            if (attr)
            {
                return 'for({0}){'.razorFormat(attr.trim());
            }
            attr = jqObj.attr("razor-if") || jqObj.attr("data-razor-if");
            if (attr)
            {
                return 'if({0}){'.razorFormat(attr.trim());
            }

            attr = jqObj.attr("razor-while") || jqObj.attr("data-razor-while");
            if (attr)
            {
                return 'while({0}){'.razorFormat(attr.trim());
            }

            attr = jqObj.attr("razor-each") || jqObj.attr("data-razor-each");
            if (attr)
            {
                return "each({0}){".razorFormat(attr);
            }

            //啥都不是
            return '';
        };
        var getTemplate = function (jqObj) {
            //div 的 innerHTML 已经不是模板
            var template = jqObj[0].tagName === "SCRIPT"
                ? jqObj.html() //script标签直接取html()
                : jqObj.attr("razor-template") || jqObj.html();//div标签,先取razor-template属性

            //razor-for/while/if
            //razor-each
            // script | div 均可有这些属性
            var loopHeader = getLoopHeader(jqObj);
            if (loopHeader)
            {
                //@ + for(){ + xxx + }
                template = SegementProcesser.symbol + loopHeader + template + '}';
            }
            return template;
        };

        $.fn.extend({
            //------------------------------------------
            //  render 表示处理节点的innerHtml
            //------------------------------------------
            //var func = $(selector).compile();
            compile: function () {
                return razor.compile(getTemplate(this));
            },

            //-----------------------------------------
            //  String html=$("#id").render(ViewBag)
            //  如果是script -> string
            //  如果是div ->html(render结果) & show
            //-----------------------------------------
            render: function (ViewBag) {
                var template = getTemplate(this);
                var result = razor.render(template, ViewBag);

                if (this[0].tagName !== "SCRIPT")
                {
                    //1.save razor-template
                    if (!this.attr("razor-template"))
                    {
                        //只在第一次render的时候保存
                        var innerTemplate = this.html().trim();
                        this.attr("razor-template", innerTemplate);
                    }
                    //2.append result
                    this.html(result);
                    //3.make it show
                    this.show();
                }

                return result;
            },

            //render到节点的parent
            //$("#template-id").renderToParent(ViewBag)
            renderToParent: function (ViewBag) {
                var html = this.render(ViewBag);
                this.parent().append(html);
            }
        });
    }
})(this);