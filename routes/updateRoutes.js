// var parse = require('co-body');
var jsonfile = require('jsonfile')
var es = require('./../lib/es');


function parse_local_datetime(time_str) {
    var time = new Date(time_str);
    return time.getTime();
}
function create_recently_time() {
    var rightNow = new Date();
    return rightNow.toISOString();
}

function extractArticleData(index, type, obj) {
    // var act;
    // obj.forEach(function(v,i){
    //     act.push({
    //         '_index': index,
    //         '_type': type,
    //         '_op_type': 'index',
    //         '_id': art_path.strip('.html').strip('/').replace('/', '.'),
    //         '_source': {
    //             'title': a['title'],
    //             'date': parse_datetime(a['date']),
    //             'updated': parse_datetime(a['updated']),
    //             'content': stripped_content,
    //             'path': art_path,
    //             'excerpt': a['excerpt'] or '\n'.join(stripped_content.split('\n')[:2])
    //         }
    //     });
    // });
}

function load_category_map(categories) {
    var maps = [];
    categories.forEach(function(v,i){
        maps.push(v.name);
    });
    return maps;
}

module.exports.updateDocument = function *(index, type) {
    var index = (index === undefined) ? 'blogs' : index;
    var type = (type === undefined) ? 'article' : type;

    // var postedData = yield parse(this);
    var result = { update: 'pendding'};
    var file_path = '/Users/soar/Sites/blog/db.json';
    jsonfile.readFile(file_path, function(err, obj) {
        var category_map = load_category_map(obj.models.Category);
        // var posts = extractArticleData(index, type, obj.models.Post)
        // var tmp = obj.models.Post;
        console.log(category_map);
    });

    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
};