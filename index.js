var koa = require('koa');
var route = require('koa-route');
var parse = require('co-body');
var moment = require('moment');
var app = module.exports = koa();

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: [{
        type: 'stdio',
        levels: ['error', 'warning']
    }]
});

app.use(route.post('/create/:index/:type', createIndex));
app.use(route.post('/delete/:index', deleteIndex));
app.use(route.post('/update', updateDocument));
app.use(route.get('/search/:keyword', searchKeyword));

function getCurrentUrl(nowUrl) {
    if (nowUrl.indexOf('localhost') > 0) {
        return 'http://localhost:4000/';
    } else {
        return 'https://soarlin.github.io/';
    }
}

function getArticleLink(article) {
    var _id = article._id;
    var title = article._source.title;
    var article_name = _id.substr(_id.indexOf('.')+1);
    var unix_timestamp = article._source.date;
    var publish_date = moment(unix_timestamp * 1000).format('YYYY/MM/DD');
    var link = publish_date + '/' + article_name + '/';

    return { title : title, link: link,
            tags: article._source.tags,
            categories: article._source.categories };
}

function * searchBlogArticla(keyword, size) {
    var size = (size === undefined) ? 5 : size;
    var result = [];

    yield client.search({
        index: 'blogs',
        type: 'article',
        q: keyword,
        size: size
    }).then( function(body) {
        var total = body.hits.total;
        var hitsArray = body.hits.hits;

        if (total > 0) {
            hitsArray.forEach(function(article, i) {
                result.push( getArticleLink(article))
            });
            // console.log(result);
        }
    }, function(error) {
        console.trace(error.message);
    });

    return result;
}

function * searchKeyword(keyword) {
    var size = 5;
    var blogUrl = getCurrentUrl(this.request.origin);

    var result = yield searchBlogArticla(keyword, size);
    // result.forEach(function(v,i){
    //     v.link = blogUrl + v.link;
    // });

    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
}

function * updateDocument() {
    var postedData = yield parse(this);
    this.body = "還不會實作...QQ";
    console.log("還不會實作...QQ");
}

function * deleteIndex(index) {
    var result = {delete: 'pendding'};

    var index = (index === undefined) ? 'blogs' : index;

    yield client.indices.delete({
        index: index,
        ignore: [404]
    }).then(function(body) {
        result = body;
    }, function(error) {
        result = {delete: 'fail'};
        console.error(error.message);
    });

    this.set('Access-Control-Allow-Origin', '*');
    this.body = result;
}

var blogs_index = {
    "settings": {
        "number_of_shards" :   1,
        "number_of_replicas" : 0
    },
    "_default_": {},
    "mappings": {
       "article": {
            "dynamic": false,
            "date_detection": false,
            "_all": {
                  "analyzer": "ik_max_word",
                  "search_analyzer": "ik_smart",
                  "term_vector": "no"
            },
            "properties": {
                "title": {
                    "type": "string" ,
                    "term_vector": "with_positions_offsets",
                    "include_in_all": true,
                    "analyzer": "ik_max_word",
                    "search_analyzer": "ik_smart",
                    "boost": 2
                },
                "slug": {
                    "type": "string",
                    "index": "no"
                },
                "date": {
                    "type": "date",
                    "format": "epoch_second"
                },
                "updated": {
                    "type": "date",
                    "format": "epoch_second"
                },
                "categories": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "tags": {
                    "type": "string",
                    "index": "not_analyzed"
                },
                "content": {
                    "type": "string",
                    "term_vector": "with_positions_offsets",
                    "include_in_all": true,
                    "analyzer": "ik_max_word",
                    "search_analyzer": "ik_smart",
                    "norms": { "enabled": false }
                }
           }
       }
    }
};

function * createIndex(index, type) {
    var postedData = yield parse(this);
    var result = {create: 'pendding'};

    var index = (index === undefined) ? 'blogs' : index;
    var type = (type === undefined) ? 'article' : type;
    var bodyIndex = (postedData.body) ? postedData.body : blogs_index;
    yield client.create({
        index: index,
        type: type,
        body: blogs_index,
    }).then(function(body) {
        if (body.created === true) {
            result = {create: 'success', index: index, type: type};
        } else {
            result = {create: 'fail'};
        }
    }, function(error) {
        console.trace(error.message);
    });

    this.set('Access-Control-Allow-Origin', '*');
    this.body = result;
}

// Start app up
app.listen(3000);
console.log('The app is listening on port 3000.');
