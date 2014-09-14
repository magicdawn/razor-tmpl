/*
 * Created BY Magicdawn;
 */
String.prototype.razorReplaceAll = function(old, replaceValue) {
    return this.replace(new RegExp(old, 'g'), replaceValue);
};
String.prototype.razorReplaceAll._doc = 'str.razorReplaceAll(old,new),use new RegExp(old,g)';

String.prototype.razorFormat = function(obj0, obj1, obj2) {
    var result = this;
    for (var i in arguments) {
        //将{0} -> obj[0]
        result = result.razorReplaceAll("\\{" + i + "\\}", arguments[i].toString());
    }
    return result;
};
String.prototype.razorFormat._doc = '"{0},{1},{2}".razorFormat(obj0, obj1, obj2) , no obj count limit';

(function(_export) {
    var razor = {
        version: '1.2.1',
        update_date: '2014-09-14',
        debuging: false
    };

    //do export
    if (typeof module !== "undefined" && module.exports) { //nodejs
        module.exports = razor;
    }
    else if (typeof window !== 'undefined') { //browser
        window.razor = razor;
    }
    else { //no window,no global
        _export.razor = razor;
    }

    var Regexs = {
        //@each(item in items){}
        Each: /^each\s*?\([\s\S]+?\)\s*?\{[\s\S]*?\}/,

        //@...{}
        Noraml: /[\S\s]*?\{[\S\s]*?\}/
    };

    var symbol = '@';
    var ViewBag = 'ViewBag';

    function Parser(input) {
        if(typeof input !== 'string')
            input = input.toString();

        this.input = input;
        this.consumed = -1;
        this.tokens = [];
    }

    Parser.Tokens = {
        "TK_VAR": "TK_VAR",
        "TK_CODE_BLOCK": "TK_CODE_BLOCK",
        "TK_STRING": "TK_STRING",

        "TK_LOOP_END" : "TK_LOOP_END" //trim right
    };

    Parser.prototype = {
        tok: function(type, val) {
            this.tokens.push({
                type: type,
                val: val
            });
        },

        parse: function() {
            for (var index = 0; index < this.input.length; index++) {
                var cur = this.input[index];
                var next = '';

                if (cur == symbol) //'@'
                {
                    //handle string before handle symbol @xxx
                    this.handleString(index);

                    //2. @之后的判断,不允许空白
                    next = this.input[index + 1];
                    //@@
                    if (next == symbol) {
                        index = this.handleEscapeSymbol(index);
                        continue;
                    }
                    //@* comment *@
                    else if (next == "*") {
                        index = this.handleComment(index);
                        continue;
                    }
                    else {
                        var tokenIndex = index + 1;
                        //其他允许有空白
                        //@ if ( name == 'zhangsan' )
                        //{
                        //  ...
                        //}
                        while (next == ' ' || next == '\n') {
                            //继续
                            next = this.input[++tokenIndex];
                            //@ if() -> tokenIndex=index+2
                        }

                        switch (next) {
                            case '{': //@{code block}
                                index = this.handleCodeBlock(index, tokenIndex);
                                break;
                            case '(': //@(var)
                                index = this.handleVariable(index, tokenIndex);
                                break;
                            default: //可能有@if @for @while等
                                var remain = this.input.substring(tokenIndex);
                                //each - for/while/if/else - 普通 @...{}
                                if (Regexs.Each.test(remain)) {
                                    //@each
                                    index = this.handleEach(index, tokenIndex);
                                }
                                else if (Regexs.Noraml.test(remain)) {
                                    //@...{}
                                    index = this.handleNormal(index, tokenIndex);
                                }
                                break;
                        }
                    }
                }
            }
            //for退出后,还有一段string
            //handleString取 [handleedIndex+1,atIndex)就是atIndex前面一个
            //(template.length-1)+1 如length=10,0-9,9+1,包括9
            this.handleString(this.input.length);

            return this.tokens;
        },

        /*
         * handleXXX(i)
         * i为@的位置
         * 返回新的index应该位置
         */

        //普通String,如 <div>@(var变量)中的<div>
        handleString: function(i) {
            var content = this.input.substring(this.consumed + 1, i);

            if (content.trim()) {
                this.tok(Parser.Tokens.TK_STRING, content);
            }
            this.cousumed = i - 1;
        },

        handleComment: function(i) {
            // @* comment *@
            var remain = this.input.substr(i);
            var star_index = remain.indexOf('*' + symbol);

            if (star_index > -1) { // *@ exists
                var commentEnd = star_index + 1 + i;
                return this.consumed = commentEnd;
            }
            else { // no *@ found
                var before = this.input.substring(0, i + 2); // start...@*
                var line = before.split('\n').length + 1;
                var chr = (i + 2) - before.split('\n').reduce(function(sum, line) {
                    return sum += line.length + 1; // '\r\n'.length = 2
                }, 0);
                throw new Error("line : {0},column : {1} no comment-end(*{3}) found".razorFormat(line, chr, symbol));
            }
        },

        handleEscapeSymbol: function(i) {
            //@@ i i+1
            this.tok(Parser.Tokens.TK_STRING, symbol);
            return this.consumed = i + 1;
        },

        handleCodeBlock: function(i, fi) {
            //@ { }
            //i  -> '@'
            //fi -> '{'
            var sec = this.getSecondIndex(fi);
            var content = this.input.substring(fi + 1, sec);
            if (content) {
                // &amp; -> &
                content = this.decodeHtmlEntity(content);
                this.tok(Parser.Tokens.TK_CODE_BLOCK, content);
            }
            return this.consumed = sec;
        },

        handleVariable: function(i, fi) {
            // i  -> '@'
            // fi -> '('

            //@ (-=? var_or_expression )
            //@(- ) encode
            //@(= ) ViewBag.

            var sec = this.getSecondIndex(fi);
            var content = this.input.substring(fi + 1, sec).trim();
            if (content) {
                content = this.decodeHtmlEntity(content); //像@( p.age &gt;= 10)

                /*
                 * @(-= name) -=混用,不论顺序
                 */
                var fi_chr = content[0];
                var sec_chr = content[1];
                var no_viewbag = 0;
                var escape = 0;

                //@(-= name)
                if (fi_chr === '=' || sec_chr === '=') {
                    no_viewbag = 1;
                }
                if (fi_chr === '-' || sec_chr === '-') {
                    escape = 1;
                }

                content = content.substring(no_viewbag + escape).trim();

                if (no_viewbag) {
                    content = ViewBag + "." + content;
                }
                if (escape) {
                    //content += ".encodeHtml()"; //速度太慢,不能接受

                    //@(- data) data="&1"
                    content += ".replace(/&/g,'&amp;')";
                    content += ".replace(/</g,'&lt;')";
                    content += ".replace(/>/g,'&gt;')";
                    // content += ".replace(/'/g,'&#39;')";
                    // content += '.replace(/"/g,"&#34;")';
                    // content += ".replace(/\\//g,'&#47;')";
                }

                //@(data)
                this.tok(Parser.Tokens.TK_VAR, content);
            }
            return this.consumed = sec;
        },

        handleEach: function(i, fi) {
            //i  -> '@'
            //fi -> 'e' , each's first letter

            //@ each(item in items) {
            //  <div>@(item)</div>
            //}

            // '(' ')'
            var remain = this.input.substring(i); //@xxxxx
            var fi_small = remain.indexOf('(') + i;
            var sec_small = this.getSecondIndex(fi_small);

            //'{' '}'
            var fi_big = remain.indexOf('{') + i;
            var sec_big = this.getSecondIndex(fi_big);

            //1.for(var i in items){ item = items[i];
            var loop = this.input.substring(fi_small + 1, sec_small); //item in items
            var inIndex = loop.indexOf('in');
            var item = loop.substring(0, inIndex).trim()
            var items = loop.substring(inIndex + 2).trim();

            //循环体
            var loop_head = "for(var $index = 0,$length = {1}.length;$index < $length;$index++) { var {0} = {1}[$index];".razorFormat(item, items);
            this.tok(Parser.Tokens.TK_CODE_BLOCK, loop_head);

            //2.循环体
            //{ <div>@(data)</div> }
            var loop_body = this.input.substring(fi_big + 1, sec_big).trimLeft();
            var inner_tokens = new Parser(loop_body).parse();
            this.tokens = this.tokens.concat(inner_tokens);

            //3.}
            this.tok(Parser.Tokens.TK_CODE_BLOCK, '}');

            //StringBlock END,trim end
            // this.tok(Parser.Tokens.TK_LOOP_END,'');

            return this.consumed = sec_big;
        },
        handleNormal: function(i, fi) {
            //i  -> '@'
            //fi -> @之后第一个非空白字符

            //@...{     for/while/if/else/try/catch/switch/case
            //  <div><>
            //}

            var remain = this.input.substring(i);
            var fi_big = remain.indexOf('{') + i;
            var sec_big = this.getSecondIndex(fi_big);

            var part1 = this.input.substring(fi, fi_big + 1); // for(xxx){
            var part2 = this.input.substring(fi_big + 1, sec_big); // <div>@(data)</div>
            var part3 = '}'; //}

            //1.part1
            part1 = this.decodeHtmlEntity(part1);
            this.tok(Parser.Tokens.TK_CODE_BLOCK, part1);

            //2.part2
            var inner_tokens = new Parser(part2).parse();
            this.tokens = this.tokens.concat(inner_tokens);

            //3.part3
            this.tok(Parser.Tokens.TK_CODE_BLOCK, part3);

            //StringBlock END,trim end
            // this.tok(Parser.Tokens.TK_LOOP_END,'');

            return this.consumed = sec_big;
        },

        getSecondIndex: function(fi) {
            // fi = first index
            // input[fi] = '{' or '('
            var pair = {
                '{': '}',
                '(': ')'
            };

            var first = this.input[fi]; //'{' or '('
            var second = pair[first];
            var count = 1; //input[fi]

            for (var i = fi + 1; i < this.input.length; i++) {
                var cur = this.input[i];

                if (cur == second) {
                    count--;
                    if (count == 0) {
                        return i;
                    }
                }
                else if (cur == first) {
                    count++;
                }
            }
            return -1; //not found
        },

        //在浏览器中,html()等方法会将特殊字符encode,导致处理之前是@while(a &gt; 10) { }
        //http://www.w3school.com.cn/html/html_entities.asp
        //'&lt;'    ---->    <
        //'&gt;'    ---->    >
        //'&amp;'   ---->    &
        decodeHtmlEntity: function(variable) {
            return variable.razorReplaceAll('&lt;', '<')
                .razorReplaceAll('&gt;', '>')
                .razorReplaceAll('&amp;', '&');
        }
    };

    //将 ' => \'
    //将 " => \"
    //将 回车 => \n
    function escapeInFunction(s) {
        if (!s) return s;
        return s
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/(\r?\n)/g, "\\n");

        //一个string包含"abcd\nabcd"
        //写到function也就是
        //$result += "abcd
        // abcd";
        //导致new function出错
    }

    var Compiler = {
        compileToCode: function(tokens) {
            var code = ["var $result='';"]; //$result
            for (var i in tokens) {
                var data = tokens[i].val;
                switch (tokens[i].type) {
                    case Parser.Tokens.TK_CODE_BLOCK:
                        //@{ var data=10; }
                        code.push(data);
                        break;
                    case Parser.Tokens.TK_VAR:
                        //不允许空值,就是值不存在的情况下会报错
                        //@(data)
                        //result.push(data);
                        var inner = "$result+={0};".razorFormat(data);
                        code.push(inner);
                        break;
                    case Parser.Tokens.TK_STRING:
                        //div
                        //result+='div';
                        // "div"
                        //result+='\"div\"';
                        var inner = "$result+='{0}';".razorFormat(
                            escapeInFunction(data)
                            //将String直接量中的 ' " 屏蔽
                        );
                        code.push(inner);
                        break;
                    case Parser.Tokens.TK_LOOP_END:
                        code.push('$result = $result.trimRight();')
                    break;
                    default:
                        break;
                }
            }
            code.push("return $result;"); //return $result;
            return code.join('\n');
        },

        compile: function(tokens) {
            var code = Compiler.compileToCode(tokens);
            try {
                return new Function(ViewBag, code);
            }
            catch (e) {
                //if (razor.debuging) { //debuging show err & code
                    console.log("error when call 'new Function',please check template & data !");
                    console.log();
                    console.log("----- compiled code start -----");
                    console.log(code);
                    console.log("----- compiled code  end  -----");
                    console.log();
                //}
                throw e;
            }
        }
    }

    razor.compile = function(template) {
        var tokens = new Parser(template).parse();
        var func = Compiler.compile(tokens);
        return func;
    };
    razor.compile._doc = "function func = razor.compile(template)";

    //String result=razor.render(String template,Object ViewBag)
    razor.render = function(template, ViewBag) {
        if (!this.withViewBag) {
            var codeDef = "";
            for (var key in ViewBag) {
                codeDef += "var {0} = ViewBag['{0}'];".razorFormat(key);
            }
            template = "@{" + codeDef + "}" + template;
        }

        var func = this.compile(template);
        return func(ViewBag);
    };
    razor.render._doc = "String result = razor.render(String template,Object ViewBag)";

    //自定义相关
    razor.withViewBag = true;
    razor.symbol = function(newSymbol) {
        // get
        if (!newSymbol) return symbol

        // set
        symbol = newSymbol;
        return this;
    };
    razor.symbol._doc = "\n\
        get or set the char as the symbol\n\
          get : razor.symbol() default = '@'\n\
          set : razor.symbol(newSymbol)\n\
    ";

    razor.model = function(newModelName) {
        // get
        if (!newModelName) return ViewBag;

        //2 set
        ViewBag = newModelName;
        return this;
    };
    razor.model._doc = "\n\
        get or set the data object used in the view\n\
          get : razor.model() default = 'ViewBag'\n\
          set : razor.model(newModelName)\n\
    ";

    razor.init = function() {
        this.withViewBag = true;
        return this.symbol('@').model('ViewBag');
    };
    razor.init._doc = "\n\
        you can custom by\n\
            razor.symbol        default = '@'\n\
            razor.model         default = ViewBag\n\
            razor.withViewBag   default = false,that means you need @(ViewBag.somevar)\n\
        \n\
        and this method is to change back to the default value.\n\
    ";

    //工具
    razor.encodeHtml = function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };
    razor.encodeHtml._doc = "encode html entity";

    razor.decodeHtml = function(str) {
        return Parser.decodeHtmlEntity(str);
    };
    razor.decodeHtml._doc = "decode html entity";

    //高级选项
    razor._advance = {
        toTokens: function(tmpl) {
            return new Parser(tmpl).parse();
        },
        toCode: Compiler.compileToCode
    };
    razor._advance.toTokens._doc = "Token[] tokens = toTokens(tmpl)";
    razor._advance.toCode._doc = "String code = toCode(Token[] tokens)";

    //if jQuery exists
    //---------------------------------------
    if (typeof jQuery !== 'undefined' && jQuery) {
        var $ = jQuery;
        //隐藏所有的razor-template div
        $(function() {
            $("[razor-template]").hide();
        });

        //"for(var xxx=xxx){" = getLoopHeader(jqObj)

        function getLoopHeader(jqObj) {
            var attr = jqObj.attr("razor-for") || jqObj.attr("data-razor-for");
            if (attr) {
                return 'for({0}){'.razorFormat(attr.trim());
            }
            attr = jqObj.attr("razor-if") || jqObj.attr("data-razor-if");
            if (attr) {
                return 'if({0}){'.razorFormat(attr.trim());
            }

            attr = jqObj.attr("razor-while") || jqObj.attr("data-razor-while");
            if (attr) {
                return 'while({0}){'.razorFormat(attr.trim());
            }

            attr = jqObj.attr("razor-each") || jqObj.attr("data-razor-each");
            if (attr) {
                return "each({0}){".razorFormat(attr);
            }

            //啥都不是
            return '';
        };

        function getTemplate(jqObj) {
            //div 的 innerHTML 已经不是模板
            var template = jqObj[0].tagName === "SCRIPT" ? jqObj.html() //script标签直接取html()
                : jqObj.attr("razor-template") || jqObj.html(); //div标签,先取razor-template属性

            //razor-for/while/if
            //razor-each
            // script | div 均可有这些属性
            var loopHeader = getLoopHeader(jqObj);
            if (loopHeader) {
                //@ + for(){ + xxx + }
                template = symbol + loopHeader + template + '}';
            }
            return template;
        };

        $.fn.extend({
            //------------------------------------------
            //  render 表示处理节点的innerHtml
            //------------------------------------------
            //var func = $(selector).compile();
            compile: function() {
                return razor.compile(getTemplate(this));
            },

            //-----------------------------------------
            //  String html=$("#id").render(ViewBag)
            //  如果是script -> string
            //  如果是div ->html(render结果) & show
            //-----------------------------------------
            render: function(ViewBag) {
                var template = getTemplate(this);
                var result = razor.render(template, ViewBag);

                if (this[0].tagName !== "SCRIPT") {
                    //1.save razor-template
                    if (!this.attr("razor-template")) {
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
            renderToParent: function(ViewBag) {
                var html = this.render(ViewBag);
                this.parent().append(html);
                return html;
            }
        });

        $.fn.compile._doc = "var func = $(selector).compile()";
        $.fn.render._doc = "result = $(selector).render(ViewBag) , for div[data-razor-tmpl] or SCRIPT[type='template']";
        $.fn.renderToParent._doc = "$(selector).renderToParent() , it use the jqObj.parent() to find parent,and append result";
    }
})(this);