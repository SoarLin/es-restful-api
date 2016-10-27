var koa = require('koa');
var route = require('koa-route');
var app = module.exports = koa();

// Create Index,Type && Delete whole Indeies
var indexRoutes = require('./routes/indexRoutes');
app.use(route.post('/create/:index/:type', indexRoutes.createIndex));
app.use(route.post('/delete/:index', indexRoutes.deleteIndex));

// Update Documents to index/type
var updateRoutes = require('./routes/updateRoutes');
app.use(route.post('/update/:index/:type', updateRoutes.updateDocument));

// Search
var searchRoutes = require('./routes/searchRoutes');
app.use(route.get('/search/:keyword/:size', searchRoutes.searchKeyword));

// Start app up
app.listen(3000);
console.log('The app is listening on port 3000.');
