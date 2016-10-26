// var parse = require('co-body');
var jsonfile = require('jsonfile')
var es = require('./../lib/es');

module.exports.updateDocument = function *() {
    // var postedData = yield parse(this);
    var result = { update: 'pendding'};
    var file_path = '/Users/soar/Sites/blog/db.json';
    jsonfile.readFile(file_path, function(err, obj) {
        console.log(obj.meta);
    });


    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
};