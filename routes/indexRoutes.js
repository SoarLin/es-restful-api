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

var indexExists = function (indexName) {
    return es.client.indices.exists({
        index: indexName
    });
};

var deleteIndex = function (indexName) {
    return es.client.indices.delete({
        index: indexName
    });
};

module.exports.createIndex = function *(index) {
    var result = {create: 'pendding'};
    var bodyIndex = blogs_index;
    var index = (index === undefined) ? 'blogs' : index;

    if (this.request.type) {
        var postedData = yield parse(this);
        bodyIndex = (postedData.mappings) ? postedData : blogs_index;
    }

    if (indexExists(index)) {
        console.log("{index = " + index + "} already exists, delete it!");
        deleteIndex(index);
    }

    yield es.client.indices.create({
        index: index,
        body: bodyIndex
    }).then(function(res) {
        if (res.acknowledged === true) {
            result = {create: 'success', index: index, type: Object.keys(bodyIndex.mappings)[0]};
        } else {
            result = {create: 'fail'};
        }
    }, function(error) {
        console.trace(error.message);
    });

    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
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
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
}