"""CAZA migration utilities. Standard library only. Passwords never enter Git.
Set PGHOST, PGPORT, PGUSER, PGDATABASE and PGSSLMODE; use --pg-bin on Windows.
Restore refuses any nonempty public schema. Images generates SQL, never applies it.
"""
import argparse, csv, getpass, hashlib, json, os, pathlib, re, shutil, subprocess, sys, time
import urllib.request, urllib.parse

def pg(name):
    return str(pathlib.Path(args.pg_bin)/(name+'.exe' if os.name=='nt' else name)) if args.pg_bin else name

def run(name, *params):
    p=subprocess.run([pg(name),*params],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if p.returncode: raise RuntimeError(f'{name} failed: {p.stderr}')
    return p.stdout

def sql(query):
    return run('psql','-X','-A','-t','-v','ON_ERROR_STOP=1','-c',query).strip()

def password():
    for k in ('PGHOST','PGUSER','PGDATABASE'):
        if not os.getenv(k): raise ValueError(f'Set {k} first')
    if not os.getenv('PGPASSWORD'): os.environ['PGPASSWORD']=getpass.getpass('PostgreSQL password: ')

def fingerprints():
    tables=sql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").splitlines()
    out={}
    for t in tables:
        quoted='"'+t.replace('"','""')+'"'
        out[t]=sql(f"SELECT count(*) || '|' || md5(coalesce(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),'')) FROM public.{quoted} t")
    return out

def backup():
    password(); dest=pathlib.Path(args.output); dest.mkdir(parents=True,exist_ok=False)
    run('pg_dump','-Fc','-f',str(dest/'database.dump'))
    run('pg_dump','--schema-only','-f',str(dest/'schema.sql'))
    (dest/'contents.txt').write_text(run('pg_restore','--list',str(dest/'database.dump')),encoding='utf-8')
    (dest/'fingerprints.json').write_text(json.dumps(fingerprints(),indent=2),encoding='utf-8')
    query="SELECT 'players' AS tabla,id,imagen_url FROM players UNION ALL SELECT 'jugadores',id,imagen_url FROM jugadores ORDER BY tabla,id"
    (dest/'images.csv').write_text(run('psql','-X','--csv','-c',query),encoding='utf-8')
    shutil.copytree(args.uploads,dest/'uploads')
    hashes={str(p.relative_to(dest)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dest.rglob('*') if p.is_file()}
    (dest/'sha256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
    print('Backup complete. Stop application writes during backup; verify a restore before use.')

def restore():
    password()
    if sql("SELECT count(*) FROM pg_tables WHERE schemaname='public'")!='0':
        raise ValueError('Target public schema is not empty. Create a separate empty database; nothing was restored.')
    run('pg_restore','--no-owner','--no-acl','--exit-on-error','--single-transaction','-d',os.environ['PGDATABASE'],args.dump)
    print('Restore complete. Run verify before migration-cloud.sql.')

def verify():
    password(); expected=json.loads(pathlib.Path(args.baseline).read_text(encoding='utf-8-sig'))
    actual=fingerprints()
    differences=[k for k in sorted(expected.keys()|actual.keys()) if expected.get(k)!=actual.get(k)]
    if differences: raise ValueError('Content/count mismatch in: '+', '.join(differences))
    print(f'PASS: all {len(actual)} tables match baseline. Compare BEFORE changing image URLs or schema.')

def quote(s): return "'"+s.replace("'","''")+"'"

def images():
    root=pathlib.Path(args.uploads).resolve()
    rows=list(csv.DictReader(pathlib.Path(args.csv).read_text(encoding='utf-8-sig').splitlines()))
    local=[]; external=0
    for r in rows:
        url=r.get('imagen_url','')
        if not url: continue
        parsed=urllib.parse.urlparse(url)
        if '/uploads/players/' not in parsed.path:
            external+=1; continue
        name=urllib.parse.unquote(parsed.path.rsplit('/',1)[-1]); path=(root/name).resolve()
        if path.parent!=root or not path.is_file(): raise ValueError(f'Missing/unsafe image: {name}')
        if r['tabla'] not in ('players','jugadores') or not r['id'].isdigit(): raise ValueError('Invalid image record')
        local.append((r,path))
    print(f'Preflight: {len(local)} local references, {len(set(p for _,p in local))} files, {external} external references unchanged.')
    if not args.upload: return
    cloud=os.getenv('CLOUDINARY_CLOUD_NAME') or input('Cloudinary cloud name: ').strip()
    key=os.getenv('CLOUDINARY_API_KEY') or getpass.getpass('Cloudinary API key: ')
    secret=os.getenv('CLOUDINARY_API_SECRET') or getpass.getpass('Cloudinary API secret: ')
    if not re.fullmatch(r'[A-Za-z0-9_-]+',cloud): raise ValueError('Invalid cloud name')
    out=pathlib.Path(args.output); out.mkdir(parents=True,exist_ok=True)
    journal=out/'image-manifest.json'
    manifest=json.loads(journal.read_text()) if journal.exists() else {}
    updates=[]; reverse=[]
    for r,path in local:
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        identity=cloud+':'+digest
        if identity not in manifest:
            timestamp=str(int(time.time()))
            fields={'public_id':'caza/migration/'+digest,'timestamp':timestamp,'overwrite':'false'}
            signed='&'.join(k+'='+fields[k] for k in sorted(fields))
            fields.update(api_key=key,signature=hashlib.sha1((signed+secret).encode()).hexdigest())
            boundary='CAZA'+os.urandom(12).hex()
            body=b''
            for k,v in fields.items(): body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
            body+=f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{path.name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()+path.read_bytes()+f'\r\n--{boundary}--\r\n'.encode()
            req=urllib.request.Request(f'https://api.cloudinary.com/v1_1/{cloud}/image/upload',data=body,headers={'Content-Type':'multipart/form-data; boundary='+boundary})
            with urllib.request.urlopen(req,timeout=90) as response: data=json.load(response)
            url=data['secure_url']
            if not url.startswith('https://res.cloudinary.com/'): raise ValueError('Unexpected image URL')
            manifest[identity]={'file':path.name,'sha256':digest,'url':url,'public_id':data['public_id']}
            temporary=journal.with_suffix('.tmp'); temporary.write_text(json.dumps(manifest,indent=2),encoding='utf-8'); temporary.replace(journal)
        url=manifest[identity]['url']
        # Confirm URL is available before emitting a DB change.
        with urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=30) as response:
            if not response.headers.get('Content-Type','').startswith('image/'): raise ValueError('URL is not an image')
        table=r['tabla']; rid=r['id']; old=r['imagen_url']
        updates.append(f"DO $$ BEGIN UPDATE public.{table} SET imagen_url={quote(url)} WHERE id={rid} AND imagen_url={quote(old)}; IF NOT FOUND THEN RAISE EXCEPTION 'Image mapping mismatch: {table}/{rid}'; END IF; END $$;")
        reverse.append(f"UPDATE public.{table} SET imagen_url={quote(old)} WHERE id={rid} AND imagen_url={quote(url)};")
    (out/'apply-images.sql').write_text('BEGIN;\n'+'\n'.join(updates)+'\nCOMMIT;\n',encoding='utf-8')
    (out/'rollback-images.sql').write_text('BEGIN;\n'+'\n'.join(reverse)+'\nCOMMIT;\n',encoding='utf-8')
    mapping={r['imagen_url']:manifest[cloud+':'+hashlib.sha256(p.read_bytes()).hexdigest()]['url'] for r,p in local}
    (out/'image-url-map.json').write_text(json.dumps(mapping,indent=2),encoding='utf-8')
    print('Uploads verified. SQL and URL map generated; database NOT changed. Apply only to your restored cloud database.')

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pg-bin',default='')
commands=parser.add_subparsers(dest='command',required=True)
p=commands.add_parser('backup');p.add_argument('--output',required=True);p.add_argument('--uploads',required=True)
p=commands.add_parser('restore');p.add_argument('--dump',required=True)
p=commands.add_parser('verify');p.add_argument('--baseline',required=True)
p=commands.add_parser('images');p.add_argument('--csv',required=True);p.add_argument('--uploads',required=True);p.add_argument('--upload',action='store_true');p.add_argument('--output',default='migration-private/images')
args=parser.parse_args()
try: globals()[args.command]()
except Exception as e: print('ERROR:',e,file=sys.stderr);sys.exit(1)
