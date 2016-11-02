// var parse = require('co-body');
var jsonfile = require('jsonfile')
var fs = require('fs');
var Promise = require('promise');

var es = require('./../lib/es');

var file_path = '/Users/soar/Sites/blog/db.json';
var lastIndexFile = '.es-last-index-time';
var tag_stripper = /(<!--.*?-->|<[^>]*>)/g;

var parse_datetime = function(time_str) {
    var time = new Date(time_str);
    return time.getTime();
};
var create_recently_time = function() {
    var rightNow = new Date();
    return rightNow.toISOString();
};

var createCategoryMap = function(category) {
    var map = {};
}

var findCategory = function(a_id, post_cats_map, cat_map) {
    var cat_id;
    var categories = [];
    post_cats_map.forEach(function(v,i) {
        if (a_id === v.post_id) {
            cat_id = v.category_id;
            cat_map.forEach(function(v,i) {
                if (cat_id === v._id) {
                    categories.push(v.name);
                }
            });
        }
    });
    return categories;
};

var findTags = function(a_id, post_tags_map, tag_map) {
    var tag_id;
    var tags = [];
    post_tags_map.forEach(function(v,i){
        if (a_id === v.post_id) {
            tag_id = v.tag_id;
            tag_map.forEach(function(v,i){
                if (tag_id === v._id) {
                    tags.push(v.name);
                }
            });
        }
    });
    return tags;
};

var extractArticleData = function(index, type, obj, last_index_time) {
    var category_map = obj.models.Category;
    var tag_map      = obj.models.Tag;
    var articles     = load_valid_articles(obj.models.Post, last_index_time);
    var actions      = [];

    articles.forEach(function(v,i){
        var categories = findCategory(v._id, obj.models.PostCategory, category_map);
        var tags       = findTags(v._id, obj.models.PostTag, tag_map);
        var stripped_content = v._content.replace(tag_stripper, '');
        var art_path = categories[0] + '/' + v.slug + '.html';
        // console.log(art_path);
        actions.push({
            'index' : {
                '_index': index,
                '_type': type,
                '_id': (categories.length > 0) ? categories[0]+'.'+ v.slug : v.slug,
                '_source': {
                    'title': v.title,
                    'categories': categories,
                    'tags': tags,
                    'date': parse_datetime(v.date),
                    'updated': parse_datetime(v.updated),
                    'content': stripped_content,
                    'path': art_path,
                    'excerpt': '\n'
                }
            }
        });
    });

    // console.log(actions);
    return actions;
};

var check_last_index_file = function() {
    return new Promise(function(resolve, reject){
        fs.access(lastIndexFile, fs.R_OK | fs.W_OK, function(err) {
            if (err) {
                reject({status: 'fail'});
            } else {
                resolve({status: 'ok'});
            }
        });
    });
};

var get_last_index = function(data) {
    return new Promise(function(resolve, reject) {
        if (data.status === 'ok') {
            fs.readFile(lastIndexFile, 'utf8', function(err, data) {
                if(err) reject({status: 'fail'});
                else resolve({status: 'ok', data: data});
            });
        } else {
            resolve({status: 'fail'});
        }
    });
};

var load_valid_articles = function(posts, last_index_time) {
    var articles = [];
    posts.forEach(function(v,i) {
        // console.log('last_index_time = '+last_index_time);
        // console.log('post date time = '+parse_datetime(v.date));
        if( parse_datetime(v.updated) > last_index_time) {
            articles.push(v);
        }
    });
    return articles;
}

module.exports.updateDocument = function *(index, type) {
    var index = (index === undefined) ? 'blogs' : index;
    var type = (type === undefined) ? 'article' : type;

    // var postedData = yield parse(this);
    var result = { update: 'pendding'};

    var last_index_time = 0;

    jsonfile.readFile(file_path, function(err, obj) {
        check_last_index_file().then(get_last_index, null)
            .then(function(res) {
                if( res.status === 'ok') {
                    last_index_time = parse_datetime(res.data);
                }
                console.log(last_index_time);
                var actions = extractArticleData(index, type, obj, last_index_time);
                console.log(actions);
                // es.client.bulk({
                //     body: actions
                // }, function (err, res){
                //     console.log(err);
                //     console.log(res);
                // });
            });
    });


    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
};