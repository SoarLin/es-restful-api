var parse = require('co-body');
var es = require('./../lib/es');

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

module.exports.createIndex = function *(index, type) {
    var postedData = yield parse(this);
    var result = {create: 'pendding'};

    var index = (index === undefined) ? 'blogs' : index;
    var type = (type === undefined) ? 'article' : type;
    var bodyIndex = (postedData.body) ? postedData.body : blogs_index;
    yield es.client.create({
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
};

module.exports.deleteIndex = function *(index) {
    var result = {delete: 'pendding'};

    var index = (index === undefined) ? 'blogs' : index;

    yield es.client.indices.delete({
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