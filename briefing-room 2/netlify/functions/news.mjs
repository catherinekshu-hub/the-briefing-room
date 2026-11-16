const SOURCES = {
  taiwan: [
    {name:'Focus Taiwan', url:'https://focustaiwan.tw/politics'},
    {name:'Taipei Times',url:'https://www.taipeitimes.com/News/taiwan'},
    {name:'Reuters Taiwan',url:'https://www.reuters.com/world/asia-pacific/'}
  ],
  global: [
    {name:'TechCrunch',url:'https://techcrunch.com/'},
    {name:'Crunchbase News',url:'https://news.crunchbase.com/'},
    {name:'Reuters Technology',url:'https://www.reuters.com/technology/'}
  ],
  asia: [
    {name:'Tech in Asia',url:'https://www.techinasia.com/'},
    {name:'TechNode Global',url:'https://technode.global/'},
    {name:'DealStreetAsia',url:'https://www.dealstreetasia.com/'}
  ],
  us: [
    {name:'AP News',url:'https://apnews.com/politics'},
    {name:'Reuters US',url:'https://www.reuters.com/world/us/'},
    {name:'NPR Politics',url:'https://www.npr.org/sections/politics/'}
  ]
};
const QUERIES = {
 taiwan:'(Taiwan election OR Taiwan legislature OR Taiwan politics OR Taipei mayor OR Taiwan government) when:3d',
 global:'(startup funding OR venture capital OR startup acquisition OR AI startup OR tech IPO) when:3d',
 asia:'(Asia startup funding OR Southeast Asia venture capital OR India startup OR Japan startup OR Taiwan startup) when:5d',
 us:'(US Congress OR White House OR US politics OR Supreme Court OR US election) when:3d'
};
const entities = s => (s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?entities(m[1]):''}
function parse(xml,beat){const chunks=xml.match(/<item>[\s\S]*?<\/item>/g)||[];return chunks.map(x=>{let title=field(x,'title');let link=field(x,'link');let desc=field(x,'description');let date=field(x,'pubDate');let sourceMatch=x.match(/<source[^>]*>([\s\S]*?)<\/source>/i);let source=sourceMatch?entities(sourceMatch[1]):'Google News';return {id:Buffer.from(link).toString('base64url').slice(0,70),title,link,description:desc,date,source,beat};}).filter(x=>x.title&&x.link&&/^https?:\/\//.test(x.link));}
async function fetchBeat(beat){const q=QUERIES[beat];const url=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 BriefingRoom/1.0'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('Feed unavailable');return parse(await r.text(),beat).slice(0,18)}
export default async (request)=>{const u=new URL(request.url);const beat=u.searchParams.get('beat');if(beat==='sources')return Response.json(SOURCES);if(!Object.hasOwn(QUERIES,beat||''))return Response.json({error:'Unknown beat'},{status:400});try{const items=await fetchBeat(beat);return Response.json({items,updatedAt:new Date().toISOString(),beat},{headers:{'Cache-Control':'public, max-age=300, s-maxage=900, stale-while-revalidate=1800','Access-Control-Allow-Origin':'*'}})}catch(e){return Response.json({error:'Could not load news right now. Please retry.',items:[]},{status:503,headers:{'Cache-Control':'no-store'}})}};
export const config={path:'/api/news'};
