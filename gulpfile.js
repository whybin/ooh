const Gulp = require('gulp');
const Sass = require('gulp-sass');

Gulp.task('sass', function () {
    return Gulp.src('./styles/*.scss')
        .pipe(Sass().on('error', Sass.logError))
        .pipe(Gulp.dest('./public/css'));
});

Gulp.task('sass:watch', function () {
    return Gulp.watch('./styles/*.scss', ['sass']);
});

Gulp.task('default', ['sass']);
