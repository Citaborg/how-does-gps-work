import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const port=Number(process.env.PORT)||4176;
http.createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,`.${path==='/'?'/index.html':path}`),local=relative(root,file);
    if(local.startsWith('..')||isAbsolute(local)){res.writeHead(403).end('Forbidden');return;}
    const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Fant ikke filen.');}
}).listen(port,'127.0.0.1',()=>console.log(`GPS-fortellingen: http://127.0.0.1:${port}`));
