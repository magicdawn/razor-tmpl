module.exports = en = {};

en.help = "\n\
    razor file [output]\n\
    \n
    output : to set the output\n\
    \n\
    example : \n\
        razor index.rhtml index.htm             -> index.htm\n\
        \n\
        output can also be specified with @{ var dest = 'dest_path'; }\n\
        \n\
        razor index.rhtml                       -> index.html\n\
        razor style.rcss                        -> style.css\n\
    \n\
";

cn.must_specify_template = 'must specify a template file';
en.file_generated = "File generated : %s";