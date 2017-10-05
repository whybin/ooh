const _       = require('lodash');
const Pug     = require('pug');
const Express = require('express');

const config  = require('../include/config.js');
const router  = Express.Router();

const pugOptions = {
    basedir: config.get('env')['views']
};

router.use(function (req, res, next) {
    res.locals.title = config.get('site.name');
    next();
});

const prependTitle = function (name, res) {
    return name + ' - ' + (res.locals.title || config.get('site.name'));
};

router.get('/', function (req, res) {
    res.render('index', {
        title: prependTitle('Home', res),
        flapContent: config.get('site.name'),
        message: Pug.renderFile('./views/partials/top-flap.pug', _.extend(pugOptions, {
            homepage: config.get('site.url'),
            shorturl: config.get('site.shorturl')
        }))
    });
});

module.exports = router;
