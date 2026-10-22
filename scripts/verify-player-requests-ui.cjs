const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const auth={admin:process.env.CAZA_UI_ADMIN_TOKEN,user:process.env.CAZA_UI_USER_TOKEN}; assert(auth.admin&&auth.user,'Configure local test admin and user tokens');
 const base='http://127.0.0.1:18081/api';
 const req=async(url,token,body,method=body?'POST':'GET')=>{const r=await fetch(base+url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(url+' '+r.status);return (await r.json()).data;};
 const demo=await req('/jugadores',auth.admin,{nombre:'Delantero de demostración',goles:34,asistencias:12,partidos:48,precio:500});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=process.env.CAZA_UI_OUTPUT||path.join(require('os').tmpdir(),'caza-requests-ui');fs.mkdirSync(out,{recursive:true});
 try{
  const publicContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const reg=await publicContext.newPage();await reg.goto('http://127.0.0.1:5173/register');await reg.getByLabel('Nombre completo',{exact:true}).fill('Lionel');await reg.getByLabel('Correo electrónico',{exact:true}).fill('lionel@example.com');
  assert(!/Gemini|Géminis|Chat IA/.test(await reg.locator('body').innerText()));
  for(const input of await reg.locator('.field-with-icon input').all())assert(await input.evaluate(el=>parseFloat(getComputedStyle(el).paddingLeft)>=44));
  await reg.screenshot({path:path.join(out,'registro.png'),fullPage:true});
  await reg.setViewportSize({width:390,height:844});await reg.getByLabel('Contraseña',{exact:true}).fill('abcdef12');await reg.getByLabel('Confirmar contraseña',{exact:true}).fill('abcdef13');await reg.getByText('Las contraseñas no coinciden.',{exact:true}).waitFor();
  assert(await reg.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await reg.screenshot({path:path.join(out,'registro-movil.png'),fullPage:true});
  async function signed(token){const me=await req('/auth/me',token);const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});await c.route('http://localhost:8080/uploads/**',async route=>{const r=await fetch(route.request().url().replace('http://localhost:8080','http://127.0.0.1:18081'));await route.fulfill({status:r.status,contentType:r.headers.get('content-type')||'image/png',body:Buffer.from(await r.arrayBuffer())});});await c.addInitScript(({token,me})=>{localStorage.setItem('caza_token',token);localStorage.setItem('caza_user',JSON.stringify(me));},{token,me});return c;}
  const userContext=await signed(auth.user),page=await userContext.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/players');await page.getByRole('heading',{name:'Encuentra tu próximo fichaje.'}).waitFor();assert.equal(await page.locator('#btn-add-player').count(),0);assert.equal(await page.getByTitle('Actualizar stats',{exact:true}).count(),0);
  await page.locator('#tab-efootball').click();await page.getByText('Ver',{exact:true}).first().waitFor();assert.equal(await page.getByText('Editar',{exact:true}).count(),0);await page.screenshot({path:path.join(out,'catalogo.png'),fullPage:true});
  await page.goto(`http://127.0.0.1:5173/efootball/${demo.id}`);await page.getByRole('button',{name:/Solicitar cambio/}).click();await page.getByRole('spinbutton',{name:/^Goles/}).fill('36');await page.getByLabel('Motivo de la corrección').fill('Se registraron dos goles adicionales en el último partido.');await page.getByRole('button',{name:'Enviar propuesta'}).click();await page.getByText('Solicitud pendiente.',{exact:false}).waitFor();
  await page.goto('http://127.0.0.1:5173/requests');await page.getByRole('heading',{name:'Mis solicitudes'}).waitFor();await page.getByText('Delantero de demostración',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Aprobar cambios'}).count(),0);
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:path.join(out,'solicitudes-movil.png'),fullPage:true});
  const adminContext=await signed(auth.admin),admin=await adminContext.newPage();admin.on('pageerror',e=>errors.push(e.message));admin.on('dialog',d=>d.accept());await admin.goto('http://127.0.0.1:5173/requests');const card=admin.locator('article').filter({hasText:'Delantero de demostración'});await card.waitFor();await card.getByLabel('Respuesta para el usuario (opcional)').fill('Comprobado en el registro de partidos.');await admin.screenshot({path:path.join(out,'solicitudes-admin.png'),fullPage:true});await card.getByRole('button',{name:'Aprobar cambios'}).click();await card.waitFor({state:'detached'});
  assert.equal((await req(`/jugadores/${demo.id}`,auth.admin)).goles,36);
  await page.getByRole('button',{name:'Aprobadas',exact:true}).click();await page.getByText('Comprobado en el registro de partidos.').first().waitFor();
  await admin.goto('http://127.0.0.1:5173/dashboard');await admin.getByRole('heading',{name:'Acceso rápido'}).waitFor();await admin.screenshot({path:path.join(out,'dashboard.png'),fullPage:true});
  await admin.goto('http://127.0.0.1:5173/admin/audit');const downloadPromise=admin.waitForEvent('download');await admin.getByRole('button',{name:'Descargar PDF con estos filtros'}).click();const download=await downloadPromise;await download.saveAs(path.join(out,'requests-audit.pdf'));
  assert.deepEqual(errors,[]);console.log('PASS UI: register spacing/validation/mobile; admin-only controls; user proposal; admin approval; user result; PDF download; no page errors.');
 }finally{await req(`/jugadores/${demo.id}`,auth.admin,undefined,'DELETE');await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

