module.exports = cn = {};

cn.help = "\n\
    razor file [output]\n\
    \n\
    output : 表示输出内容\n\
    \n\
    example : \n\
        razor index.rhtml index.htm             -> index.htm\n\
        \n\
        output 还可以在模板里用 @dest('dest_path'); 指定\n\
        \n\
        razor index.rhtml                       -> index.html\n\
        razor style.rcss                        -> style.css\n\
    \n";

cn.must_specify_template = '必须指定模板文件';
cn.file_generated = "文件已生成 : %s";