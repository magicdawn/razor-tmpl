/**
 * razor-tmpl BY Magicdawn
 * on 14-4-12.
 */

(function (exports) {
    //表示Segment类型
    var ESegemrntType = {
        CodeBlock: 0,
        Variable: 1,
        String: 2
    };

    //构造一个Sgement
    function Segment(content, eSegmentType) {
        this.content = content;
        this.SegmentType = eSegmentType;
    };

    var Regexs = {
        //loop
        //part1: @  if(abc === abc){
        //part2:    <div>@(data)</div>
        //part3: }

        //采用String.match(regex) regex非global,匹配一个,match[1~n]为分组,不成功为null
        //多个在一起时,会混乱
        //\S 是 Symbol
        Loop: /^\S((?:if|for|while)\s*?\([\s\S]*?\)\s*?\{)([\s\S]*)(\})/
    };

    function simpleMinfy(str) {
        return str
            // //comment
            .replace(/\/\/.*$/gm, '')//单行注释

            // /*  */
            .replace(/\/\*[\s\S]*\*\//g, '')//多行注释,.号任意字符不包括\n,用[\s\S]表示任意字符
            .replace(/\n+/g, '') //多个空行转为一个
            .replace(/ +/g, ' '); //对个空格转为一个
    }

    //解析器
    var Parser = {
        //使用的 标志@
        symbol: '@',

        //模板
        template: null,

        //模块
        segments: [],

        //已处理的索引
        parsedIndex: -1,

        init: function () {
            this.template = null;
            this.segments = [];
            this.parsedIndex = -1;
        },

        parse: function (template) {
            this.init();
            this.template = simpleMinfy(template);

            var length = this.template.length
            for (var index = 0; index < length; index++)
            {
                var currentChar = this.template.substr(index, 1);
                switch (currentChar)
                {
                    case this.symbol:
                        //@{xxx code}@data   }@在一起,差值为1
                        if (index - this.parsedIndex > 1)
                        {
                            this._handleString(this.parsedIndex + 1, index - 1);
                        }
                        //更新index,handleSymbol返回值表示index应该更新的位置
                        index = this._handleSymbol(index);
                        //this.parsedIndex;//index会自增
                        break;

                    default:
                        break;
                }

            }

            //最后在 parsedIndex 后面没有@符号了
            this._handleString(this.parsedIndex + 1, this.template.length - 1)

            //parse方法返回segments数组
            return this.segments;
        },

        _handleSymbol: function (index) {
            //处理完@符号,要更新主循环index位置,靠返回值实现,而且赋值之后,index还会++
            //
            //有一种情况@hello这种,没有括号,视为普通string,处理@的时候就不能将index=parsedIndex,
            //会导致死循环,今天把chrome ie 全都整歇菜了...
            //@{ code ...} @data
            //parsedIndex->'}' ,index -> '@'
            //@ d不满足,若index=parsedIndex= '{'
            //再处理'@',死循环

            //在index位置是一个@

            //@下一个位置
            var nextChar = this.template.substr(index + 1, 1);
            switch (nextChar)
            {
                case this.symbol:
                    //@@的情况
                    this.segments.push(this.symbol);
                    this.parsedIndex = index + 1;
                    return index + 1;
                    break;
                case '{':
                    this._handleCodeBlock(index);
                    return this.parsedIndex;
                    break;
                case '(':
                    //@(data)
                    this._handleVariable(index);
                    return this.parsedIndex;
                    break;
                default:
                    //@if(){}
                    //不能把@符号算进来,因为symbol可以换
                    var remain = this.template.substring(index);
                    if (Regexs.Loop.test(remain))
                    {
                        //是@(if|forwhile) \s* {}
                        var firstIndex = remain.indexOf('{') + index;           //'{'
                        var secondIndex = this._getSecondBraceIndex(firstIndex);//'}'

                        /*
                            template[index]='@'
                            @if(abc == abc){
                                <div>@(abc)</div>
                            }
                        */

                        var part1 = this.template.substring(index+1,firstIndex+1);     //'if(){'
                        var part2 = this.template.substring(firstIndex+1,secondIndex); //   '<div>@(abc)</div>'
                        var part3 = this.template.substr(secondIndex,1);               // }'
                        
                        this.segments.push(new Segment(part1, ESegemrntType.CodeBlock));
                        this._handleStringBlock(firstIndex+1, secondIndex-1);
                        this.segments.push(new Segment(part3, ESegemrntType.CodeBlock));

                        //最后更新parsedIndex
                        this.parsedIndex = secondIndex; //'}'的index
                        return this.parsedIndex;
                    }
                    else
                    {
                        //上面是@if @while
                        //else 是@data这种情况
                        return index;
                    }
                    break;
            }

            return this.parsedIndex;
        },

        //@{} template[index]='@'
        _handleCodeBlock: function (index) {
            //@{}代码块
            //代码块中可能有@if @for @while
            /*
             @ index
             { index+1
             alert(hello wo de in template);
             } blockEnd
             */
            //获取 } 的位置
            var blockEnd = this._getSecondBraceIndex(index + 1);
            if (blockEnd == index + 2)
            {
                //@{}空的
                return;
            }

            var codeBlock = this.template.substring(index + 2, blockEnd);
            //假设@{} 不包含 @if等
            if (codeBlock)
            {
                //不为空
                this.segments.push(new Segment(codeBlock, ESegemrntType.CodeBlock));
            }
            this.parsedIndex = blockEnd;

            /*if(Regexs.Loop.test(codeBlock) == false)
             {
             }
             var arr=Regexs.LoopInCodeBlock.exec(codeBlock);
             var loopIndex=match.index;//获取内容用arr[0]
             for(var i=index+1;i<blockEnd;i++)
             {
             var cur=this.template.substr(i,1);
             }*/
        },

        //@(var) template[index]='@'
        _handleVariable: function (index) {
            var variableEnd = this._getSecondBraceIndex(index + 1);

            var content = this.template.substring(index + 2, variableEnd).trim();
            if (content)
            {
                //@() variableEnd=index+2,substring(n,n)=''
                this.segments.push(new Segment(content, ESegemrntType.Variable));
            }
            this.parsedIndex = variableEnd;
        },

        //从from 至to,end直接传@的位置即可
        _handleString: function (fromIndex, endIndex) {
            var content = this.template.substring(fromIndex, endIndex + 1).trim();
            if (content)
            {
                this.segments.push(new Segment(content, ESegemrntType.String));
            }

            this.parsedIndex = endIndex;
        },

        //像@if(){<div>@(data)</div>} part2 为string block
        _handleStringBlock: function (fromIndex, endIndex) {
            var parsed = fromIndex - 1;
            var content = '';
            //<div>@(data)</div>
            for (var i = fromIndex; i < endIndex; i++)
            {
                var cur = this.template.substr(i, 1);
                if (cur == this.symbol)
                {
                    //处理<div>
                    //-----------------------------------------
                    content = this.template.substring(parsed + 1, i).trim();
                    if (content)
                    {
                        this.segments.push(new Segment(content, ESegemrntType.String));
                    }
                    parsed = i - 1;
                    //----------------------------------------


                    //处理@(data)
                    //---------------------------------------
                    var next = this.template.substr(i + 1, 1);
                    if (next == '(')
                    {
                        //i i+1
                        //@(
                        var variableEnd = this._getSecondBraceIndex(i + 1);
                        content = this.template.substring(i + 2, variableEnd).trim();
                        if (content)
                        {
                            this.segments.push(new Segment(content, ESegemrntType.Variable));
                        }
                        parsed = variableEnd;
                        i = variableEnd;
                    }
                    //---------------------------------------
                }
            }
            content = this.template.substring(parsed + 1, endIndex + 1).trim();
            if (content)
            {
                this.segments.push(new Segment(content, ESegemrntType.String));
            }
        },

        //获取{} or () 第二个括号的index
        _getSecondBraceIndex: function (firstIndex) {
            //index 是第一个{的Index
            var brace = this.template.substr(firstIndex, 1);//'{' or '('
            var secondBrace = brace == '{' ? '}' : ')';//右括号
            var count = 1;//firstIndex处是 '{'|'('

            var index = firstIndex + 1;
            var length = this.template.length;
            for (; index < length; index++)
            {
                var cur = this.template.substr(index, 1);
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

    //编译器
    var Compiler = {
        modelName: "ViewBag",

        //将segment[]编译为function(ViewBag)
        compile: function (segments) {
            var functionContent = [];
            functionContent.push("var result=[];");

            var segment = null;
            var content = '';
            for (var index = 0, length = segments.length; index < length; index++)
            {
                segment = segments[index];
                content = segment.content;

                switch (segment.SegmentType)
                {
                    case ESegemrntType.CodeBlock:
                        //{alert("hello world ...");} -> alert("hello world...")
                        functionContent.push(content);
                        break;
                    case ESegemrntType.String:
                        //<div></div> -> result.push("<div>")
                        var inner = "result.push(\u0022" + content + "\u0022);";
                        functionContent.push(inner);
                        break;
                    case ESegemrntType.Variable:
                        //@(data)
                        var inner = "result.push(" + content + ");";
                        functionContent.push(inner);
                        break;
                }
            }

            functionContent.push("return result.join('');");

            return new Function(this.modelName, functionContent.join(''));
        }
    };


    var razor = {
        //更改使用的标记,默认为'@'
        changeSymbol: function (newSymbol) {
            Parser.symbol = newSymbol;
        },

        //更改视图中使用的model名,默认为ViewBag
        changeModelName: function (newModelName) {
            Compiler.modelName = newModelName;
        },

        /**
         * 根据模板编译,返回一个function(ViewBag)
         * @param template 模板String
         * @returns {function()}
         */
        compile: function (template) {
            var segments = Parser.parse(template);
            var func = Compiler.compile(segments);
            return func;
        },

        //将template 转变成html
        render: function (template, ViewBag) {
            var func = this.compile(template);
            return func(ViewBag);
        }
    };
    exports.razor = razor;

    if (typeof ($) != "undefined" && $)
    {
        $.fn.extend({
            //$("#id").render
            render: function (ViewBag) {
                var html = this.html();//this是jquery对象
                return razor.render(html, ViewBag);
            },

            //render到节点的parent
            quickRender: function (ViewBag) {
                var html = this.render(ViewBag);
                this.parent().append(html);
            }
        });
    }
})(window);