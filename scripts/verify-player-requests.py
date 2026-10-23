from safe_inputs import HTTP, local_api_url
import os,json,time,urllib.request,urllib.error,urllib.parse,concurrent.futures
from pathlib import Path
BASE=os.environ.get('CAZA_TEST_URL','http://127.0.0.1:18081/api')
assert urllib.parse.urlparse(BASE).hostname in ('localhost','127.0.0.1'),'Only isolated local servers are allowed'
count=0
def call(method,path,body=None,token=None,status=200):
 global count
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(local_api_url(BASE,path),data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:
  with HTTP.open(req,timeout=30) as res: code=res.status;data=json.load(res)
 except urllib.error.HTTPError as e:
  code=e.code
  try:data=json.load(e)
  except:data={}
 assert code==status,(method,path,code,status,data)
 count+=1
 return data.get('data',data)
pw=os.environ['CAZA_TEST_PASSWORD']
a=call('POST','/auth/login',{'correo':os.environ.get('CAZA_TEST_EMAIL','admin@caza.com'),'password':pw})['accessToken']
suffix=str(time.time_ns()); userpw='Local-requests-test-2026'
u=call('POST','/auth/register',{'nombre':'Proponente QA','correo':f'proposal-{suffix}@example.test','password':userpw},status=201)['accessToken']
u2=call('POST','/auth/register',{'nombre':'Otro QA','correo':f'other-{suffix}@example.test','password':userpw},status=201)['accessToken']
efbody={'nombre':'QA solicitud '+suffix,'goles':18,'asistencias':5,'partidos':40,'precio':100}
e=call('POST','/jugadores',efbody,a,201)
fbody={'nombre':'QA FIFA '+suffix,'nacionalidad':'Peru','posicion':'DELANTERO','edad':25,'precio':100,'initialStats':{'temporada':'2026','goles':12,'asistencias':3,'partidosJugados':20}}
f=call('POST','/players',fbody,a,201);sid=f['stats'][0]['id']
for method,path,body in [('POST','/players',fbody),('POST','/jugadores',efbody),('PUT',f"/jugadores/{e['id']}",efbody),('PUT',f"/players/{f['id']}",fbody),('PATCH',f"/players/{f['id']}/imagen",{'imagenUrl':'https://example.com/photo.png'}),('POST',f"/players/{f['id']}/stats",fbody['initialStats']),('PUT',f"/players/{f['id']}/stats/{sid}",fbody['initialStats']),('DELETE',f"/players/{f['id']}/stats/{sid}",None),('DELETE',f"/jugadores/{e['id']}",None)]:call(method,path,body,u,403)
call('GET','/player-change-requests',status=401)
def proposal(changes,game='EFOOTBALL',pid=None,stats=None):return {'game':game,'playerId':pid or e['id'],'statsId':stats,'changes':changes,'reason':'Correccion validada en registros de prueba'}
for changes in [{'goles':'-1'},{'rol':'ADMIN'},{'precio':'501'},{'goles':'1.5'},{'imagenUrl':'javascript:alert(1)'},{'goles':'18'}]:call('POST','/player-change-requests',proposal(changes),u,400)
req=call('POST','/player-change-requests',proposal({'goles':'21','nombre':efbody['nombre']+' corregido'}),u)
assert call('GET',f"/jugadores/{e['id']}")['goles']==18
call('POST','/player-change-requests',proposal({'goles':'22'}),u,409)
assert all(r['id']!=req['id'] for r in call('GET','/player-change-requests',token=u2)['content'])
call('POST',f"/player-change-requests/{req['id']}/resolve",{'approve':True},u,403)
def approve():
 try:return call('POST',f"/player-change-requests/{req['id']}/resolve",{'approve':True,'note':'Revisado QA'},a)['status']
 except AssertionError as err:
  assert err.args[0][2]==409;return 'CONFLICT'
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda _:approve(),range(2)))
assert sorted(results)==['APROBADA','CONFLICT'],results
assert call('GET',f"/jugadores/{e['id']}")['goles']==21
req2=call('POST','/player-change-requests',proposal({'goles':'25'}),u)
call('POST',f"/player-change-requests/{req2['id']}/resolve",{'approve':False,'note':'No corresponde'},a)
assert call('GET',f"/jugadores/{e['id']}")['goles']==21
req3=call('POST','/player-change-requests',proposal({'goles':'30'}),u)
call('PUT',f"/jugadores/{e['id']}",{**efbody,'goles':22},a)
call('POST',f"/player-change-requests/{req3['id']}/resolve",{'approve':True},a,409)
assert call('GET',f"/jugadores/{e['id']}")['goles']==22
req4=call('POST','/player-change-requests',proposal({'goles':'15','asistencias':'6'},'FIFA',f['id'],sid),u)
call('POST',f"/player-change-requests/{req4['id']}/resolve",{'approve':True},a)
assert call('GET',f"/players/{f['id']}")['stats'][0]['goles']==15
call('POST','/player-change-requests',proposal({'goles':'99'},'FIFA',f['id'],sid+99999),u,400)
rows=call('GET','/admin/audit?size=200&player='+urllib.parse.quote(efbody['nombre']),token=a)['content']
assert any(x['field_name']=='reviewerName' for x in rows)
assert any(x['field_name']=='requesterName' for x in rows)
assert any(x['field_name']=='goles' and x['new_value']=='21' for x in rows)
call('GET','/admin/audit',token=u,status=403)
call('GET','/player-change-requests/pending-count',token=u)
call('DELETE',f"/jugadores/{e['id']}",token=a)
call('POST',f"/player-change-requests/{req3['id']}/resolve",{'approve':True},a,409)
call('POST',f"/player-change-requests/{req3['id']}/resolve",{'approve':False},a)
call('DELETE',f"/players/{f['id']}",token=a)
print('PASS:',count,'HTTP checks; role isolation, validation, concurrent approval, stale conflict, rejection, FIFA season and audit attribution.')
