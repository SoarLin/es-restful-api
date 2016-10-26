var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: [{
        type: 'stdio',
        levels: ['error', 'warning']
    }]
});

module.exports.client = client;