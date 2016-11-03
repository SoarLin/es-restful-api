var views = require('co-view');

module.exports = views(__dirname + './../views', {
    map: { html: 'swig' }
});