// const level = require("level-rocksdb");

// const keywordsDB = level("./db/keywords.db");
// const maindataDB = level("./db/main_data.db");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";



const test_return = [{
  '_id': '0',
  'page_title': 'page_title1',
  'url': "http://a.b.com",
  'last_modification_date': '2019-01-02',
  'size_of_page': 12,
  'keywords': [
    {'keyword': 'note', 'tf': 14, 'pos': [0, 1]},
    {'keyword': 'project', 'tf': 2, 'pos': [1,2,3]}
  ],
  'parent_links': ['aparent', 'bparent'],
  'child_links': ['achild', 'bchild']
},{
  '_id': '1',
  'page_title': 'page_title2',
  'url': "c.d.net",
  'last_modification_date': '2099-01-02',
  'size_of_page': 123,
  'keywords': [
    {'keyword': 'ddd', 'tf': 4, 'pos': [4,5,6]},
    {'keyword': 'ccc', 'tf': 6, 'pos': [8,9]}
  ],
  'parent_links': ['ccparent', 'ddparent'],
  'child_links': ['ccchild', 'ddchild']
}]

export function searchEngine(query_raw){
//   fetch("http://localhost:8000/doc/1+2", {
//   method: "GET",
// }).then(response => response.json())
//   .then(response => console.log(response))
//   .catch(e => console.error("TODO handle error " + e));
  return test_return;
}