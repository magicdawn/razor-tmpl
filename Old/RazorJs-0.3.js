//RazorJs - 0.3
//0.2版本采用Segments的办法,来构造 ,编译 segments
//0.3版本,摆脱这个Segments,直接在遍历的时候,来构造函数,内容
//  能稍微运行快一点,但是
//  写着写着容易出错,不易维护.
//  扔进Old冷宫

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

    //StringBlockModel构造函数
    function StringBlockModel(template) {
        this.template = template;
        this.processedIndex = -1;
        this.functionContent = '';
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
                .replace(/\/\/.*$/gm, '')//单行注释
                .replace(/\/\*[\s\S]*\*\//g, '')//多行注释,.号任意字符不包括\n,用[\s\S]表示任意字符
        }
        //普通的去除空行
        return str
            .replace(/@\*[\s\S]*?\*@]/g, '')//去除 @* 模板注释 *@
            .replace(/\n+/g, '\n') //多个空行转为一个
            .replace(/ +/g, ' ') //对个空格转为一个
            .trim();
    };

    var Processer = {
        symbol: '@',
        modelName: "ViewBag",
        enableEmptyValue: false,//是否允许空值

        //------------------------------------------------
        //---导出,供外部使用
        //------------------------------------------------
        //作用 : 将template生成对于的functionContent
        //String functionContent = Processer.process(String template);
        process: function (template) {
            var model = new StringBlockModel(simpleMinfy(template));
            this.processStringBlock(model);
            return model.functionContent;
        },
        //作用 : 添加result =''; ...  return result;并返回function
        //Function func = Processer.compile(functionContent);
        compile: function (functionContent) {
            functionContent = "var result = '';" + functionContent + "return result;";
            return new Function(this.modelName, functionContent);
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
                        case '*': //@* comment *@
                            index = this.processComment(model.index);
                            break;
                        default://可能有@if @for @while等
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
            var lasString = model.template.substring(
                model.processedIndex + 1, model.template.length
            ).trim();
            if (lasString)
            {
                this.addString(model, lasString);
            }
        },

        //-------------------------------------------------
        //---Process 函数
        //-------------------------------------------------
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
                this.addString(model, content);
            }
            model.processedIndex = index - 1;
        },
        processEscapeSymbol: function (model, index) {
            //@@ index index+1
            this.addString(model, this.symbol);
            model.processedIndex = index + 1;

            //index指向block最后
            return model.processedIndex;
        },
        processCodeBlock: function (model, index) {
            //@{}
            var secondBraceIndex = this.getSecondIndex(model.template, index + 1);

            var codeBlock = model.template.substring(index + 2, secondBraceIndex).trim();
            if (codeBlock)
            {
                codeBlock = this.decodeHtml(codeBlock);
                this.addCodeBlock(model, codeBlock);
            }

            model.processedIndex = secondBraceIndex;
            return model.processedIndex;
        },
        processVariable: function (model, index) {
            //@(data) or @(- data)
            //使用@(- data)来escape,如data="<div>abc</div>"   --> &lt;div&gt;abc
            var secondBraceIndex = this.getSecondIndex(model.template, index + 1);
            var variable = model.template.substring(index + 2, secondBraceIndex).trim();

            if (variable)
            {
                variable = this.decodeHtml(variable);//像@( p.age &gt;= 10)
                if (/^- /g.test(variable))
                {
                    //以-空格开头 @(- data) 这种escape
                    variable = variable.substring(2);

                    //escape 86, non escape 8451
                    //variable += ".encodeHtml()"; //速度太慢,不能接受

                    //@(- data) data="&1"

                    //2014-4-19 10:05:27
                    //no escape : 57
                    //escape : 2111
                    //escape no '&' 1657

                    variable += ".replace(/&/g,'&amp;')";
                    variable += ".replace(/</g,'&lt;')";
                    variable += ".replace(/>/g,'&gt;')";
                    variable += ".replace(/'/g,'&#39;')";
                    variable += '.replace(/"/g,"&#34;")';
                    variable += ".replace(/\\//g,'&#47;')";
                }

                this.addVariable(model, variable);
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

            var part1 = model.template.substring(index + 1, firstIndex + 1);    //for(xxx){
            var part2 = model.template.substring(firstIndex + 1, secondInex);   //  <div>@(data)</div>
            var part3 = '}';                                                    //}

            //1.part1
            part1 = this.decodeHtml(part1);
            this.addCodeBlock(model, part1);

            //2.part2
            //part2为StringBlock,意味着if while for 可以 嵌套
            var innerFunctionContent = this.process(part2);
            this.addCodeBlock(model, innerFunctionContent);

            //3.part3
            this.addCodeBlock(model, '}');

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
            var firstIfBrace = remain.indexOf('{') + index;//'{'
            var secondIfBrace = this.getSecondIndex(model.template, firstIfBrace);//'}'

            var ifpart1 = model.template.substring(index + 1, firstIfBrace + 1);
            var ifpart2 = model.template.substring(firstIfBrace + 1, secondIfBrace);
            var ifpart3 = '}';

            //1.if(abc==abc){
            ifpart1 = this.decodeHtml(ifpart1);
            this.addCodeBlock(model, ifpart1);
            //2. <div>@(data)</div>
            var innerFunctionContent = this.process(ifpart2);
            this.addCodeBlock(model, innerFunctionContent);
            //3.}
            this.addCodeBlock(model, '}');
            model.processedIndex = secondIfBrace;

            //判断有无else块
            remain = model.template.substring(secondIfBrace + 1);
            if (/^\s*else/g.test(remain))
            {
                //存在else块
                var firstElseBrace = remain.indexOf('{') + secondIfBrace + 1;//'{'
                var secondeElseBrace = this.getSecondIndex(model.template, firstElseBrace);//'}'

                //part 1 2 3
                //else {
                //  xxx
                //}
                var elsepart1 = "else{";
                var elsepart2 = model.template.substring(firstElseBrace + 1, secondeElseBrace);
                var elsepart3 = "}"
                //1.else{
                this.addCodeBlock(model, elsepart1);
                //2. <divdiv>>@data</
                var elseInnerFunctionContent = this.process(elsepart2);
                this.addCodeBlock(model, elseInnerFunctionContent);
                //3.}
                this.addCodeBlock(model, '}');

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

        //--------------------------------------------------
        //---添加内容函数
        //--------------------------------------------------
        addCodeBlock: function (model, codeBlock) {
            //@{ var data=10; }
            model.functionContent += codeBlock;
        },
        addVariable: function (model, variable) {
            if (!this.enableEmptyValue)
            {
                //不允许空值,就是值不存在的情况下会报错
                //@(data)
                //result.push(data);
                model.functionContent += "result+={0};".format(variable);
            }
            else
            {
                //允许空值
                //@(data)
                //if(typeof(data) != 'undefined' && data) result.push(data);
                //else result.push("data");
                model.functionContent +=
                    "if(typeof({0}) != 'undefined' && {0}) result+={0}; else result+='{0}';".format(variable);

            }
        },
        addString: function (model, str) {
            // "div"
            //result+='\"div\"';
            model.functionContent += "result+='{0}';".format(
                this.escapeInFunction(str)
                //将String直接量中的 ' " \n 屏蔽
            );
        },

        //--------------------------------------------------
        //---工具函数
        //--------------------------------------------------
        //{ --- }
        getSecondIndex: function (template, firstIndex) {
            //index 是第一个{的Index
            var pair = {
                '{': '}',
                '(': ')'
            };
            pair[this.symbol] = this.symbol;//pair['@']='@';

            var first = template.substr(firstIndex, 1);//'{' or '('
            var second = pair[first];
            var count = 1;//firstIndex处是first

            var index = firstIndex + 1,
                length = template.length;
            for (; index < length; index++)
            {
                var cur = template.substr(index, 1);
                if (cur == first)
                {
                    count++;
                }
                else if (cur == second)
                {
                    count--;
                    if (count == 0)
                    {
                        break;
                    }
                }
            }
            return index;
        },
        //'&lt;'    ---->    <
        //'&gt;'    ---->    >
        //'&amp;'   ---->    &
        decodeHtml: function (variable) {
            //在浏览器中,html()等方法会将特殊字符encode,导致处理之前是@while(a &gt; 10) { }
            //http://www.w3school.com.cn/html/html_entities.asp
            return variable
                .replaceAll('&lt;', '<')
                .replaceAll('&gt;', '>')
                .replaceAll('&amp;', '&');
        },
        //将 ' => \'
        //将 " => \"
        //将 回车 => \n
        //usage : "xxx".escapeInFunction();
        escapeInFunction: function (str) {
            if (!str) return str;
            return str
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n");
        }
    };

    var razor = {
        //---------------------------------------
        //---模板相关函数
        //---------------------------------------
        //var func=razor.compile(String template);
        compile: function (template) {
            //不包含 result=''; return result;
            var functionContent = Processer.process(template);
            var func = Processer.compile(functionContent);
            return func;
        },
        //String result=razor.render(String template,Object ViewBag)
        render: function (template, ViewBag) {
            var func = this.compile(template);
            return func(ViewBag);
        },

        //---------------------------------------
        //自定义相关
        //---------------------------------------
        changeSymbol: function (newSymbol) {
            Processer.symbol = newSymbol;
        },
        changeModelName: function (newModelName) {
            Processer.modelName = newModelName;
        },
        enableEmptyValue: function (boolEnable) {
            Processer.enableEmptyValue = boolEnable;
        },
        init: function () {
            this.changeSymbol('@');
            this.changeModelName('ViewBag');
            this.enableEmptyValue(false);
        }
    };

    //-----------------------------------------
    //---导出到外部this
    //-----------------------------------------
    if (typeof (module) != "undefined" && module.exports)
    {
        //NodeJS
        //exports.razor = razor; 写成这样,var r = require("xxx.js");则r.razor.render才有作用
        module.exports = razor;
    }
    else
    {
        //Browser
        global.razor = razor;//绑定到外部window对象上
    }

    //---------------------------------------
    //---if jquery exists
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

            //----------------------------------------------
            //---Node 表示节点上有 要处理的内容
            //---<div razor-template razor-for="var i=0;i<ViewBag.length;i++">
            //-----------------------------------------------
            //Function func=$(选择器).compileNode();
            compileNode: function () {
                var functionContent = '';
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
                    functionContent += loop.symbol + "(" + loop.content + "){";
                }

                //在innerrender
                var innerTemplate = this.attr("razor-template") || this.html();
                var innerFunctionContent = Processer.process(innerTemplate);
                functionContent += innerFunctionContent;

                //最后一个}
                if (loop.symbol)
                {
                    functionContent += '}';
                }

                var func = Processer.compile(functionContent);
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
                var functionContent = '';
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
                    functionContent += "for(var index in {0}){ var {1} = {0}[index];".format(items, item);
                }

                //2.中间内容
                var innerTemplate = this.attr("razor-template") || this.html();
                var innerFunctionContent = Processer.process(innerTemplate);
                functionContent += innerFunctionContent;

                if (repeatAttr)
                {
                    //3.最后,与1对应的 '}'
                    functionContent += '}';
                }

                //compile : r functionContent -> func
                var func = Processer.compile(functionContent);
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