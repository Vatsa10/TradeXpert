const H: Record<string,string> = {
  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0",
  Accept:"*/*","Accept-Language":"en-US,en;q=0.5",
  Referer:"https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE",
};
let jar="";
function merge(r:Response){const a:any=r.headers;const l:string[]=typeof a.getSetCookie==="function"?a.getSetCookie():(r.headers.get("set-cookie")?[r.headers.get("set-cookie")!]:[]);
const m=new Map<string,string>();for(const p of jar.split("; ").filter(Boolean)){const e=p.indexOf("=");if(e>0)m.set(p.slice(0,e),p.slice(e+1));}
for(const c of l){const[p]=c.split(";");const e=p.indexOf("=");if(e>0)m.set(p.slice(0,e).trim(),p.slice(e+1).trim());}
jar=[...m].map(([k,v])=>`${k}=${v}`).join("; ");}

async function prime(u:string){const r=await fetch(u,{headers:H,redirect:"follow"});merge(r);console.log("PRIME",u,r.status,"cookies:",jar.split("; ").map(c=>c.split("=")[0]).join(","));}

async function probe(u:string){
  try{const r=await fetch(u,{headers:{...H,Cookie:jar},signal:AbortSignal.timeout(10000)});
  const t=await r.text();merge(r);
  console.log(`\n${r.status} ${u}\n   ${t.slice(0,200).replace(/\s+/g," ")}`);}
  catch(e:any){console.log(`\nERR ${u} ${e?.name} ${e?.message}`);}
}
const B="https://www.nseindia.com/api";
await prime("https://www.nseindia.com/");
await prime("https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE");
await probe(`${B}/quote-equity?symbol=RELIANCE`);
await probe(`${B}/quote-equity?symbol=RELIANCE&section=trade_info`);
await probe(`${B}/search/autocomplete?q=RELI`);
await probe(`${B}/historical/cm/equity?symbol=TCS&series=[%22EQ%22]&from=01-07-2026&to=31-07-2026`);
await probe(`${B}/historicalOR/generateSecurityWiseHistoricalData?from=01-07-2026&to=31-07-2026&symbol=TCS&type=priceVolumeDeliverable&series=EQ`);
await probe(`${B}/NextApi/apiClient/GetQuoteApi?functionName=getHistoricalTradeData&symbol=TCS&series=EQ&fromDate=01-07-2026&toDate=31-07-2026`);
