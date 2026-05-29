import { useState, useEffect, useRef } from "react";

const ZONES_RUN=[{z:1,bpm:[129,143],color:"#4dabf7",bg:"rgba(77,171,247,.1)",label:"Recovery"},{z:2,bpm:[143,157],color:"#69db7c",bg:"rgba(105,219,124,.1)",label:"Aerobic Base ★"},{z:3,bpm:[157,171],color:"#ffd43b",bg:"rgba(255,212,59,.1)",label:"Tempo"},{z:4,bpm:[171,186],color:"#ff922b",bg:"rgba(255,146,43,.1)",label:"Threshold"},{z:5,bpm:[186,200],color:"#ff6b6b",bg:"rgba(255,107,107,.1)",label:"VO2 Max"}];
const ZONES_BIKE=[{z:1,bpm:[119,133],color:"#4dabf7",bg:"rgba(77,171,247,.1)",label:"Recovery"},{z:2,bpm:[133,148],color:"#69db7c",bg:"rgba(105,219,124,.1)",label:"Aerobic Base ★"},{z:3,bpm:[148,163],color:"#ffd43b",bg:"rgba(255,212,59,.1)",label:"Tempo"},{z:4,bpm:[163,178],color:"#ff922b",bg:"rgba(255,146,43,.1)",label:"Threshold"},{z:5,bpm:[178,200],color:"#ff6b6b",bg:"rgba(255,107,107,.1)",label:"VO2 Max"}];
const UPPER_EX=["Incline Bench Press","Pec Fly","Chest Supported DB Row","Lat Pulldown","Tricep Pushdown","Preacher Curl","Shoulder Press"];
const LOWER_EX=["Hamstring Curl","Bulgarian Split Squat","Single-leg RDL","Quad Extension","Single-leg Calf Raises","Cable Crunch","Leg Raises"];
const TICON={run:"🏃",bike:"🚴",swim:"🏊",strength:"💪",brick:"🧱",rest:"😴",recovery:"🚶"};
const TBG={run:"rgba(105,219,124,.1)",bike:"rgba(77,171,247,.1)",swim:"rgba(77,171,247,.15)",strength:"rgba(255,146,43,.1)"};
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DSHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TRAIN_START=new Date("2026-05-23");
const MILESTONES=[
  {id:"z2run30",text:"Complete 30 min run in Zone 2 (143–157 bpm)"},
  {id:"swim400",text:"Swim 400m continuously without stopping"},
  {id:"css_done",text:"CSS test completed — swim zones set on FR165"},
  {id:"ride50",text:"Ride 50km in Zone 2 (133–148 bpm)"},
  {id:"brick1",text:"Complete first brick session"},
  {id:"race5k",text:"Complete first 5K race"},
  {id:"sprint_tri",text:"Complete Sprint Triathlon"},
];
const OOC_PLAN={
  1:[{type:"run",label:"Zone 2 Run",detail:"30 min · 143–157 bpm"}],
  2:[{type:"run",label:"Zone 2 Run",detail:"30 min · 143–157 bpm"},{type:"swim",label:"Technique Swim",detail:"500m · CSS pace"}],
  3:[{type:"run",label:"Zone 2 Run",detail:"30 min"},{type:"swim",label:"Technique Swim",detail:"500m"},{type:"bike",label:"Zone 2 Ride",detail:"50 min · 133–148 bpm"}],
  4:[{type:"run",label:"Zone 2 Run",detail:"30 min"},{type:"strength",label:"Upper Day",detail:"2 sets to failure"},{type:"swim",label:"Technique Swim",detail:"500m"},{type:"bike",label:"Zone 2 Ride",detail:"50 min"}],
  5:[{type:"run",label:"Zone 2 Run",detail:"30 min"},{type:"strength",label:"Upper Day",detail:"2 sets to failure"},{type:"swim",label:"Technique Swim",detail:"500m"},{type:"bike",label:"Zone 2 Ride",detail:"50 min"},{type:"strength",label:"Lower Day",detail:"2 sets to failure"}],
};

const todayStr=()=>new Date().toISOString().split("T")[0];
const dow=()=>new Date().getDay();
const isWknd=()=>{const d=dow();return d===0||d===6;};
const daysUntil=t=>{const d=dow();let diff=t-d;if(diff<=0)diff+=7;return diff;};
const getWeek=()=>Math.max(1,Math.ceil((new Date()-TRAIN_START)/(7*86400000)));
const isUpperWk=()=>getWeek()%2===1;
const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];};
const calcACWR=sessions=>{const now=new Date(),d7=new Date(now),d28=new Date(now);d7.setDate(d7.getDate()-7);d28.setDate(d28.getDate()-28);const a=sessions.filter(s=>new Date(s.date)>=d7).reduce((x,s)=>x+(s.load||0),0);const c=sessions.filter(s=>new Date(s.date)>=d28).reduce((x,s)=>x+(s.load||0),0)/4;return c>0?a/c:0;};

const getPlan=sessions=>{
  const week=getWeek(),acwr=sessions.length>0?calcACWR(sessions):0;
  let runDur=30,rideDur=50,swimDist=500;
  const cycles=Math.floor((week-1)/4);
  if(cycles>0&&sessions.length>0&&acwr>=0.7&&acwr<=1.4){const f=Math.pow(1.08,Math.min(cycles,8));runDur=Math.round(Math.min(runDur*f,180));rideDur=Math.round(Math.min(rideDur*f,300));swimDist=Math.round(Math.min(swimDist*f,4000));}
  let adj="normal";
  if(acwr>1.5){runDur=Math.round(runDur*.6);rideDur=Math.round(rideDur*.6);adj="deload";}
  else if(acwr>1.3){runDur=Math.round(runDur*.8);rideDur=Math.round(rideDur*.8);adj="reduce";}
  return{week,runDur,rideDur,swimDist,acwr,adj,cycles,runDist:Math.round(runDur/7.5*10)/10,rideDist:Math.round(rideDur*.33),strengthType:isUpperWk()?"upper":"lower",strengthLabel:isUpperWk()?"Upper Day":"Lower Day",runPace:"7:30–8:30"};
};

const S={
  app:{background:"#080808",color:"#f4f1eb",fontFamily:"system-ui,sans-serif",minHeight:"100vh",maxWidth:420,margin:"0 auto",paddingBottom:72},
  hdr:{padding:"48px 20px 0"},eye:{fontSize:10,color:"#555",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:2,fontFamily:"monospace"},
  ttl:{fontSize:44,fontWeight:900,lineHeight:.95,marginBottom:20},
  card:{background:"#161616",border:"1px solid #242424",borderRadius:14,padding:16,margin:"0 16px 10px"},
  ct:{fontSize:9,color:"#555",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12,fontFamily:"monospace"},
  nav:{position:"sticky",bottom:0,background:"rgba(8,8,8,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #242424",display:"flex",zIndex:100},
  nb:on=>({flex:1,padding:"11px 2px 9px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontSize:9,color:on?"#69db7c":"#555",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}),
  btn:v=>({width:"100%",padding:13,border:v==="p"?"none":"1px solid #242424",borderRadius:11,fontSize:14,fontWeight:700,cursor:"pointer",background:v==="p"?"#69db7c":v==="danger"?"rgba(255,107,107,.1)":v==="warn"?"rgba(255,212,59,.1)":v==="blue"?"rgba(77,171,247,.1)":"#1a1a1a",color:v==="p"?"#000":v==="danger"?"#ff6b6b":v==="warn"?"#ffd43b":v==="blue"?"#4dabf7":"#f4f1eb",marginTop:v==="p"?12:6}),
  inp:{width:"100%",padding:"10px 12px",background:"#1a1a1a",border:"1px solid #242424",borderRadius:10,fontSize:13,fontFamily:"monospace",color:"#f4f1eb",outline:"none"},
  bdg:c=>({display:"inline-block",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20,fontFamily:"monospace",background:c==="g"?"rgba(105,219,124,.12)":c==="y"?"rgba(255,212,59,.12)":c==="r"?"rgba(255,107,107,.12)":c==="b"?"rgba(77,171,247,.12)":c==="o"?"rgba(255,146,43,.12)":"#1a1a1a",color:c==="g"?"#69db7c":c==="y"?"#ffd43b":c==="r"?"#ff6b6b":c==="b"?"#4dabf7":c==="o"?"#ff922b":"#555"}),
};

let toastT;
const Toast=({msg})=><div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#69db7c",color:"#000",padding:"9px 18px",borderRadius:18,fontSize:12,fontWeight:700,zIndex:999,whiteSpace:"nowrap",opacity:msg?1:0,transition:"opacity .3s",pointerEvents:"none"}}>{msg}</div>;

export default function App(){
  const [tab,setTab]=useState("today");
  const [sessions,setSessions]=useState([]);
  const [checkins,setCheckins]=useState([]);
  const [milestones,setMilestones]=useState({brick1:true});
  const [oocPeriods,setOocPeriods]=useState([]);
  const [missedDecisions,setMissedDecisions]=useState({});
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [missedModal,setMissedModal]=useState(null);
  const [toast,setToast]=useState("");

  const showToast=msg=>{setToast(msg);clearTimeout(toastT);toastT=setTimeout(()=>setToast(""),2400);};
  const saveSession=sess=>{setSessions(p=>[...p,sess]);showToast("Session saved ✓");};
  const saveCheckin=ci=>{setCheckins(p=>[...p.filter(x=>x.date!==ci.date),ci]);showToast("Check-in saved ✓");};
  const toggleM=id=>setMilestones(p=>({...p,[id]:!p[id]}));

  useEffect(()=>{
    const saved=localStorage.getItem("im_sessions");if(saved)setSessions(JSON.parse(saved));
    const savedCI=localStorage.getItem("im_checkins");if(savedCI)setCheckins(JSON.parse(savedCI));
    const savedM=localStorage.getItem("im_milestones");if(savedM)setMilestones(JSON.parse(savedM));
    const savedOOC=localStorage.getItem("im_ooc");if(savedOOC)setOocPeriods(JSON.parse(savedOOC));
    const savedMD=localStorage.getItem("im_missed");if(savedMD)setMissedDecisions(JSON.parse(savedMD));
  },[]);

  const saveSess=sess=>{const arr=[...sessions,sess];setSessions(arr);localStorage.setItem("im_sessions",JSON.stringify(arr));showToast("Session saved ✓");};
  const saveCI=ci=>{const arr=[...checkins.filter(x=>x.date!==ci.date),ci];setCheckins(arr);localStorage.setItem("im_checkins",JSON.stringify(arr));showToast("Check-in saved ✓");};
  const toggleMil=id=>{const m={...milestones,[id]:!milestones[id]};setMilestones(m);localStorage.setItem("im_milestones",JSON.stringify(m));};
  const saveOOC=p=>{setOocPeriods(p);localStorage.setItem("im_ooc",JSON.stringify(p));};
  const saveMD=d=>{setMissedDecisions(d);localStorage.setItem("im_missed",JSON.stringify(d));};

  const plan=getPlan(sessions);
  const workouts=buildWorkouts(plan);
  const now=new Date();
  const wkStart=new Date(now);wkStart.setDate(now.getDate()-now.getDay());wkStart.setHours(0,0,0,0);
  const thisSat=new Date(wkStart);thisSat.setDate(wkStart.getDate()+6);
  const thisSatStr=thisSat.toISOString().split("T")[0];
  const thisSun=wkStart.toISOString().split("T")[0];
  const satLogged=sessions.some(s=>s.date===thisSatStr);
  const sunLogged=sessions.some(s=>s.date===thisSun);
  const d=dow();
  const satMissed=d>0&&!satLogged&&!missedDecisions[thisSatStr];
  const sunMissed=d>1&&!sunLogged&&!missedDecisions[thisSun];
  const currentOOC=oocPeriods.find(p=>todayStr()>=p.start&&todayStr()<=p.end);

  if(activeWorkout)return<><Toast msg={toast}/><ActiveWorkout workout={activeWorkout} plan={plan} onComplete={sess=>{saveSess(sess);setActiveWorkout(null);}} onCancel={()=>setActiveWorkout(null)}/></>;
  if(missedModal)return<MissedModal missed={missedModal} plan={plan} onDecide={(date,dec,mk)=>{const nd={...missedDecisions,[date]:dec};saveMD(nd);if(mk)saveSess(mk);setMissedModal(null);showToast(dec==="skip"?"Skipped ✓":dec==="makeup"?"Make-up added ✓":"Plan pushed back ✓");}} onClose={()=>setMissedModal(null)}/>;

  const screens={
    today:<Today sessions={sessions} plan={plan} workouts={workouts} checkins={checkins} saveCheckin={saveCI} onStart={setActiveWorkout} satMissed={satMissed} sunMissed={sunMissed} thisSatStr={thisSatStr} thisSun={thisSun} onMissed={setMissedModal} currentOOC={currentOOC}/>,
    schedule:<Schedule sessions={sessions} plan={plan} oocPeriods={oocPeriods} setOocPeriods={saveOOC} missedDecisions={missedDecisions} onMissed={setMissedModal} thisSatStr={thisSatStr} thisSun={thisSun} satLogged={satLogged} sunLogged={sunLogged} showToast={showToast}/>,
    load:<Load sessions={sessions} checkins={checkins} plan={plan}/>,
    progress:<Progress sessions={sessions} milestones={milestones} toggleM={toggleMil} showToast={showToast}/>,
    log:<Log sessions={sessions} workouts={workouts} onStart={setActiveWorkout}/>,
  };

  return(
    <div style={S.app}>
      <Toast msg={toast}/>
      {screens[tab]}
      <nav style={S.nav}>
        {[["today","Today",<HI/>],["schedule","Schedule",<CalI/>],["load","Load",<ChI/>],["progress","Progress",<TrI/>],["log","Log",<PlI/>]].map(([id,lbl,ico])=>(
          <button key={id} style={S.nb(tab===id)} onClick={()=>setTab(id)}>{ico}{lbl}</button>
        ))}
      </nav>
    </div>
  );
}
function buildWorkouts(plan){
  return{
    sat_run:{id:"sat_run",type:"run",logType:"cardio",title:"Zone 2 Base Run",badge:`Z2 · ${plan.runDur} min · 143–157 bpm`,targetHRLow:143,targetHRHigh:157,targetDur:plan.runDur,targetDist:plan.runDist,zoneTable:"run",exercises:null,steps:[{t:"Walk Warmup — 5 min",d:"Leg swings, hip circles. HR below 120."},{t:`Zone 2 Run — ${plan.runDur-10} min`,d:`Target 143–157 bpm. Walk if HR hits 158+.`},{t:"Walk Cooldown — 5 min",d:"Calf 30s, quad 30s, hip flexor 45s."}],loc:"East Coast Park",note:"Chase HR not pace. Zone 2 is your Ironman engine."},
    sat_bike:{id:"sat_bike",type:"bike",logType:"cardio",title:"Zone 2 Brick Ride",badge:`Z2 · ${plan.rideDur} min · 133–148 bpm`,targetHRLow:133,targetHRHigh:148,targetDur:plan.rideDur,targetDist:plan.rideDist,zoneTable:"bike",exercises:null,steps:[{t:"Warmup Spin — 10 min",d:"Lightest gears, 90+ RPM."},{t:`Zone 2 Ride — ${plan.rideDur-15} min`,d:"Target 133–148 bpm. Bike Z2 is lower than run."},{t:"Cooldown — 5 min",d:"HR below 125."}],loc:"East Coast Park",note:"Bike Zone 2 = 133–148 bpm."},
    sun_swim:{id:"sun_swim",type:"swim",logType:"cardio",title:"Technique Swim",badge:`CSS · ${plan.swimDist}m`,targetHRLow:null,targetHRHigh:null,targetDur:40,targetDist:plan.swimDist/1000,zoneTable:"swim",exercises:null,steps:[{t:"Warmup 3×50m",d:"Count strokes per 25m."},{t:"Drills 4×50m",d:"Catch-up drill."},{t:"Pace 4×50m",d:"Effort 6–7."},{t:"Cooldown 100m",d:"Backstroke."}],loc:"Bishan or Sports Hub",note:"Log stroke count every session."},
    sun_strength:{id:"sun_strength",type:"strength",logType:"strength",title:`Strength — ${plan.strengthLabel}`,badge:`${plan.strengthLabel} · 2 sets to failure`,targetDur:45,strengthType:plan.strengthType,exercises:plan.strengthType==="upper"?UPPER_EX:LOWER_EX,steps:[{t:"Follow your routine",d:"2 sets to failure per exercise."},{t:plan.strengthType==="upper"?"Upper focus":"Lower focus",d:plan.strengthType==="upper"?"Pull movements priority.":"Single-leg exercises priority."}],loc:"Home or gym",note:plan.strengthType==="lower"?"Start light on Bulgarian split squat.":"Control eccentric — 3s down."},
  };
}

function Today({sessions,plan,workouts,checkins,saveCheckin,onStart,satMissed,sunMissed,thisSatStr,thisSun,onMissed,currentOOC}){
  const [bb,setBb]=useState("");const [hrv,setHrv]=useState("");const [saved,setSaved]=useState(false);
  const d=dow(),isSat=d===6,isSun=d===0;
  const tl=(()=>{if(!bb&&!hrv)return null;let sc=0;const n=parseInt(bb);if(!isNaN(n)){if(n>=70)sc+=3;else if(n>=50)sc+=2;else if(n>=35)sc+=1;else sc-=2;}if(hrv==="balanced")sc+=2;else if(hrv==="above")sc+=1;else if(hrv==="below")sc-=1;else if(hrv==="low")sc-=1;else if(hrv==="poor")sc-=2;if(sc>=4)return{e:"🟢",s:"Green — Train as Planned",d:`BB ${bb} · HRV ${hrv}`,bg:"rgba(105,219,124,.1)",z:"Full session",zc:"g"};if(sc>=1)return{e:"🟡",s:"Yellow — Reduce Intensity",d:"Z2 only · −20% duration",bg:"rgba(255,212,59,.1)",z:"Z2 only",zc:"y"};return{e:"🔴",s:"Red — Rest or Z1 Only",d:"Skip hard training",bg:"rgba(255,107,107,.1)",zc:"r"};})();
  const wS=new Date();wS.setDate(wS.getDate()-wS.getDay());wS.setHours(0,0,0,0);
  const weekVol=sessions.filter(s=>new Date(s.date)>=wS).reduce((a,s)=>a+(s.dur||0),0);
  const pct=Math.min(100,Math.round(weekVol/(plan.runDur+plan.rideDur+85)*100));
  const todayWos=isSat?[workouts.sat_run,workouts.sat_bike]:isSun?[workouts.sun_swim,workouts.sun_strength]:[];
  const oocDayIdx=currentOOC?Math.floor((new Date(todayStr())-new Date(currentOOC.start))/(86400000)):0;
  const oocSession=currentOOC?(OOC_PLAN[Math.min(currentOOC.days,5)]||[])[oocDayIdx]:null;
  return(
    <div>
      <div style={S.hdr}>
        <div style={S.eye}>Phase 1 — Foundation</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div style={S.ttl}>{DAYS[dow()]}</div>
          <div style={{marginBottom:20}}>{currentOOC?<span style={S.bdg("b")}>Out of Camp</span>:isWknd()?<span style={S.bdg("g")}>Training Day</span>:<span style={S.bdg("default")}>Rest Day</span>}</div>
        </div>
      </div>
      {(satMissed||sunMissed)&&<div style={{...S.card,background:"rgba(255,212,59,.06)",border:"1px solid rgba(255,212,59,.25)"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#ffd43b",marginBottom:8}}>⚠️ Missed sessions this week</div>
        {satMissed&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:sunMissed?"1px solid #2a2a2a":"none"}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Saturday — Run + Ride</div><div style={{fontSize:11,color:"#555"}}>{thisSatStr}</div></div>
          <button onClick={()=>onMissed({date:thisSatStr,type:"sat",plan})} style={{padding:"7px 14px",background:"rgba(255,212,59,.1)",border:"1px solid rgba(255,212,59,.3)",borderRadius:8,fontSize:12,fontWeight:700,color:"#ffd43b",cursor:"pointer"}}>Decide →</button>
        </div>}
        {sunMissed&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Sunday — Swim + Strength</div><div style={{fontSize:11,color:"#555"}}>{thisSun}</div></div>
          <button onClick={()=>onMissed({date:thisSun,type:"sun",plan})} style={{padding:"7px 14px",background:"rgba(255,212,59,.1)",border:"1px solid rgba(255,212,59,.3)",borderRadius:8,fontSize:12,fontWeight:700,color:"#ffd43b",cursor:"pointer"}}>Decide →</button>
        </div>}
      </div>}
      <div style={{...S.card,padding:"12px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div><div style={S.ct}>Training Week</div><div style={{fontFamily:"monospace",fontSize:28,fontWeight:800,color:"#69db7c"}}>WK {plan.week}</div></div>
          <div style={{textAlign:"right"}}><div style={S.ct}>This Week</div><div style={{fontFamily:"monospace",fontSize:24,fontWeight:700}}>{weekVol}<span style={{fontSize:12,color:"#555"}}> min</span></div></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#555",fontFamily:"monospace",marginBottom:4}}><span>Weekly volume</span><span>{pct}%</span></div>
        <div style={{height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"#69db7c",borderRadius:2}}/></div>
        <div style={{marginTop:8,fontSize:10,color:"#555",fontFamily:"monospace"}}>{plan.adj==="deload"?"🔴 Deload — ACWR high, load reduced 40%":plan.adj==="reduce"?"🟡 Reduced load — ACWR elevated":plan.cycles>0?`📈 Cycle ${plan.cycles} — ${Math.round((Math.pow(1.08,plan.cycles)-1)*100)}% above base`:"Building base — auto-increases every 4 weeks"}</div>
      </div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={S.ct}>Garmin Morning Report</div>{saved&&<span style={{fontSize:9,color:"#69db7c",fontFamily:"monospace"}}>SAVED ✓</span>}</div>
        <div style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #242424"}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>Body Battery</div><div style={{fontSize:10,color:"#555",fontFamily:"monospace",marginTop:1}}>0–100</div></div>
          <input type="number" value={bb} onChange={e=>{setBb(e.target.value);setSaved(false);}} placeholder="71" style={{...S.inp,width:66,textAlign:"center"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"10px 0"}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>HRV Status</div><div style={{fontSize:10,color:"#555",fontFamily:"monospace",marginTop:1}}>Morning Report</div></div>
          <select value={hrv} onChange={e=>{setHrv(e.target.value);setSaved(false);}} style={{...S.inp,width:158,fontSize:11}}>
            <option value="">Select</option>
            <option value="balanced">Balanced ✅</option>
            <option value="above">Above baseline</option>
            <option value="below">Below baseline ⚠️</option>
            <option value="low">Low ⚠️</option>
            <option value="poor">Poor 🔴</option>
          </select>
        </div>
        <button style={S.btn("p")} onClick={()=>{saveCheckin({date:todayStr(),bb,hrv});setSaved(true);}}>Save Check-in</button>
      </div>
      <div style={{...S.card,textAlign:"center",padding:"20px 16px"}}>
        {tl?(<><div style={{width:76,height:76,borderRadius:"50%",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,background:tl.bg}}>{tl.e}</div><div style={{fontSize:20,fontWeight:800,marginBottom:6}}>{tl.s}</div><div style={{fontSize:11,color:"#888",lineHeight:1.6}}>{tl.d}</div><div style={{marginTop:10}}><span style={S.bdg(tl.zc)}>{tl.z}</span></div></>):(
          <><div style={{width:76,height:76,borderRadius:"50%",margin:"0 auto 12px",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:28}}>—</div><div style={{fontSize:18,fontWeight:800}}>Log Your Garmin Stats</div><div style={{fontSize:11,color:"#555",marginTop:6}}>Enter Body Battery + HRV above.</div></>
        )}
      </div>
      {currentOOC&&oocSession&&<>
        <div style={{margin:"4px 20px 8px",fontSize:9,color:"#4dabf7",fontFamily:"monospace",letterSpacing:"0.14em",textTransform:"uppercase"}}>Out of Camp — Today</div>
        <div style={{...S.card,border:"1px solid rgba(77,171,247,.2)",background:"rgba(77,171,247,.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:42,height:42,borderRadius:10,background:TBG[oocSession.type]||"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{TICON[oocSession.type]}</div>
            <div><div style={{fontSize:18,fontWeight:800}}>{oocSession.label}</div><div style={{fontSize:11,color:"#555",marginTop:2}}>{oocSession.detail}</div></div>
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:10}}>Day {oocDayIdx+1} of your {currentOOC.days}-day out-of-camp plan</div>
          <button style={{...S.btn("blue"),marginTop:0}}>▶ Start Session</button>
        </div>
      </>}
      {!currentOOC&&todayWos.length>0&&<>
        <div style={{margin:"4px 20px 8px",fontSize:9,color:"#555",fontFamily:"monospace",letterSpacing:"0.14em",textTransform:"uppercase"}}>Today's Sessions</div>
        {todayWos.map(w=>(
          <div key={w.id} style={{margin:"0 16px 10px",background:"#161616",border:"1px solid #242424",borderRadius:14,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #242424"}}>
              <div style={{width:42,height:42,borderRadius:10,background:TBG[w.type]||"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{TICON[w.type]}</div>
              <div style={{flex:1}}><div style={{fontSize:18,fontWeight:800}}>{w.title}</div><div style={{fontSize:10,fontFamily:"monospace",color:"#555",marginTop:2}}>{w.badge}</div></div>
            </div>
            {w.targetHRLow&&<div style={{padding:"10px 16px",display:"flex",gap:8,borderBottom:"1px solid #242424"}}><span>🎯</span><span style={{fontSize:12,color:"#69db7c",fontWeight:600}}>HR: {w.targetHRLow}–{w.targetHRHigh} bpm</span></div>}
            {w.logType==="strength"&&<div style={{padding:"10px 16px",display:"flex",gap:8,borderBottom:"1px solid #242424"}}><span>💪</span><span style={{fontSize:12,color:"#ff922b",fontWeight:600}}>{w.exercises?.length} exercises · 2 sets to failure</span></div>}
            <button onClick={()=>onStart(w)} style={{width:"100%",padding:"13px",background:"none",border:"none",cursor:"pointer",color:"#69db7c",fontSize:13,fontWeight:700,letterSpacing:"0.06em"}}>▶ START WORKOUT</button>
          </div>
        ))}
      </>}
      {!currentOOC&&!isWknd()&&<div style={{...S.card,textAlign:"center",padding:"28px 16px"}}>
        <div style={{fontSize:44,marginBottom:10}}>🏕️</div>
        <div style={{fontSize:28,fontWeight:900,marginBottom:8}}>NS Rest Day</div>
        <div style={{fontSize:12,color:"#555",lineHeight:1.7}}>Got unexpected time off?<br/>Add it in the Schedule tab ↓</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
          {[["Sat",daysUntil(6)],["Sun",daysUntil(0)]].map(([l,n])=>(
            <div key={l} style={{background:"#1a1a1a",borderRadius:12,padding:"12px 20px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:32,fontWeight:800,color:"#69db7c"}}>{n}</div>
              <div style={{fontSize:9,color:"#555",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.08em"}}>days to {l}</div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

function MissedModal({missed,plan,onDecide,onClose}){
  const isSat=missed.type==="sat";
  const nextDay=daysUntil(dow()===6?0:6);
  return(
    <div style={{...S.app,paddingBottom:0,overflowY:"auto",padding:"48px 20px 30px"}}>
      <div style={{fontSize:10,color:"#555",fontFamily:"monospace",textTransform:"uppercase",marginBottom:4}}>Missed Session</div>
      <div style={{fontSize:32,fontWeight:900,marginBottom:4}}>{isSat?"Saturday":"Sunday"}</div>
      <div style={{fontSize:13,color:"#555",marginBottom:24}}>{missed.date} · {isSat?"Zone 2 Run + Brick Ride":"Technique Swim + Strength"}</div>
      <div style={{fontSize:12,color:"#aaa",lineHeight:1.7,marginBottom:20}}>Missing sessions is part of any long-term plan. Choose how to handle it:</div>
      <div style={{...S.card,margin:"0 0 10px",border:"1px solid rgba(105,219,124,.25)",background:"rgba(105,219,124,.04)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#69db7c",marginBottom:6}}>Option 1 — Make-up session</div>
        <div style={{fontSize:12,color:"#888",lineHeight:1.6,marginBottom:12}}>Schedule the priority session ({isSat?"Zone 2 Run":"Technique Swim"}) on the next available day, {nextDay} day{nextDay>1?"s":""} away.</div>
        <button style={{...S.btn("p"),marginTop:0}} onClick={()=>onDecide(missed.date,"makeup",{date:addDays(nextDay),type:isSat?"run":"swim",zone:2,dur:isSat?plan.runDur:40,load:isSat?plan.runDur*3:120,notes:"Make-up session",autoLogged:false})}>Add make-up session ✓</button>
      </div>
      <div style={{...S.card,margin:"0 0 10px"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Option 2 — Skip & continue</div>
        <div style={{fontSize:12,color:"#888",lineHeight:1.6,marginBottom:12}}>Mark as skipped. Plan continues next weekend as normal. Best if you were sick or needed the rest.</div>
        <button style={S.btn("ghost")} onClick={()=>onDecide(missed.date,"skip",null)}>Skip — continue as planned</button>
      </div>
      <div style={{...S.card,margin:"0 0 20px"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Option 3 — Push plan back 1 week</div>
        <div style={{fontSize:12,color:"#888",lineHeight:1.6,marginBottom:12}}>Shifts this week's sessions to next weekend. Use for significant disruptions only.</div>
        <button style={S.btn("warn")} onClick={()=>onDecide(missed.date,"pushback",null)}>Push back 1 week</button>
      </div>
      <button style={{...S.btn("ghost"),marginTop:0}} onClick={onClose}>Decide later</button>
    </div>
  );
}

function Schedule({sessions,plan,oocPeriods,setOocPeriods,missedDecisions,onMissed,thisSatStr,thisSun,satLogged,sunLogged,showToast}){
  const [showForm,setShowForm]=useState(false);
  const [oocStart,setOocStart]=useState("");const [oocEnd,setOocEnd]=useState("");
  const days=oocStart&&oocEnd&&new Date(oocEnd)>=new Date(oocStart)?Math.ceil((new Date(oocEnd)-new Date(oocStart))/86400000)+1:0;
  const addOOC=()=>{if(!days){showToast("Set valid dates");return;}setOocPeriods([...oocPeriods,{start:oocStart,end:oocEnd,days}]);setOocStart("");setOocEnd("");setShowForm(false);showToast(`${days}-day out-of-camp plan created ✓`);};
  const now=new Date();
  const wkStart=new Date(now);wkStart.setDate(now.getDate()-now.getDay());wkStart.setHours(0,0,0,0);
  const calDays=Array.from({length:14},(_,i)=>{
    const d=new Date(wkStart);d.setDate(d.getDate()+i);
    const ds=d.toISOString().split("T")[0];
    const dw=d.getDay();
    const logged=sessions.some(s=>s.date===ds);
    const inOOC=oocPeriods.some(p=>ds>=p.start&&ds<=p.end);
    const missed=missedDecisions[ds];
    const isToday=ds===todayStr();
    const isFuture=d>now;
    return{d,ds,dw,isSat:dw===6,isSun:dw===0,logged,inOOC,missed,isToday,isFuture};
  });
  return(
    <div>
      <div style={S.hdr}><div style={S.eye}>Training Schedule</div><div style={S.ttl}>Schedule</div></div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showForm?12:0}}>
          <div><div style={S.ct}>Out-of-camp periods</div>{!showForm&&<div style={{fontSize:12,color:"#555"}}>Got unexpected days off? Add them for a daily training plan.</div>}</div>
          <button onClick={()=>setShowForm(v=>!v)} style={{padding:"8px 14px",background:"rgba(77,171,247,.1)",border:"1px solid rgba(77,171,247,.3)",borderRadius:8,fontSize:12,fontWeight:700,color:"#4dabf7",cursor:"pointer",flexShrink:0}}>{showForm?"Cancel":"+ Add"}</button>
        </div>
        {showForm&&<div>
          <div style={{fontSize:11,color:"#555",marginBottom:12,lineHeight:1.6}}>Set your dates. App generates an optimised daily plan based on how many days you have.</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:5}}>START</div><input type="date" value={oocStart} onChange={e=>setOocStart(e.target.value)} style={S.inp}/></div>
            <div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:5}}>END</div><input type="date" value={oocEnd} onChange={e=>setOocEnd(e.target.value)} style={S.inp}/></div>
          </div>
          {days>0&&<div style={{background:"#1a1a1a",borderRadius:10,padding:12,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#4dabf7",marginBottom:8}}>{days}-day plan preview</div>
            {(OOC_PLAN[Math.min(days,5)]||[]).map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<Math.min(days,5)-1?"1px solid #242424":"none"}}>
              <div style={{fontSize:14}}>{TICON[t.type]}</div>
              <div><div style={{fontSize:12,fontWeight:500}}>Day {i+1} — {t.label}</div><div style={{fontSize:10,color:"#555"}}>{t.detail}</div></div>
            </div>)}
          </div>}
          <button style={{...S.btn("p"),marginTop:0}} onClick={addOOC}>Create plan ✓</button>
        </div>}
        {oocPeriods.length>0&&!showForm&&oocPeriods.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid #242424",marginTop:8}}>
          <span style={S.bdg("b")}>OOC</span>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{p.start} → {p.end}</div><div style={{fontSize:10,color:"#555"}}>{p.days} days</div></div>
          <button onClick={()=>setOocPeriods(oocPeriods.filter((_,j)=>j!==i))} style={{padding:"4px 10px",background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.2)",borderRadius:6,fontSize:11,color:"#ff6b6b",cursor:"pointer"}}>Remove</button>
        </div>)}
      </div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={S.ct}>2-Week View</div>
          <div style={{display:"flex",gap:5}}><span style={S.bdg("g")}>trained</span><span style={S.bdg("y")}>missed</span><span style={S.bdg("b")}>OOC</span></div>
        </div>
        {calDays.map((d,i)=>(
          <div key={i}>
            {(i===0||i===7)&&<div style={{fontSize:9,color:"#555",fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase",padding:"8px 0 4px",borderTop:i===7?"1px solid #242424":"none",marginTop:i===7?8:0}}>{i===0?"This Week":"Next Week"}</div>}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<13?"1px solid #1a1a1a":"none",opacity:d.isFuture&&!d.inOOC&&!d.isSat&&!d.isSun?.45:1}}>
              <div style={{width:44,flexShrink:0,textAlign:"center"}}>
                <div style={{fontSize:10,color:d.isToday?"#69db7c":d.isSat||d.isSun?"#f4f1eb":"#555",fontWeight:d.isToday?700:400,fontFamily:"monospace"}}>{DSHORT[d.dw]}</div>
                <div style={{fontSize:18,fontWeight:800,color:d.isToday?"#69db7c":"#f4f1eb",fontFamily:"monospace"}}>{d.d.getDate()}</div>
              </div>
              <div style={{flex:1}}>
                {d.inOOC?<div style={{display:"flex",alignItems:"center",gap:6}}><span style={S.bdg("b")}>OOC</span><span style={{fontSize:12,color:"#4dabf7"}}>Daily plan active</span></div>
                :d.isSat?<div><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:12,color:d.logged?"#69db7c":d.isFuture?"#444":"#f4f1eb"}}>🏃 Run + 🚴 Ride</span>{d.logged&&<span style={S.bdg("g")}>done</span>}{d.missed&&<span style={S.bdg("y")}>{d.missed}</span>}</div>{!d.logged&&!d.isFuture&&!d.missed&&<button onClick={()=>onMissed({date:d.ds,type:"sat",plan})} style={{marginTop:4,padding:"3px 10px",background:"rgba(255,212,59,.1)",border:"1px solid rgba(255,212,59,.3)",borderRadius:6,fontSize:10,color:"#ffd43b",cursor:"pointer"}}>Handle missed →</button>}</div>
                :d.isSun?<div><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:12,color:d.logged?"#69db7c":d.isFuture?"#444":"#f4f1eb"}}>🏊 Swim + 💪 Strength</span>{d.logged&&<span style={S.bdg("g")}>done</span>}{d.missed&&<span style={S.bdg("y")}>{d.missed}</span>}</div>{!d.logged&&!d.isFuture&&!d.missed&&<button onClick={()=>onMissed({date:d.ds,type:"sun",plan})} style={{marginTop:4,padding:"3px 10px",background:"rgba(255,212,59,.1)",border:"1px solid rgba(255,212,59,.3)",borderRadius:6,fontSize:10,color:"#ffd43b",cursor:"pointer"}}>Handle missed →</button>}</div>
                :<span style={{fontSize:12,color:"#333"}}>Rest day</span>}
              </div>
              <div style={{width:8,height:8,borderRadius:"50%",background:d.inOOC?"#4dabf7":d.logged?"#69db7c":d.missed?"#ffd43b":(d.isSat||d.isSun)&&!d.isFuture?"#ff6b6b":"#222",flexShrink:0}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Load({sessions,checkins,plan}){
  const zc=["#4dabf7","#69db7c","#ffd43b","#ff922b","#ff6b6b"];
  const now=new Date();
  const wS=ago=>{const d=new Date(now);d.setDate(d.getDate()-d.getDay()-ago*7);d.setHours(0,0,0,0);return d;};
  const wE=ago=>{const d=wS(ago);d.setDate(d.getDate()+6);d.setHours(23,59,59,999);return d;};
  const d7=new Date(now);d7.setDate(d7.getDate()-7);
  const d28=new Date(now);d28.setDate(d28.getDate()-28);
  const acute=sessions.filter(s=>new Date(s.date)>=d7).reduce((a,s)=>a+(s.load||0),0);
  const chronic=sessions.filter(s=>new Date(s.date)>=d28).reduce((a,s)=>a+(s.load||0),0)/4;
  const acwr=chronic>0?acute/chronic:0;
  const ac=acwr<0.8?"#4dabf7":acwr<=1.3?"#69db7c":acwr<=1.5?"#ffd43b":"#ff6b6b";
  const al=!sessions.length?"Log sessions to calculate":acwr<0.8?"Undertraining":acwr<=1.3?"Sweet spot ✅":acwr<=1.5?"Caution":"Danger — rest today";
  const needle=Math.min(100,Math.round(Math.min(acwr,2)/2*100));
  const thisWeek=sessions.filter(s=>{const d=new Date(s.date);return d>=wS(0)&&d<=wE(0);});
  const zdur={1:0,2:0,3:0,4:0,5:0};thisWeek.filter(s=>s.type!=="strength").forEach(s=>{if(s.zone)zdur[s.zone]+=(s.dur||0);});
  const tot=Object.values(zdur).reduce((a,b)=>a+b,0);
  const loadData=Array.from({length:8},(_,i)=>{const ws=wS(7-i),we=wE(7-i);return{w:`${ws.getDate()}/${ws.getMonth()+1}`,v:sessions.filter(s=>{const d=new Date(s.date);return d>=ws&&d<=we;}).reduce((a,s)=>a+(s.load||0),0)};});
  const bbData=checkins.slice(-7).map(c=>({d:c.date.slice(5),v:parseInt(c.bb)||0}));
  const strSess=sessions.filter(s=>s.type==="strength"&&s.exercises);
  const lw={};strSess.forEach(sess=>sess.exercises?.forEach(ex=>{if(ex.set2Weight)lw[ex.name]={reps:ex.set2Reps,weight:ex.set2Weight,date:sess.date};}));
  return(
    <div>
      <div style={S.hdr}><div style={S.eye}>Training Science</div><div style={S.ttl}>Load</div></div>
      <div style={S.card}>
        <div style={S.ct}>ACWR — updates every session</div>
        <div style={{fontFamily:"monospace",fontSize:64,fontWeight:900,textAlign:"center",lineHeight:1,marginBottom:2,color:ac}}>{sessions.length?acwr.toFixed(2):"—"}</div>
        <div style={{fontFamily:"monospace",fontSize:11,color:"#555",textAlign:"center",marginBottom:14}}>{al}</div>
        <div style={{position:"relative",marginBottom:4}}>
          <div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden"}}>{[["#0d2035","40%"],["#0d2e18","25%"],["#2e1f08","10%"],["#2e0d0d","25%"]].map(([bg,w],i)=><div key={i} style={{width:w,background:bg}}/>)}</div>
          <div style={{position:"relative",height:0}}><div style={{position:"absolute",top:-16,left:`${needle}%`,width:2,height:18,background:"#f4f1eb",borderRadius:2,transform:"translateX(-50%)"}}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#555",fontFamily:"monospace",marginTop:8}}><span>0</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.0</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>{[["Acute 7d",acute,"#4dabf7"],["Chronic 28d",Math.round(chronic),"#555"]].map(([l,v,col])=><div key={l} style={{background:"#1a1a1a",borderRadius:10,padding:12}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",textTransform:"uppercase"}}>{l}</div><div style={{fontFamily:"monospace",fontSize:28,fontWeight:800,color:col}}>{v}</div></div>)}</div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>Zone Distribution — Cardio</div>
        {!tot?<div style={{fontSize:12,color:"#555",textAlign:"center",padding:"12px 0"}}>No cardio sessions logged</div>:(
          <>{[1,2,3,4,5].map((z,i)=>{const m=zdur[z]||0,p=Math.round(m/tot*100);return(<div key={z} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:zc[i],fontWeight:700,fontFamily:"monospace"}}>Z{z}</span><span style={{color:"#555",fontFamily:"monospace"}}>{m}min · {p}%</span></div><div style={{height:5,background:"#1a1a1a",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:zc[i],borderRadius:3}}/></div></div>);})}
          <div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>Z1+Z2: {Math.round(((zdur[1]+zdur[2])/(tot||1))*100)}% · target ≥80%</div></>
        )}
      </div>
      {Object.keys(lw).length>0&&<div style={S.card}><div style={S.ct}>Strength — Latest Numbers</div>{Object.entries(lw).map(([name,data])=><div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1a1a1a"}}><div style={{fontSize:12}}>{name}</div><div style={{textAlign:"right"}}><span style={{fontFamily:"monospace",fontWeight:700,color:"#ff922b"}}>{data.weight}kg × {data.reps}</span><div style={{fontSize:9,color:"#555",fontFamily:"monospace"}}>{data.date}</div></div></div>)}</div>}
      <div style={S.card}><div style={S.ct}>8-Week Load</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:5,height:110,padding:"8px 0"}}>
          {loadData.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",background:d.v===0?"#1a1a1a":d.v<800?"#69db7c":d.v<1500?"#ffd43b":"#ff6b6b",borderRadius:"4px 4px 0 0",height:`${d.v>0?Math.max(6,Math.round(d.v/800*90)):0}%`,transition:"height .5s"}}/><div style={{fontSize:8,color:"#555",fontFamily:"monospace",whiteSpace:"nowrap"}}>{d.w}</div></div>)}
        </div>
      </div>
      <div style={S.card}><div style={S.ct}>Body Battery — 7 Days</div>
        {bbData.length<2?<div style={{fontSize:12,color:"#555",textAlign:"center",padding:"12px 0"}}>Log check-ins to see trend</div>:(
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:70}}>
            {bbData.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{fontSize:9,color:"#69db7c",fontFamily:"monospace",fontWeight:700}}>{d.v}</div><div style={{width:"100%",background:"rgba(105,219,124,.2)",borderRadius:"4px 4px 0 0",height:`${d.v}%`}}/></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({sessions,milestones,toggleM,showToast}){
  const done=MILESTONES.filter(m=>milestones[m.id]).length;
  const strSess=sessions.filter(s=>s.type==="strength"&&s.exercises);
  const prs={};strSess.forEach(sess=>sess.exercises?.forEach(ex=>{const vol=(parseInt(ex.set1Reps)||0)*(parseInt(ex.set1Weight)||0)+(parseInt(ex.set2Reps)||0)*(parseInt(ex.set2Weight)||0);if(!prs[ex.name]||vol>prs[ex.name].vol)prs[ex.name]={vol,reps:ex.set2Reps,weight:ex.set2Weight,date:sess.date};}));
  return(
    <div>
      <div style={S.hdr}><div style={S.eye}>Ironman 2032–2035</div><div style={S.ttl}>Progress</div></div>
      <div style={S.card}>
        <div style={S.ct}>Phase 1 Milestones</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#555"}}>Completed</span><span style={{fontFamily:"monospace",color:"#69db7c",fontWeight:700}}>{done} / {MILESTONES.length}</span></div>
        <div style={{height:4,background:"#1a1a1a",borderRadius:2,marginBottom:12,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(done/MILESTONES.length*100)}%`,background:"#69db7c",borderRadius:2,transition:"width .5s"}}/></div>
        {MILESTONES.map(m=><div key={m.id} onClick={()=>{toggleM(m.id);showToast(milestones[m.id]?"Unchecked":"Milestone achieved! 🎉");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #1e1e1e",cursor:"pointer"}}><div style={{width:22,height:22,borderRadius:"50%",border:milestones[m.id]?"none":"1.5px solid #333",background:milestones[m.id]?"#69db7c":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{milestones[m.id]&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}</div><span style={{fontSize:12,lineHeight:1.4,color:milestones[m.id]?"#444":"#f4f1eb",textDecoration:milestones[m.id]?"line-through":"none"}}>{m.text}</span></div>)}
      </div>
      {Object.keys(prs).length>0&&<div style={S.card}><div style={S.ct}>Strength PRs</div>{Object.entries(prs).map(([name,data])=><div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1a1a1a"}}><div style={{fontSize:12}}>{name}</div><div style={{textAlign:"right"}}><span style={{fontFamily:"monospace",fontWeight:700,color:"#ff922b"}}>{data.weight}kg × {data.reps}</span><div style={{fontSize:9,color:"#555",fontFamily:"monospace"}}>{data.date}</div></div></div>)}</div>}
      <div style={{background:"rgba(105,219,124,.04)",border:"1px solid rgba(105,219,124,.15)",borderRadius:14,padding:16,margin:"0 16px 10px"}}>
        <div style={S.ct}>AI Coaching Engine</div>
        <div style={{fontSize:12,color:"#555",lineHeight:1.6,marginBottom:12}}>Analyses all sessions, HR trends and strength PRs. Generates personalised coaching updates weekly.</div>
        <button style={{...S.btn("p"),marginTop:0}} onClick={async()=>{showToast("⚡ Generating...");try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`Elite triathlon coach. Athlete: 20yo male Singapore, Ironman 2032-2035, NS weekends only. Run Z2:143-157, Bike Z2:133-148. Sessions logged: ${sessions.length}. Give 3 specific coaching tips based on week ${getWeek()} of training.`}]})});const data=await res.json();showToast(data.content?.[0]?.text?.slice(0,60)+"..."||"Done");}catch(e){showToast("Connect to live app for AI coaching");}}}>⚡ GENERATE COACHING INSIGHTS</button>
      </div>
    </div>
  );
}

function Log({sessions,workouts,onStart}){
  return(
    <div>
      <div style={S.hdr}><div style={S.eye}>After Every Session</div><div style={S.ttl}>Log</div></div>
      <div style={S.card}>
        <div style={S.ct}>Quick Start — Select & Go</div>
        <div style={{fontSize:11,color:"#555",marginBottom:12}}>Tap to start with live timer. Auto-logs when finished.</div>
        {Object.values(workouts).map(w=><div key={w.id} onClick={()=>onStart(w)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#1a1a1a",borderRadius:10,marginBottom:6,cursor:"pointer"}}><div style={{fontSize:20}}>{TICON[w.type]}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{w.title}</div><div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{w.badge}</div></div><div style={{color:"#69db7c",fontSize:12,fontWeight:700}}>▶ START</div></div>)}
      </div>
      <div style={S.card}>
        <div style={S.ct}>Recent Sessions</div>
        {!sessions.length?<div style={{fontSize:12,color:"#555",textAlign:"center",padding:"16px 0"}}>No sessions yet — tap Start above</div>:(
          [...sessions].reverse().slice(0,5).map((ss,i)=>{
            const isStr=ss.type==="strength";
            return(
              <div key={i} style={{padding:"10px 0",borderBottom:i<4?"1px solid #1e1e1e":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:32,height:32,borderRadius:9,background:TBG[ss.type]||"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{TICON[ss.type]}</div>
                    <div><div style={{fontSize:12,fontWeight:600,textTransform:"capitalize"}}>{isStr?(ss.strengthType==="upper"?"Upper Day":"Lower Day"):ss.type}{ss.autoLogged?" 🤖":""}</div><div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{ss.date} · {ss.dur}min</div></div>
                  </div>
                  {isStr?<span style={S.bdg("o")}>{ss.exercises?.filter(e=>e.set1Reps).length||0} ex</span>:<span style={S.bdg(ss.zone<=2?"g":ss.zone===3?"y":"r")}>Z{ss.zone}</span>}
                </div>
                {isStr&&ss.exercises?.some(e=>e.set2Weight)&&<div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>{ss.exercises.filter(e=>e.set2Weight).slice(0,3).map(ex=><span key={ex.name} style={{fontSize:9,fontFamily:"monospace",background:"#1a1a1a",padding:"2px 6px",borderRadius:6,color:"#ff922b"}}>{ex.name.split(" ").slice(-1)[0]} {ex.set2Weight}kg×{ex.set2Reps}</span>)}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ActiveWorkout({workout,plan,onComplete,onCancel}){
  const [phase,setPhase]=useState("brief");
  const [elapsed,setElapsed]=useState(0);
  const [stepIdx,setStepIdx]=useState(0);
  const [zone,setZone]=useState(2);
  const [avghr,setAvghr]=useState("");const [pace,setPace]=useState("");const [dist,setDist]=useState("");const [rpe,setRpe]=useState(null);
  const [exLogs,setExLogs]=useState(()=>(workout.exercises||[]).map(name=>({name,set1Reps:"",set1Weight:"",set2Reps:"",set2Weight:""})));
  const timer=useRef(null);
  const zones=workout.zoneTable==="bike"?ZONES_BIKE:ZONES_RUN;
  const isStr=workout.logType==="strength";
  useEffect(()=>{if(phase==="active"){timer.current=setInterval(()=>setElapsed(e=>e+1),1000);}else{clearInterval(timer.current);}return()=>clearInterval(timer.current);},[phase]);
  const upEx=(i,f,v)=>setExLogs(p=>p.map((e,j)=>j===i?{...e,[f]:v}:e));
  const durMins=Math.max(1,Math.round(elapsed/60));

  if(phase==="brief")return(
    <div style={{...S.app,paddingBottom:0,overflowY:"auto",padding:"48px 20px 30px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{width:50,height:50,borderRadius:12,background:TBG[workout.type]||"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{TICON[workout.type]}</div>
        <div><div style={{fontSize:10,color:"#555",fontFamily:"monospace",textTransform:"uppercase"}}>Ready to start</div><div style={{fontSize:26,fontWeight:900}}>{workout.title}</div></div>
      </div>
      {workout.targetHRLow&&<div style={{...S.card,margin:"0 0 10px",padding:"12px 16px",display:"flex",gap:10,alignItems:"center",background:"rgba(105,219,124,.04)",border:"1px solid rgba(105,219,124,.2)"}}><span>🎯</span><div><div style={{fontSize:13,fontWeight:700,color:"#69db7c"}}>HR: {workout.targetHRLow}–{workout.targetHRHigh} bpm</div><div style={{fontSize:11,color:"#555"}}>{workout.type==="bike"?"Bike Zone 2 — lower than run":"Run Zone 2"}</div></div></div>}
      {isStr&&workout.exercises&&<div style={{...S.card,margin:"0 0 10px"}}><div style={S.ct}>Today's Exercises</div>{workout.exercises.map((ex,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<workout.exercises.length-1?"1px solid #1a1a1a":"none"}}><div style={{width:20,height:20,borderRadius:"50%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"monospace",color:"#555",flexShrink:0}}>{i+1}</div><div style={{flex:1,fontSize:13}}>{ex}</div><span style={S.bdg("o")}>2 sets</span></div>)}</div>}
      <div style={{...S.card,margin:"0 0 10px"}}><div style={S.ct}>Steps</div>{workout.steps.map((st,i)=><div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<workout.steps.length-1?"1px solid #1a1a1a":"none"}}><div style={{width:22,height:22,borderRadius:"50%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"monospace",color:"#555",flexShrink:0}}>{i+1}</div><div><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{st.t}</div><div style={{fontSize:11,color:"#666",lineHeight:1.6}}>{st.d}</div></div></div>)}</div>
      <div style={{margin:"0 0 12px",padding:"10px 14px",background:"rgba(105,219,124,.04)",borderLeft:"2px solid #69db7c",borderRadius:"0 10px 10px 0",fontSize:11,color:"#aaa",lineHeight:1.6}}><b style={{color:"#69db7c"}}>Coach:</b> {workout.note}</div>
      <div style={{fontSize:11,color:"#555",marginBottom:12}}>📍 {workout.loc}</div>
      <button style={{...S.btn("p"),fontSize:16,fontWeight:900,padding:16}} onClick={()=>setPhase("active")}>▶ START WORKOUT</button>
      <button style={S.btn("ghost")} onClick={onCancel}>Cancel</button>
    </div>
  );

  if(phase==="active")return(
    <div style={{...S.app,paddingBottom:0,minHeight:"100vh",display:"flex",flexDirection:"column",padding:"48px 20px 20px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:10,color:"#555",fontFamily:"monospace",textTransform:"uppercase",marginBottom:6}}>Elapsed</div>
        <div style={{fontSize:68,fontWeight:900,fontFamily:"monospace",color:"#69db7c",lineHeight:1}}>{fmtTime(elapsed)}</div>
        <div style={{fontSize:12,color:"#555",marginTop:6}}>Target: {workout.targetDur||45} min</div>
        <div style={{height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden",margin:"8px 40px 2px"}}><div style={{height:"100%",width:`${Math.min(100,Math.round(elapsed/((workout.targetDur||45)*60)*100))}%`,background:"#69db7c",borderRadius:2,transition:"width 1s"}}/></div>
        <div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{Math.min(100,Math.round(elapsed/((workout.targetDur||45)*60)*100))}%</div>
      </div>
      {workout.targetHRLow&&<div style={{...S.card,margin:"0 0 12px",textAlign:"center",padding:"12px"}}><div style={S.ct}>HR Target</div><div style={{fontSize:36,fontWeight:900,color:"#69db7c",fontFamily:"monospace"}}>{workout.targetHRLow}–{workout.targetHRHigh}</div><div style={{fontSize:11,color:"#555"}}>bpm</div></div>}
      <div style={{...S.card,margin:"0 0 12px",flex:1,overflowY:"auto"}}><div style={S.ct}>Steps</div>{workout.steps.map((st,i)=><div key={i} onClick={()=>setStepIdx(i)} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:i<workout.steps.length-1?"1px solid #1a1a1a":"none",cursor:"pointer",opacity:i===stepIdx?1:0.35}}><div style={{width:22,height:22,borderRadius:"50%",background:i===stepIdx?"#69db7c":"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"monospace",color:i===stepIdx?"#000":"#555",flexShrink:0}}>{i+1}</div><div><div style={{fontSize:13,fontWeight:i===stepIdx?700:500,color:i===stepIdx?"#f4f1eb":"#888"}}>{st.t}</div>{i===stepIdx&&<div style={{fontSize:11,color:"#69db7c",marginTop:2,lineHeight:1.5}}>{st.d}</div>}</div></div>)}</div>
      <button style={{...S.btn("p"),fontSize:15,fontWeight:900,padding:15,marginTop:0}} onClick={()=>{clearInterval(timer.current);setPhase("log");}}>✓ FINISH & LOG</button>
      <button style={S.btn("danger")} onClick={onCancel}>Abandon</button>
    </div>
  );

  if(phase==="log"&&isStr)return(
    <div style={{...S.app,paddingBottom:0,overflowY:"auto",padding:"48px 20px 30px"}}>
      <div style={{fontSize:10,color:"#555",fontFamily:"monospace",textTransform:"uppercase",marginBottom:4}}>Nice work 💪</div>
      <div style={{fontSize:36,fontWeight:900,marginBottom:4}}>Log Lifts</div>
      <div style={{fontSize:12,color:"#555",marginBottom:20}}>{workout.title} · {durMins} min</div>
      {exLogs.map((ex,i)=>(
        <div key={i} style={{...S.card,margin:"0 0 10px"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><div style={{width:24,height:24,borderRadius:"50%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"monospace",color:"#555",flexShrink:0}}>{i+1}</div>{ex.name}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["SET 1","#69db7c","set1Reps","set1Weight"],["SET 2","#ff922b","set2Reps","set2Weight"]].map(([lbl,col,rk,wk])=>(
              <div key={lbl} style={{background:"#1a1a1a",borderRadius:10,padding:12}}>
                <div style={{fontSize:9,color:col,fontFamily:"monospace",fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>{lbl}</div>
                <div style={{display:"flex",gap:6}}>
                  <div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:4}}>REPS</div><input type="number" value={ex[rk]} onChange={e=>upEx(i,rk,e.target.value)} placeholder="12" style={{...S.inp,padding:"8px 10px",fontSize:14,textAlign:"center"}}/></div>
                  <div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:4}}>KG</div><input type="number" value={ex[wk]} onChange={e=>upEx(i,wk,e.target.value)} placeholder="20" style={{...S.inp,padding:"8px 10px",fontSize:14,textAlign:"center"}}/></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{padding:"0 0 8px"}}><button style={{...S.btn("p"),fontSize:15,fontWeight:900,padding:15,marginTop:4}} onClick={()=>onComplete({date:todayStr(),type:"strength",strengthType:workout.strengthType,dur:durMins,exercises:exLogs,load:durMins*4,autoLogged:true})}>SAVE ALL LIFTS ✓</button></div>
    </div>
  );

  return(
    <div style={{...S.app,paddingBottom:0,overflowY:"auto",padding:"48px 20px 30px"}}>
      <div style={{fontSize:10,color:"#555",fontFamily:"monospace",textTransform:"uppercase",marginBottom:4}}>Nice work 💪</div>
      <div style={{fontSize:36,fontWeight:900,marginBottom:20}}>Log Session</div>
      <div style={{...S.card,margin:"0 0 12px",background:"rgba(105,219,124,.04)",border:"1px solid rgba(105,219,124,.15)"}}><div style={S.ct}>Auto-filled</div><div style={{display:"flex",gap:20}}><div><div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>DURATION</div><div style={{fontSize:28,fontWeight:900,color:"#69db7c",fontFamily:"monospace"}}>{durMins}<span style={{fontSize:12}}>min</span></div></div><div><div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>TYPE</div><div style={{fontSize:24}}>{TICON[workout.type]}</div></div></div></div>
      <div style={{...S.card,margin:"0 0 12px"}}><div style={S.ct}>Confirm Zone {workout.type==="bike"?"(Bike)":"(Run)"}</div><div style={{display:"flex",gap:5}}>{zones.map(z=><div key={z.z} onClick={()=>setZone(z.z)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`2px solid ${zone===z.z?z.color:"transparent"}`,cursor:"pointer",textAlign:"center",background:z.bg,opacity:zone===z.z?1:0.4}}><div style={{fontSize:12,fontWeight:800,fontFamily:"monospace",color:z.color}}>Z{z.z}</div><div style={{fontSize:9,color:"#555",marginTop:2}}>{z.bpm[0]}–{z.bpm[1]}</div></div>)}</div></div>
      <div style={{...S.card,margin:"0 0 12px"}}><div style={S.ct}>From Garmin</div>
        <div style={{display:"flex",gap:8,marginBottom:workout.type!=="strength"?10:0}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:5}}>AVG HR</div><input type="number" value={avghr} onChange={e=>setAvghr(e.target.value)} placeholder="148" style={S.inp}/></div>
          {workout.type!=="strength"&&<div style={{flex:1}}><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:5}}>{workout.type==="swim"?"PACE/100M":"PACE/KM"}</div><input type="text" value={pace} onChange={e=>setPace(e.target.value)} placeholder={workout.type==="swim"?"2:10":"7:30"} style={S.inp}/></div>}
        </div>
        {workout.type!=="strength"&&<><div style={{fontSize:9,color:"#555",fontFamily:"monospace",marginBottom:5}}>DISTANCE (KM)</div><input type="number" value={dist} onChange={e=>setDist(e.target.value)} placeholder={String(workout.targetDist||"")} step="0.1" style={S.inp}/></>}
      </div>
      <div style={{...S.card,margin:"0 0 12px"}}><div style={S.ct}>RPE</div><div style={{display:"flex",gap:3}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} onClick={()=>setRpe(n)} style={{flex:1,padding:"8px 0",background:rpe===n?"rgba(105,219,124,.08)":"#1a1a1a",border:`2px solid ${rpe===n?"#69db7c":"transparent"}`,borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"center",fontFamily:"monospace",color:rpe===n?"#69db7c":"#555"}}>{n}</div>)}</div></div>
      <button style={{...S.btn("p"),fontSize:15,fontWeight:900,padding:15,marginTop:8}} onClick={()=>onComplete({date:todayStr(),type:workout.type,zone,dur:durMins,dist:parseFloat(dist)||workout.targetDist||null,avghr:parseInt(avghr)||null,pace:pace||null,rpe,load:durMins*(zone+1),autoLogged:true})}>SAVE & COMPLETE ✓</button>
    </div>
  );
}

const I=d=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">{d}</svg>;
const HI=()=>I(<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>);
const CalI=()=>I(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>);
const ChI=()=>I(<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>);
const TrI=()=>I(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>);
const PlI=()=>I(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>);
