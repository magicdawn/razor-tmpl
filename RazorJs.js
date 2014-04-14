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
        //\S 是 Symbol
        Loop: /^\Sif|for|while\s*?\([\s\S]*?\)\s*?\{[\s\S]*?\}/
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

        //主方法,对外公开
        process: function (template) {
            var model = new StringBlockModel(simpleMinfy(template));
            this.processStringBlock(model);
            return model.segments;
        },

        //StringBlock
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
                        default://可能有@if 等
                            var remain = model.template.substring(index);
                            if (Regexs.Loop.test(remain))
                            {
                                //是if for while
                                index = this.processLoop(model, index);
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

        //@@ index index+1
        processEscapeSymbol: function (model, index) {
            model.segments.push(new Segment(this.symbol, ESegmentType.String));
            model.processedIndex = index + 1;

            //index指向block最后
            return model.processedIndex;
        },

        //@{}
        processCodeBlock: function (model, index) {
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
            //  @if() {   }
            var remain = model.template.substring(index);
            var firstIndex = remain.indexOf('{') + index;
            //在model.template里找匹配的'}'
            var secondInex = this.getSecondBraceIndex(model.template, firstIndex);

            var part1 = model.template.substring(index + 1, firstIndex + 1);      //if(abc == abc){
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

        //主方法,对外公开
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
        compile: function (template) {
            var segments = SegementProcesser.process(template);
            var func = SegmentCompiler.compile(segments);
            return func;
        },
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
    exports.razor = razor;

    //if jquery exists
    //---------------------------------------
    if (typeof ($) != "undefined" && $)
    {
        //隐藏所有的razor-template div
        $(function () {
            $("[razor-template]").hide();
        });

        $.fn.extend({
            //String html=$("#id").render(ViewBag)
            render: function (ViewBag) {
                var html = this.html();//this是jquery对象
                return razor.render(html, ViewBag);
            },

            //render到节点的parent
            //$("#template-id").quickRender(ViewBag)
            renderToParent: function (ViewBag) {
                var html = this.render(ViewBag);
                this.parent().append(html);
            },

            //renderInParent,会清空parent的内容,再append,会覆盖此Script template
            renderInParent: function (ViewBag) {
                var result = this.render(ViewBag);
                this.parent().html(result);
            },

            //上面是一个<script>标签,render的时候取innderHTML,这个取节点
            //<div razor-template razor-for="var i=0;i<ViewBag.length;i++">
            //---------------------------------
            renderNode: function (ViewBag) {
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
                var innerSegments = SegementProcesser.process(this.html());
                segments = segments.concat(innerSegments);

                //最后一个}
                if (loop.symbol)
                {
                    segments.push(new Segment('}', ESegmentType.CodeBlock));
                }

                //最后结果
                var html = SegmentCompiler.compile(segments)(ViewBag);
                this.html(html);
                this.show();
            }
        });
    }
})(window);