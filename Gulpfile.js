var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var fs = require('fs');
var path = require('path');
var min = require('gulp-uglify');
var through2 = require('through2');
var format = require('./lib/util').format;

/**
 * use browserify to generate browser version
 *
 */
gulp.task('browserify', function(done) {
  // generate umd wrapper
  //
  // browserify https://github.com/substack/node-browserify/issues/1150
  //
  // 手动
  done();
  // ./node_modules/.bin/browserify lib/index.js --standalone razor > browser/razor-tmpl.js
  //
  // var b = browserify({
  //   entries: __dirname + '/lib/index.js',
  //   standalone: 'razor'
  // });

  // // output
  // b.bundle(function(e, buf) {
  //   if (e) {
  //     console.error(e);
  //     console.error(e.stack);
  //     throw e;
  //   }

  //   fs.writeFileSync(__dirname + '/browser/razor-tmpl.js', buf);
  //   gutil.log('File generated : browser/razor-tmpl.js');
  //   done();
  // });
});

/**
 * generate .min.js
 */
gulp.task('min', ['browserify'], function() {
  gulp
    .src('./browser/razor-tmpl.js')
    .pipe(min())
    .pipe(through2.obj(function(file, enc, cb) {
      file.path = file.path.replace(/\.js$/, '.min.js')
      gutil.log("min File : ", file.path);

      this.push(file);
      cb();
    }))
    .pipe(gulp.dest('./browser/'));
});

/**
 * default task
 */
gulp.task('default', ['browserify', 'min']);