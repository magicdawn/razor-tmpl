var Transform = require('stream').Transform;

var tran = new Transform({
    objectMode : true
});
tran._transform(file,encoding,cb){
    if(file.isStream()){

    }

    this.push(file);
    cb();
}