import { server_link } from './server_link';
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

// export function searchEngine(query_raw){
// //   fetch("http://localhost:8000/doc/1+2", {
// //   method: "GET",
// // }).then(response => response.json())
// //   .then(response => console.log(response))
// //   .catch(e => console.error("TODO handle error " + e));
//   return test_return;
// }

const fetch = require("node-fetch");

var N; // num_documnents
var docs;
var score = [];
var rank;
var top_N = 50;
var query = ["research", "step", "in"];

function contain(doc, item){
  var keywords = doc.keywords;
  for (var i = 0; i< keywords.length; i++){
    if (keywords[i].keyword == item){
      return true;
    }
  }
  return false;
}

function calculate_idf(item){
  var count = 0;
  for (var i = 0; i < N; i++) {
    if (contain(docs[i],item)){
      count += 1;
      continue;
    }
  }
  //console.log(count);
  return Math.log(N/count)/Math.log(2);
}

function tf_in_document(doc, item){
  //var normalize_factor = 0;
  var keywords = doc.keywords; 
  // fetch keywords of specific doc
  var sum = 0;
  var tf_raw = 0;
  for (var i = 0; i< keywords.length; i++){
    sum += keywords[i].tf * keywords[i].tf;
    if (keywords[i].keyword == item){
      tf_raw = keywords[i].tf;
    }
  }
  sum = Math.sqrt(sum);
  return tf_raw/sum;
}

export function searchEngine(query_raw){
  let query = query_raw.split(' ');
  let x = fetch(server_link + "/all_doc", {
    method: "GET",
    // headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({ message: message })
  }).then(response => response.json())
    // .then(response => console.log(response))
    .then(function(response){
        // console.log(response[0]);
        docs = response;
        // console.log(docs[0].keywords);
        return response;
    })
    .then(function(y){
        // prepare the parameters
        N = docs.length;
        // console.log(a);
        
        // get started!  
        for (var i = 0; i < N; i++){
            score.push(0);
        }
  
        for (let i = 0; i < query.length; i++) {
            let item = query[i];
            // console.log(item);
            let idf = calculate_idf(item);
            // console.log(idf);
            for (let j = 0; j < N; j++){
                let tf_normalized = tf_in_document(docs[j], item);
                // console.log(tf_normalized);
                score[j] += idf*tf_normalized;
            }
    
        }
        for (let i = 0; i < N; i++){
            if (isNaN(score[i])) {
              score[i] = 0;
            }
        }
        // console.log(score);
        var id_score=[];
        for (let i = 0; i < N; i++){
          id_score.push([i, score[i]]);
        }
        // console.log(id_score);
        // console.log(score.sort(function(a, b){return b-a}));
        rank = id_score.sort(function(a, b){return b[1]-a[1]});
        // console.log(rank);
  
        var top = Math.min(top_N, N);
        // console.log(top_list);
        let top_id_list = rank.slice(0,top);
        let top_doc_list = [];
        for (let i = 0; i < top_id_list.length; i++){
          var index = top_id_list[i][0];
          // console.log(index);
          top_doc_list.push(docs[index]);
        }
        return top_doc_list;
    })
    .catch(e => console.error("TODO handle error " + e));
  return x;
}



