const Gulp = require('gulp');
const Sass = require('gulp-sass');
const ConvertData = require('./gulp/convert-data.js');

Gulp.task('sass', function () {
    return Gulp.src('./styles/*.scss')
        .pipe(Sass().on('error', Sass.logError))
        .pipe(Gulp.dest('./public/css'));
});

Gulp.task('sass:watch', function () {
    return Gulp.watch('./styles/*.scss', ['sass']);
});

Gulp.task('convert-data', function () {
    return Gulp.src('./raw_data/*.json')
        .pipe(ConvertData())
        .pipe(Gulp.dest('./public/js/data'));
});

Gulp.task('default', ['sass']);
