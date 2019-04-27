import rocksdb
db1 = rocksdb.DB("main_data.db",rocksdb.Options(create_if_missing=True))
db2 = rocksdb.DB("keywords.db",rocksdb.Options(create_if_missing=True))
n=0
word_start_id = 0
while 1:
	if db1.get(str(n)) is None:
		break
	temp = eval(db1.get(str(n)))
	for keyword in list(temp['keywords'].keys()):
		print(keyword,db2.get(keyword))
		if db2.get(keyword) is None:
			db2.put(keyword,str({'df':1,'pos':{str(n):temp['keywords'][keyword]['pos']}}))
		else:
			temp2 = eval(db2.get(keyword))
			tempdic = temp2['pos']
			tempdic[str(n)] = temp['keywords'][keyword]['pos']
			db2.put(keyword,str({'df':temp2['df']+1,'pos':tempdic}))
	n+=1
		
n-=1
print('done')

import pymongo
import ast
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['main_data']

db.keywords.drop()
it2 = db2.iterkeys()
it2.seek_to_first()
for i in list(it2):
    value = ast.literal_eval(db2.get(i).decode("utf-8"))
    value["_id"] = i.decode("utf-8")
    db.keywords.insert_one(value)