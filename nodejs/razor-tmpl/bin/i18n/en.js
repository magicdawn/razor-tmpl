module.exports = en = {};

en.help = "\n\
    razor file [output]\n\
    \n\
    file   : split with ','\n\
    output : to set the output\n\
    \n\
    example : \n\
        razor index.rhtml index.htm             -> index.htm\n\
        razor index.rhtml output_dir/index.htm  -> output_dir/index.htm\n\
        razor index.rhtml output_dir/           -> output_dir/index.html\n\
        \n\
        output can also be specified with @{ var dest = 'dest_path'; }\n\
        \n\
        razor index.rhtml                       -> index.html\n\
        razor style.rcss                        -> style.css\n\
    \n\
";

en.file_not_found = "Can't find file : %s";
en.success = "[Created] File : %s";
cn.found_dest_expression = "detect dest expression : %s"