const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('assert');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
const context=await browser.newContext();
const user={id:1,nombre:'Test',correo:'test@test.local',rol:'ADMIN',saldo:10000,activo:true};
await context.addInitScript(user=>{localStorage.setItem('caza_token','test');localStorage.setItem('caza_user',JSON.stringify(user));},user);
const requests=[];
await context.route('**/api/**',async route=>{
 const u=new URL(route.request().url()); const path=u.pathname; if(path.startsWith('/src/')) return route.continue(); requests.push(u);
 let data;
 const row=id=>({id,nombre:'Jugador '+id,precio:500,activo:true,nacionalidad:'Peru',posicion:'DELANTERO',edad:25,goles:200-id,asistencias:4,partidos:230,ga:204-id,pg:0.5,pa:0.1,pga:0.6,stats:[{id,temporada:'2025',goles:200-id,asistencias:4,partidosJugados:230}]});
 if(path.endsWith('/auth/me'))data=user;
 else if(path.includes('/comments')) data={content:[],totalPages:0};
 else if(path.endsWith('/cart')) data={items:[],total:0};
 else if(path.endsWith('/purchases'))data=[{players:[{id:2,gameType:'FIFA'},{id:90,gameType:'FIFA'},{id:2,gameType:'FIFA'},{id:80,gameType:'EFOOTBALL'}]}];
 else if(/\/(players|jugadores)\/\d+$/.test(path)) data=row(Number(path.split('/').pop()));
 else if(path.endsWith('/stats'))data=[{id:1,temporada:'2025',goles:100,asistencias:4,partidosJugados:230}];
 else if(/\/(players|jugadores)(\/search.*)?$/.test(path)){
 const page=Number(u.searchParams.get('page')||0),size=Number(u.searchParams.get('size')||12);
 const rows=Array.from({length:110},(_,i)=>row(i+1)).filter(p=>!u.searchParams.get('nombre')||p.nombre.includes(u.searchParams.get('nombre')));
 data={content:rows.slice(page*size,(page+1)*size),pageNo:page,pageSize:size,totalPages:Math.ceil(rows.length/size),totalElements:rows.length,last:(page+1)*size>=rows.length};
 }else data=[];
 await route.fulfill({json:{success:true,data}});
});
const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/players');
await page.getByText('Jugador 1',{exact:true}).waitFor();
assert(requests.some(u=>u.searchParams.get('sortBy')==='goles'&&u.searchParams.get('sortDir')==='desc'));
await page.getByRole('button',{name:'2',exact:true}).click();
await page.getByText('Jugador 13',{exact:true}).waitFor();
await page.getByText('Jugador 13',{exact:true}).click();
await page.getByRole('button',{name:/Volver a jugadores/}).click();
await page.getByText('Jugador 13',{exact:true}).waitFor();
assert.equal(await page.getByText('Jugador 1',{exact:true}).count(),0);
await page.locator('#tab-efootball').click();
await page.getByText('Jugador 1',{exact:true}).waitFor();
await page.getByRole('button',{name:'2',exact:true}).click();
await page.getByText('Jugador 13',{exact:true}).waitFor();
await page.getByText('Ver',{exact:true}).first().click();
await page.getByRole('button',{name:/Volver a jugadores/}).waitFor();
await page.goBack();
await page.getByText('Jugador 13',{exact:true}).waitFor();
await page.getByRole('button',{name:'Mis jugadores',exact:true}).click();
await page.getByText('Jugador 80',{exact:true}).waitFor();
assert.equal(await page.getByText('Ver',{exact:true}).count(),1);
await page.locator('#tab-fifa').click();
await page.getByText('Jugador 90',{exact:true}).waitFor();
assert.equal(await page.getByText('Jugador 2',{exact:true}).count(),1);
assert.equal(await page.getByText('Jugador 1',{exact:true}).count(),0);
await page.reload();await page.getByText('Jugador 90',{exact:true}).waitFor();
assert.deepEqual(errors,[]);
console.log('PASS: default goals descending; FIFA detail return; eFootball browser Back; owned across catalogue pages; purchase deduplication; section and scope restored on reload; no browser errors.');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

