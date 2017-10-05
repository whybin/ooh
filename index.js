const Express = require('express');
const app     = Express();

const routes  = require('./routes/index.js');
const config  = require('./include/config.js');

const settings = config.get('env');
for (let key in settings) {
    app.set(key, settings[key]);
}

app.use(Express.static('public'));
app.use('/', routes);

app.listen(3000, function () {
    console.log('Listening on port 3000');
});
