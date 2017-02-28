RESTful API for ElasticSearch
===============================

這專案是提供給透過 HEXO 產生 Blog 靜態頁面後，可以將 db.json 檔案丟到 ElasticSearch Server 上建立文章索引，然後再透過搜尋 API 來檢索資料，基本上只有我自己能使用

請將下方所有 ELASTICSEARCH_IP 替換成自己 server ip

# Before

## 1. create .env file

因為預設環境名稱是我自己的名字(soar)，正式環境為 `production` ，但是正式環境還需要有 Domain name、使用 443 port 連線以及申請 SSL 憑證，所以還是先以測試環境使用就好

````
echo 'APP_ENV=soar' > .env
````
## 2. install node modules

````
npm install
````
## 3. create upload folder
上傳的檔案會放到 public/upload 目錄下，所以須建立該目錄，更新 git resposity 後，應該可以省略這個步驟

````
mkdir -p public/upload
````

## 4. 產生 .es-last-index-time
用來記錄最後一次更新的時間，避免已經建立過的文章重複建立 index，第一次可以不用建立，會再 update index 後自動建立檔案


# Seart Server
基本啟動

````
node index.js
````

### 較好的替代方案
使用 pm2 來背景執行

````
# 安裝 PM2
sudo npm install -g pm2

# 使用 PM2 啟動 index.js
sudo pm2 start index.js
````

# 基本API指令 

## Create Index

````
HTTP Method : POST
http://ELASTICSEARCH_IP:3000/:index
````

## Delete Index

````
HTTP Method : POST
http://ELASTICSEARCH_IP:3000/:index
````

## Update URL

````
HTTP Method : GET
http://ELASTICSEARCH_IP:3000/update
````

upload `db.json` which create by `hexo generate`, but remember to set the right `index` and `type` name

![Reference Image](https://i.imgur.com/2wFmH1N.png)

正確回傳：(請注意 server 是否有錯誤訊息噴出)

````
{
	update: "success"
}
````

## Search API

````
HTTP Method : POST
http://ELASTICSEARCH_IP:3000/search/:index/:type

Content-Type: application/x-www-form-urlencoded
keyword={keyword}&size={size}
````


# Server 端參考指令

## check elasticsearch

````
curl localhost:9200
````

## list all index

````
curl localhost:9200/_cat/indices?v
````

## list all types in index

````
curl -XGET 'http://localhost:9200/INDEX_NAME/_mapping?pretty'
````

## put mapping date to index
記得替換掉 -d 後方的 json 資料

````
curl -X PUT 'localhost:9200/INDEX_NAME/' -d '{
  "mappings": {
    "user": {
      "properties": {
        "name": {
          "properties": {
            "first": {
              "type": "text"
            }
          }
        },
        "user_id": {
          "type": "keyword"
        }
      }
    }
  }
}'; echo 
````
