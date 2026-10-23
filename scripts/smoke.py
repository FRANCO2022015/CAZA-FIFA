"""Read-only cloud smoke test. Never creates users, purchases or balance changes."""
from safe_inputs import HTTP, cloud_image_url
import argparse, getpass, json, urllib.request, urllib.error
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--api',required=True,help='https://your-backend.onrender.com/api')
p.add_argument('--origin',required=True,help='https://your-frontend.vercel.app')
p.add_argument('--email',help='Optional: login and check your profile/history')
a=p.parse_args();base=a.api.rstrip('/')
def request(path,token=None,data=None):
    headers={'Origin':a.origin,'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    req=urllib.request.Request(base+path,headers=headers,data=json.dumps(data).encode() if data else None)
    with HTTP.open(req,timeout=120) as r:
        assert r.headers.get('Access-Control-Allow-Origin')==a.origin,'CORS origin mismatch'
        return json.load(r)
request('/health'); print('PASS: health/database and CORS')
for kind in ('players','jugadores'):
    page=0;count=0;images=set()
    while True:
        data=request(f'/{kind}?page={page}&size=100')['data']
        for player in data['content']:
            if player.get('imagenUrl'): images.add(player['imagenUrl'])
        count+=len(data['content']);page+=1
        if page>=data['totalPages']:break
    for url in images:
        url=cloud_image_url(url)
        with HTTP.open(urllib.request.Request(url,method='HEAD'),timeout=30) as r:
            assert r.headers.get('Content-Type','').startswith('image/'),'Not an image'
    print(f'PASS: {kind}, {count} records, {len(images)} accessible HTTPS images')
if a.email:
    auth=request('/auth/login',data={'correo':a.email,'password':getpass.getpass('Password: ')})
    token=auth['data']['accessToken']
    request('/auth/me',token);request('/purchases',token)
    print('PASS: login, profile and purchase history')
print('Read-only checks complete. Test the UI separately as explained in the guide.')
