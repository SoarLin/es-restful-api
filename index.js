'use strict';

var koa = require('koa');
var route = require('koa-route');
var app = module.exports = koa();
var path = require('path');
var serve = require('koa-static');
require('dotenv').config({
    path: '.env'
});

app.use(serve(path.join(__dirname, '/public')));

var basicRoutes = require('./routes/basicRoutes');
app.use(route.get('/', basicRoutes.getIndex));

// Create Index,Type && Delete whole Indeies
var indexRoutes = require('./routes/indexRoutes');
app.use(route.post('/create/:index', indexRoutes.createIndex));
app.use(route.post('/delete/:index', indexRoutes.deleteIndex));

// Update Documents to index/type
var updateRoutes = require('./routes/updateRoutes');
app.use(route.get('/update/', updateRoutes.getUpdate));
app.use(route.post('/update/', updateRoutes.postUpdate));

// Search
var searchRoutes = require('./routes/searchRoutes');
app.use(route.post('/search/:index/:type', searchRoutes.postSearch));

// Start app up
if (process.env.APP_ENV === 'soar') {
    app.listen(3000);
    console.log('The app is listening on port 3000.');

} else if (process.env.APP_ENV === 'production') {

    var le = require('letsencrypt-express').create({
      server: 'https://acme-v01.api.letsencrypt.org/directory'
    , configDir: require('os').homedir() + '/letsencrypt/etc'
    , approveDomains: function (opts, certs, cb) {
        opts.domains = certs && certs.altnames || opts.domains;
        opts.email = 'soar@stco.tw' // CHANGE ME
        opts.agreeTos = true;

        cb(null, { options: opts, certs: certs });
      }
     , debug: true
    });

    var https = require('spdy');
    var server = https.createServer(le.httpsOptions, le.middleware(app.callback()));
    //console.log(le.httpsOptions);
    server.listen(3000, function () {
        console.log('Listening at https://soar.stco.tw:' + this.address().port);
    });

    var http = require('http');
    var redirectHttps = koa().use(require('koa-sslify')()).callback();
    http.createServer(le.middleware(redirectHttps)).listen(80, function () {
      console.log('handle ACME http-01 challenge and redirect to https');
    });
}
