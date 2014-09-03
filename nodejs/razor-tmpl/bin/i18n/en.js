module.exports = en = {};

en.help = "\n\
    razor file [output]\n\
    \n\
    file   : split with ',' , and razor ext can be ignored , such as a,b,c\n\
    output : to set the output,default is no-output\n\
    \n\
    example : \n\
        razor xxx.razor                     -> no-output\n\
        razor xxx.razor xxx.abc             -> xxx.abc\n\
        razor xxx.razor abc                 -> xxx.abc\n\
        razor a,b,c css                     -> a.css,b.css,c.css\n\
        razor xxx.razor output_dir/         -> output_dir/xxx.html\n\
        razor xxx.razor output_dir/%s.css   -> output_dir/xxx.css\n\
    \n\
    output can also be specified with @{ var dest = 'dest_path'; }\n\
";

en.file_not_found = "Can't find file : %s";
en.success = "[Created] File : %s";