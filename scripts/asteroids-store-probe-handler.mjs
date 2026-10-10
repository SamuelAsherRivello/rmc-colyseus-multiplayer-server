import {get,put,del,BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
const instance=randomUUID();
export default async function(req,res) {
  res.setHeader('Content-Type','application/json');
  if(req.headers['x-probe-secret']!==process.env.PROBE_SECRET){res.statusCode=403;res.end('{}');return;}
  const url=new URL(req.url,'http://probe'),key=url.searchParams.get('key'),op=url.searchParams.get('op');
  if(!/^[a-f0-9-]{36}$/.test(key||'')){res.statusCode=400;res.end('{}');return;}
  const path=`asteroids/probes/${key}.json`;
  try {
    if(op==='read') {
      const result=await get(path,{access:'private',useCache:false});
      if(!result || result.statusCode!==200)throw new Error('Missing probe document');
      res.end(JSON.stringify({instance,etag:result.blob.etag,value:await new Response(result.stream).json()}));return;
    }
    if(op==='delete'){await del(path);res.end(JSON.stringify({instance,deleted:true}));return;}
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const data=JSON.parse(Buffer.concat(chunks).toString());
    const result=await put(path,JSON.stringify(data.value),{access:'private',addRandomSuffix:false,allowOverwrite:op==='cas',...(op==='cas'?{ifMatch:data.etag}:{})});
    res.end(JSON.stringify({instance,etag:result.etag,written:true}));
  } catch(error) {
    if(error instanceof BlobPreconditionFailedError || (error instanceof BlobError && /already exists/i.test(error.message))) {
      res.statusCode=409;res.end(JSON.stringify({instance,conflict:true}));
    }else{res.statusCode=500;res.end(JSON.stringify({instance,error:error.name}));}
  }
}
