import httplib2
import rocksdb
from bs4 import BeautifulSoup
from nltk.stem import PorterStemmer
from nltk.tokenize import sent_tokenize, word_tokenize

ps = PorterStemmer()
database_name = "main_data"
db = rocksdb.DB(database_name+".db",rocksdb.Options(create_if_missing=True))



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
  print(pcontent)
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
  return {'page_title':ptitle, 'last_modified':ptime, 'doc_size':len(pcontent.split()), 'doc_url':w, 'next_links':nextlinks, 'keywords':tempdic}
  
def rescanweb(w,n=30):
  global startid
  print(startid, 'scanning :',w)
  db.put(str(startid),str(scanweb(w)))
  db.put(w,str(startid))
  startid+=1
  if n>1:
    for i in eval(db.get(str(startid-1)))['next_links']:
      if db.get(i) is None:
        rescanweb(i,n-1)
		

startid = 0
rescanweb('http://www.cse.ust.hk',2)	#crawl for 3 layers
print("done")
