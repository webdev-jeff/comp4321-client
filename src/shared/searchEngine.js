import { server_link } from "./server_link";
// const server_link = "http://2ca6c744.ngrok.io";
const test_return = [
  {
    _id: "0",
    page_title: "page_title1",
    url: "http://a.b.com",
    last_modification_date: "2019-01-02",
    size_of_page: 12,
    keywords: [
      { keyword: "note", tf: 14, pos: [0, 1] },
      { keyword: "project", tf: 2, pos: [1, 2, 3] }
    ],
    parent_links: ["aparent", "bparent"],
    child_links: ["achild", "bchild"]
  },
  {
    _id: "1",
    page_title: "page_title2",
    url: "c.d.net",
    last_modification_date: "2099-01-02",
    size_of_page: 123,
    keywords: [
      { keyword: "ddd", tf: 4, pos: [4, 5, 6] },
      { keyword: "ccc", tf: 6, pos: [8, 9] }
    ],
    parent_links: ["ccparent", "ddparent"],
    child_links: ["ccchild", "ddchild"]
  }
];

// export function searchEngine(query_raw){
// //   fetch("http://localhost:8000/doc/1+2", {
// //   method: "GET",
// // }).then(response => response.json())
// //   .then(response => console.log(response))
// //   .catch(e => console.error("TODO handle error " + e));
//   return test_return;
// }

const fetch = require("node-fetch");
const stemmer = require("stemmer");

let N; // num_documnents
let docs;
let rank;
let top_id_list;
let top_N = 50;
// var query = ["research", "step", "in"];
let startTime = Date.now();

function contain(doc, item) {
  let keywords = doc.keywords;
  for (let i = 0; i < keywords.length; i++) {
    if (keywords[i].keyword === item) {
      return true;
    }
  }
  return false;
}

function contain_in_title(doc, item) {
  let title = doc.toLowerCase();
  item = item.toLowerCase();
  let words = title.split(" ");
  //console.log(words);
  for (let i = 0; i < words.length; i++) {
    if (item === words[i]) {
      return true;
    }
  }
  return false;
}

function calculate_idf(item) {
  let count = 0;
  for (let i = 0; i < N; i++) {
    if (contain(docs[i], item)) {
      count += 1;
    }
  }
  //console.log(count);
  return Math.log(N / count) / Math.log(2);
}

function tf_in_document(doc, item) {
  //var normalize_factor = 0;
  const keywords = doc.keywords;
  // fetch keywords of specific doc
  let sum = 0;
  let tf_raw = 0;
  for (let i = 0; i < keywords.length; i++) {
    sum += keywords[i].tf * keywords[i].tf;
    if (keywords[i].keyword === item) {
      tf_raw = keywords[i].tf;
    }
  }
  sum = Math.sqrt(sum);
  return sum > 0 ? tf_raw / sum : 0;
}

function isPhrase(item) {
  return item.charAt(0) === '"' || item.charAt(0) === "'";
}

/**
 * Calculate the tfidf value for a phrase
 * @param phrase, eg: "hong kong"
 * @returns {Promise<Map<any, any> | void>}, docID => tfidf_{doc, phrase}
 */
async function phrase_tfidf(phrase) {
  let terms = phrase.split('"')[1].split(/\s+/i);
  let phrasePosMap = terms.map(t => {
    return fetch(server_link + "/term/" + t, {
      method: "GET"
    })
      .then(response => response.json())
      .then(response => {
        return response[0].pos;
      })
      .catch(e =>
        console.error("TODO handle error in function phrase_tfidf " + e)
      );
  });

  return Promise.all(phrasePosMap)
    .then(result => {
      return result.map(item => {
        let tmpDict = {};
        item.forEach(entry => {
          tmpDict[entry["doc_id"]] = entry;
        });
        return tmpDict;
      });
    })
    .then(result => {
      let intersectDoc = result.reduce(
        intersectionKeys,
        new Set(Object.keys(result[0]))
      );
      // console.log("intersectDoc: ", intersectDoc);

      let resultObj = {};
      intersectDoc.forEach(d_id => {
        let posEntries = [];
        for (let res of result) {
          posEntries.push(res[d_id]);
        }
        resultObj[d_id] = posEntries;
      });
      return resultObj;
    })
    .then(resultObj => {
      // resultObj is a "map" from document_id => [[pos1], [pos2], [pos3], ...]
      let intersectPos = new Map();
      Object.keys(resultObj).forEach(key => {
        // console.log("resultObj[" + key + "]: ", resultObj[key]);
        let tmpPos = resultObj[key].reduce(
          findPhrasePos,
          elementWiseAdd(resultObj[key][0].pos, -1)
        );
        intersectPos.set(key, tmpPos);
      });
      // console.log("intersectPos: ", intersectPos);
      return intersectPos;
    })
    .then(intersectPos => {
      let doc2tfidf = {};
      for (let i = 0; i < N; i++) {
        let index = i.toString();
        if (intersectPos.has(index)) {
          let sum = 0;
          let tf = intersectPos.get(index).length;
          for (let k of docs[i].keywords) {
            sum += k.tf * k.tf;
          }
          tf = sum > 0 ? tf / sum : 0;
          let idf = Math.log(N / intersectPos.size) / Math.log(2);
          doc2tfidf[i] = tf * idf;
        } else {
          doc2tfidf[i] = 0;
        }
      }
      // console.log("doc2tfidf: ", doc2tfidf);
      return doc2tfidf;
    })
    .catch(e => console.error("TODO handle error in Promise.all " + e));
}

/**
 * Elementwise add a number into an array
 * @param array
 * @param num
 * @returns int[]
 */
function elementWiseAdd(array, num) {
  let tmpArray = [...array];
  for (let i = 0; i < array.length; i++) {
    tmpArray[i] += num;
  }
  return tmpArray;
}

/**
 * The function to be used in "reduce"
 * @param list
 * @param dct, {'keyword':..., 'pos':...}
 * @returns {Array} The pos list of a phrase's last word (in a doc)
 */
function findPhrasePos(list, dct) {
  let list1 = [...list];
  let list2 = [...dct.pos];
  let m = 0;
  let n = 0;
  let tmpPosList = [];
  while (m < list1.length && n < list2.length) {
    if (Number(list1[m]) === Number(list2[n]) - 1) {
      tmpPosList.push(list2[n]);
      m++;
      n++;
    } else if (list1[m] < list2[n] - 1) {
      m++;
    } else if (list1[m] > list2[n] - 1) {
      n++;
    } else {
      console.log("TODO error: intersection.");
    }
  }
  return tmpPosList;
}

/**
 * Find the cooccurence docs of multiple keywords(for phrase)
 * @param set
 * @param obj
 * @returns {Set<T>}
 */
function intersectionKeys(set, obj) {
  // find the cooccurence document id
  return new Set(Object.keys(obj).filter(k => set.has(k)));
}

function stemList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i] = stemmer(list[i]);
  }
  return list;
}

export function searchEngine(query_raw) {
  // function searchEngine(query_raw) {
  console.log("query_raw: ", query_raw);
  let score = [];
  let final_list = [];
  let top_doc_list = [];
  let query_list = query_raw.split('"');
  let phrase_list = [];
  let non_phrase_list = [];
  for (let i = 0; i < query_list.length; i++) {
    if (i % 2 === 0) {
      //0,2,4,...: non-phrase
      non_phrase_list = non_phrase_list
        .concat(stemList(query_list[i].split(/\s+/i)))
        .filter(n => n);
    } else {
      //1,3,...: phrase
      phrase_list.push(
        '"' + stemList(query_list[i].split(/\s+/i)).join(" ") + '"'
      );
    }
  }
  console.log("phrase_list: ", phrase_list);
  console.log("non_phrase_list: ", non_phrase_list);
  let query = non_phrase_list.concat(phrase_list);
  console.log("query after stemming: ", query);
  let x = fetch(server_link + "/all_doc", {
    method: "GET"
    // headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({ message: message })
  })
    .then(response => response.json())
    // .then(response => console.log(response))
    .then(response => {
      // measure the time consuming
      console.log("TIMER: start docs=response ", Date.now() - startTime);
      startTime = Date.now();

      docs = response;
      return response;
    })
    .then(async y => {
      console.log("TIMER: start async y ", Date.now() - startTime);
      startTime = Date.now();

      // prepare the parameters
      N = docs.length;
      console.log("Number of documents: ", N);
      // console.log(a);

      // get started!
      for (let i = 0; i < N; i++) {
        score.push(0);
      }
      // console.log("score before calculating tfidf: ", score);

      //use a map to deal with query loop
      let queryMap = query.map(item => {
        if (isPhrase(item)) {
          //phrase:
          return phrase_tfidf(item).then(tfidfDict => {
            for (let j = 0; j < N; j++) {
              score[j] += tfidfDict[j];
            }
          });
        } else {
          //non-phrase:
          let idf = calculate_idf(item);
          for (let j = 0; j < N; j++) {
            let tf_normalized = tf_in_document(docs[j], item);
            score[j] += idf * tf_normalized;
          }
          return Promise.resolve();
        }
      });

      console.log(
        "TIMER: awaiting promise all queryMap ",
        Date.now() - startTime
      );
      startTime = Date.now();

      //wait for all the queries to be done
      await Promise.all(queryMap);
      // console.log("score before remove NaN: ", score);

      for (let i = 0; i < N; i++) {
        if (isNaN(score[i])) {
          score[i] = 0;
        }
      }

      console.log("TIMER: Printing score ", Date.now() - startTime);
      console.log("score: ", score);

      let id_score = [];
      for (let i = 0; i < N; i++) {
        id_score.push([parseInt(docs[i]._id), score[i]]);
      }
      // console.log(id_score);
      // console.log(score.sort(function(a, b){return b-a}));

      // New(with favoring title matches):
      // Calculate the similarity between the query and page title
      let title_score = [];
      for (let i = 0; i < N; i++) {
        let count = 0;
        for (let j = 0; j < query.length; j++) {
          if (contain_in_title(docs[i].page_title, query[j])) {
            count += 1;
          }
        }
        title_score.push([parseInt(docs[i]._id), docs[i].page_title, count]);
      }

      // Combine the similarity score and page title rank
      for (let i = 0; i < N; i++) {
        final_list.push([
          id_score[i][0],
          title_score[i][1],
          id_score[i][1] + title_score[i][2]
        ]);
      }
      //console.log(final_list);

      final_list.sort(function(a, b) {
        return b[2] - a[2];
      });
      console.log("final_list: ", final_list);

      let top = Math.min(top_N, N);
      let top_final_list = final_list.slice(0, top);

      for (let i = 0; i < top_final_list.length; i++) {
        let index = top_final_list[i][0];
        for (let j = 0; j < N; j++) {
          if (parseInt(docs[j]._id) === index) top_doc_list.push(docs[j]);
        }
      }

      console.log("top_final_list: ", top_doc_list);
      return top_doc_list;

      // // Old(without favoring title matches):
      // rank = id_score.sort(function(a, b) {
      //   return b[1] - a[1];
      // });
      // // console.log(rank);
      // let top = Math.min(top_N, N);
      // // console.log(top_list);
      // let top_id_list = rank.slice(0, top);
      // let top_doc_list = [];
      // for (let i = 0; i < top_id_list.length; i++) {
      //   let index = top_id_list[i][0];
      //   // console.log(index);
      //   top_doc_list.push(docs[index]);
      // }
      // console.log("top_doc_list: ", top_doc_list);
      // return top_doc_list;
    })
    .catch(e =>
      console.error("TODO handle error in function searchEngine " + e)
    );
  return x;
}
// searchEngine('"undergraduate research"');
