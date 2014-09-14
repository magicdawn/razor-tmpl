var fs = require('fs');

fs.createReadStream('razor-tmpl.js').pipe(fs.createWriteStream('nodejs/razor-tmpl/razor-tmpl.js'))

console.log("完成复制");