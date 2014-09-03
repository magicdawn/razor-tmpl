module.exports = cn = {};

cn.help = "\n\
    razor file [output]\n\
    \n\
    file    表示模版文件,使用,分隔,可以省略razor后缀,如a,b,c\n\
    output  表示输出内容,默认无输出\n\
    \n\
    示例 : \n\
        razor xxx.razor                     -> 无输出\n\
        razor xxx.razor xxx.abc             -> xxx.abc\n\
        razor xxx.razor abc                 -> xxx.abc\n\
        razor a,b,c css                     -> a.css,b.css,c.css\n\
        razor xxx.razor output_dir/         -> output_dir/xxx.html\n\
        razor xxx.razor output_dir/%s.css   -> output_dir/xxx.css\n\
    \n\
    output 还可以在模板里用 @{ var dest = 'dest_path'; } 指定\n\
";

cn.file_not_found = "找不到文件啊,亲 : %s";
cn.success = "[已生成] 文件 : %s";