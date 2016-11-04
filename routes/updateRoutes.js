var render = require('./../lib/render');
var parse = require('co-busboy');
var jsonfile = require('jsonfile');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Promise = require('promise');

var es = require('./../lib/es');

var INDEX = 'blogs', TYPE = 'article';
var RESULT = { update: 'pendding'};
var file_path = '/Users/soar/Sites/blog/db.json';
var lastIndexFile = '.es-last-index-time';
var tag_stripper = /(<!--.*?-->|<[^>]*>)/g;

var parse_datetime = function(time_str) {
    var time = new Date(time_str);
    return time.getTime();
};
var get_current_time = function() {
    var rightNow = new Date();
    return rightNow.toISOString();
};


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

var load_valid_articles = function(posts, last_index_time) {
    var articles = [];
    posts.forEach(function(v,i) {
        // console.log('last_index_time = '+last_index_time);
        // console.log('post date time = '+parse_datetime(v.date));
        if( parse_datetime(v.updated) > last_index_time) {
            articles.push(v);
        }
    });
    console.log("find valid articles: " + articles.length);
    return articles;
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
            "index" : {
                "_index": index,
                "_type": type,
                "_id": (categories.length > 0) ? categories[0]+"."+ v.slug : v.slug,
            }
        });
        actions.push({
            "title": v.title,
            "categories": categories,
            "tags": tags,
            "date": parse_datetime(v.date),
            "updated": parse_datetime(v.updated),
            "content": stripped_content,
            "path": art_path,
            "excerpt": "\n"
        });
    });

    // console.log(actions);
    return actions;
};

var check_db_json = function(uploadfile) {
    return new Promise(function(resolve, reject){
        console.log('readFile = ' + uploadfile);
        jsonfile.readFile(uploadfile, function(err, obj) {
            if (err) {
                reject({status: 'fail'});
            } else {
                resolve({status: 'ok', obj: obj});
            }
        });
    });
};

var check_last_index_file = function(data) {
    return new Promise(function(resolve, reject){
        fs.access(lastIndexFile, fs.R_OK | fs.W_OK, function(err) {
            if (err) {
                resolve({status: 'fail', obj: data.obj});
            } else {
                resolve({status: 'ok', obj: data.obj });
            }
        });
    });
};

var get_last_index = function(data) {
    return new Promise(function(resolve, reject) {
        var obj = data.obj;

        if (data.status === 'ok') {
            fs.readFile(lastIndexFile, 'utf8', function(err, response) {
                if(err){
                    reject({status: 'fail'});
                } else {
                    resolve({status: 'ok', obj: obj, time: response});
                }
            });
        } else {
            resolve({status: 'fail', obj: obj, time: 0});
        }
    });
};

var bulkArticles = function(data) {
    return new Promise(function(resolve, reject) {
        var last_index_time = 0;
        if( data.status === 'ok') {
            last_index_time = parse_datetime(data.time);
        }
        var actions = extractArticleData(INDEX, TYPE, data.obj, last_index_time);
        if (actions.length > 0) {
            es.client.bulk({
                body: actions
            }, function (err, res){
                // console.log(res.items[0].index.error);
                if (err === undefined || res.items[0].index.error === undefined) {
                    RESULT.update = 'success';
                    resolve({ status: 'ok' });
                } else {
                    reject({ status: 'fail', msg: err });
                }
            });
        } else {
            resolve({ status: 'done', msg: 'No article need to index!' });
        }
    });
};

var update_last_index_file = function(res) {
    return new Promise(function(resolve, reject) {
        if (res.status === 'ok') {
            console.log('Update index success!!');
            fs.writeFile(lastIndexFile, get_current_time(), function(err){
                if (err) {
                    reject({status: 'fail', msg: err});
                } else {
                    resolve({status: 'ok', msg: 'update last index time!!'});
                }
            });
        } else if (res.status === 'done') {
            resolve({status: 'done', msg: res.msg});
            // console.log(res.msg);
        }
    });
};

module.exports.postUpdate = function *() {
    if ('POST' != this.method) return yield next;

    var parts   = parse(this);
    var tmpfile = path.join(__dirname, '../public/upload/tmpfile');
    var hasUpload = false;
    while (part = yield parts) {
        if (part.length) {
            if (part[0] === 'index') {
                INDEX = part[1];
            } else if (part[0] === 'type') {
                TYPE = part[1];
            }
            console.log(part[0] + ': ' + part[1]);
        } else {
            part.pipe(fs.createWriteStream(tmpfile));
            hasUpload = true;
        }
    }

    if (hasUpload) {
        yield check_db_json(tmpfile)
            .then(check_last_index_file)
            .then(get_last_index)
            .then(bulkArticles)
            .then(update_last_index_file, function(res){console.log(res.msg);})
            .then(function(res){
                if (res.status === 'ok' || res.status === 'done') {
                    console.log(res.msg);
                    RESULT.update = 'success';
                }
            }, function(res){
                console.log(res.msg);
            });
    }
    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = RESULT;
};

module.exports.getUpdate = function *() {
    this.body = yield render('update');
};