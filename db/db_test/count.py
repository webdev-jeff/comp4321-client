# import rocksdb
# db = rocksdb.DB("main_data.db",rocksdb.Options(create_if_missing=True))
# db2 = rocksdb.DB("keywords.db",rocksdb.Options(create_if_missing=True))
import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['main_data']


n=0
word_start_id = 0
while 1:
	if db.page_info.find({"_id": str(n)}).limit(1).count() == 0:
		break
	s = db.page_info.aggregate([{"$match": {"_id": str(n)}}, {"$project": {"keywords":1}}, {"$unwind": "$keywords"}, {"$project": {"kw": "$keywords.keyword", "pos":"$keywords.pos"}}])
	keywords = {i['kw']:i['pos'] for i in s}
	for keyword in keywords.keys():
		print(keyword,db2.get(keyword))
		if db.page_info.find({"_id": keyword}).limit(1).count() == 0:
			
			db2.put(keyword,str({'df':1,'pos':{str(n):keywords[keyword]['pos']}}))
		else:
			temp2 = eval(db2.get(keyword))
			tempdic = temp2['pos']
			tempdic[str(n)] = keywords[keyword]['pos']
			db2.put(keyword,str({'df':temp2['df']+1,'pos':tempdic}))
	n+=1
		
n-=1
print('done')
