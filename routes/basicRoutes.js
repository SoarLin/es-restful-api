var parse = require('co-body');
var render = require('./../lib/render');

module.exports.getIndex = function *() {
    this.body = yield render('index');
};