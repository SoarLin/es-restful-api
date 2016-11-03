var koa = require('koa');
var route = require('koa-route');
var app = module.exports = koa();
var path = require('path');
var serve = require('koa-static');

app.use(serve(path.join(__dirname, '/public')));

// Create Index,Type && Delete whole Indeies
var indexRoutes = require('./routes/indexRoutes');
app.use(route.post('/create/:index/:type', indexRoutes.createIndex));
app.use(route.post('/delete/:index', indexRoutes.deleteIndex));

// Update Documents to index/type
var updateRoutes = require('./routes/updateRoutes');
app.use(route.get('/update/', updateRoutes.getUpdate));
app.use(route.post('/update/', updateRoutes.postUpdate));

// Search
var searchRoutes = require('./routes/searchRoutes');
app.use(route.post('/search/:index/:type', searchRoutes.postSearch));

// Start app up
app.listen(3000);
console.log('The app is listening on port 3000.');
