/**
 * I really want to get rid of gulp and use npm scripts to do everything, but it
 * was a huge headache... Tooling fatigue FTL
 */
var gulp = require('gulp');
var tsc = require('gulp-typescript');

gulp.task("build:test", function() {
  return gulp.src(__dirname + "/test/**/*_test.ts")
    .pipe(tsc({
      removeComments: false,
      noImplicitAny: false,
      target: "ES5",
      module: "commonjs",
      declarationFiles: false
    }))
    .js.pipe(gulp.dest(__dirname + "/build/test"));
});

gulp.task("build:src", function() {
  return gulp.src(__dirname + "/src/**/*.ts")
    .pipe(tsc({
      removeComments: false,
      noImplicitAny: false,
      target: "ES5",
      module: "commonjs",
      declarationFiles: false,
      sourceMap: true
    }))
    .js.pipe(gulp.dest(__dirname + "/build/src"));
});
