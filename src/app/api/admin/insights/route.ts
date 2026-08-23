import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function authenticate(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    const decoded = Buffer.from(auth.slice(7), 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (!parts[0] || !parts[1]) return false;
    const timestamp = parseInt(parts[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return false;
    return true;
  } catch { return false; }
}

const FLAGS: Record<string, string> = {
  Pakistan:'🇵🇰',India:'🇮🇳','United States':'🇺🇸','United Kingdom':'🇬🇧',Canada:'🇨🇦',Australia:'🇦🇺',Germany:'🇩🇪',France:'🇫🇷','Saudi Arabia':'🇸🇦',UAE:'🇦🇪',Turkey:'🇹🇷',Malaysia:'🇲🇾','China':'🇨🇳',Japan:'🇯🇵','South Korea':'🇰🇷',Indonesia:'🇮🇩',Bangladesh:'🇧🇩',Afghanistan:'🇦🇫',Iran:'🇮🇷',Iraq:'🇮🇶',Egypt:'🇪🇬',Thailand:'🇹🇭',Singapore:'🇸🇬',Qatar:'🇶🇦',Kuwait:'🇰🇼',Bahrain:'🇧🇭',Oman:'🇴🇲',Jordan:'🇯🇴',Italy:'🇮🇹',Spain:'🇪🇸','Netherlands':'🇳🇱',Sweden:'🇸🇪',Russia:'🇷🇺',Brazil:'🇧🇷','South Africa':'🇿🇦',Nigeria:'🇳🇬',Kenya:'🇰🇪',Philippines:'🇵🇭',Vietnam:'🇻🇳','Sri Lanka':'🇱🇰',Nepal:'🇳🇵',Local:'🖥️',
};
const fl = (c: string) => FLAGS[c] || '🌍';

export async function GET(request: NextRequest) {
  if (!authenticate(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7*86400000);
    const monthAgo = new Date(now.getTime() - 30*86400000);

    // 1. Top Searches
    const topSearches = await db.searchLog.groupBy({ by:['query'],_count:true,orderBy:{_count:{query:'desc'}},take:25 }).catch(()=>[]);
    const searchesToday = await db.searchLog.count({where:{createdAt:{gte:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()))}}}).catch(()=>0);
    const searchesWeek = await db.searchLog.count({where:{createdAt:{gte:weekAgo}}}).catch(()=>0);

    // 2. Popular Countries (from visitor sessions)
    const countryGroups = await db.visitorSession.groupBy({by:['country'],_count:true,where:{country:{not:''}},orderBy:{_count:{country:'desc'}},take:15}).catch(()=>[]);
    const popularCountries = countryGroups.map(g=>({country:g.country,flag:fl(g.country),count:g._count}));

    // 3. Subscription Metrics
    const totalUsers = await db.user.count().catch(()=>0);
    const proUsers = await db.user.count({where:{role:'pro',proExpiresAt:{gt:now}}}).catch(()=>0);
    const newUsersWeek = await db.user.count({where:{createdAt:{gte:weekAgo}}}).catch(()=>0);
    const newUsersMonth = await db.user.count({where:{createdAt:{gte:monthAgo}}}).catch(()=>0);

    // 4. Visa Freshness (oldest first)
    const staleCountries = await db.country.findMany({select:{name:true,code:true,flagEmoji:true,fetchTimestamp:true},orderBy:{fetchTimestamp:'asc'},take:10}).catch(()=>[]);
    const visaFreshness = staleCountries.map(c=>({name:c.name,code:c.code,flagEmoji:c.flagEmoji,daysSince:Math.floor((now.getTime()-c.fetchTimestamp.getTime())/86400000),fetchTimestamp:c.fetchTimestamp.toISOString()}));

    // 5. Security Logs
    const secLogs = await db.securityLog.findMany({orderBy:{createdAt:'desc'},take:20}).catch(()=>[]);
    const recentSecurity = secLogs.map(l=>({id:l.id,action:l.action,email:l.email,ip:l.ip,success:l.success,details:l.details,createdAt:l.createdAt.toISOString()}));
    const securityStats = {totalLogins:0,failedLogins:0,adminLogins:0,adminFails:0};
    for(const l of secLogs){if(l.action==='user_login'&&l.success)securityStats.totalLogins++;if(l.action.includes('fail'))securityStats.failedLogins++;if(l.action==='admin_login'&&l.success)securityStats.adminLogins++;if(l.action==='admin_login_fail')securityStats.adminFails++;}

    // 6. Traffic Sources
    const srcGroups = await db.visitorSession.groupBy({by:['referrerCategory'],_count:true,orderBy:{_count:{referrerCategory:'desc'}}}).catch(()=>[]);
    const srcTotal = srcGroups.reduce((s,g)=>s+g._count,0);
    const srcLabels:Record<string,string>={direct:'Direct',organic:'Organic Search',social:'Social Media',referral:'Referral'};
    const trafficSources = srcGroups.map(g=>({source:srcLabels[g.referrerCategory]||g.referrerCategory,count:g._count,pct:srcTotal>0?Math.round(g._count/srcTotal*100):0}));

    // 7. Device & Browser
    const devGroups = await db.visitorSession.groupBy({by:['device'],_count:true,where:{device:{not:''}},orderBy:{_count:{device:'desc'}}}).catch(()=>[]);
    const devTotal = devGroups.reduce((s,g)=>s+g._count,0);
    const devices = devGroups.map(g=>({type:g.device||'Unknown',count:g._count,pct:devTotal>0?Math.round(g._count/devTotal*100):0}));
    const brGroups = await db.visitorSession.groupBy({by:['browser'],_count:true,where:{browser:{not:''}},orderBy:{_count:{browser:'desc'}},take:8}).catch(()=>[]);
    const brTotal = brGroups.reduce((s,g)=>s+g._count,0);
    const browsers = brGroups.map(g=>({name:g.browser||'Other',count:g._count,pct:brTotal>0?Math.round(g._count/brTotal*100):0}));

    // 8. Critical Alerts
    const alerts: Array<{type:string;title:string;message:string;severity:string}>=[];
    const staleCount = await db.country.count({where:{fetchTimestamp:{lt:new Date(now.getTime()-90*86400000)}}}).catch(()=>0);
    if(staleCount>0)alerts.push({type:'data',title:`${staleCount} countries with data >90 days old`,message:'Run Data Sync to update.',severity:'warning'});
    const fail24h = await db.securityLog.count({where:{success:false,createdAt:{gte:new Date(now.getTime()-86400000)}}}).catch(()=>0);
    if(fail24h>0)alerts.push({type:'security',title:`${fail24h} failed login attempts (24h)`,message:'Check Security Logs.',severity:fail24h>10?'error':'warning'});
    const unread = await db.contactMessage.count({where:{isRead:false}}).catch(()=>0);
    if(unread>0)alerts.push({type:'messages',title:`${unread} unread message${unread>1?'s':''}`,message:'Check Messages tab.',severity:'info'});
    const pending = await db.paymentProof.count({where:{status:'pending'}}).catch(()=>0);
    if(pending>0)alerts.push({type:'payments',title:`${pending} pending proof${pending>1?'s':''}`,message:'Review Payment Proofs.',severity:'info'});

    // 9. Affiliate Tracking
    const affGroups = await db.affiliateClick.groupBy({by:['partner'],_count:true,orderBy:{_count:{partner:'desc'}}}).catch(()=>[]);
    const affTotal = await db.affiliateClick.count().catch(()=>0);
    const affiliate = {total:affTotal,partners:affGroups.map(g=>({partner:g.partner,clicks:g._count}))};

    return NextResponse.json({success:true,
      searchQueries:{topSearches:topSearches.map(g=>({query:g.query,count:g._count})),searchesToday,searchesWeek},
      popularCountries,
      subscription:{totalUsers,proUsers,freeUsers:totalUsers-proUsers,newUsersWeek,newUsersMonth},
      visaFreshness,
      security:{recent:recentSecurity,stats:securityStats},
      trafficSources,devices,browsers,alerts,affiliate,
    });
  }catch(error){
    console.error('Insights error:',error);
    return NextResponse.json({success:false,error:'Failed'},{status:500});
  }
}
