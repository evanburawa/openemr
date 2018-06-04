'use strict';

// modules
var browserSync = require('browser-sync');
var csso = require('gulp-csso');
var del = require('del');
var gap = require('gulp-append-prepend');
var gulp = require('gulp');
var argv = require('minimist')(process.argv.slice(2));
var gulpif = require('gulp-if');
var prefix = require('gulp-autoprefixer');
var reload = browserSync.reload;
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

// configuration
var config = {
    dev: argv['dev'],
    build: argv['b'], // temporary until build == production
    proxy: argv['p'],
    src: {
        styles: {
            style_uni: 'themes/style_*.scss',
            style_color: 'themes/colors/*.scss',
            all: 'themes/**/style_*.css',
            all_rtl: 'themes/**/*style_*.css',
        }
    },
    dist: {
        storybook: '.out/'
    },
    dest: {
        themes: 'themes'
    }
};

// clean - will make even stricter once css files are no longer committed
gulp.task('clean', function () {
    let ignore = "!" + config.dist.storybook+ '.gitignore';
    del.sync([config.dist.storybook + "*", ignore]);
});

gulp.task('ingest', function() {
    if (config.dev && typeof config.dev !== "boolean") {
        // allows for custom proxy to be passed into script
        config.proxy = config.dev;
        config.dev = true;
    }
});

gulp.task('sync', ['styles'], function() {
    if (config.proxy) {
        browserSync.init({
            proxy: "127.0.0.1:" + config.proxy
        });
    }

    if (config.dev && !config.build) {
        gulp.watch('themes/**/*.scss', ['styles']);
    } else {
        // hack to get font awesome files into the .out directory
        gulp.src([
            '../public/assets/font-awesome-4-6-3/fonts/**/*.{ttf,woff,eof,svg}'
            ], {base: '../'})
            .pipe(gulp.dest(config.dist.storybook));
    }
});

// styles
const autoGeneratedHeader = `
/*! This style sheet was autogenerated using gulp + scss
 *  For usage instructions, see: https://github.com/openemr/openemr/blob/master/interface/README.md
 */
`;
gulp.task('styles:style_uni', function () {
    gulp.src(config.src.styles.style_uni)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix('last 1 version'))
        .pipe(gap.prependText(autoGeneratedHeader))
        .pipe(gulpif(!config.dev, csso()))
        .pipe(gulpif(!config.dev,sourcemaps.write()))
        .pipe(gulp.dest(config.dest.themes))
        .pipe(gulpif(config.build, gulp.dest(config.dist.storybook + config.dest.themes)))
        .pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles:style_color', function () {
    gulp.src(config.src.styles.style_color)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix('last 1 version'))
        .pipe(gap.prependText(autoGeneratedHeader))
        .pipe(gulpif(!config.dev, csso()))
        .pipe(gulpif(!config.dev,sourcemaps.write()))
        .pipe(gulp.dest(config.dest.themes))
        .pipe(gulpif(config.build, gulp.dest(config.dist.storybook + config.dest.themes)))
        .pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles:rtl', function () {
    gulp.src(config.src.styles.all)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix('last 1 version'))
        .pipe(gulpif(!config.dev, csso()))
        .pipe(gap.appendFile('themes/rtl.css'))
        .pipe(rename({
            dirname: "",
            prefix:"rtl_"
        }))
        .pipe(gulp.dest(config.dest.themes))
        .pipe(gulpif(config.build, gulp.dest(config.dist.storybook + config.dest.themes)))
        .pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles:style_list', function () {
    gulp.src(config.src.styles.all_rtl)
        .pipe(require('gulp-filelist')('themeOptions.json', {flatten: true, removeExtensions: true}))
        .pipe(gulp.dest('.storybook'));
});

gulp.task('styles', ['styles:style_uni', 'styles:style_color', 'styles:rtl', 'styles:style_list']);

if (config.dev && !config.build) {
    gulp.task('default', [ 'ingest', 'sync' ]);
} else {
    gulp.task('default', function (callback) {
        runSequence('clean', ['sync'], callback)
    });
}

