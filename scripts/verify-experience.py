import urllib.request,urllib.error,json,uuid,concurrent.futures,pathlib,time,subprocess
import os,tempfile
W=pathlib.Path(tempfile.gettempdir())
base=os.environ.get('CAZA_TEST_URL','http://127.0.0.1:18081/api').rstrip('/')
if urllib.parse.urlparse(base).hostname not in ('localhost','127.0.0.1'):
 raise SystemExit('Solo se permiten servidores locales de prueba.')
pw=os.environ['CAZA_TEST_ADMIN_PASSWORD']
results=[]
def call(method,path,data=None,token=None,status=200,headers=None):
 h={'Content-Type':'application/json',**(headers or {})}
 if token:h['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers=h,method=method)
 try:
  with urllib.request.urlopen(req,timeout=45) as r:code=r.status;body=r.read()
 except urllib.error.HTTPError as e:code=e.code;body=e.read()
 if status is not None:assert code==status,(method,path,code,body[:800])
 results.append(f'{method} {path}: {code}')
 return code,json.loads(body) if body else {}
def api(method,path,data=None,token=None,status=200,headers=None):return call(method,path,data,token,status,headers)[1].get('data')
for attempt in range(30):
 try:call('GET','/health');break
 except Exception:
  if attempt==29:raise
  time.sleep(1)
admin=api('POST','/auth/login',{'correo':os.environ.get('CAZA_TEST_ADMIN_EMAIL','admin@caza.com'),'password':pw})['accessToken']
user=api('POST','/auth/login',{'correo':os.environ['CAZA_TEST_USER_EMAIL'],'password':os.environ['CAZA_TEST_USER_PASSWORD']})['accessToken']
other=api('POST','/auth/login',{'correo':os.environ['CAZA_TEST_OTHER_EMAIL'],'password':os.environ['CAZA_TEST_OTHER_PASSWORD']})['accessToken']
call('GET','/admin/audit',token=user,status=403)
call('GET','/admin/audit',status=401)
call('GET','/admin/archive',token=user,status=403)
tag=str(uuid.uuid4())[:8]
jpayload={'nombre':'QA '+tag,'goles':7,'asistencias':3,'partidos':9,'precio':0,'hologramUrl':'https://example.com/sample.png'}
j=api('POST','/jugadores',jpayload,admin,status=201);jid=j['id'];assert j['precio']==0 and j['hologramUrl'].endswith('sample.png')
jpayload['goles']=12
api('PUT',f'/jugadores/{jid}',jpayload,admin)
audit=api('GET',f'/admin/audit?player=QA%20{tag}',token=admin)
assert any(r['field_name']=='goles' and r['old_value']=='7' and r['new_value']=='12' for r in audit['content'])
assert not any(r['field_name']=='precio' and r['action']=='ACTUALIZAR' for r in audit['content'])
call('PUT',f'/jugadores/{jid}',{**jpayload,'hologramUrl':'javascript:alert(1)'},admin,status=400)
fifa={'nombre':'FIFA QA '+tag,'nacionalidad':'Perú','posicion':'DELANTERO','edad':25,'precio':100,'imagenUrl':'','hologramUrl':'','initialStats':{'temporada':'2026','goles':5,'asistencias':2,'partidosJugados':7}}
f=api('POST','/players',fifa,admin,status=201);fid=f['id'];assert len(f['stats'])==1
bundle={'player':{**fifa,'nombre':'FIFA edit '+tag},'seasons':[{'id':f['stats'][0]['id'],'values':{**fifa['initialStats'],'goles':10}}]}
f=api('PUT',f'/admin/players/{fid}',bundle,admin);assert f['stats'][0]['goles']==10
before_audit=api('GET','/admin/audit',token=admin)['totalElements']
bad={'player':{**fifa,'nombre':'MUST ROLLBACK'},'seasons':[{'id':999999999,'values':fifa['initialStats']}]}
call('PUT',f'/admin/players/{fid}',bad,admin,status=404)
assert api('GET',f'/players/{fid}')['nombre']=='FIFA edit '+tag
assert api('GET','/admin/audit',token=admin)['totalElements']==before_audit
api('DELETE',f'/jugadores/{jid}',token=admin)
call('GET',f'/jugadores/{jid}',status=404)
call('POST','/cart',{'jugadorId':jid,'cantidad':1},user,status=404)
arch=api('GET','/admin/archive',token=admin);assert any(r['id']==jid and r['game']=='EFOOTBALL' for r in arch)
api('POST',f'/admin/archive/EFOOTBALL/{jid}/restore',token=admin)
assert api('GET',f'/jugadores/{jid}')['goles']==12
# Two simultaneous checkout attempts with the same key must produce one purchase/debit.
api('DELETE','/cart',token=user)
api('POST','/cart',{'playerId':fid,'cantidad':2},user)
before=api('GET','/auth/me',token=user)['saldo']
key=str(uuid.uuid4())
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 purchases=list(pool.map(lambda _:api('POST','/purchases/checkout',token=user,status=201,headers={'Idempotency-Key':key}),range(2)))
assert purchases[0]['id']==purchases[1]['id']
assert api('GET','/auth/me',token=user)['saldo']==before-200
assert api('GET',f'/purchases/requests/{key}',token=user)['id']==purchases[0]['id']
call('GET',f'/purchases/requests/{key}',token=other,status=404)
lid=str(uuid.uuid4())
draft={'name':'QA team','gameType':'FIFA','teamMode':'POTENCIAL','formationKey':'4-3-3','lineup':{'0':{'id':fid,'nombre':'QA'},'11':{'id':1,'nombre':'Suplente'}}}
body={'name':'QA team','payload':json.dumps(draft),'version':None}
lineup=api('PUT',f'/lineups/{lid}',body,user);assert lineup['version']==0
assert any(x['id']==lid for x in api('GET','/lineups',token=user))
assert not any(x['id']==lid for x in api('GET','/lineups',token=other))
call('PUT',f'/lineups/{lid}',{**body,'version':0},other,status=409)
body['version']=0
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 responses=list(pool.map(lambda n:call('PUT',f'/lineups/{lid}',{**body,'name':f'Changed {n}'},user,status=None),range(2)))
assert sorted(r[0] for r in responses)==[200,409],responses
call('DELETE',f'/lineups/{lid}?version=0',token=user,status=409)
api('DELETE',f'/lineups/{lid}?version=1',token=user)
logs=api('GET','/admin/audit?size=200',token=admin)
assert all(r['field_name'] not in ['password','accessToken','secret'] for r in logs['content'])
assert any(r['entity_type']=='Lineup' for r in logs['content'])
assert any(r['entity_type']=='Purchase' for r in logs['content'])
assert any(r['field_name']=='saldo' for r in logs['content'])
call('GET','/admin/audit?from=invalid',token=admin,status=400)
thread=api('POST','/forum/threads',{'titulo':'QA report '+tag,'descripcion':'Auditoría de prueba'},user,status=201)
post=api('POST',f"/forum/threads/{thread['id']}/posts",{'contenido':'Prueba de auditoría'},user,status=201)
api('PUT',f"/forum/posts/{post['id']}",{'contenido':'Contenido modificado'},user)
comment=api('POST',f'/players/{fid}/comments',{'contenido':'Comentario de prueba','rating':4},user,status=201)
meeting=api('POST','/meetings',{'tema':'QA meeting '+tag,'url':'https://example.com/test','fechaInicio':'2027-01-01T12:00:00','fechaFin':'2027-01-01T13:00:00'},user,status=201)
saldo=api('POST','/saldo-requests',{'montoSolicitado':20,'mensaje':'QA audit'},user,status=201)
api('PUT',f"/saldo-requests/{saldo['id']}/aprobar",token=admin)
api('DELETE',f"/forum/posts/{post['id']}",token=user)
api('DELETE',f"/forum/threads/{thread['id']}",token=user)
api('DELETE',f"/comments/{comment['id']}",token=user)
api('DELETE',f"/meetings/{meeting['id']}",token=user)
all_logs=api('GET','/admin/audit?size=200',token=admin)['content']
assert {'ForumThread','ForumPost','Comment','Meeting','SaldoRequest'}.issubset({r['entity_type'] for r in all_logs})
assert any(r['field_name']=='montoSolicitado' and r['new_value'] in ('20','20.00') for r in all_logs)
api('DELETE',f'/players/{fid}',token=admin)
api('DELETE',f'/jugadores/{jid}',token=admin)
(W/'upgrade-test-results.txt').write_text('\n'.join(results)+'\nALL ASSERTIONS PASSED\n',encoding='utf-8')
print(f'PASS: {len(results)} HTTP requests; audit, rollback, archive/restore, idempotency, ownership and optimistic concurrency.')
