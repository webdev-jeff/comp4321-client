import httplib2
import rocksdb
from bs4 import BeautifulSoup
from nltk.stem import PorterStemmer
from nltk.tokenize import sent_tokenize, word_tokenize
import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['main_data']
db.page_info.drop()

import networkx as nx
G = nx.DiGraph()

ps = PorterStemmer()
database_name = "main_data"
# db = rocksdb.DB(database_name+".db",rocksdb.Options(create_if_missing=True))

def scanweb(w):
    status, response = httplib2.Http().request(w)
    soup = BeautifulSoup(response)
    nextlinks = []
    if soup.find('title') is None or len(soup.find('title'))==0:
        ptitle="no title"
    else:
        ptitle = [a for a in soup.find('title')][0]
    if 'last-modified' in status.keys():
        ptime = status['last-modified']
    elif 'date' in status.keys():
        ptime = status['date']
    pcontent = ' '.join([p.text for p in soup.select('p')])
    pcontent = ''.join([k if 'a'<=k<='z' or 'A'<=k<='Z' else ' ' for k in pcontent])
    # print(pcontent)
    for a in soup.find_all('a', href=True):
        if a['href'][:5]=='http:':
            nextlinks+=[a['href']]
        elif len(a['href']) != 0 and a['href'][0]=='/':
            nextlinks+=[w+a['href']]
    tempdic = {}
    for i,word in enumerate(pcontent.split()):
        if tempdic.get(ps.stem(word)):
            tempdic[ps.stem(word)]['tf']+=1
            tempdic[ps.stem(word)]['pos']+=[i]
        else:
            tempdic[ps.stem(word)]={"tf":1,"pos":[i]}
    tempList = []
    for k in tempdic.keys():
        tempListItem = {}
        tempListItem["keyword"] = k
        tempListItem["tf"] = tempdic[k]["tf"]
        tempListItem["pos"] = tempdic[k]["pos"]
        tempList.append(tempListItem)

    return {'page_title':ptitle, 'last_modified':ptime, 'doc_size':len(pcontent.split()), 'doc_url':w, 'next_links':nextlinks, 'keywords':tempList}
    
def rescanweb(w,n=30):
    global startid, mapFromUrlToId, UrlAdjacencyLists
    print(startid, 'scanning :',w)
    # db.put(str(startid),bytes(scanweb(w)))
    # db.put(w,bytes(startid))
    scanResult = scanweb(w)

    UrlAdjacencyLists[str(startid)] = scanResult['next_links']
    mapFromUrlToId[scanResult['doc_url']] = str(startid)
    G.add_node(str(startid))

    scanResult['_id'] = str(startid)
    db.page_info.insert_one(scanResult)
    startid+=1
    if n>1:
        s = db.page_info.find({"_id": str(startid-1)})
        for i in s:
            for j in i['next_links']:
                if db.page_info.find({"doc_url": j}).limit(1).count() == 0:
                    rescanweb(j,n-1)

startid = 0
mapFromUrlToId = {}
UrlAdjacencyLists = {}
rescanweb('http://www.cse.ust.hk',3)    #crawl for 3 layers
for pageId in UrlAdjacencyLists.keys():
    for next_link in UrlAdjacencyLists[pageId]:
        try:
            G.add_edge(pageId, mapFromUrlToId[next_link])
        except:
            # print(pageId, next_link)
            pass
print("done")


