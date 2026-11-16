import { createHash } from 'node:crypto';
import he from 'he';

// Publisher feeds include readable excerpts; Google News only repeats headlines.
const FEEDS = {
 taiwan: [{name:'The Guardian',url:'https://www.theguardian.com/world/taiwan/rss'}],
 global: [{name:'TechCrunch',url:'https://techcrunch.com/feed/'},{name:'The Guardian',url:'https://www.theguardian.com/technology/startups/rss'}],
 asia: [{name:'e27',url:'https://e27.co/feed/'}],
 us: [{name:'NPR',url:'https://feeds.npr.org/1014/rss.xml'},{name:'The Guardian',url:'https://www.theguardian.com/us-news/us-politics/rss'}]
};
const entities = value => {
 let text = (value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
 // Feed descriptions can contain HTML encoded more than once.
 for (let i = 0; i < 3; i++) {
  const decoded = he.decode(text);
  text = decoded.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ');
  if (text === decoded && !/&(?:#|[a-z])/i.test(text)) break;
 }
 return text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?entities(m[1]):''}
function excerpt(xml) {
 const content=field(xml,'content:encoded') || field(xml,'description');
 const clean=content.replace(/\s*(?:The post .*? appeared first on|Continue reading|Read more|Sign up for).*$/i,'').trim();
 if(clean.length<120) return '';
 const sentences=clean.match(/[^.!?]+[.!?]+(?:[”’"']|$|\s)|[^.!?]+$/g)||[clean];
 let result='';
 for(const sentence of sentences){if(result && result.length+sentence.length>650)break;result+=sentence;if(result.length>350)break;}
 if(result.length>700)result=result.slice(0,697).replace(/\s+\S*$/,'')+'…';
 return result.trim();
}
function parse(xml,beat,source){const chunks=xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/g)||[];return chunks.map(x=>{const title=field(x,'title'),link=field(x,'link');return {id:createHash('sha256').update(link).digest('hex'),title,link,description:excerpt(x),summaryType:'publisher-excerpt',date:field(x,'pubDate'),source,beat};}).filter(x=>x.title && /^https?:\/\//.test(x.link) && x.description.length>=120);}
async function fetchBeat(beat){
 const results=await Promise.allSettled(FEEDS[beat].map(async feed=>{
  const r=await fetch(feed.url,{headers:{'User-Agent':'Mozilla/5.0 BriefingRoom/1.0'},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw Error('Feed unavailable');
  const xml=await r.text();
  if(!/<rss[\s>]/i.test(xml))throw Error('Not an RSS feed');
  return parse(xml,beat,feed.name);
 }));
 const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 const seen=new Set();
 const unique=items.filter(x=>!seen.has(x.link)&&seen.add(x.link));
 if(!unique.length)throw Error('No publisher excerpts available');
 return unique.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,18);
}
export default async (request)=>{const u=new URL(request.url);const beat=u.searchParams.get('beat');if(beat==='sources')return Response.json(FEEDS);if(!Object.hasOwn(FEEDS,beat||''))return Response.json({error:'Unknown beat'},{status:400});try{const items=await fetchBeat(beat);return Response.json({items,updatedAt:new Date().toISOString(),beat},{headers:{'Cache-Control':'public, max-age=300, s-maxage=900, stale-while-revalidate=1800','Access-Control-Allow-Origin':'*'}})}catch(e){return Response.json({error:'Could not load news right now. Please retry.',items:[]},{status:503,headers:{'Cache-Control':'no-store'}})}};
export const config={path:'/api/news'};
