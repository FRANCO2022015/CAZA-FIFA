import json,urllib.request,urllib.parse,os
from pathlib import Path
base=os.environ.get('CAZA_TEST_URL','http://127.0.0.1:18081/api')
assert urllib.parse.urlparse(base).hostname in ('127.0.0.1','localhost'), 'Use only an isolated local test server'
pw=os.environ['CAZA_TEST_PASSWORD']
a=json.load(urllib.request.urlopen(urllib.request.Request(base+'/auth/login',data=json.dumps({'correo':os.environ.get('CAZA_TEST_EMAIL','admin@caza.com'),'password':pw}).encode(),headers={'Content-Type':'application/json'})))['data']
def get(path):return json.load(urllib.request.urlopen(urllib.request.Request(base+path,headers={'Authorization':'Bearer '+a['accessToken']})))['data']
checks=0
for endpoint in ['/players','/players/search','/jugadores','/jugadores/search','/jugadores/search/advanced']:
 for field in ['goles','asistencias']:
  for direction in ['desc','asc']:
   seen=set(); previous=None
   for page in range(100):
    batch=get(endpoint+'?'+urllib.parse.urlencode(dict(page=page,size=7,sortBy=field,sortDir=direction)))
    for p in batch['content']:
     assert p['id'] not in seen,(endpoint,'duplicate',p['id']);seen.add(p['id'])
     value=sum(x[field] for x in p.get('stats',[])) if endpoint.startswith('/players') else p[field]
     key=((-value if direction=='desc' else value),p['id'])
     assert previous is None or previous<=key,(endpoint,previous,key)
     previous=key
    if batch['last']:break
   checks+=1
print('PASS',checks,'real PostgreSQL traversals: goals/assists, both directions, all search routes; no repeated IDs and stable ties.')
