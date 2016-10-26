var moment = require('moment');
var es = require('./../lib/es');

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

    yield es.client.search({
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

module.exports.searchKeyword = function *(keyword, size) {
    var size = (size === undefined) ? 5 : size;

    var result = yield searchBlogArticla(keyword, size);

    this.set('Access-Control-Allow-Origin', '*');
    this.set('Content-Type', 'application/json;charset=utf-8;');
    this.body = result;
};