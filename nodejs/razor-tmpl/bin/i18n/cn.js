module.exports = cn = {};

cn.help = "\n\
    razor file [output]\n\
    \n\
    file    表示模版文件,使用,分隔\n\
    output  表示输出内容\n\
    \n\
    示例 : \n\
        razor index.rhtml index.htm             -> index.htm\n\
        razor index.rhtml output_dir/index.htm  -> output_dir/index.htm\n\
        razor index.rhtml output_dir/           -> output_dir/index.html\n\
        \n\
        output 还可以在模板里用 @{ var dest = 'dest_path'; } 指定\n\
        \n\
        razor index.rhtml                       -> index.html\n\
        razor style.rcss                        -> style.css\n\
    \n\
";

cn.file_not_found = "找不到文件啊,亲 : %s";
cn.success = "[已生成] 文件 : %s";
cn.found_dest_expression = "检测到dest语句 : %s"