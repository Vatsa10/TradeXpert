const H:Record<string,string>={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0",Accept:"*/*","Accept-Language":"en-US,en;q=0.5",Referer:"https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE"};
let jar="";
function merge(r:Response){const a:any=r.headers;const l:string[]=typeof a.getSetCookie==="function"?a.getSetCookie():(r.headers.get("set-cookie")?[r.headers.get("set-cookie")!]:[]);const m=new Map<string,string>();for(const p of jar.split("; ").filter(Boolean)){const e=p.indexOf("=");if(e>0)m.set(p.slice(0,e),p.slice(e+1));}for(const c of l){const[p]=c.split(";");const e=p.indexOf("=");if(e>0)m.set(p.slice(0,e).trim(),p.slice(e+1).trim());}jar=[...m].map(([k,v])=>`${k}=${v}`).join("; ");}
async function probe(u:string,hh:Record<string,string>=H){try{const r=await fetch(u,{headers:{...hh,Cookie:jar},signal:AbortSignal.timeout(12000)});const t=await r.text();merge(r);console.log(`\n${r.status} ${u}\n   ${t.slice(0,300).replace(/\s+/g," ")}`);}catch(e:any){console.log(`\nERR ${u} ${e?.name} ${e?.message}`);}}
const B="https://www.nseindia.com/api";
merge(await fetch("https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE",{headers:H,redirect:"follow"}));
await probe(`${B}/equity-stockIndices?index=NIFTY%2050`);
await probe(`${B}/equity-meta-info?symbol=RELIANCE`);
await probe(`${B}/quote-equity?symbol=RELIANCE&section=trade_info`);
await probe(`${B}/search/autocomplete?q=RELIANCE`);
await probe(`${B}/master-quote`);
await probe(`${B}/NextApi/apiClient/GetQuoteApi?functionName=getEquityQuote&symbol=RELIANCE`);
await probe(`${B}/NextApi/apiClient/marketData?functionName=getSecurityInfo&symbol=RELIANCE`);
// BSE
const BH={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; rv:138.0) Gecko/20100101 Firefox/138.0",Accept:"application/json, text/plain, */*",Origin:"https://www.bseindia.com",Referer:"https://www.bseindia.com/"};
const BB="https://api.bseindia.com/BseIndiaAPI/api";
await probe(`${BB}/getScripHeaderData/w?scripcode=500325`,BH);
await probe(`${BB}/PeerSmartSearch/w?Type=SS&text=RELIANCE`,BH);
