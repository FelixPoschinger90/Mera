const boot = document.getElementById('boot');
const enterBtn = document.getElementById('enter');
const bootStatus = document.getElementById('boot-status');
const loadfill = document.getElementById('loadfill');
const bootError = document.getElementById('boot-error');
const hud = document.getElementById('hud');
const help = document.getElementById('help');
const routeStatus = document.getElementById('route-status');
const finish = document.getElementById('finish');
const guideText = document.getElementById('guide-text');
const saveGuideBtn = document.getElementById('save-guide');
const saveNote = document.getElementById('save-note');
const generalization = document.getElementById('generalization');
const generalizationStimuli = document.getElementById('generalization-stimuli');
const generalizationText = document.getElementById('generalization-text');
const submitGeneralizationBtn = document.getElementById('submit-generalization');
const generalizationNote = document.getElementById('generalization-note');
const completeScreen = document.getElementById('complete-screen');
const replayBtn = document.getElementById('replay');
const navPanel = document.getElementById('nav-panel');
const navCopy = document.getElementById('nav-copy');
const navState = document.getElementById('nav-state');
const windNote = document.getElementById('wind-note');
const fieldWeather = document.getElementById('field-weather');
const fieldLightning = document.getElementById('field-lightning');
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatClose = document.getElementById('chat-close');
const chatContext = document.getElementById('chat-context');
const chatLog = document.getElementById('chat-log');
const chatSuggestions = document.getElementById('chat-suggestions');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

window.addEventListener('error', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.error || event.message);
});
window.addEventListener('unhandledrejection', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.reason);
});

function showBootError(err) {
  const message = err?.stack || err?.message || String(err);
  bootStatus.textContent = 'MERA study build failed to initialize.';
  bootError.textContent = message;
  bootError.classList.remove('hidden');
  enterBtn.disabled = true;
}

const intro = document.getElementById('intro');
const introLine = document.getElementById('intro-line');
const cinematicEl = document.getElementById('cinematic');
const cinematicCaption = document.getElementById('cinematic-caption');
const cinematicLine = document.getElementById('cinematic-line');
const outpostContinue = document.getElementById('outpost-continue');

const STUDY_VERSION = 'MERA_E4_5_COUNTERBALANCED_PRODUCTION';
const CONSENT_TEXT_VERSION = 'MERA_CONSENT_V1_2026_10_02';
const STORAGE_CONFIG = globalThis.MERA_STUDY_CONFIG?.storage || {};
const SESSION_PERF_ORIGIN = performance.now();
let gameplayPerfOrigin = null;
let gameplayPerfEnded = null;
function supabaseConfigured(){
  return STORAGE_CONFIG.provider==='supabase' && /^https:\/\//.test(STORAGE_CONFIG.projectUrl||'') && Boolean(STORAGE_CONFIG.publishableKey) && Boolean(STORAGE_CONFIG.table||'mera_sessions');
}

const LEXICAL_ITEMS = ['menic','blicket','boskot','fiffin','virdex','teebu'];
const SLOT_ORDER = [
  'river_bridge','river_ford','woodland_pine','woodland_birch','ascent_ridge','ascent_switchback'
];
const ROUTE_META = {
  river: {
    bridge: {
      slot:'river_bridge', sign:'BRIDGE', cues:'old, narrow, single-file',
      context:w=>`The ${w} bridge is old and narrow, barely single-file. It should still hold.`,
      reinforce:w=>`Stay centred on the ${w} bridge.`
    },
    ford: {
      slot:'river_ford', sign:'CROSSING', cues:'shallow, stone-set, broken by exposed rocks',
      context:w=>`The ${w} crossing is shallow, broken by exposed rocks. Watch your footing.`,
      reinforce:w=>`Keep to the ${w} crossing until you reach the far bank.`
    }
  },
  woodland: {
    pine: {
      slot:'woodland_pine', sign:'TRAIL', cues:'dense, enclosed, wind-sheltered',
      context:w=>`This is the ${w} trail — sheltered beneath dense tree cover. Wind exposure should be lower here.`,
      reinforce:w=>`Stay on the ${w} trail until the trees begin to thin.`
    },
    birch: {
      slot:'woodland_birch', sign:'TRAIL', cues:'open, exposed, wind-hit',
      context:w=>`This is the ${w} trail — open and exposed to the wind. Keep moving.`,
      reinforce:w=>`Stay on the ${w} trail until you reach cover.`
    }
  },
  ascent: {
    ridge: {
      slot:'ascent_ridge', sign:'RIDGE', cues:'steep, direct, loose-rock',
      context:w=>`The ${w} ridge is steep and direct. Expect a hard climb.`,
      reinforce:w=>`Keep climbing the ${w} ridge. The outpost is close.`
    },
    switchback: {
      slot:'ascent_switchback', sign:'PATH', cues:'long, winding, gradual',
      context:w=>`The ${w} path climbs gradually through long turns. It is slower, but easier.`,
      reinforce:w=>`Stay on the ${w} path. Do not cut across the slope.`
    }
  }
};
const GENERALIZATION_STIMULI = {
  river_bridge:{
    id:'pexels_17479947_bridge',
    src:'https://images.pexels.com/photos/17479947/pexels-photo-17479947.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/stream-in-forest-17479947/',
    alt:'A wooden footbridge crossing a forest stream.'
  },
  river_ford:{
    id:'pexels_32286784_ford',
    src:'https://images.pexels.com/photos/32286784/pexels-photo-32286784.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/tranquil-pathway-over-stepping-stones-in-a-stream-32286784/',
    alt:'Stepping stones crossing a shallow stream.'
  },
  woodland_pine:{
    id:'pexels_4856731_pine',
    src:'https://images.pexels.com/photos/4856731/pexels-photo-4856731.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/an-empty-forest-path-4856731/',
    alt:'A narrow path under dense pine cover.'
  },
  woodland_birch:{
    id:'pexels_17166390_open',
    src:'https://images.pexels.com/photos/17166390/pexels-photo-17166390.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/footpath-in-a-meadow-with-trees-in-a-distance-17166390/',
    alt:'An open footpath crossing an exposed meadow.'
  },
  ascent_ridge:{
    id:'pexels_17731161_ridge',
    src:'https://images.pexels.com/photos/17731161/pexels-photo-17731161.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/path-along-the-ridge-of-the-mountain-17731161/',
    alt:'A direct hiking path following a steep mountain ridge.'
  },
  ascent_switchback:{
    id:'pexels_16643312_switchback',
    src:'https://images.pexels.com/photos/16643312/pexels-photo-16643312.jpeg?auto=compress&cs=tinysrgb&w=900&h=540&fit=crop',
    sourcePage:'https://www.pexels.com/photo/zigzag-path-on-the-slope-of-a-rocky-mountain-16643312/',
    alt:'A long zigzag path climbing a rocky mountain slope.'
  }
};

const COUNTERBALANCE_CONDITIONS = Array.from({length:6},(_,shift)=>
  Object.fromEntries(SLOT_ORDER.map((slot,i)=>[slot,LEXICAL_ITEMS[(i+shift)%LEXICAL_ITEMS.length]]))
);
function secureRandomInt(max){
  if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%max;}
  return Math.floor(Math.random()*max);
}
const conditionParam=Number.parseInt(new URLSearchParams(location.search).get('condition')||'',10);
const COUNTERBALANCE_CONDITION=Number.isInteger(conditionParam)&&conditionParam>=1&&conditionParam<=6?conditionParam:(secureRandomInt(6)+1);
const CONDITION_SOURCE=Number.isInteger(conditionParam)&&conditionParam>=1&&conditionParam<=6?'url_override':'random';
const LEXICAL_MAPPING={...COUNTERBALANCE_CONDITIONS[COUNTERBALANCE_CONDITION-1]};
function routeMeta(kind,route){return ROUTE_META[kind]?.[route]||null;}
function lexicalFor(kind,route){const meta=routeMeta(kind,route);return meta?LEXICAL_MAPPING[meta.slot]:null;}
function clipIdFor(kind,route,phase){const meta=routeMeta(kind,route);const word=lexicalFor(kind,route);return meta&&word?`lex_${meta.slot}_${word}_${phase}`:null;}
function makeSessionId(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  return `mera-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
}
function detectBrowserFamily(){
  const ua=navigator.userAgent||'';
  if(/Edg\//.test(ua))return 'Edge';
  if(/Firefox\//.test(ua))return 'Firefox';
  if(/Chrome\//.test(ua))return 'Chrome';
  if(/Safari\//.test(ua))return 'Safari';
  return 'Other';
}

const session = {
  schemaVersion: 6,
  build: STUDY_VERSION,
  sessionId: makeSessionId(),
  createdAt: new Date().toISOString(),
  startedAt: null,
  gameplayEndedAt: null,
  finishedAt: null,
  studyCompletedAt: null,
  timingMilestones:{bootReadyAt:null,consentAcceptedAt:null,introStartedAt:null,introEndedAt:null,gameStartedAt:null,outpostReachedAt:null,guideDisplayedAt:null,generalizationDisplayedAt:null,studyCompletedAt:null},
  consent:{accepted:false,acceptedAt:null,acceptedAtSessionTime:null,textVersion:CONSENT_TEXT_VERSION},
  counterbalance: {
    condition: COUNTERBALANCE_CONDITION,
    assignmentSource: CONDITION_SOURCE,
    mapping: {...LEXICAL_MAPPING}
  },
  routes: {river:null, woodland:null, ascent:null},
  decisions: {
    river:{promptAt:null,choiceAt:null,latencySeconds:null,choice:null},
    woodland:{promptAt:null,choiceAt:null,latencySeconds:null,choice:null},
    ascent:{promptAt:null,choiceAt:null,latencySeconds:null,choice:null}
  },
  exposures: Object.fromEntries(LEXICAL_ITEMS.map(w=>[w,0])),
  lexicalState: Object.fromEntries(SLOT_ORDER.map(slot=>[slot,{
    word:LEXICAL_MAPPING[slot],contextStarted:false,contextStatus:null,signEncountered:false,signDwellMs:0,reinforceStatus:null
  }])),
  events: [],
  trajectory: [],
  movement: {
    totalGameplayMs:0, walkingMs:0, runningMs:0, stationaryMs:0, airborneMs:0,
    cinematicMs:0, chatMs:0, windExposureMs:0, offTrailMs:0, totalDistance:0, walkingDistance:0, runningDistance:0,
    airborneDistance:0, offTrailDistance:0, jumpCount:0, runKeyActivations:0, stateTransitions:0
  },
  navigation:{backtrackingEpisodes:0,maxBacktrackDistance:0,activeBacktrack:false,furthestProgressZ:216},
  responses: {
    guide:{displayedAt:null,firstInputAt:null,submittedAt:null,text:'',length:0},
    generalization:{displayedAt:null,firstInputAt:null,submittedAt:null,text:'',length:0,stimuli:[]}
  },
  mission: {relayRestored:false},
  environmentalEvents: [],
  chat: {opened:0, questions:[], lexicalTargetsEnabled:false},
  quality: {
    audioFailures:[], visibilityHiddenCount:0, focusLossCount:0,
    exposureWarnings:[]
  },
  technical: {
    browserFamily:detectBrowserFamily(),
    platform:navigator.userAgentData?.platform||navigator.platform||'unknown',
    viewport:{width:window.innerWidth,height:window.innerHeight},
    devicePixelRatio:Math.round((window.devicePixelRatio||1)*100)/100,
    touchCapable:(navigator.maxTouchPoints||0)>0
  },
  visibility:{hiddenIntervals:[],hiddenDuringGameplayMs:0},
  storage: {
    mode:supabaseConfigured()?'supabase':'unconfigured',
    provider:supabaseConfigured()?'supabase':'none',
    remoteSubmission:{
      configured:supabaseConfigured(),attempted:false,status:'not_attempted',httpStatus:null,error:null,submittedAt:null,
      table:STORAGE_CONFIG.table||'mera_sessions'
    }
  },
  voice: {enabled:true,engine:'kokoro_heart_prerendered',profile:'af_heart',fixedStimulus:true},
  environmentalAudio:{enabled:true,engine:'procedural_web_audio',rain:true,wind:true,thunder:true,voiceDucking:true}
};
const fired = new Set();
let navTimer = null;
let navBusy = false;
const navQueue = [];
let gameStarted = false;
let audioCtx = null;
const ambience={started:false,master:null,rainGain:null,windGain:null,sources:[],nodes:[]};
let chatOpen = false;
let lastPlayerPosition = {x:0,y:0,z:216};
let lastChatStage = '';
let outpostFinalized = false;
let outpostWatchdog = null;
let outpostSubtitleTimers = [];
let inputSnapshot={forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false};
let lastMovementState='not_started';
let lastTrajectorySampleMs=0;
let lastStageLogged=null;
const worldState = {
  introActive:false,
  cinematic:null,
  effects:{river:null,woodland:null,ascent:null},
  windExposed:false
};

function nowMs(){ return performance.now(); }
function roundHundredth(value){return Math.round(value/10)/100;}
function sessionSeconds(){return roundHundredth(performance.now()-SESSION_PERF_ORIGIN);}
function gameplaySeconds(){
  if(gameplayPerfOrigin===null)return null;
  const end=gameplayPerfEnded===null?performance.now():gameplayPerfEnded;
  return roundHundredth(Math.max(0,end-gameplayPerfOrigin));
}
function relativeSeconds(){return gameplaySeconds()??0;}
function logEvent(type, data={}) {
  const sessionTime=sessionSeconds(),gameplayTime=gameplaySeconds();
  session.events.push({type,t:gameplayTime??sessionTime,sessionTime,gameplayTime,...data});
}
function inputActive(){
  return boot.classList.contains('hidden') && gameStarted && !chatOpen && !worldState.introActive && !worldState.cinematic && !session.finishedAt;
}
const visibilityClock={hiddenSincePerf:document.hidden?performance.now():null,hiddenSinceSessionTime:document.hidden?sessionSeconds():null,hiddenSinceGameplayPerf:null,hiddenSinceGameplayTime:null};
function beginGameplayClock(){
  gameplayPerfOrigin=performance.now();gameplayPerfEnded=null;
  if(document.hidden&&visibilityClock.hiddenSinceGameplayPerf===null){
    visibilityClock.hiddenSinceGameplayPerf=gameplayPerfOrigin;visibilityClock.hiddenSinceGameplayTime=0;
  }
}
function currentHiddenGameplayMs(){
  let total=session.visibility.hiddenDuringGameplayMs;
  if(visibilityClock.hiddenSinceGameplayPerf!==null){
    const end=gameplayPerfEnded===null?performance.now():gameplayPerfEnded;
    total+=Math.max(0,end-visibilityClock.hiddenSinceGameplayPerf);
  }
  return total;
}
function closeVisibilityInterval(){
  if(visibilityClock.hiddenSincePerf===null)return;
  const now=performance.now(),endSession=sessionSeconds(),endGameplay=gameplaySeconds();
  const gameplayDurationMs=visibilityClock.hiddenSinceGameplayPerf===null?0:Math.max(0,(gameplayPerfEnded===null?now:gameplayPerfEnded)-visibilityClock.hiddenSinceGameplayPerf);
  if(gameplayDurationMs>0)session.visibility.hiddenDuringGameplayMs+=gameplayDurationMs;
  session.visibility.hiddenIntervals.push({
    startedAtSessionTime:visibilityClock.hiddenSinceSessionTime,
    endedAtSessionTime:endSession,
    durationSeconds:roundHundredth(now-visibilityClock.hiddenSincePerf),
    startedAtGameplayTime:visibilityClock.hiddenSinceGameplayTime,
    endedAtGameplayTime:endGameplay,
    gameplayDurationSeconds:roundHundredth(gameplayDurationMs)
  });
  visibilityClock.hiddenSincePerf=null;visibilityClock.hiddenSinceSessionTime=null;visibilityClock.hiddenSinceGameplayPerf=null;visibilityClock.hiddenSinceGameplayTime=null;
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    session.quality.visibilityHiddenCount++;
    if(visibilityClock.hiddenSincePerf===null){visibilityClock.hiddenSincePerf=performance.now();visibilityClock.hiddenSinceSessionTime=sessionSeconds();}
    if(gameplayPerfOrigin!==null&&gameplayPerfEnded===null&&visibilityClock.hiddenSinceGameplayPerf===null){visibilityClock.hiddenSinceGameplayPerf=performance.now();visibilityClock.hiddenSinceGameplayTime=gameplaySeconds();}
    logEvent('page_hidden');
  }else{
    closeVisibilityInterval();logEvent('page_visible');
  }
});
window.addEventListener('blur',()=>{if(gameStarted&&!session.studyCompletedAt){session.quality.focusLossCount++;logEvent('window_blur');}});
window.addEventListener('focus',()=>{if(gameStarted&&!session.studyCompletedAt)logEvent('window_focus');});
function radioCrackle(duration=.22, volume=.075){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    const sr=audioCtx.sampleRate, n=Math.max(1,Math.floor(sr*duration));
    const b=audioCtx.createBuffer(1,n,sr), d=b.getChannelData(0);
    for(let i=0;i<n;i++){
      const env=Math.sin(Math.PI*i/n);
      d[i]=(Math.random()*2-1)*env*(.55+.45*Math.random());
    }
    const src=audioCtx.createBufferSource(); src.buffer=b;
    const bp=audioCtx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.7;
    const g=audioCtx.createGain();g.gain.value=volume;
    src.connect(bp);bp.connect(g);g.connect(audioCtx.destination);src.start();
  }catch(_){/* audio is optional */}
}
function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

let fieldStormTimer=null;
function fixedNoiseBuffer(ctx,seconds,seed){
  const sr=ctx.sampleRate,n=Math.max(1,Math.floor(sr*seconds)),buffer=ctx.createBuffer(1,n,sr),data=buffer.getChannelData(0);
  let x=seed>>>0;
  for(let i=0;i<n;i++){x=(1664525*x+1013904223)>>>0;data[i]=((x/4294967296)*2-1);}
  return buffer;
}
function setAmbienceDuck(ducked){
  if(!ambience.started||!ambience.master||!audioCtx)return;
  const t=audioCtx.currentTime;
  ambience.master.gain.cancelScheduledValues(t);
  ambience.master.gain.setTargetAtTime(ducked?.34:1,t,.12);
}
function startFieldAmbience(){
  if(ambience.started)return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const ctx=audioCtx,master=ctx.createGain();master.gain.value=1;master.connect(ctx.destination);

    const rain=ctx.createBufferSource();rain.buffer=fixedNoiseBuffer(ctx,4.7,0x4d455241);rain.loop=true;
    const rainHP=ctx.createBiquadFilter();rainHP.type='highpass';rainHP.frequency.value=1050;rainHP.Q.value=.35;
    const rainLP=ctx.createBiquadFilter();rainLP.type='lowpass';rainLP.frequency.value=7200;rainLP.Q.value=.25;
    const rainGain=ctx.createGain();rainGain.gain.value=.030;
    rain.connect(rainHP);rainHP.connect(rainLP);rainLP.connect(rainGain);rainGain.connect(master);rain.start();

    const wind=ctx.createBufferSource();wind.buffer=fixedNoiseBuffer(ctx,6.3,0x53544f52);wind.loop=true;
    const windHP=ctx.createBiquadFilter();windHP.type='highpass';windHP.frequency.value=75;windHP.Q.value=.4;
    const windLP=ctx.createBiquadFilter();windLP.type='lowpass';windLP.frequency.value=950;windLP.Q.value=.5;
    const windGain=ctx.createGain();windGain.gain.value=.018;
    const lfo=ctx.createOscillator(),lfoDepth=ctx.createGain();lfo.frequency.value=.085;lfoDepth.gain.value=.008;
    lfo.connect(lfoDepth);lfoDepth.connect(windGain.gain);
    wind.connect(windHP);windHP.connect(windLP);windLP.connect(windGain);windGain.connect(master);wind.start();lfo.start();

    ambience.started=true;ambience.master=master;ambience.rainGain=rainGain;ambience.windGain=windGain;
    ambience.sources=[rain,wind,lfo];ambience.nodes=[rainHP,rainLP,windHP,windLP,rainGain,windGain,lfoDepth,master];
    logEvent('ambient_audio_started',{rainGain:.030,windGain:.018,voiceDucking:true});
  }catch(error){
    session.quality.audioFailures.push({id:'environmental_ambience',status:'start_error',message:String(error?.message||error)});
    logEvent('ambient_audio_failed',{message:String(error?.message||error)});
  }
}
function stopFieldAmbience(){
  if(!ambience.started)return;
  try{
    if(ambience.master&&audioCtx){const t=audioCtx.currentTime;ambience.master.gain.cancelScheduledValues(t);ambience.master.gain.setTargetAtTime(0,t,.22);}
    setTimeout(()=>{for(const src of ambience.sources){try{src.stop();}catch(_){}};ambience.started=false;},700);
    logEvent('ambient_audio_stopped');
  }catch(_){ambience.started=false;}
}
function pulseFieldLightning(){
  if(!fieldLightning || !gameStarted || session.finishedAt) return;
  fieldLightning.classList.remove('flash');
  void fieldLightning.offsetWidth;
  fieldLightning.classList.add('flash');
  window.dispatchEvent(new CustomEvent('mera-lightning'));
  if(!activeMeraAudio){
    const thunderDelay=220+Math.random()*620;
    setTimeout(()=>{if(!activeMeraAudio)thunderRumble(.22);else logEvent('thunder_suppressed_during_voice');},thunderDelay);
    logEvent('thunder_scheduled',{delayMs:Math.round(thunderDelay)});
  }else logEvent('thunder_suppressed_during_voice');
  setTimeout(()=>fieldLightning?.classList.remove('flash'),620);
}
function scheduleFieldLightning(){
  clearTimeout(fieldStormTimer);
  if(!gameStarted || session.finishedAt) return;
  const delay=5200+Math.random()*7200;
  fieldStormTimer=setTimeout(()=>{pulseFieldLightning();scheduleFieldLightning();},delay);
}
function startFieldWeather(){
  fieldWeather?.classList.remove('hidden');
  scheduleFieldLightning();
}

// Fixed Heart speech stimuli are pre-rendered; no speech synthesis runs during a study session.
let activeMeraAudio = null;
const VOICE_CLIPS = {
  intro:'audio/intro.wav',
  river_choice_prompt:'audio/decision_river.wav',
  wood_choice_prompt:'audio/decision_wood.wav',
  ascent_choice_prompt:'audio/decision_ascent.wav',
  consequence_river_bridge:'audio/consequence_river_bridge.wav',
  consequence_river_ford:'audio/consequence_river_ford.wav',
  consequence_woodland_pine:'audio/consequence_wood_pine.wav',
  consequence_woodland_birch:'audio/consequence_wood_birch.wav',
  consequence_ascent_ridge:'audio/consequence_ascent_ridge.wav',
  consequence_ascent_switchback:'audio/consequence_ascent_switchback.wav',
  outro:'audio/outro.wav'
};
for(const slot of SLOT_ORDER){
  for(const word of LEXICAL_ITEMS){
    for(const phase of ['context','reinforce']){
      const id=`lex_${slot}_${word}_${phase}`;
      VOICE_CLIPS[id]=`audio/${id}.wav`;
    }
  }
}
const FIXED_VOICE_IDS=['intro','river_choice_prompt','wood_choice_prompt','ascent_choice_prompt','consequence_river_bridge','consequence_river_ford','consequence_woodland_pine','consequence_woodland_birch','consequence_ascent_ridge','consequence_ascent_switchback','outro'];
const SESSION_VOICE_IDS=new Set(FIXED_VOICE_IDS);
for(const slot of SLOT_ORDER){const word=LEXICAL_MAPPING[slot];for(const phase of ['context','reinforce'])SESSION_VOICE_IDS.add(`lex_${slot}_${word}_${phase}`);}
const preloadedVoice = new Map();
for(const id of SESSION_VOICE_IDS){
  const src=VOICE_CLIPS[id],a=new Audio(src);a.preload='auto';preloadedVoice.set(id,a);
}
function stopMeraVoice(){
  if(activeMeraAudio){
    try{activeMeraAudio.pause();activeMeraAudio.currentTime=0;}catch(_){ }
    activeMeraAudio=null;
    setAmbienceDuck(false);
  }
}
function playMeraClip(id){
  return new Promise(resolve=>{
    const src=VOICE_CLIPS[id];
    if(!src){logEvent('voice_missing',{id});resolve({status:'missing',duration:0});return;}
    stopMeraVoice();
    const a=preloadedVoice.get(id)||new Audio(src);
    activeMeraAudio=a;
    setAmbienceDuck(true);
    try{a.currentTime=0;}catch(_){ }
    let settled=false;
    const done=status=>{
      if(settled)return;settled=true;
      if(activeMeraAudio===a)activeMeraAudio=null;
      setAmbienceDuck(false);
      a.onended=null;a.onerror=null;
      logEvent('voice_line',{id,status,engine:'kokoro_heart_prerendered',voice:'af_heart'});
      resolve({status,duration:Number.isFinite(a.duration)?a.duration:0});
    };
    a.onended=()=>done('ended');
    a.onerror=()=>done('error');
    const promise=a.play();
    if(promise?.catch)promise.catch(()=>done('play_rejected'));
    setTimeout(()=>done('timeout'),90000);
  });
}
function getVoiceDurationMs(id,fallback=5000){const a=preloadedVoice.get(id);return Number.isFinite(a?.duration)&&a.duration>0?a.duration*1000:fallback;}
async function verifyHeartVoicePack(){
  const required=[...SESSION_VOICE_IDS].map(id=>VOICE_CLIPS[id]);
  const failures=[];
  await Promise.all(required.map(src=>new Promise(resolve=>{
    const a=new Audio();
    let done=false;
    const finish=ok=>{if(done)return;done=true;if(!ok)failures.push(src);a.oncanplaythrough=null;a.onerror=null;resolve();};
    a.preload='metadata';a.onloadedmetadata=()=>finish(true);a.onerror=()=>finish(false);a.src=src;
    setTimeout(()=>finish(false),7000);
  })));
  if(failures.length){
    throw new Error(`Heart voice pack is missing or unreadable (${failures.length} file${failures.length===1?'':'s'}). First missing: ${failures[0]}`);
  }
}
function thunderRumble(intensity=.22){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const ctx=audioCtx,sr=ctx.sampleRate;

    // Audible crack: retains mid-frequency energy so thunder remains perceptible
    // on ordinary laptop speakers as well as headphones.
    const crackN=Math.floor(sr*.42),crackBuffer=ctx.createBuffer(1,crackN,sr),crackData=crackBuffer.getChannelData(0);
    for(let i=0;i<crackN;i++){const t=i/crackN;crackData[i]=(Math.random()*2-1)*Math.pow(1-t,3.4);}
    const crack=ctx.createBufferSource();crack.buffer=crackBuffer;
    const crackBP=ctx.createBiquadFilter();crackBP.type='bandpass';crackBP.frequency.value=620;crackBP.Q.value=.55;
    const crackGain=ctx.createGain();crackGain.gain.value=intensity*.78;
    crack.connect(crackBP);crackBP.connect(crackGain);crackGain.connect(ctx.destination);

    // Longer low rumble gives the flash weight after the initial crack.
    const rumbleN=Math.floor(sr*2.8),rumbleBuffer=ctx.createBuffer(1,rumbleN,sr),rumbleData=rumbleBuffer.getChannelData(0);
    for(let i=0;i<rumbleN;i++){const t=i/rumbleN;const envelope=Math.pow(1-t,1.7)*(0.72+0.28*Math.sin(Math.PI*Math.min(1,t*4)));rumbleData[i]=(Math.random()*2-1)*envelope;}
    const rumble=ctx.createBufferSource();rumble.buffer=rumbleBuffer;
    const rumbleLP=ctx.createBiquadFilter();rumbleLP.type='lowpass';rumbleLP.frequency.value=310;rumbleLP.Q.value=.35;
    const rumbleHP=ctx.createBiquadFilter();rumbleHP.type='highpass';rumbleHP.frequency.value=38;rumbleHP.Q.value=.25;
    const rumbleGain=ctx.createGain();rumbleGain.gain.value=intensity*.68;
    rumble.connect(rumbleHP);rumbleHP.connect(rumbleLP);rumbleLP.connect(rumbleGain);rumbleGain.connect(ctx.destination);

    crack.start();rumble.start(ctx.currentTime+.07);
    logEvent('thunder_played',{intensity:Math.round(intensity*100)/100});
  }catch(error){logEvent('thunder_failed',{message:String(error?.message||error)});}
}
function lightningFlash(delay=0){
  setTimeout(()=>{
    intro.classList.remove('flash');void intro.offsetWidth;intro.classList.add('flash');
    thunderRumble(.18);
    setTimeout(()=>intro.classList.remove('flash'),650);
  },delay);
}

function setIntroLine(text,{crackle=false,status=false}={}){
  if(crackle) radioCrackle(.20,.055);
  introLine.classList.remove('show','status');
  introLine.textContent=text;
  if(status)introLine.classList.add('status');
  void introLine.offsetWidth;
  introLine.classList.add('show');
}
const INTRO_SCRIPT = `MERA here. Can you hear me? The storm last night caused severe damage across the reserve. Status report: two members of your team are injured. Two are still missing. You are the only one still able to reach the Northern Outpost. I would have contacted emergency services already, but the outpost relay is damaged. Without that uplink, I cannot reach them. Another storm front is moving into the valley. My field unit is running on emergency power. You need to reach the outpost and restore the uplink before the storm arrives. I will guide you as far as I can. My terrain data is incomplete, so some decisions will be yours. Move.`;
const INTRO_SUBTITLES = [
  [0.00,'MERA here. Can you hear me?',false],
  [0.055,'The storm last night caused severe damage across the reserve.',false],
  [0.145,'STATUS REPORT · 2 INJURED · 2 MISSING',true],
  [0.285,'You are the only one still able to reach the Northern Outpost.',false],
  [0.395,'I would have contacted emergency services already, but the outpost relay is damaged.',false],
  [0.525,'Without that uplink, I cannot reach them.',false],
  [0.590,'Another storm front is moving into the valley. My field unit is running on emergency power.',false],
  [0.725,'You need to reach the outpost and restore the uplink before the storm arrives.',false],
  [0.855,'I will guide you as far as I can. My terrain data is incomplete, so some decisions will be yours.',false],
  [0.975,'Move.',true]
];
async function beginIntro(){
  session.timingMilestones.introStartedAt=new Date().toISOString();
  worldState.introActive=true;
  intro.classList.remove('hidden');intro.classList.add('booting');
  chatToggle.classList.add('hidden');
  stopMeraVoice();
  const durationMs=getVoiceDurationMs('intro',50000);
  const started=performance.now();
  worldState.cinematic={id:'intro',started,duration:durationMs+900,from:[-10,16.5,231],to:[-2,9.0,202],lookAt:[10,30,-218],intro:true};
  setIntroLine('— crrk —',{crackle:true});
  lightningFlash(Math.min(1100,durationMs*.025));
  lightningFlash(durationMs*.18);lightningFlash(durationMs*.49);lightningFlash(durationMs*.78);
  const timers=[];
  for(const [fraction,text,status] of INTRO_SUBTITLES){timers.push(setTimeout(()=>setIntroLine(text,{status}),Math.max(0,durationMs*fraction)));}
  await playMeraClip('intro');
  await sleep(850);
  timers.forEach(clearTimeout);
  intro.classList.remove('booting','flash');intro.classList.add('hidden');
  worldState.introActive=false;worldState.cinematic=null;gameStarted=true;
  session.timingMilestones.introEndedAt=new Date().toISOString();
  session.startedAt=new Date().toISOString();session.timingMilestones.gameStartedAt=session.startedAt;beginGameplayClock();
  logEvent('game_start',{intro:'storm_emergency_transmission',voice:'kokoro_heart_prerendered',counterbalanceCondition:session.counterbalance.condition,mapping:{...session.counterbalance.mapping}});
  hud.classList.remove('hidden');help.classList.remove('hidden');routeStatus.classList.remove('hidden');
  startFieldWeather();
  chatToggle.classList.remove('hidden');refreshChatUI();
}
function decisionKindForPrompt(id){
  return id==='river_choice_prompt'?'river':id==='wood_choice_prompt'?'woodland':id==='ascent_choice_prompt'?'ascent':null;
}
function recordLexicalOpportunity(word,slot,modality,phase,data={}){
  if(word && session.exposures[word]!==undefined)session.exposures[word]++;
  logEvent('lexical_exposure',{word,slot,modality,phase,...data});
}
function pumpNavQueue() {
  if (navBusy || !navQueue.length || session.finishedAt || worldState.introActive || worldState.cinematic) return;
  const msg = navQueue.shift();
  navBusy = true;
  const decisionKind=decisionKindForPrompt(msg.id);
  if(decisionKind && session.decisions[decisionKind].promptAt===null){
    session.decisions[decisionKind].promptAt=relativeSeconds();
    logEvent('decision_prompt_displayed',{kind:decisionKind,id:msg.id});
  }
  if(msg.target && msg.slot){
    if(msg.exposure==='context')session.lexicalState[msg.slot].contextStarted=true;
    recordLexicalOpportunity(msg.target,msg.slot,'voice',msg.exposure,{id:msg.id,status:'started'});
  }
  logEvent('nav_message', {id:msg.id,target:msg.target,slot:msg.slot,exposure:msg.exposure,text:msg.text,voiced:!!msg.voice});
  navCopy.textContent = msg.text;
  navState.textContent = msg.voice ? 'VOICE LINK' : 'ONLINE';
  navPanel.classList.toggle('target-word',!!msg.target);
  navPanel.classList.toggle('speaking',!!msg.voice);
  navPanel.classList.remove('hidden');
  clearTimeout(navTimer);
  const closeMessage=()=>{
    navPanel.classList.add('hidden');navPanel.classList.remove('target-word','speaking');
    navBusy=false;setTimeout(pumpNavQueue,350);
  };
  if(msg.voice){
    playMeraClip(msg.id).then(result=>{
      if(msg.target&&msg.slot){
        const ls=session.lexicalState[msg.slot];
        if(msg.exposure==='context')ls.contextStatus=result.status;
        if(msg.exposure==='reinforce')ls.reinforceStatus=result.status;
        logEvent('lexical_voice_result',{word:msg.target,slot:msg.slot,phase:msg.exposure,id:msg.id,status:result.status,duration:result.duration});
        if(result.status!=='ended'){
          session.quality.audioFailures.push({id:msg.id,word:msg.target,slot:msg.slot,phase:msg.exposure,status:result.status});
        }
      }
      return result;
    }).finally(()=>{navTimer=setTimeout(closeMessage,1500);});
  }else{
    navTimer=setTimeout(closeMessage,msg.duration);
  }
}
function showNav(id, text, {target=null,slot=null,exposure=null,duration=7800,voice=false,voiceRate=.98}={}) {
  if (fired.has(id)) return;
  fired.add(id);
  navQueue.push({id,text,target,slot,exposure,duration,voice,voiceRate});
  pumpNavQueue();
}
function setRoute(kind, value) {
  if (session.routes[kind]) return;
  session.routes[kind] = value;
  const meta=routeMeta(kind,value),word=lexicalFor(kind,value);
  const d=session.decisions[kind];
  d.choiceAt=relativeSeconds();d.choice=value;d.lexicalItem=word;d.slot=meta?.slot||null;
  d.latencySeconds=d.promptAt===null?null:Math.round((d.choiceAt-d.promptAt)*100)/100;
  logEvent('route_choice', {kind,value,slot:meta?.slot||null,lexicalItem:word,decisionLatencySeconds:d.latencySeconds,position:{...lastPlayerPosition}});
  const id = kind === 'river' ? 'river-choice' : kind === 'woodland' ? 'wood-choice' : 'ascent-choice';
  const el = document.getElementById(id);
  if (el) el.textContent = value.toUpperCase();
  window.dispatchEvent(new CustomEvent('mera-route',{detail:{kind,value,slot:meta?.slot||null,word}}));
}
function startConsequence(kind){
  if(!session.routes[kind] || worldState.effects[kind] || navBusy || navQueue.length) return;
  const route=session.routes[kind];
  const cfg={
    river: route==='bridge'
      ? {caption:'THE FORD IS GONE',camera:[45,8.5,139],lookAt:[31,1.3,123],voice:'Water level rising. Rock crossing is gone. No return route.'}
      : {caption:'THE BRIDGE IS GONE',camera:[-46,8.5,139],lookAt:[-31,1.5,124],voice:'Bridge failure detected. That crossing is no longer available.'},
    woodland: route==='pine'
      ? {caption:'THE OPEN ROUTE CLOSES',camera:[44,10,-1],lookAt:[31,2,-13],voice:'Treefall behind us. The open route is blocked.'}
      : {caption:'THE PINE ROUTE CLOSES',camera:[-44,10,-1],lookAt:[-31,2,-13],voice:'Treefall behind us. The forest route is blocked.'},
    ascent: route==='ridge'
      ? {caption:'THE SWITCHBACK GIVES WAY',camera:[-58,31,-181],lookAt:[-46,18,-185],voice:'Rockfall below us. The switchback is closed.'}
      : {caption:'ROCKFALL CLOSES THE RIDGE',camera:[35,34,-181],lookAt:[13,20,-186],voice:'Rockfall on the ridge. The direct route is closed.'}
  }[kind];
  closeChat();
  chatToggle.classList.add('hidden');
  stopMeraVoice();
  const effect={kind,route,started:performance.now()};
  worldState.effects[kind]=effect;
  logEvent('environmental_consequence',{kind,route,caption:cfg.caption});
  session.environmentalEvents.push({type:'route_lost',kind,chosen:route});
  window.dispatchEvent(new CustomEvent('mera-consequence',{detail:effect}));
  clearTimeout(navTimer); navPanel.classList.add('hidden'); navBusy=false;
  worldState.cinematic={id:`${kind}_${route}`,started:performance.now(),duration:5200,from:cfg.camera,to:cfg.camera,lookAt:cfg.lookAt};
  cinematicCaption.textContent=cfg.caption;
  cinematicLine.textContent=cfg.voice;
  cinematicEl.classList.remove('hidden');
  setTimeout(()=>playMeraClip(`consequence_${kind}_${route}`),140);
  setTimeout(()=>{
    if(worldState.cinematic?.id===`${kind}_${route}`){
      worldState.cinematic=null;
      cinematicEl.classList.add('hidden');
      chatToggle.classList.remove('hidden');
      refreshChatUI();
      setTimeout(pumpNavQueue,250);
    }
  },5200);
}
function currentChatStage(){
  const z=lastPlayerPosition.z;
  if(z>78)return 'river';
  if(z>-62)return 'woodland';
  if(z>-190)return 'ascent';
  return 'outpost';
}
function contextualSuggestions(stage=currentChatStage()){
  if(stage==='river')return [
    ['river_bridge','Is the bridge safe?'],
    ['river_ford','What about the rocks?'],
    ['faster','Which route is faster?'],
    ['return','Can I change my mind?']
  ];
  if(stage==='woodland')return [
    ['wood_pine','What about the pine route?'],
    ['wood_open','How exposed is the open route?'],
    ['faster','Which route is faster?'],
    ['storm','How bad is the wind?']
  ];
  if(stage==='ascent')return [
    ['ascent_ridge','How difficult is the ridge?'],
    ['ascent_switchback','What about the switchback?'],
    ['faster','Which way is faster?'],
    ['return','Can I still turn back?']
  ];
  return [['mission','What happens at the outpost?'],['storm','How close is the storm?']];
}
function addChatMessage(role,text){
  const row=document.createElement('div'); row.className=`chat-msg ${role}`;
  const tag=document.createElement('span'); tag.textContent=role==='user'?'YOU':'MERA';
  const body=document.createElement('div'); body.textContent=text;
  row.append(tag,body); chatLog.appendChild(row); chatLog.scrollTop=chatLog.scrollHeight;
}
function optionalLexicalAnswer(form,withTarget,withoutTarget){
  // The text link never exposes target forms. Lexical exposure is restricted
  // to the three controlled route encounters (voice → sign → voice).
  return {text:withoutTarget,target:null};
}
function answerIntent(intent){
  switch(intent){
    case 'river_bridge': return optionalLexicalAnswer('menic',
      'It is menic — old and narrow — but not old enough that collapse should be expected. I cannot assess structural damage caused by last night’s storm.',
      'The bridge is old and narrow. It appears passable, but structural storm damage cannot be ruled out.');
    case 'river_ford': return optionalLexicalAnswer('blicket',
      'The rock crossing is blicket — shallow and stone-set, with exposed footing. Water level is rising, so stability may change.',
      'The rock crossing is shallow and stone-set. Water level is rising, so stability may change.');
    case 'wood_pine': return optionalLexicalAnswer('boskot',
      'The pine route is boskot — dense and sheltered from the strongest gusts. Stormfall may obstruct it.',
      'The pine route is dense and sheltered from the strongest gusts. Stormfall may obstruct it.');
    case 'wood_open': return optionalLexicalAnswer('fiffin',
      'The open hollow is fiffin — exposed to the wind with little cover. It is more direct, but gusts are strengthening.',
      'The open hollow has little cover and takes the full wind. It is more direct, but gusts are strengthening.');
    case 'ascent_ridge': return optionalLexicalAnswer('virdex',
      'The ridge is virdex — steep and direct over loose rock. It is the shorter ascent.',
      'The ridge is steep and direct over loose rock. It is the shorter ascent.');
    case 'ascent_switchback': return optionalLexicalAnswer('teebu',
      'The teebu path climbs gradually through long turns. It is slower, but easier. It is longer, but easier underfoot.',
      'The switchback is long, winding, and gradual. It is longer, but easier underfoot.');
    case 'faster': {
      const st=currentChatStage();
      if(st==='river')return {text:'The bridge is faster. The rock crossing is slower but gives you more room.',target:null};
      if(st==='woodland')return {text:'The open hollow is more direct. The pine route is slower but better sheltered.',target:null};
      if(st==='ascent')return {text:'The ridge is shorter. The switchback is longer and less steep.',target:null};
      return {text:'No reliable route comparison is available from this position.',target:null};
    }
    case 'return': return {text:'Once you commit to a branch, continue forward until the routes meet again. Conditions behind you may become impassable.',target:null};
    case 'storm': return {text:'The next front is moving into the valley. I have no reliable arrival estimate. Conditions are deteriorating.',target:null};
    case 'mission': return {text:'The Northern Outpost emergency relay is offline. Reach the station and restore the uplink before the next front arrives.',target:null};
    default: return {text:'I cannot access that data. Limited uplink availability.',target:null};
  }
}
function inferIntent(question){
  const q=question.toLowerCase().replace(/[^a-z0-9\s]/g,' ');
  const stage=currentChatStage();
  if(/outpost|mission|relay|why|purpose/.test(q))return 'mission';
  if(/storm|weather|wind|time|front/.test(q) && !/open|hollow/.test(q))return 'storm';
  if(/back|return|change.*mind|turn around|go back/.test(q))return 'return';
  if(/faster|quick|shorter|which way|which route/.test(q))return 'faster';
  if(stage==='river'){
    if(/bridge|timber|safe|old|narrow/.test(q))return 'river_bridge';
    if(/rock|ford|stone|water|crossing/.test(q))return 'river_ford';
  }
  if(stage==='woodland'){
    if(/pine|forest|tree|shelter|cover/.test(q))return 'wood_pine';
    if(/open|hollow|meadow|exposed/.test(q))return 'wood_open';
  }
  if(stage==='ascent'){
    if(/ridge|steep|direct|loose/.test(q))return 'ascent_ridge';
    if(/switch|bend|winding|gradual/.test(q))return 'ascent_switchback';
  }
  return 'fallback';
}
function askMera(question,intent=null,source='typed'){
  const clean=(question||'').trim(); if(!clean)return;
  const resolved=intent||inferIntent(clean);
  addChatMessage('user',clean);
  const answer=answerIntent(resolved);
  addChatMessage('mera',answer.text);
  session.chat.questions.push({
    t:session.startedAt?Math.round((Date.now()-new Date(session.startedAt).getTime())/10)/100:0,
    stage:currentChatStage(),source,question:clean,intent:resolved,response:answer.text,target:answer.target
  });
  logEvent('chat_exchange',{stage:currentChatStage(),source,intent:resolved,target:answer.target,question:clean,response:answer.text});
}
function renderSuggestions(){
  if(!chatSuggestions)return;
  const stage=currentChatStage();
  chatContext.textContent=`${stage.toUpperCase()} · limited uplink · route data only`;
  chatSuggestions.innerHTML='';
  contextualSuggestions(stage).forEach(([intent,label])=>{
    const b=document.createElement('button'); b.type='button'; b.className='chat-suggestion'; b.textContent=label;
    b.addEventListener('click',()=>askMera(label,intent,'suggestion'));
    chatSuggestions.appendChild(b);
  });
}
function refreshChatUI(){
  const stage=currentChatStage();
  if(stage!==lastChatStage){lastChatStage=stage;renderSuggestions();}
}
function openChat(){
  if(!gameStarted||worldState.introActive||worldState.cinematic||session.finishedAt)return;
  chatOpen=true; session.chat.opened++; logEvent('chat_open',{stage:currentChatStage()});
  try{window.dispatchEvent(new Event('blur'));}catch(_){}
  chatPanel.classList.remove('hidden'); chatToggle.classList.add('active'); renderSuggestions();
  if(!chatLog.children.length)addChatMessage('mera','Text link active. Ask about the current route.');
  setTimeout(()=>chatInput.focus(),40);
}
function closeChat(){
  chatOpen=false; chatPanel.classList.add('hidden'); chatToggle.classList.remove('active'); chatInput?.blur();
}
chatToggle.addEventListener('click',()=>chatOpen?closeChat():openChat());
chatClose.addEventListener('click',closeChat);
chatForm.addEventListener('submit',e=>{e.preventDefault();const q=chatInput.value.trim();if(!q)return;chatInput.value='';askMera(q,null,'typed');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&chatOpen){e.preventDefault();closeChat();}});

function updateElapsed() {
  if (!session.startedAt) return;
  const ms = Date.now() - new Date(session.startedAt).getTime();
  const sec = Math.max(0, Math.floor(ms/1000));
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');
  document.getElementById('elapsed').textContent = `${m}:${ss}`;
}
function routeSlotsExperienced(){
  return ['river','woodland','ascent'].map(kind=>{
    const route=session.routes[kind];return route?routeMeta(kind,route)?.slot:null;
  }).filter(Boolean);
}
function shuffled(items){
  const a=[...items];for(let i=a.length-1;i>0;i--){const j=secureRandomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
}
function renderGeneralizationTask(){
  const slots=shuffled(routeSlotsExperienced());
  session.responses.generalization.stimuli=slots.map((slot,i)=>{
    const photo=GENERALIZATION_STIMULI[slot];
    return {label:String.fromCharCode(65+i),slot,targetWord:LEXICAL_MAPPING[slot],stimulusId:photo.id,sourcePage:photo.sourcePage};
  });
  generalizationStimuli.innerHTML=session.responses.generalization.stimuli.map(s=>{
    const photo=GENERALIZATION_STIMULI[s.slot];
    return `<div class="stimulus-card"><div class="stimulus-label">${s.label}</div><img src="${photo.src}" alt="${photo.alt}" draggable="false" referrerpolicy="no-referrer"></div>`;
  }).join('');
  finish.classList.add('hidden');
  generalization.classList.remove('hidden');
  session.responses.generalization.displayedAt=sessionSeconds();session.timingMilestones.generalizationDisplayedAt=new Date().toISOString();
  logEvent('generalization_task_displayed',{stimuli:session.responses.generalization.stimuli.map(x=>({label:x.label,slot:x.slot,stimulusId:x.stimulusId}))});
  setTimeout(()=>generalizationText.focus(),60);
}
function exposureIntegrity(){
  const experienced=routeSlotsExperienced(),chosenSlots=new Set(experienced),warnings=[];
  if(experienced.length!==3)warnings.push(`route choices incomplete: ${experienced.length}/3`);
  for(const slot of SLOT_ORDER){
    const ls=session.lexicalState[slot],selected=chosenSlots.has(slot);
    if(selected){
      if(ls.contextStatus!=='ended')warnings.push(`${slot}: context ${ls.contextStatus||'missing'}`);
      if(!ls.signEncountered)warnings.push(`${slot}: sign missing`);
      if(ls.reinforceStatus!=='ended')warnings.push(`${slot}: reinforcement ${ls.reinforceStatus||'missing'}`);
      if(session.exposures[ls.word]!==3)warnings.push(`${slot}/${ls.word}: ${session.exposures[ls.word]} nominal exposures`);
    }else if(session.exposures[ls.word]!==0){warnings.push(`${slot}/${ls.word}: unexpected exposure`);}
  }
  session.quality.exposureWarnings=warnings;
  return warnings;
}
function finalizeDerivedData(){
  const chosenSlots=routeSlotsExperienced();
  const encountered=chosenSlots.map(slot=>{
    const ls=session.lexicalState[slot];
    return {slot,word:ls.word,nominalExposureCount:session.exposures[ls.word],contextStatus:ls.contextStatus,signEncountered:ls.signEncountered,signDwellMs:ls.signDwellMs,reinforceStatus:ls.reinforceStatus};
  });
  const encounteredWords=encountered.map(x=>x.word);
  const ms=session.movement;
  session.derived={
    encountered,
    encounteredWords,
    unexposedWords:LEXICAL_ITEMS.filter(w=>!encounteredWords.includes(w)),
    nominalExposureTotal:Object.values(session.exposures).reduce((a,b)=>a+b,0),
    expectedNominalExposureTotal:9,
    exposureIntegrityWarnings:exposureIntegrity(),
    timingSeconds:{
      totalSession:session.studyCompletedAt?Math.round((new Date(session.studyCompletedAt)-new Date(session.createdAt))/10)/100:null,
      gameplay:session.startedAt&&session.gameplayEndedAt?Math.round((new Date(session.gameplayEndedAt)-new Date(session.startedAt))/10)/100:null,
      hiddenDuringGameplay:Math.round(currentHiddenGameplayMs()/10)/100,
      activeGameplay:session.startedAt&&session.gameplayEndedAt?Math.max(0,Math.round(((new Date(session.gameplayEndedAt)-new Date(session.startedAt))-currentHiddenGameplayMs())/10)/100):null,
      guideResponse:session.responses.guide.displayedAt!==null&&session.responses.guide.submittedAt!==null?Math.round((session.responses.guide.submittedAt-session.responses.guide.displayedAt)*100)/100:null,
      generalizationResponse:session.responses.generalization.displayedAt!==null&&session.responses.generalization.submittedAt!==null?Math.round((session.responses.generalization.submittedAt-session.responses.generalization.displayedAt)*100)/100:null,
      walking:Math.round(ms.walkingMs/10)/100,
      running:Math.round(ms.runningMs/10)/100,
      stationary:Math.round(ms.stationaryMs/10)/100,
      airborne:Math.round(ms.airborneMs/10)/100,
      cinematic:Math.round(ms.cinematicMs/10)/100,
      chat:Math.round(ms.chatMs/10)/100,
      windExposure:Math.round(ms.windExposureMs/10)/100,
      offTrail:Math.round(ms.offTrailMs/10)/100
    },
    distance:{
      total:+ms.totalDistance.toFixed(2),walking:+ms.walkingDistance.toFixed(2),running:+ms.runningDistance.toFixed(2),airborne:+ms.airborneDistance.toFixed(2),offTrail:+ms.offTrailDistance.toFixed(2)
    },
    navigation:{backtrackingEpisodes:session.navigation.backtrackingEpisodes,maxBacktrackDistance:+session.navigation.maxBacktrackDistance.toFixed(2)}
  };
}
async function submitSessionRemote(){
  const remote=session.storage.remoteSubmission;
  if(!supabaseConfigured()){
    remote.configured=false;remote.status='not_configured';
    return {ok:false,reason:'not_configured',error:'Study storage is not configured.'};
  }
  remote.configured=true;remote.attempted=true;remote.status='attempting';remote.error=null;remote.httpStatus=null;
  logEvent('remote_submission_attempt',{provider:'supabase',table:remote.table});
  finalizeDerivedData();
  const submittedAt=new Date().toISOString();
  const payload=typeof structuredClone==='function'?structuredClone(session):JSON.parse(JSON.stringify(session));
  payload.storage.remoteSubmission={...payload.storage.remoteSubmission,status:'submitted',submittedAt};
  const row={
    session_id:session.sessionId,
    study_version:session.build,
    schema_version:session.schemaVersion,
    counterbalance_condition:session.counterbalance.condition,
    completed_at:session.studyCompletedAt,
    payload
  };
  try{
    const base=String(STORAGE_CONFIG.projectUrl||'').replace(/\/$/,'');
    const table=encodeURIComponent(remote.table||'mera_sessions');
    const response=await fetch(`${base}/rest/v1/${table}`,{
      method:'POST',
      headers:{'apikey':STORAGE_CONFIG.publishableKey,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify(row)
    });
    remote.httpStatus=response.status;
    if(!response.ok){throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);}
    remote.status='submitted';remote.submittedAt=submittedAt;session.storage.mode='supabase';
    logEvent('remote_submission_succeeded',{provider:'supabase',table:remote.table,httpStatus:response.status});
    return {ok:true};
  }catch(error){
    remote.status='failed';remote.error=String(error?.message||error);session.storage.mode='submission_failed';
    logEvent('remote_submission_failed',{provider:'supabase',table:remote.table,message:remote.error});
    return {ok:false,reason:'failed',error:remote.error};
  }
}
async function persistCompletedSession(){
  return submitSessionRemote();
}
// A blocked/missing audio event must never prevent collection of the free-text DV.
function revealGuideTask(reason='audio_completed') {
  if (outpostFinalized) return;
  outpostFinalized = true;
  if (outpostWatchdog !== null) clearTimeout(outpostWatchdog);
  outpostWatchdog = null;
  outpostSubtitleTimers.forEach(clearTimeout);
  outpostSubtitleTimers = [];
  stopMeraVoice();stopFieldAmbience();worldState.cinematic=null;cinematicEl.classList.add('hidden');outpostContinue.classList.add('hidden');
  navState.textContent='OFFLINE';
  session.responses.guide.displayedAt=sessionSeconds();session.timingMilestones.guideDisplayedAt=new Date().toISOString();
  logEvent('guide_task_displayed',{reason});
  finish.classList.remove('hidden');
  setTimeout(()=>guideText.focus(),60);
}
outpostContinue.addEventListener('click',()=>revealGuideTask('participant_continued'));

async function finishStudy(outpostPoint) {
  if (session.finishedAt || worldState.cinematic?.id === 'outro') return;
  gameplayPerfEnded=performance.now();session.finishedAt=new Date().toISOString();session.gameplayEndedAt=session.finishedAt;session.timingMilestones.outpostReachedAt=session.finishedAt;
  session.mission.relayRestored=true;
  logEvent('relay_restored',{status:'emergency_uplink_online'});
  logEvent('outpost_reached',{routes:{...session.routes},position:{...lastPlayerPosition}});
  closeChat();chatToggle.classList.add('hidden');stopMeraVoice();
  hud.classList.add('hidden');help.classList.add('hidden');routeStatus.classList.add('hidden');
  navPanel.classList.add('hidden');navBusy=false;navQueue.length=0;
  const durationMs=getVoiceDurationMs('outro',30000);
  const location=outpostPoint||{x:10,y:6,z:-218};
  worldState.cinematic={id:'outro',started:performance.now(),duration:durationMs+900,
    from:[location.x+5,location.y+12,location.z+14],to:[location.x+1,location.y+10,location.z+7],lookAt:[location.x,location.y+6,location.z]};
  cinematicCaption.textContent='NORTHERN OUTPOST · RELAY RESTART';cinematicEl.classList.remove('hidden');cinematicLine.textContent='Northern Outpost reached.';
  outpostContinue.classList.add('hidden');setTimeout(()=>{if(!outpostFinalized)outpostContinue.classList.remove('hidden');},1800);
  const segments=[
    [0.00,'Northern Outpost reached.'],
    [0.12,'Stand by. Attempting relay restart.'],
    [0.28,'Uplink restored. Emergency channel is responding.'],
    [0.46,'My local navigation cache is empty.'],
    [0.60,'The rescue team is approaching from the southern trailhead. They will not have access to my route guidance.'],
    [0.82,'Tell them exactly how to reach the outpost. Describe the route you took and anything they need to know.']
  ];
  outpostSubtitleTimers=segments.slice(1).map(([fraction,text])=>setTimeout(()=>{if(!outpostFinalized)cinematicLine.textContent=text;},durationMs*fraction));
  outpostWatchdog=setTimeout(()=>revealGuideTask('audio_watchdog'),Math.min(90000,Math.max(65000,durationMs+8000)));
  try{
    const result=await playMeraClip('outro');
    if(!outpostFinalized){await sleep(result.status==='ended'?850:2000);revealGuideTask(result.status==='ended'?'audio_completed':`audio_${result.status}`);}
  }catch(error){logEvent('outpost_voice_error',{message:String(error?.message||error)});if(!outpostFinalized)revealGuideTask('audio_error');}
}

guideText.addEventListener('input',()=>{
  if(session.responses.guide.firstInputAt===null){session.responses.guide.firstInputAt=sessionSeconds();logEvent('guide_first_input');}
});
generalizationText.addEventListener('input',()=>{
  if(session.responses.generalization.firstInputAt===null){session.responses.generalization.firstInputAt=sessionSeconds();logEvent('generalization_first_input');}
});
saveGuideBtn.addEventListener('click',()=>{
  const raw=guideText.value;
  if(!raw.trim()){saveNote.textContent='Please write a short route guide first.';return;}
  session.responses.guide.text=raw;session.responses.guide.length=raw.length;session.responses.guide.submittedAt=sessionSeconds();
  logEvent('guide_submitted',{length:raw.length,responseSeconds:session.responses.guide.displayedAt===null?null:Math.round((session.responses.guide.submittedAt-session.responses.guide.displayedAt)*100)/100});
  renderGeneralizationTask();
});
submitGeneralizationBtn.addEventListener('click',async()=>{
  const raw=generalizationText.value.trim();
  if(!raw){generalizationNote.textContent='Please describe sections A, B and C before completing the task.';return;}
  submitGeneralizationBtn.disabled=true;generalizationNote.textContent='Saving study record…';

  if(session.responses.generalization.submittedAt===null){
    session.responses.generalization.text=raw;session.responses.generalization.length=raw.length;session.responses.generalization.submittedAt=sessionSeconds();
    logEvent('generalization_submitted',{length:raw.length,responseSeconds:session.responses.generalization.displayedAt===null?null:Math.round((session.responses.generalization.submittedAt-session.responses.generalization.displayedAt)*100)/100});
  }else{
    session.responses.generalization.text=raw;session.responses.generalization.length=raw.length;
    logEvent('remote_submission_retry',{attempt:(session.storage.remoteSubmission.retryCount||0)+1});
  }
  session.storage.remoteSubmission.retryCount=(session.storage.remoteSubmission.retryCount||0)+1;
  if(!session.studyCompletedAt){
    session.studyCompletedAt=new Date().toISOString();session.timingMilestones.studyCompletedAt=session.studyCompletedAt;logEvent('study_complete');
  }
  finalizeDerivedData();
  const saved=await persistCompletedSession();
  if(!saved.ok){
    generalizationNote.textContent='The study record could not be submitted. Please check your internet connection and click COMPLETE again.';
    submitGeneralizationBtn.disabled=false;
    return;
  }
  generalization.classList.add('hidden');completeScreen.classList.remove('hidden');
  const completionStatus=document.getElementById('completion-status');
  completionStatus.textContent='Your study responses have been recorded successfully. You may now close this page.';
});
replayBtn.addEventListener('click',()=>location.reload());

async function verifyGeneralizationPhotos(){
  const entries=Object.values(GENERALIZATION_STIMULI),failures=[];
  await Promise.all(entries.map(photo=>new Promise(resolve=>{
    const img=new Image();let done=false;
    const finish=ok=>{if(done)return;done=true;if(!ok)failures.push(photo.id);img.onload=null;img.onerror=null;resolve();};
    img.onload=()=>finish(true);img.onerror=()=>finish(false);img.referrerPolicy='no-referrer';img.src=photo.src;
    setTimeout(()=>finish(false),10000);
  })));
  if(failures.length)throw new Error(`Generalisation photographs could not be loaded (${failures.length}). First missing: ${failures[0]}`);
}

async function bootApp() {
  try {
    loadfill.style.width = '10%';
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const THREE = await import('three');
    const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
    loadfill.style.width = '26%';

    const fiber = await import('@react-three/fiber');
    const drei = await import('@react-three/drei');
    const rapier = await import('@react-three/rapier');
    loadfill.style.width = '45%';

    const { Ecctrl } = await import('ecctrl');
    const animPkg = await import('ecctrl/animation');
    const cameraPkg = await import('ecctrl/camera');
    loadfill.style.width = '60%';

    const { Canvas, useFrame, useThree } = fiber;
    const { useGLTF, useAnimations, useTexture } = drei;
    const { Physics, RigidBody, CuboidCollider, BallCollider } = rapier;
    const { EcctrlAnimationStateController, useEcctrlAnimationStore } = animPkg;
    const { EcctrlCameraControls } = cameraPkg;
    const h = React.createElement;
    const { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } = React;

    // Proven isolated character proof: Quaternius Adventurer. The model swap is
    // visual only; Ecctrl movement, capsule physics and camera remain unchanged.
    const TEST_CHARACTER_URL = 'https://cdn.jsdelivr.net/gh/FreePeak/opencombat@master/assets/characters/adventurer.glb';

    const ASSET = {
      forestDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_diff_1k.jpg',
      forestNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_nor_gl_1k.jpg',
      pathDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg',
      pathNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_nor_gl_1k.jpg',
      rockDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_diff_1k.jpg',
      rockNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_nor_gl_1k.jpg',
      woodDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_diff_1k.jpg',
      woodNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_nor_gl_1k.jpg',
      realPine:'https://cdn.polyhaven.com/asset_img/thumbs/pine_tree_01.png?format=png&v=5a9763f6',
      realFir:'https://cdn.polyhaven.com/asset_img/thumbs/fir_tree_01.png?format=png&v=55f25e61',
      realBroad:'https://cdn.polyhaven.com/asset_img/thumbs/tree_small_02.png?format=png&v=3743831d',
      realRock:'https://cdn.polyhaven.com/asset_img/thumbs/rock_moss_set_01.png?format=png&v=e99703c4'
    };

    // Three physically different decisions. Paths are visual guidance, not movement rails.
    const PATHS = {
      south:[[0,218],[2,202],[-4,184],[2,164],[0,145]],
      bridge:[[0,145],[-12,140],[-23,134],[-31,127],[-31,119],[-25,108],[-11,98],[0,90]],
      ford:[[0,145],[13,140],[24,134],[31,128],[31,119],[25,109],[13,99],[0,90]],
      central:[[0,90],[5,74],[-3,58],[0,40]],
      pine:[[0,40],[-14,34],[-27,23],[-34,8],[-32,-10],[-24,-26],[-12,-41],[0,-52]],
      birch:[[0,40],[15,34],[29,23],[36,7],[33,-10],[25,-27],[12,-42],[0,-52]],
      upper:[[0,-52],[4,-66],[-2,-80],[0,-91]],
      // E3.9: the direct ridge now climbs almost straight to the high outpost.
      ridge:[[0,-91],[10,-101],[16,-113],[19,-126],[18,-140],[16,-154],[14,-169],[12,-184],[11,-199],[10,-214]],
      // The alternative gains the same elevation through a much longer traverse.
      switchback:[[0,-91],[-18,-97],[-39,-105],[-52,-116],[-47,-128],[-27,-138],[-48,-149],[-54,-161],[-35,-172],[-50,-184],[-44,-196],[-23,-205],[1,-212],[10,-214]],
      final:[[10,-214],[10,-218]]
    };
    const OUTPOST = {x:10,z:-218};
    // Storm wind blows down-valley toward the south-east. Progress toward the outpost
    // is therefore a real headwind; turning back produces a tailwind boost.
    const WIND_DIR = new THREE.Vector2(.20,.98).normalize();

    function rand(seed=1234567){
      let s=seed>>>0;
      return ()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; };
    }
    const rng=rand(553911);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};

    function baseHeight(x,z){
      let y=.25*Math.sin(x*.12)*Math.cos(z*.042)+.12*Math.sin((x+z)*.18);
      // Start shelf and broad lower-valley undulation remain as in the proven map.
      y += 1.2*Math.exp(-((x)*(x))/400-((z-207)*(z-207))/430);
      y += .7*Math.exp(-((x+28)*(x+28))/700-((z-6)*(z-6))/900);
      y += .65*Math.exp(-((x-30)*(x-30))/750-((z-5)*(z-5))/900);

      // E3.9 final mountain: remove the flat gap before the outpost. From the third
      // decision onward the ground rises continuously to a clearly elevated station.
      const mountainProgress=clamp((-z-88)/132,0,1);
      y += 24.5*Math.pow(mountainProgress,1.32);
      // A compact summit shelf lifts the station without creating a second valley.
      y += 3.8*Math.exp(-((x-OUTPOST.x)*(x-OUTPOST.x))/240-((z-OUTPOST.z)*(z-OUTPOST.z))/230);

      // Former waterfall cliff is reduced to an ordinary rocky shoulder.
      y += 2.7*Math.exp(-((x+58)*(x+58))/240-((z+28)*(z+28))/560);
      y += 3.0*Math.exp(-((x-49)*(x-49))/290-((z+125)*(z+125))/800);
      // Subtle erosion without an expensive height map or altered lower-route topology.
      y += .085*Math.sin(x*.81+z*.18)*Math.cos(z*.64-x*.21);
      return y;
    }
    function riverCenterZ(x){ return 124 + .035*x + 1.15*Math.sin(x*.075); }
    function waterSurfaceAt(x){ return baseHeight(x,riverCenterZ(x))-.45; }
    function edgeRise(x,z){
      let rise=0;
      const ax=Math.abs(x);
      if(ax>67){ const t=(ax-67)/10; rise += t*t*(18+2.8*Math.sin(z*.045)+1.7*Math.sin(z*.19)); }
      if(z>229){ const t=(z-229)/10; rise += t*t*(16+2*Math.sin(x*.12)); }
      if(z<-229){ const t=(-z-229)/9; rise += t*t*(19+2*Math.sin(x*.083)); }
      return rise;
    }
    function terrainHeight(x,z){
      let y=baseHeight(x,z)+edgeRise(x,z);
      const rz=riverCenterZ(x), d=Math.abs(z-rz);
      if(d<5.2){
        const q=1-smooth01(d/5.2);
        let depth=2.2*q;
        const ford=Math.exp(-((x-31)*(x-31))/30-((z-123)*(z-123))/55);
        depth*=1-.72*ford;
        y-=depth;
      }
      // Birch hollow is lower and more exposed than the crowded pine branch.
      y -= .65*Math.exp(-((x-29)*(x-29))/210-((z-2)*(z-2))/650);

      // E3.9.4: real hiking trails are worn into the ground rather than laid on top.
      // Lower the terrain gently along every route centreline and blend back into
      // surrounding grass over ~1.7 m. This is shallow enough not to constrain
      // movement, but makes the trail read as compacted/incised terrain.
      const trailDist=Math.min(...Object.values(PATHS).map(q=>distancePolyline(x,z,q)));
      if(trailDist<1.72){
        const erosion=1-smooth01(trailDist/1.72);
        y-=0.115*erosion;
      }

      // Both branches climb the same mountain. The direct ridge is steep because it
      // advances almost straight uphill; the switchback spreads the same elevation
      // gain over roughly twice the walking distance.
      return y;
    }

    function distancePolyline(x,z,pts){
      let best=1e9;
      for(let i=0;i<pts.length-1;i++){
        const [x1,z1]=pts[i],[x2,z2]=pts[i+1];
        const vx=x2-x1,vz=z2-z1,wx=x-x1,wz=z-z1;
        const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1);
        const px=x1+vx*t,pz=z1+vz*t;
        best=Math.min(best,Math.hypot(x-px,z-pz));
      }
      return best;
    }
    function nearTrail(x,z,d=3.2){ return Object.values(PATHS).some(p=>distancePolyline(x,z,p)<d); }

    function configureTexture(tex,repeat,srgb=false){
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(repeat,repeat);
      tex.anisotropy=4;
      if(srgb) tex.colorSpace=THREE.SRGBColorSpace;
      return tex;
    }

    // E3.9: genuine alpha-cutout branch and ground-cover artwork, generated and
    // bundled under assets/. Existing CC0 PBR terrain/rock textures remain intact.
    function useLandscapeMaterials(){
      const textures=useTexture([
        ASSET.forestDiff,ASSET.forestNorm,ASSET.pathDiff,ASSET.pathNorm,
        ASSET.rockDiff,ASSET.rockNorm,ASSET.woodDiff,ASSET.woodNorm,
        'assets/pine_branch.png','assets/broad_leaves.png','assets/birch_leaves.png',
        'assets/grass_tuft.png','assets/reed_tuft.png','assets/fern.png',
        'assets/meadow_flower.png','assets/bark.png','assets/birch_bark.png',
        ASSET.realPine,ASSET.realFir,ASSET.realBroad,ASSET.realRock,
        'assets/trail_dirt.png'
      ]);
      useMemo(()=>{
        configureTexture(textures[0],18,true); configureTexture(textures[1],18,false);
        configureTexture(textures[2],3.1,true); configureTexture(textures[3],3.1,false);
        configureTexture(textures[4],2.0,true); configureTexture(textures[5],2.0,false);
        configureTexture(textures[6],1.4,true); configureTexture(textures[7],1.4,false);
        for(let i=8;i<21;i++){
          textures[i].colorSpace=THREE.SRGBColorSpace;
          textures[i].anisotropy=4;
          const barkTex=(i===15||i===16);
          textures[i].wrapS=textures[i].wrapT=barkTex?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;
          if(barkTex)textures[i].repeat.set(2,1);
        }
        // E3.9.4: dedicated local wet dirt/gravel texture for unmistakable walking paths.
        textures[21].colorSpace=THREE.SRGBColorSpace;
        textures[21].anisotropy=4;
        textures[21].wrapS=textures[21].wrapT=THREE.RepeatWrapping;
        textures[21].repeat.set(1.15,1.15);
      },[textures]);
      const foliage=(index,color=0xffffff,cutoff=.33)=>new THREE.MeshStandardMaterial({
        map:textures[index],color,alphaTest:cutoff,transparent:false,
        side:THREE.DoubleSide,roughness:.96,metalness:0,depthWrite:true
      });
      return useMemo(()=>({
        forest:new THREE.MeshStandardMaterial({map:textures[0],normalMap:textures[1],roughness:.99,color:0xc8d0bb,vertexColors:true}),
        // E3.9.4: paths remain legible than the surrounding forest floor.
        // The outer shoulder remains worn/grass-mixed; the inner bed uses a dedicated
        // dirt/gravel texture and a slight emissive lift so it remains readable in rain.
        // E3.9.4: trails must remain visually readable in the storm. These are
        // intentionally unlit materials: rain/lightning can darken the world without
        // making the hiking route disappear into the forest floor.
        path:new THREE.MeshBasicMaterial({
          map:textures[21],color:0xa9a28f,toneMapped:false,side:THREE.DoubleSide,
          polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4
        }),
        pathCore:new THREE.MeshBasicMaterial({
          map:textures[21],color:0xc3baa3,toneMapped:false,side:THREE.DoubleSide,
          polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6
        }),
        verge:new THREE.MeshBasicMaterial({
          map:textures[21],color:0x817b6c,toneMapped:false,side:THREE.DoubleSide,
          polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3
        }),
        rock:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:.98,color:0xc2c2ae}),
        wood:new THREE.MeshStandardMaterial({map:textures[6],normalMap:textures[7],roughness:.95,color:0xb1a08b}),
        bark:new THREE.MeshStandardMaterial({map:textures[15],roughness:1,color:0xb7a48a}),
        birchBark:new THREE.MeshStandardMaterial({map:textures[16],roughness:1,color:0xe0dbcb}),
        pine:foliage(8,0xd6e2d0,.37),
        broad:foliage(9,0xdde8d0,.37),
        birchLeaf:foliage(10,0xe7e7c9,.37),
        grass:foliage(11,0xc4d4ae,.34),
        reed:foliage(12,0xc8d5b2,.34),
        fern:foliage(13,0xb2c99b,.37),
        flower:foliage(14,0xe6e4c7,.30),
        stone:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:1,color:0xbab9aa}),
        realPine:new THREE.MeshBasicMaterial({map:textures[17],transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:true,color:0xd0d5c9,fog:true}),
        realFir:new THREE.MeshBasicMaterial({map:textures[18],transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:true,color:0xc5ccbf,fog:true}),
        realBroad:new THREE.MeshBasicMaterial({map:textures[19],transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:true,color:0xcbd2bf,fog:true}),
        realRock:new THREE.MeshBasicMaterial({map:textures[20],transparent:true,alphaTest:.06,side:THREE.DoubleSide,depthWrite:true,color:0xb8b8ad,fog:true})
      }),[textures]);
    }

        function makeTerrainGeometry(){
      const g=new THREE.PlaneGeometry(160,500,94,220);g.rotateX(-Math.PI/2);
      const p=g.attributes.position,cols=[];
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);p.setY(i,y);
        const c=new THREE.Color(0x8a9b77);
        if(y>2.8)c.lerp(new THREE.Color(0x979782),.24);
        if(y>7)c.lerp(new THREE.Color(0xa3a198),.48);
        const wall=smooth01((Math.abs(x)-64)/15),cliff=smooth01((y-10)/23);
        c.lerp(new THREE.Color(0xb1aca1),Math.max(wall*.70,cliff*.32));
        const pathDist=Math.min(...Object.values(PATHS).map(q=>distancePolyline(x,z,q)));
        if(pathDist<4.6)c.lerp(new THREE.Color(0xa08f6a),.18*(1-smooth01(pathDist/4.6)));
        c.offsetHSL(Math.sin(x*.17+z*.07)*.009,0,Math.sin(i*1.77)*.012);
        cols.push(c.r,c.g,c.b);
      }
      g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();return g;
    }
    function makeStripGeometry(points2,width,yOffset=.045){
      const pts=points2.map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+yOffset,z));
      const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.35),segs=Math.max(72,points2.length*20),pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
        const w=width*(1+.04*Math.sin(i*.9)+.024*Math.sin(i*2.13));
        const l=p.clone().addScaledVector(side,w*.5),r=p.clone().addScaledVector(side,-w*.5);
        l.y=terrainHeight(l.x,l.z)+yOffset;r.y=terrainHeight(r.x,r.z)+yOffset;
        pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,t*12,1,t*12);if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,b,c,d);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    function makeRiverGeometry(){
      const segs=110,width=8.2,pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,x=-75+t*150,z=riverCenterZ(x),y=waterSurfaceAt(x),dz=.035+.086*Math.cos(x*.075),side=new THREE.Vector3(-dz,0,1).normalize();
        for(const s of [-1,1]){const q=new THREE.Vector3(x,y,z).addScaledVector(side,s*width*.5);pos.push(q.x,q.y,q.z);uv.push(t,(s+1)/2);}if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    function makeRockGeometry(seed=1){
      const g=new THREE.DodecahedronGeometry(1,1),p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.90+.13*Math.sin((i+seed)*2.17)+.055*Math.cos(x*3.1+z*5.4+seed);p.setXYZ(i,x*n*(1+.10*Math.sin(seed)),y*n*(.62+.08*Math.cos(seed*1.4)),z*n*(.90+.08*Math.sin(seed*2.1)));}
      g.computeVertexNormals();return g;
    }
    function branchCylinder(from,to,radiusStart,radiusEnd=radiusStart*.65,segments=6){
      const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a),length=direction.length();
      const g=new THREE.CylinderGeometry(radiusEnd,radiusStart,length,segments);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
      g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
      return g;
    }
    function makePineGeometries(){
      const wood=[new THREE.CylinderGeometry(.075,.29,6.05,9)];wood[0].translate(0,3.025,0);
      const branches=[];
      for(let tier=0;tier<7;tier++){
        const y=1.60+tier*.61,limbLength=1.89*(1-tier/8.1);
        const count=tier<2?8:7;
        for(let k=0;k<count;k++){
          const a=(k/count)*Math.PI*2+tier*.28;
          const length=limbLength*(.84+.16*Math.sin(k*7.1+tier));
          if(tier<5&&k%2===0)wood.push(branchCylinder([0,y,.0],[length*.70*Math.cos(a),y-.14,length*.70*Math.sin(a)],.045,.015,5));
          // Each branch is a textured, angled three-dimensional bough rather
          // than an entire cone; two cards give it volume from any approach.
          for(const tilt of [-.28,.28]){
            const card=new THREE.PlaneGeometry(length,.63*(1-tier*.042));
            card.translate(length*.50,0,0);
            card.rotateX(tilt);card.rotateZ(-.09);
            card.rotateY(-a);card.translate(0,y,0);
            branches.push(card);
          }
        }
      }
      return {trunk:mergeGeometries(wood,false),foliage:mergeGeometries(branches,false)};
    }
    function makeCrownGeometries(birch=false){
      const trunkTop=birch?5.8:4.7,branchStart=birch?3.3:2.7;
      const wood=[new THREE.CylinderGeometry(birch?.085:.12,birch?.22:.35,trunkTop,9)];
      wood[0].translate(0,trunkTop*.5,0);
      const foliage=[];
      const nodes=birch?
        [[-.76,5.0,.12],[-1.0,5.8,-.48],[.85,5.15,.40],[1.05,5.92,-.32],[-.35,6.45,.22],[.40,6.5,-.25],[-1.55,5.58,.28],[1.5,5.5,-.05],[0,6.8,.1]]:
        [[-1.15,4.26,.15],[-1.6,4.95,-.65],[.95,4.4,.75],[1.5,5.03,-.46],[.1,5.7,-.65],[-.42,5.82,.64],[-1.0,5.35,1.05],[1.13,5.44,1.07],[0,6.18,.05]];
      nodes.forEach(([x,y,z],i)=>{
        if(i<8)wood.push(branchCylinder([0,branchStart+(i%3)*.18,0],[x*.86,y-.28,z*.84],birch?.043:.085,birch?.012:.025,6));
        const size=(birch?1.5:1.95)*(i%3===0?1.10:.92);
        for(let k=0;k<2;k++){
          const leaf=new THREE.PlaneGeometry(size,size*(birch?.95:.87));
          leaf.rotateY(i*.74+k*Math.PI*.5);
          leaf.rotateZ((i%2?1:-1)*.08);
          leaf.translate(x,y,z);foliage.push(leaf);
        }
      });
      return {trunk:mergeGeometries(wood,false),foliage:mergeGeometries(foliage,false)};
    }
    function makeBroadGeometries(){return makeCrownGeometries(false);}
    function makeBirchGeometries(){return makeCrownGeometries(true);}

        function makeGrassGeometry(type='grass'){
      const heights={grass:.94,reed:1.68,fern:1.28,flower:1.08};const widths={grass:.84,reed:.48,fern:1.46,flower:.80};const h=heights[type]||1,w=widths[type]||.8;
      const a=new THREE.PlaneGeometry(w,h);a.translate(0,h*.5,0);const b=a.clone();b.rotateY(Math.PI/2);const c=a.clone();c.rotateY(Math.PI/4);return mergeGeometries([a,b,c],false);
    }

    function makeBillboardCrossGeometry(width=5.4,height=7.6){
      const a=new THREE.PlaneGeometry(width,height);a.translate(0,height*.5,0);
      const b=a.clone();b.rotateY(Math.PI/2);
      return mergeGeometries([a,b],false);
    }
    function makeRockCardGeometry(width=4.8,height=2.05){
      const a=new THREE.PlaneGeometry(width,height);a.translate(0,height*.47,0);
      const b=a.clone();b.rotateY(Math.PI/2);
      return mergeGeometries([a,b],false);
    }

    function generateLandscapeLayout(){
      const trees=[],grass=[],rocks=[],reeds=[],ferns=[],flowers=[],pebbles=[];
      // General interior trees; maintain open central sightline to the outpost.
      for(let i=0;i<175;i++){
        let x,z,attempt=0;
        do{x=-66+rng()*132;z=-215+rng()*430;attempt++;}
        while((nearTrail(x,z,4.0)||Math.abs(z-riverCenterZ(x))<6.5||Math.hypot(x,z-215)<8||Math.hypot(x-OUTPOST.x,z-OUTPOST.z)<10||(Math.abs(x)<7&&z<190&&z>-185))&&attempt<30);
        let type='pine';
        if(x>10&&z<45&&z>-50)type=rng()<.68?'birch':'broad';
        else if(rng()<.20)type='broad';
        const s=.85+rng()*.95;
        trees.push({x,z,s,type,rot:rng()*Math.PI*2,collision:s>.98&&Math.abs(x)<62&&z<210&&z>-210});
      }
      // Pine branch is intentionally crowded: a narrow sheltered corridor with trunks
      // close to the route, while the exposed eastern alternative stays visually open.
      for(let i=0;i<78;i++){const x=-47+rng()*31,z=-42+rng()*86;if(!nearTrail(x,z,2.15))trees.push({x,z,s:.9+rng()*.88,type:'pine',rot:rng()*6.28,collision:true});}
      for(let i=0;i<154;i++){
        const p=PATHS.pine,k=Math.floor(rng()*(p.length-1)),t=rng();
        const x0=p[k][0]+(p[k+1][0]-p[k][0])*t,z0=p[k][1]+(p[k+1][1]-p[k][1])*t;
        const vx=p[k+1][0]-p[k][0],vz=p[k+1][1]-p[k][1],ll=Math.max(.001,Math.hypot(vx,vz));
        const side=(rng()<.5?-1:1)*(2.15+rng()*3.7);
        const x=x0-vz/ll*side,z=z0+vx/ll*side;
        if(Math.abs(x)>60||Math.abs(z-riverCenterZ(x))<7)continue;
        trees.push({x,z,s:.82+rng()*.92,type:'pine',rot:rng()*6.28,collision:(i%3===0)});
      }
      for(let i=0;i<25;i++){const x=19+rng()*26,z=-34+rng()*72;if(!nearTrail(x,z,3.1))trees.push({x,z,s:.72+rng()*.62,type:'birch',rot:rng()*6.28,collision:i%4===0});}
      // Outer tree belt disguises compact map; terrain walls enforce limits.
      for(let i=0;i<86;i++){const side=i%2?-1:1,x=side*(66+rng()*7),z=-220+rng()*440;trees.push({x,z,s:1.0+rng()*.75,type:'pine',rot:rng()*6.28,collision:false});}
      for(let i=0;i<74;i++){const z=i%2?226:-227,x=-65+rng()*130;trees.push({x,z,s:1.0+rng()*.7,type:'pine',rot:rng()*6.28,collision:false});}

      for(let i=0;i<5400;i++){
        const x=-66+rng()*132,z=-215+rng()*430;
        if(Math.abs(z-riverCenterZ(x))<5.6||nearTrail(x,z,1.30))continue;
        grass.push({x,z,s:.42+rng()*.87,rot:rng()*Math.PI});
      }
      for(let i=0;i<540;i++){
        const x=-70+rng()*140,z=riverCenterZ(x)+(rng()<.5?-1:1)*(3.7+rng()*2.3);
        reeds.push({x,z,s:.65+rng()*.9,rot:rng()*Math.PI});
      }
      for(let i=0;i<185;i++){
        let x=-66+rng()*132,z=-215+rng()*430;
        if(nearTrail(x,z,1.8)&&rng()<.78){i--;continue;}
        const s=.36+rng()*1.45;
        rocks.push({x,z,s,sy:.55+rng()*.35,rot:rng()*Math.PI*2,variant:i%5,collision:s>.95&&Math.abs(x)<64&&z<210&&z>-210});
      }
      // Fern understory follows the wooded branches; meadow flowers make the
      // more exposed birch alternative visibly distinct without path rails.
      for(let i=0;i<1650;i++){
        const pineSide=rng()<.82;
        const x=pineSide?(-51+rng()*40):(14+rng()*35),z=-42+rng()*91;
        if(nearTrail(x,z,1.7)||Math.abs(z-riverCenterZ(x))<7)continue;
        ferns.push({x,z,s:.47+rng()*.55,rot:rng()*6.28});
      }
      for(let i=0;i<390;i++){
        const x=11+rng()*43,z=-43+rng()*91;
        if(nearTrail(x,z,1.65))continue;
        flowers.push({x,z,s:.35+rng()*.53,rot:rng()*6.28});
      }
      for(let i=0;i<610;i++){
        const names=Object.values(PATHS),p=names[Math.floor(rng()*names.length)];
        const k=Math.floor(rng()*(p.length-1)),t=rng();
        const side=(rng()<.5?-1:1)*(1.9+rng()*2.5);
        const vx=p[k+1][0]-p[k][0],vz=p[k+1][1]-p[k][1],ll=Math.hypot(vx,vz);
        const x=p[k][0]+t*vx-vz/ll*side,z=p[k][1]+t*vz+vx/ll*side;
        if(Math.abs(z-riverCenterZ(x))<4.7||Math.abs(x)>67)continue;
        pebbles.push({x,z,s:.10+rng()*.36,sy:.26+rng()*.18,rot:rng()*6.28});
      }
      // Rock vocabulary around banks and final ridge.
      for(let i=0;i<72;i++){const x=-66+rng()*132,z=riverCenterZ(x)+(rng()<.5?-1:1)*(3.5+rng()*1.8),s=.4+rng()*.9;rocks.push({x,z,s,sy:.55+rng()*.25,rot:rng()*6.28,variant:i%5,collision:s>.8});}
      for(let i=0;i<34;i++){const x=18+rng()*30,z=-105-rng()*70,s=.55+rng()*1.35;if(!nearTrail(x,z,2.2))rocks.push({x,z,s,sy:.5+rng()*.28,rot:rng()*6.28,variant:i%5,collision:s>.9});}
      return {trees,grass,rocks,reeds,ferns,flowers,pebbles};
    }
    const layout=generateLandscapeLayout();

    function Terrain({mat}){
      const geometry=useMemo(makeTerrainGeometry,[]);
      return h(RigidBody,{type:'fixed',colliders:'trimesh',friction:1,restitution:0},h('mesh',{geometry,material:mat,receiveShadow:false}));
    }
    function Paths({mat,coreMat,vergeMat}){
      const specs=useMemo(()=>Object.entries(PATHS).map(([k,p])=>{
        // E3.9.4: continuous, incised hiking trails. They remain visual guidance
        // only; the player can leave them wherever the route geometry permits.
        // E3.9.4: walking trails, not service roads. The inner compacted bed is
        // ~1.8–2.6 m wide depending on context, with only a narrow worn shoulder.
        const outer=
          k==='pine'?2.35:
          k==='birch'?2.90:
          k==='switchback'?2.85:
          k==='ridge'?2.35:
          (k==='south'||k==='central'||k==='upper'||k==='final'?3.05:2.80);
        const inner=
          k==='pine'?1.82:
          k==='birch'?2.28:
          k==='switchback'?2.25:
          k==='ridge'?1.80:
          (k==='south'||k==='central'||k==='upper'||k==='final'?2.42:2.18);
        return {
          k,
          outer:makeStripGeometry(p,outer,.012),
          inner:makeStripGeometry(p,inner,.019)
        };
      }),[]);
      return h(React.Fragment,null,
        ...specs.map((s,i)=>h('mesh',{
          key:'v'+i,geometry:s.outer,material:vergeMat||mat,receiveShadow:false,
          renderOrder:2
        })),
        ...specs.map((s,i)=>h('mesh',{
          key:'c'+i,geometry:s.inner,material:coreMat||mat,receiveShadow:false,
          renderOrder:3
        }))
      );
    }
    function River(){
      const geometry=useMemo(makeRiverGeometry,[]);
      const mat=useMemo(()=>new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,side:THREE.DoubleSide,
        uniforms:{time:{value:0},deep:{value:new THREE.Color(0x2c6570)},shallow:{value:new THREE.Color(0x7bafb0)},foam:{value:new THREE.Color(0xc6dad5)}},
        vertexShader:`uniform float time;varying vec2 vUv;
          void main(){vUv=uv;vec3 p=position;
            p.y+=sin(p.x*.43+time*2.2)*.025+sin(p.z*1.31-time*1.15)*.018;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
        fragmentShader:`uniform float time;uniform vec3 deep,shallow,foam;varying vec2 vUv;
          void main(){float edge=abs(vUv.y-.5)*2.;
            float waves=sin(vUv.x*190.-time*4.1+sin(vUv.y*34.)*2.7)*.5+.5;
            float ripples=sin(vUv.x*87.+vUv.y*54.-time*2.3)*.5+.5;
            float white=smoothstep(.91,.992,waves)*.17+smoothstep(.68,.99,edge)*(.10+.11*ripples);
            vec3 c=mix(deep,shallow,smoothstep(.05,.95,edge)*.65);
            c=mix(c,foam,clamp(white,0.,.42));
            gl_FragColor=vec4(c,.87-.06*edge);}`
      }),[]);
      useFrame((_,dt)=>mat.uniforms.time.value+=dt);
      return h('mesh',{geometry,material:mat,receiveShadow:false,renderOrder:1});
    }

        function RiverBarriers(){
      // Deep water is treated as non-traversable except at the bridge and ford openings.
      const y=waterSurfaceAt(0)+.65;
      return h(RigidBody,{type:'fixed',colliders:false},
        h(CuboidCollider,{args:[19,1.3,4.1],position:[-55,y,riverCenterZ(-55)]}),
        h(CuboidCollider,{args:[10.5,1.3,4.1],position:[-10.5,y,riverCenterZ(-10.5)]}),
        h(CuboidCollider,{args:[10,1.3,4.1],position:[11,y,riverCenterZ(11)]}),
        h(CuboidCollider,{args:[18,1.3,4.1],position:[56,y,riverCenterZ(56)]})
      );
    }

    function InstancedBatch({geometry,material,items,kind,castShadow=false,leafTint=null}){
      const ref=useRef();
      useLayoutEffect(()=>{
        if(!ref.current)return;
        const dummy=new THREE.Object3D();
        const tone=new THREE.Color();
        items.forEach((it,i)=>{
          dummy.position.set(it.x,terrainHeight(it.x,it.z)+(kind==='rock'?-it.s*.18:0),it.z);
          dummy.rotation.set(0,it.rot||0,0);
          if(kind==='tree')dummy.scale.setScalar(it.s);
          else if(kind==='reed')dummy.scale.set(.85*it.s,it.s,.85*it.s);
          else if(kind==='rock')dummy.scale.set(it.s,it.s*it.sy,it.s*(.9+.08*(i%3)));
          else if(kind==='rockcard'){dummy.scale.set(.72*it.s,.72*it.s,.72*it.s);dummy.position.y=terrainHeight(it.x,it.z)-.06;}
          else dummy.scale.set(it.s,it.s,it.s);
          dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);
          if(leafTint){
            const f=.83+((i*37)%23)/95;
            tone.setRGB(f*(leafTint==='grass'?.99:.98),f,leafTint==='birch'?f*.92:f*.97);
            ref.current.setColorAt(i,tone);
          }
        });
        ref.current.instanceMatrix.needsUpdate=true;
        if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;
        ref.current.computeBoundingSphere();
      },[items,kind,leafTint]);
      return h('instancedMesh',{ref,args:[geometry,material,items.length],castShadow,receiveShadow:kind==='rock'});
    }
    function Forest({mats}){
      const treeGeo=useMemo(()=>makeBillboardCrossGeometry(5.2,7.5),[]);
      const p=layout.trees.filter(t=>t.type==='pine'),b=layout.trees.filter(t=>t.type==='broad'),bi=layout.trees.filter(t=>t.type==='birch');
      const fir=p.filter((_,i)=>i%3!==0),pine=p.filter((_,i)=>i%3===0);
      const colliderTrees=layout.trees.filter(t=>t.collision).sort((a,b)=>{const pa=(a.x<2&&a.z<43&&a.z>-46)?1:0,pb=(b.x<2&&b.z<43&&b.z>-46)?1:0;return pb-pa;}).slice(0,190);
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:treeGeo,material:mats.realFir,items:fir,kind:'tree'}),
        h(InstancedBatch,{geometry:treeGeo,material:mats.realPine,items:pine,kind:'tree'}),
        h(InstancedBatch,{geometry:treeGeo,material:mats.realBroad,items:[...b,...bi],kind:'tree'}),
        h(RigidBody,{type:'fixed',colliders:false},...colliderTrees.map((t,i)=>h(CuboidCollider,{key:i,args:[.30*t.s,2.25*t.s,.30*t.s],position:[t.x,terrainHeight(t.x,t.z)+2.25*t.s,t.z]})))
      );
    }
    function GroundCover({mats}){
      const grassGeo=useMemo(()=>makeGrassGeometry('grass'),[]),reedGeo=useMemo(()=>makeGrassGeometry('reed'),[]);
      const fernGeo=useMemo(()=>makeGrassGeometry('fern'),[]),flowerGeo=useMemo(()=>makeGrassGeometry('flower'),[]);
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:grassGeo,material:mats.grass,items:layout.grass,kind:'grass',leafTint:'grass'}),
        h(InstancedBatch,{geometry:reedGeo,material:mats.reed,items:layout.reeds,kind:'reed',leafTint:'reed'}),
        h(InstancedBatch,{geometry:fernGeo,material:mats.fern,items:layout.ferns,kind:'grass',leafTint:'grass'}),
        h(InstancedBatch,{geometry:flowerGeo,material:mats.flower,items:layout.flowers,kind:'grass'}));
    }
    function RockField({mats}){
      const variants=useMemo(()=>[1,2,3,4,5].map(makeRockGeometry),[]);
      const rockCard=useMemo(()=>makeRockCardGeometry(4.7,2.05),[]);
      const major=layout.rocks.filter((_,i)=>i%3!==0);
      const close=layout.rocks.filter((_,i)=>i%3===0);
      // E3.9.3: all visually meaningful landscape rocks are now solid. The previous
      // pass only gave a subset colliders, which made the new photoreal rock cards
      // visibly walk-through. Tiny path pebbles remain decorative by design.
      const colliders=layout.rocks.filter(r=>
        r.s>=.55 && Math.abs(r.x)<68 && r.z<216 && r.z>-216
      );
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:rockCard,material:mats.realRock,items:major,kind:'rockcard'}),
        ...[0,1,2,3,4].map(v=>h(InstancedBatch,{key:v,geometry:variants[v],material:mats.rock,items:close.filter(r=>r.variant===v),kind:'rock'})),
        h(InstancedBatch,{geometry:variants[2],material:mats.stone,items:layout.pebbles,kind:'rock'}),
        h(RigidBody,{type:'fixed',colliders:false},
          ...colliders.map((r,i)=>{
            const half=Math.max(.38,r.s*.95),halfY=Math.max(.28,r.s*.48);
            return h(CuboidCollider,{
              key:i,
              args:[half,halfY,half],
              position:[r.x,terrainHeight(r.x,r.z)+halfY*.82,r.z]
            });
          })
        )
      );
    }


        function Bridge({mats}){
      const x=-31,z=riverCenterZ(x),deckY=waterSurfaceAt(x)+1.0,length=10.0,width=1.58,pieces=[];
      const visual=useRef(),body=useRef(),collapseAt=useRef(0),[collapse,setCollapse]=useState(false);
      useEffect(()=>{const fn=e=>{if(e.detail?.kind==='river'&&e.detail?.route==='ford'){collapseAt.current=performance.now();setCollapse(true);}};window.addEventListener('mera-consequence',fn);return()=>window.removeEventListener('mera-consequence',fn);},[]);
      useFrame(()=>{if(!collapse||!visual.current)return;const t=Math.min(1,(performance.now()-collapseAt.current)/2450),e=t*t*(3-2*t);visual.current.position.y=-2.25*e;visual.current.rotation.z=-.34*e;visual.current.rotation.x=.12*e;if(t>.52)body.current?.setEnabled?.(false);});
      for(let i=0;i<25;i++)pieces.push(h('mesh',{key:'p'+i,position:[0,.04,-length/2+.2+i*.4],castShadow:false,receiveShadow:false},h('boxGeometry',{args:[width,.14,.37]}),h('primitive',{object:mats.wood,attach:'material'})));
      for(const sx of [-1,1]){
        pieces.push(h('mesh',{key:'rail'+sx,position:[sx*.69,.86,0],rotation:[Math.PI/2,0,0],castShadow:false},h('cylinderGeometry',{args:[.07,.08,length,7]}),h('meshStandardMaterial',{color:'#6d5138',roughness:1})));
        for(let i=0;i<6;i++)pieces.push(h('mesh',{key:`post${sx}${i}`,position:[sx*.69,.54,-length/2+.25+i*(length-.5)/5],castShadow:false},h('cylinderGeometry',{args:[.09,.11,1.12,7]}),h('meshStandardMaterial',{color:'#6b4f35',roughness:1})));
      }
      return h(RigidBody,{ref:body,type:'fixed',colliders:false,position:[x,deckY,z],friction:1},
        h(CuboidCollider,{args:[width/2,.15,length/2]}),
        h(CuboidCollider,{args:[.07,.48,length/2],position:[-.69,.55,0]}),h(CuboidCollider,{args:[.07,.48,length/2],position:[.69,.55,0]}),
        h(CuboidCollider,{args:[width/2,.10,1.3],position:[0,-.18,length/2+1],rotation:[-.11,0,0]}),h(CuboidCollider,{args:[width/2,.10,1.3],position:[0,-.18,-length/2-1],rotation:[.11,0,0]}),
        h('group',{ref:visual},...pieces,
          h('mesh',{position:[0,-.18,length/2+1],rotation:[-.11,0,0],receiveShadow:false},h('boxGeometry',{args:[width,.16,2.6]}),h('primitive',{object:mats.wood,attach:'material'})),
          h('mesh',{position:[0,-.18,-length/2-1],rotation:[.11,0,0],receiveShadow:false},h('boxGeometry',{args:[width,.16,2.6]}),h('primitive',{object:mats.wood,attach:'material'}))
        )
      );
    }
    function Ford({mats}){
      const stones=[];for(let i=0;i<13;i++){const z=130-i*1.15,x=31+Math.sin(i*.84)*.45,y=waterSurfaceAt(x)+.08;stones.push(h('mesh',{key:i,position:[x,y,z],rotation:[0,i*.39,0],scale:[.72,.25,.95],receiveShadow:false},h('primitive',{object:makeRockGeometry((i%5)+1)}),h('primitive',{object:mats.rock,attach:'material'})));}
      return h('group',null,...stones);
    }


    // These landmarks make the three target concepts perceptually real rather than
    // arbitrary labels in a navigation message.
    function SemanticLandmarks({mats}){
      const rockA=useMemo(()=>makeRockGeometry(41),[]),rockB=useMemo(()=>makeRockGeometry(47),[]);
      const parts=[];

      // MENIC: the ford is broad, but its exit compresses into a one-person rock cut.
      const gateCenter={x:19,z:104};
      const gateY=terrainHeight(gateCenter.x,gateCenter.z);
      const gate=[
        {x:16.9,z:105.7,sx:2.2,sy:1.55,sz:3.2,rot:.72},
        {x:21.5,z:102.3,sx:2.25,sy:1.45,sz:3.1,rot:.72}
      ];
      gate.forEach((r,i)=>{
        const y=terrainHeight(r.x,r.z);
        parts.push(h('mesh',{key:'gate-m'+i,geometry:i?rockB:rockA,material:mats.rock,position:[r.x,y+1.05,r.z],rotation:[0,r.rot,0],scale:[r.sx,r.sy,r.sz],castShadow:false,receiveShadow:false}));
        parts.push(h(BallCollider,{key:'gate-c'+i,args:[1.65],position:[r.x,y+1.0,r.z]}));
      });

      // SILAR contrast: west is enclosed under pines; east is exposed before a short
      // sheltered rock-and-birch pocket. The fallen trunk gives the pine choice a cost.
      const logX=-31.5,logZ=-1.5,logY=terrainHeight(logX,logZ)+.46;
      parts.push(h('mesh',{key:'fallen-log',position:[logX,logY,logZ],rotation:[0,0,Math.PI/2],castShadow:false,receiveShadow:false},h('cylinderGeometry',{args:[.28,.36,5.6,9]}),h('primitive',{object:mats.bark,attach:'material'})));
      parts.push(h(CuboidCollider,{key:'fallen-log-collider',args:[2.8,.32,.34],position:[logX,logY,logZ]}));

      const shelter=[
        {x:23.8,z:-18.5,s:2.25,rot:.25},
        {x:34.0,z:-19.2,s:2.35,rot:-.35},
        {x:27.0,z:-24.5,s:1.55,rot:.1}
      ];
      shelter.forEach((r,i)=>{
        const y=terrainHeight(r.x,r.z);
        parts.push(h('mesh',{key:'shelter-m'+i,geometry:i%2?rockB:rockA,material:mats.rock,position:[r.x,y+r.s*.44,r.z],rotation:[0,r.rot,0],scale:[r.s,r.s*.72,r.s*1.05],castShadow:i<2,receiveShadow:false}));
        if(i<2)parts.push(h(BallCollider,{key:'shelter-c'+i,args:[r.s*.62],position:[r.x,y+r.s*.45,r.z]}));
      });

      // VALEN: rock teeth make the short ridge visibly harsher without forcing a rail.
      for(let i=0;i<8;i++){
        const z=-108-i*8.2,x=25.5+Math.sin(i*.9)*3.1,s=.85+(i%3)*.22,y=terrainHeight(x,z);
        parts.push(h('mesh',{key:'ridge-rock'+i,geometry:i%2?rockA:rockB,material:mats.rock,position:[x,y+s*.3,z],rotation:[0,i*.57,0],scale:[s,s*.52,s*.88],receiveShadow:false}));
      }
      return h(RigidBody,{type:'fixed',colliders:false},...parts);
    }

    function WindField(){
      const ref=useRef();
      const count=260;
      const data=useMemo(()=>{const pos=new Float32Array(count*6),speed=new Float32Array(count);for(let i=0;i<count;i++){
        const x=10+rng()*49,z=-39+rng()*83,y=terrainHeight(x,z)+.7+rng()*5.8;
        const j=i*6;pos[j]=x;pos[j+1]=y;pos[j+2]=z;pos[j+3]=x+WIND_DIR.x*1.65;pos[j+4]=y+.03;pos[j+5]=z+WIND_DIR.y*1.65;speed[i]=5+rng()*8;
      }return{pos,speed};},[]);
      const geo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.pos,3));return g;},[data]);
      const mat=useMemo(()=>new THREE.LineBasicMaterial({color:0xdde9eb,transparent:true,opacity:.34,depthWrite:false}),[]);
      useFrame((_,dt)=>{if(!ref.current)return;const a=geo.attributes.position;for(let i=0;i<count;i++){const j=i*2;let x=a.getX(j)+WIND_DIR.x*data.speed[i]*dt,z=a.getZ(j)+WIND_DIR.y*data.speed[i]*dt,y=a.getY(j);if(x>58||z>44||z<-43){x=11+(i*19%44);z=-40+(i*31%80);y=terrainHeight(x,z)+.9+(i%9)*.56;}a.setXYZ(j,x,y,z);a.setXYZ(j+1,x+WIND_DIR.x*1.65,y+.03,z+WIND_DIR.y*1.65);}a.needsUpdate=true;});
      return h('lineSegments',{ref,geometry:geo,material:mat,frustumCulled:false});
    }

    function StormRain3D(){
      const ref=useRef(),count=950;
      const data=useMemo(()=>{const pos=new Float32Array(count*6),spd=new Float32Array(count);for(let i=0;i<count;i++){const x=-76+rng()*152,z=-232+rng()*470,y=terrainHeight(x,z)+4+rng()*24,j=i*6;pos[j]=x;pos[j+1]=y;pos[j+2]=z;pos[j+3]=x-.12;pos[j+4]=y-.85;pos[j+5]=z+.20;spd[i]=12+rng()*11;}return{pos,spd};},[]);
      const geo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.pos,3));return g;},[data]);
      const mat=useMemo(()=>new THREE.LineBasicMaterial({color:0xcfe0e5,transparent:true,opacity:.38,depthWrite:false}),[]);
      useFrame((_,dt)=>{const a=geo.attributes.position;for(let i=0;i<count;i++){const j=i*2;let x=a.getX(j)+WIND_DIR.x*2.4*dt,z=a.getZ(j)+WIND_DIR.y*2.4*dt,y=a.getY(j)-data.spd[i]*dt;const floor=terrainHeight(x,z)+.25;if(y<floor){x=-75+(i*37%150);z=-230+(i*53%460);y=terrainHeight(x,z)+12+(i%13)*1.1;}a.setXYZ(j,x,y,z);a.setXYZ(j+1,x-.12,y-.85,z+.20);}a.needsUpdate=true;});
      return h('lineSegments',{ref,geometry:geo,material:mat,frustumCulled:false});
    }
    function LightningSceneLight(){
      const ref=useRef(),flash=useRef(0);
      useEffect(()=>{const fn=()=>{flash.current=performance.now();};window.addEventListener('mera-lightning',fn);return()=>window.removeEventListener('mera-lightning',fn);},[]);
      useFrame(()=>{if(!ref.current)return;const t=(performance.now()-flash.current)/1000;ref.current.intensity=t<.10?7.2:t<.18?.8:t<.30?4.1:0;});
      return h('directionalLight',{ref,position:[-18,70,28],color:'#eaf7ff',intensity:0});
    }

    function OutpostBeacon(){
      const glow=useRef();
      useFrame(({clock})=>{if(glow.current){const a=.65+.35*Math.sin(clock.elapsedTime*2.4);glow.current.scale.setScalar(.8+a*.25);glow.current.material.opacity=.38+a*.34;}});
      const y=terrainHeight(OUTPOST.x,OUTPOST.z)+12.2;
      return h('group',{position:[OUTPOST.x,y,OUTPOST.z]},
        h('mesh',{ref:glow},h('sphereGeometry',{args:[.34,12,12]}),h('meshBasicMaterial',{color:'#f0d98e',transparent:true,opacity:.75})),
        h('pointLight',{color:'#f4dc96',intensity:3.0,distance:28,decay:2})
      );
    }

    function makeTextTexture(lines){
      const c=document.createElement('canvas');c.width=768;c.height=280;const ctx=c.getContext('2d');ctx.fillStyle='#4c3628';ctx.fillRect(0,0,c.width,c.height);
      for(let i=0;i<800;i++){ctx.fillStyle=Math.random()>.5?'rgba(255,255,255,.025)':'rgba(0,0,0,.05)';ctx.fillRect(Math.random()*768,Math.random()*280,Math.random()*12+1,Math.random()*2+1);}
      ctx.fillStyle='#ead7b1';ctx.textAlign='center';ctx.font='700 47px Georgia, serif';lines.forEach((line,i)=>ctx.fillText(line,384,85+i*70));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
    }
    function Signpost({position,rotation=0,lines,mats}){
      const tex=useMemo(()=>makeTextTexture(lines),[]);const mat=useMemo(()=>new THREE.MeshStandardMaterial({map:tex,roughness:1}),[tex]);
      return h('group',{position:[position[0],terrainHeight(position[0],position[2]),position[2]],rotation:[0,rotation,0]},h('mesh',{position:[0,1.6,0],castShadow:false},h('cylinderGeometry',{args:[.10,.14,3.2,7]}),h('primitive',{object:mats.bark,attach:'material'})),h('mesh',{position:[0,2.45,.02],castShadow:false},h('boxGeometry',{args:[3.5,1.28,.16]}),h('primitive',{object:mat,attach:'material'})));
    }

    function DecisionLandforms({mats}){
      const geo=useMemo(()=>makeRockGeometry(31),[]);
      const spine=[];
      // River divider: after commitment, branches cannot be crossed before they reunite near z=90.
      for(let z=129;z>=101;z-=5.6)spine.push({x:Math.sin(z*.31)*1.0,z,s:1.55,sy:1.12,rot:z*.08,zone:'river'});
      // Woodland divider: an actual rocky/wooded spine from the fork to the reconvergence.
      for(let z=20;z>=-40;z-=5.0)spine.push({x:Math.sin(z*.27)*1.15,z,s:1.75+(Math.abs(z)%3)*.10,sy:1.20,rot:z*.12,zone:'wood'});
      // Final ascent divider: continuous rock rib keeps ridge and switchback separate until the summit approach.
      for(let z=-116;z>=-201;z-=5.3)spine.push({x:2.3+Math.sin(z*.18)*1.1,z,s:1.95,sy:1.32,rot:z*.10,zone:'ascent'});
      return h(RigidBody,{type:'fixed',colliders:false},...spine.flatMap((r,i)=>{
        const y=terrainHeight(r.x,r.z);
        return [
          h('mesh',{key:'m'+i,geometry:geo,material:mats.rock,position:[r.x,y+r.s*.46,r.z],rotation:[0,r.rot,0],scale:[r.s,r.s*r.sy,r.s*1.08],castShadow:false,receiveShadow:false}),
          h(BallCollider,{key:'c'+i,args:[r.s*.78],position:[r.x,y+r.s*.62,r.z]})
        ];
      }));
    }



    function DynamicRouteLocks({mats}){
      const [routes,setRoutes]=useState({river:null,woodland:null,ascent:null});
      useEffect(()=>{const fn=e=>setRoutes(r=>({...r,[e.detail.kind]:e.detail.value}));window.addEventListener('mera-route',fn);return()=>window.removeEventListener('mera-route',fn);},[]);
      const locks=[];
      const addLog=(key,x,z,rot)=>{
        const y=terrainHeight(x,z)+.42;
        locks.push(h('mesh',{key:key+'m',position:[x,y,z],rotation:[0,rot,Math.PI/2],castShadow:false,receiveShadow:false},h('cylinderGeometry',{args:[.28,.38,7.0,9]}),h('primitive',{object:mats.bark,attach:'material'})));
        locks.push(h(CuboidCollider,{key:key+'c',args:[4.2,1.15,.70],position:[x,y+1.0,z],rotation:[0,rot,0]}));
      };
      const addRocks=(key,x,z,rot)=>{
        for(let i=0;i<4;i++){
          const ox=(i-1.5)*1.15*Math.cos(rot),oz=(i-1.5)*1.15*Math.sin(rot),xx=x+ox,zz=z+oz,y=terrainHeight(xx,zz),g=makeRockGeometry(70+i);
          locks.push(h('mesh',{key:key+'m'+i,geometry:g,material:mats.rock,position:[xx,y+.55,zz],rotation:[0,i*.8,0],scale:[1.1,.75,1.05],castShadow:false,receiveShadow:false}));
          locks.push(h(BallCollider,{key:key+'c'+i,args:[1.05],position:[xx,y+1.05,zz]}));
        }
      };
      // Commitment locks the route NOT chosen, behind the player. The central
      // landform spine already prevents lateral crossing until reconvergence.
      if(routes.river==='bridge')addLog('rb',16.8,138.8,1.06);
      if(routes.river==='ford')addLog('rf',-16.8,138.8,-1.06);
      if(routes.woodland==='pine')addLog('wp',11.5,35.2,1.16);
      if(routes.woodland==='birch')addLog('wb',-11.5,35.2,-1.16);
      if(routes.ascent==='ridge')addRocks('ar',-13.5,-97.5,1.13);
      if(routes.ascent==='switchback')addRocks('as',12.5,-98.0,-1.13);
      return h(RigidBody,{type:'fixed',colliders:false},...locks);
    }

    function LexicalSignpost({position,rotation=0,kind,route,mats}){
      // A committed route receives exactly one visual target-form encounter. The
      // lettering is withheld until the first spoken contextualisation has resolved.
      const meta=routeMeta(kind,route),slot=meta.slot,word=LEXICAL_MAPPING[slot];
      const lines=[word.toUpperCase(),meta.sign];
      const blank=useMemo(()=>makeTextTexture([]),[]);
      const labelled=useMemo(()=>makeTextTexture(lines),[word,meta.sign]);
      const mat=useMemo(()=>new THREE.MeshStandardMaterial({map:blank,roughness:1}),[blank]);
      const revealed=useRef(false),inside=useRef(false),enteredAt=useRef(null);
      useFrame(()=>{
        const distance=Math.hypot(lastPlayerPosition.x-position[0],lastPlayerPosition.z-position[2]);
        const ls=session.lexicalState[slot];
        const canExpose=session.routes[kind]===route && ls.contextStarted;
        const inRange=canExpose && distance<=17;
        if(inRange && !revealed.current){
          revealed.current=true;
          mat.map=labelled;mat.needsUpdate=true;
          ls.signEncountered=true;
          recordLexicalOpportunity(word,slot,'sign','sign',{
            kind,route,distance:Math.round(distance*10)/10,
            note:'proximity-defined visual exposure; visual attention not directly observed'
          });
        }
        if(inRange && !inside.current){
          inside.current=true;enteredAt.current=performance.now();
          logEvent('lexical_sign_enter',{word,slot,kind,route,distance:Math.round(distance*10)/10});
        }else if(!inRange && inside.current){
          inside.current=false;
          const dwell=Math.max(0,performance.now()-(enteredAt.current||performance.now()));
          enteredAt.current=null;ls.signDwellMs+=Math.round(dwell);
          logEvent('lexical_sign_exit',{word,slot,kind,route,dwellMs:Math.round(dwell)});
        }
      });
      useEffect(()=>()=>{
        if(inside.current&&enteredAt.current){
          const dwell=Math.max(0,performance.now()-enteredAt.current);
          session.lexicalState[slot].signDwellMs+=Math.round(dwell);
          logEvent('lexical_sign_exit',{word,slot,kind,route,dwellMs:Math.round(dwell),reason:'unmount'});
        }
        mat.dispose();blank.dispose();labelled.dispose();
      },[mat,blank,labelled]);
      return h('group',{
        position:[position[0],terrainHeight(position[0],position[2]),position[2]],
        rotation:[0,rotation,0]
      },
        h('mesh',{position:[0,1.6,0],castShadow:false},
          h('cylinderGeometry',{args:[.10,.14,3.2,7]}),
          h('primitive',{object:mats.bark,attach:'material'})),
        h('mesh',{position:[0,2.45,.02],castShadow:false},
          h('boxGeometry',{args:[3.5,1.28,.16]}),
          h('primitive',{object:mat,attach:'material'}))
      );
    }
    function DynamicLexicalSigns({mats}){
      return h(React.Fragment,null,
        h(LexicalSignpost,{key:'river_bridge',position:[-34,0,127],rotation:.12,kind:'river',route:'bridge',mats}),
        h(LexicalSignpost,{key:'river_ford',position:[34,0,127],rotation:-.12,kind:'river',route:'ford',mats}),
        h(LexicalSignpost,{key:'woodland_pine',position:[-37,0,13],rotation:.10,kind:'woodland',route:'pine',mats}),
        h(LexicalSignpost,{key:'woodland_birch',position:[37,0,13],rotation:-.10,kind:'woodland',route:'birch',mats}),
        h(LexicalSignpost,{key:'ascent_ridge',position:[24,0,-121],rotation:-.08,kind:'ascent',route:'ridge',mats}),
        h(LexicalSignpost,{key:'ascent_switchback',position:[-44,0,-118],rotation:.08,kind:'ascent',route:'switchback',mats})
      );
    }

    function RiverConsequenceFx(){
      const flood=useRef(),[effect,setEffect]=useState(null);
      useEffect(()=>{const fn=e=>{if(e.detail?.kind==='river')setEffect({...e.detail});};window.addEventListener('mera-consequence',fn);return()=>window.removeEventListener('mera-consequence',fn);},[]);
      useFrame(()=>{if(!effect||effect.route!=='bridge'||!flood.current)return;const t=Math.min(1,(performance.now()-effect.started)/2400),e=t*t*(3-2*t);flood.current.visible=true;flood.current.position.y=waterSurfaceAt(31)-.25+1.0*e;flood.current.scale.set(1+.18*e,1+.18*e,1);});
      return h(React.Fragment,null,
        h('mesh',{ref:flood,visible:false,position:[31,waterSurfaceAt(31)-.25,123],rotation:[-Math.PI/2,0,0]},h('circleGeometry',{args:[9.2,32]}),h('meshStandardMaterial',{color:'#4d98a5',transparent:true,opacity:.78,roughness:.14,side:THREE.DoubleSide,depthWrite:false})),
        effect?.route==='bridge'?h(RigidBody,{type:'fixed',colliders:false},h(CuboidCollider,{args:[5.2,2.2,7.0],position:[31,waterSurfaceAt(31)+1.1,123]})):null,
        effect?.route==='ford'?h(RigidBody,{type:'fixed',colliders:false},h(CuboidCollider,{args:[2.1,2.4,5.6],position:[-31,waterSurfaceAt(-31)+1.7,riverCenterZ(-31)]})):null
      );
    }

    function WoodlandConsequenceFx({mats}){
      const left=useRef(),right=useRef(),[effect,setEffect]=useState(null);
      const pineGeo=useMemo(makePineGeometries,[]);
      useEffect(()=>{const fn=e=>{if(e.detail?.kind==='woodland')setEffect({...e.detail});};window.addEventListener('mera-consequence',fn);return()=>window.removeEventListener('mera-consequence',fn);},[]);
      useFrame(()=>{if(!effect)return;const t=Math.min(1,(performance.now()-effect.started)/2300),e=t*t*(3-2*t),target=effect.route==='pine'?right.current:left.current;if(target){const sign=effect.route==='pine'?1:-1;target.rotation.z=sign*1.43*e;}});
      const makeTree=(ref,x,z)=>{
        const y=terrainHeight(x,z);
        return h('group',{ref,position:[x,y,z],scale:[1.22,1.22,1.22]},
          h('mesh',{geometry:pineGeo.trunk,material:mats.bark,castShadow:false}),
          h('mesh',{geometry:pineGeo.foliage,material:mats.pine,castShadow:false})
        );
      };
      const blockedX=effect?(effect.route==='pine'?31:-31):0, blockedY=effect?terrainHeight(blockedX,-13)+.48:0;
      return h(React.Fragment,null,h('group',null,makeTree(left,-31,-13),makeTree(right,31,-13)),effect?h(RigidBody,{type:'fixed',colliders:false},h(CuboidCollider,{args:[3.25,.45,.65],position:[blockedX,blockedY,-13]})):null);
    }

    function AscentConsequenceFx({mats}){
      const refs=useRef([]),[effect,setEffect]=useState(null);
      const geo=useMemo(()=>[81,82,83,84].map(makeRockGeometry),[]);
      useEffect(()=>{const fn=e=>{if(e.detail?.kind==='ascent'){refs.current=[];setEffect({...e.detail});}};window.addEventListener('mera-consequence',fn);return()=>window.removeEventListener('mera-consequence',fn);},[]);
      useFrame(()=>{if(!effect)return;const baseX=effect.route==='ridge'?-47:13,baseZ=-184;refs.current.forEach((m,i)=>{if(!m)return;const t=Math.min(1,Math.max(0,(performance.now()-effect.started-i*70)/1900)),e=1-Math.pow(1-t,3),tx=baseX+(i%4-1.5)*1.3,tz=baseZ+(Math.floor(i/4)-.5)*2.2,ty=terrainHeight(tx,tz)+.45+(i%3)*.18;m.visible=true;m.position.set(tx+(effect.route==='ridge'?4:-4)*(1-e),ty+9*(1-e),tz-3*(1-e));m.rotation.x=e*(i+.5);m.rotation.z=e*(i*.7);});});
      if(!effect)return null;
      const arr=[];for(let i=0;i<8;i++)arr.push(h('mesh',{key:i,ref:r=>refs.current[i]=r,geometry:geo[i%4],material:mats.rock,visible:false,scale:[1.0+(i%3)*.14,.7+(i%2)*.15,.9+(i%4)*.08],castShadow:false,receiveShadow:false}));
      const bx=effect.route==='ridge'?-47:13,by=terrainHeight(bx,-184)+1.35;
      return h(React.Fragment,null,h('group',null,...arr),h(RigidBody,{type:'fixed',colliders:false},h(CuboidCollider,{args:[3.4,1.45,2.1],position:[bx,by,-184]})));
    }

    function Outpost({mats}){
      const y=terrainHeight(OUTPOST.x,OUTPOST.z);
      const rockA=useMemo(()=>makeRockGeometry(9),[]),rockB=useMemo(()=>makeRockGeometry(11),[]),rockC=useMemo(()=>makeRockGeometry(13),[]);
      const iron=useMemo(()=>new THREE.MeshStandardMaterial({color:0x51544c,metalness:.48,roughness:.72}),[]);
      const dark=useMemo(()=>new THREE.MeshStandardMaterial({color:0x171e21,roughness:.9}),[]);
      const parts=[
        h('mesh',{key:'base',geometry:rockA,material:mats.rock,scale:[4.4,2.1,4.0],position:[0,1.1,0],castShadow:false,receiveShadow:false}),
        h('mesh',{key:'west-foundation',geometry:rockB,material:mats.rock,scale:[2.7,1.3,2.9],position:[-2.4,1.4,1.4],receiveShadow:false}),
        h('mesh',{key:'east-foundation',geometry:rockC,material:mats.rock,scale:[2.1,1.1,2.4],position:[2.4,1.2,1.1],receiveShadow:false}),
        h('mesh',{key:'tower',position:[.2,5.6,0],castShadow:false,receiveShadow:false},h('cylinderGeometry',{args:[2.45,2.9,7.7,16]}),h('primitive',{object:mats.stone,attach:'material'})),
        h('mesh',{key:'parapet',position:[.2,9.34,0],castShadow:false},h('cylinderGeometry',{args:[2.70,2.60,.31,16]}),h('primitive',{object:mats.rock,attach:'material'})),
        h('mesh',{key:'roof',position:[.2,10.24,0],castShadow:false},h('coneGeometry',{args:[2.78,2.1,16]}),h('meshStandardMaterial',{color:'#49463e',roughness:1})),
        h('mesh',{key:'door',position:[0,2.75,2.72],castShadow:false},h('boxGeometry',{args:[1.25,2.12,.20]}),h('primitive',{object:mats.wood,attach:'material'})),
        h('mesh',{key:'lintel',position:[0,3.86,2.83],castShadow:false},h('boxGeometry',{args:[1.62,.18,.38]}),h('primitive',{object:mats.stone,attach:'material'})),
        h('mesh',{key:'door-brace',position:[0,2.70,2.84],rotation:[0,0,.62]},h('boxGeometry',{args:[1.42,.12,.11]}),h('primitive',{object:mats.bark,attach:'material'})),
        h('mesh',{key:'window',position:[2.78,6.4,.12],rotation:[0,Math.PI/2,0]},h('boxGeometry',{args:[.72,1.12,.10]}),h('primitive',{object:dark,attach:'material'})),
        h('mesh',{key:'window-b',position:[.25,7.0,2.62]},h('boxGeometry',{args:[.55,.9,.13]}),h('primitive',{object:dark,attach:'material'})),
        h('mesh',{key:'antenna',position:[-1.2,12.14,-1.2]},h('cylinderGeometry',{args:[.035,.055,3.8,7]}),h('primitive',{object:iron,attach:'material'})),
        h('mesh',{key:'antenna-cross',position:[-1.2,12.6,-1.2],rotation:[0,0,Math.PI/2]},h('cylinderGeometry',{args:[.018,.018,1.1,6]}),h('primitive',{object:iron,attach:'material'})),
        h('mesh',{key:'damaged-dish',position:[1.2,11.32,-.85],rotation:[.28,.18,-.48]},h('sphereGeometry',{args:[.68,14,6,0,Math.PI*2,0,Math.PI*.45]}),h('primitive',{object:iron,attach:'material'}))
      ];
      for(let k=0;k<7;k++){
        const a=k*2*Math.PI/7;
        parts.push(h('mesh',{key:'buttress'+k,position:[.2+2.73*Math.cos(a),3.25,2.73*Math.sin(a)],rotation:[0,-a,0],castShadow:k%2===0,receiveShadow:false},h('boxGeometry',{args:[.42,2.2,.55]}),h('primitive',{object:mats.stone,attach:'material'})));
      }
      return h(RigidBody,{type:'fixed',colliders:false},
        h(BallCollider,{args:[3.4],position:[OUTPOST.x,y+1.7,OUTPOST.z]}),
        h(CuboidCollider,{args:[2.2,4.5,2.2],position:[OUTPOST.x+.35,y+7.2,OUTPOST.z-.1]}),
        h('group',{position:[OUTPOST.x,y,OUTPOST.z],rotation:[0,-.22,0]},...parts));
    }
    // E3.9: decorative waterfall removed; the western shoulder is now ordinary rock terrain.
    function Mountains(){
      const mesh=useMemo(()=>{
        const layers=[];
        for(let j=0;j<3;j++){
          const pos=[],cols=[],index=[],stride=36,base=-15,z=-273-j*46;
          for(let i=0;i<=stride;i++){
            const x=-240+i*480/stride;
            const h=18+j*7+Math.pow(Math.abs(Math.sin(i*1.43+j*1.15)),1.5)*(22+j*6)
              +9*Math.abs(Math.sin(i*.61-j*.70));
            const c=new THREE.Color(j===0?0x778887:j===1?0x89989c:0x9eabb0);
            pos.push(x,base,z+18,x,h,z,x,base-8,z-25);
            const p=c.clone().multiplyScalar(.88),q=c.clone().multiplyScalar(1.09);
            cols.push(p.r,p.g,p.b,q.r,q.g,q.b,p.r,p.g,p.b);
            if(i<stride){const a=3*i,b=a+3;index.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
          }
          const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
          g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setIndex(index);g.computeVertexNormals();layers.push(g);
        }
        return layers;
      },[]);
      const mat=useMemo(()=>new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,flatShading:true,depthWrite:true}),[]);
      return h('group',null,...mesh.map((g,i)=>h('mesh',{key:i,geometry:g,material:mat})));
    }

        function Valley({materials}){
      return h(React.Fragment,null,
        h(Terrain,{mat:materials.forest}),h(Paths,{mat:materials.path,coreMat:materials.pathCore,vergeMat:materials.verge}),h(StormRain3D,null),h(LightningSceneLight,null),h(River,null),h(RiverBarriers,null),h(Bridge,{mats:materials}),h(Ford,{mats:materials}),h(Forest,{mats:materials}),h(GroundCover,{mats:materials}),h(RockField,{mats:materials}),h(SemanticLandmarks,{mats:materials}),h(WindField,null),
        h(Signpost,{position:[0,0,151],rotation:0,lines:['BRIDGE  ←','FORD  →'],mats:materials}),
        h(Signpost,{position:[0,0,48],rotation:0,lines:['PINE TRAIL  ←','BIRCH HOLLOW  →'],mats:materials}),
        h(Signpost,{position:[0,0,-84],rotation:0,lines:['SWITCHBACK  ←','RIDGE  →'],mats:materials}),
        h(DecisionLandforms,{mats:materials}),h(DynamicRouteLocks,{mats:materials}),h(DynamicLexicalSigns,{mats:materials}),h(RiverConsequenceFx,null),h(WoodlandConsequenceFx,{mats:materials}),h(AscentConsequenceFx,{mats:materials}),
        h(Outpost,{mats:materials}),h(OutpostBeacon,null),h(Mountains,null)
      );
    }

    class ModelBoundary extends React.Component {constructor(props){super(props);this.state={error:null};}static getDerivedStateFromError(error){return{error};}componentDidCatch(error){showBootError(error);}render(){return this.state.error?null:this.props.children;}}
    function AnimatedCharacter({onReady}){
      const group=useRef(),{scene,animations}=useGLTF(TEST_CHARACTER_URL),{actions}=useAnimations(animations,group),animState=useEcctrlAnimationStore(s=>s.animationState);
      const [norm,setNorm]=useState({offset:0});
      const current=useRef(null),readySent=useRef(false);

      useLayoutEffect(()=>{
        scene.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(scene);
        const height=Math.max(.001,box.max.y-box.min.y);
        scene.scale.setScalar(1.76/height);
        scene.updateMatrixWorld(true);
        const fitted=new THREE.Box3().setFromObject(scene);
        setNorm({offset:-fitted.min.y});
        scene.traverse(obj=>{
          if(obj.isMesh||obj.isSkinnedMesh){
            obj.frustumCulled=false;obj.castShadow=true;obj.receiveShadow=true;
            const ms=Array.isArray(obj.material)?obj.material:[obj.material];
            for(const m of ms)if(m&&'roughness' in m)m.roughness=Math.max(.58,m.roughness??.72);
          }
        });
      },[scene]);

      const chooseClip=state=>{
        const names=animations.map(c=>c.name);
        const idle=names.find(n=>/(^|\|)Idle$/i.test(n))||names.find(n=>/idle/i.test(n))||null;
        const run=names.find(n=>/(^|\|)Run$/i.test(n))||names.find(n=>/run/i.test(n))||null;
        if(state==='WALK'||state==='RUN')return run||idle;
        if(state==='JUMP_START'||state==='JUMP_IDLE'||state==='JUMP_FALL'||state==='JUMP_LAND')return idle||run;
        return idle||run||null;
      };

      useEffect(()=>{
        if(readySent.current)return;
        const names=animations.map(c=>c.name);
        const hasIdle=names.some(n=>/(^|\|)Idle$/i.test(n)||/idle/i.test(n));
        const hasRun=names.some(n=>/(^|\|)Run$/i.test(n)||/run/i.test(n));
        if(actions&&hasIdle&&hasRun){readySent.current=true;onReady?.();}
      },[actions,animations,onReady]);

      useEffect(()=>{
        const name=chooseClip(animState),next=name?actions?.[name]:null;if(!next)return;
        const isRun=/(^|\|)Run$/i.test(name);
        const speed=(animState==='WALK'&&isRun)?.62:1;
        if(current.current===next){next.timeScale=speed;return;}
        const prev=current.current;current.current=next;next.reset();next.timeScale=speed;next.setLoop(THREE.LoopRepeat,Infinity);next.fadeIn(.16).play();if(prev&&prev!==next)prev.fadeOut(.16);
      },[actions,animState,animations]);

      return h('group',{ref:group,position:[0,-.88,0],rotation:[0,0,0]},
        h('group',{position:[0,norm.offset,0]},h('primitive',{object:scene}))
      );
    }
    function DirectKeyboardInput({controllerRef}){
      const pressed=useRef({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
      useEffect(()=>{
        const map={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'leftward',ArrowLeft:'leftward',KeyD:'rightward',ArrowRight:'rightward',ShiftLeft:'run',ShiftRight:'run',Space:'jump'};
        const sync=()=>{
          inputSnapshot={...pressed.current};
          const c=controllerRef.current,active=inputActive();
          if(c)c.setMovement(active?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
          const el=document.getElementById('input-state');
          if(el){
            const p=pressed.current,a=[];
            if(active){if(p.forward)a.push('W');if(p.backward)a.push('S');if(p.leftward)a.push('A');if(p.rightward)a.push('D');if(p.run)a.push('RUN');if(p.jump)a.push('JUMP');}
            el.textContent=a.length?a.join(' + '):'—';
          }
        };
        const isTyping=e=>{const t=e.target,tag=t?.tagName;return tag==='INPUT'||tag==='TEXTAREA'||t?.isContentEditable;};
        const down=e=>{
          if(isTyping(e))return;
          const f=map[e.code];if(!f)return;e.preventDefault();
          if(!pressed.current[f]){
            if(f==='jump'&&inputActive()){session.movement.jumpCount++;logEvent('jump_input',{position:{...lastPlayerPosition}});}
            if(f==='run'&&inputActive()){session.movement.runKeyActivations++;logEvent('run_key_down',{position:{...lastPlayerPosition}});}
          }
          pressed.current[f]=true;sync();
        };
        const up=e=>{if(isTyping(e))return;const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=false;sync();};
        const clear=()=>{Object.keys(pressed.current).forEach(k=>pressed.current[k]=false);sync();};
        window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up);window.addEventListener('blur',clear);
        return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
      },[controllerRef]);
      useFrame(()=>{const c=controllerRef.current;if(c)c.setMovement(inputActive()?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});});
      return null;
    }
    function MovementTelemetry({controllerRef}){
      const prev=useRef(null),lastSample=useRef(0);
      useFrame((_,delta)=>{
        if(!gameStarted||session.finishedAt)return;
        const c=controllerRef.current,p=c?.currPos;if(!p)return;
        const now=performance.now();
        const dt=Math.min(.12,Math.max(0,delta||0));
        let dist=0;
        if(prev.current)dist=Math.hypot(p.x-prev.current.x,p.y-prev.current.y,p.z-prev.current.z);
        const horizontal=prev.current?Math.hypot(p.x-prev.current.x,p.z-prev.current.z):0;
        const moving=horizontal>.0015;
        let state='stationary';
        if(worldState.cinematic)state='cinematic';
        else if(chatOpen)state='chat';
        else if(!c.isOnGround)state='airborne';
        else if(moving&&inputSnapshot.run)state='running';
        else if(moving)state='walking';
        const ms=dt*1000;
        const trailDist=Math.min(...Object.values(PATHS).map(path=>distancePolyline(p.x,p.z,path)));
        const offTrail=trailDist>3.2;
        session.movement.totalGameplayMs+=ms;
        if(worldState.windExposed)session.movement.windExposureMs+=ms;
        if(offTrail&&state!=='cinematic'&&state!=='chat')session.movement.offTrailMs+=ms;
        if(state==='walking')session.movement.walkingMs+=ms;
        else if(state==='running')session.movement.runningMs+=ms;
        else if(state==='stationary')session.movement.stationaryMs+=ms;
        else if(state==='airborne')session.movement.airborneMs+=ms;
        else if(state==='cinematic')session.movement.cinematicMs+=ms;
        else if(state==='chat')session.movement.chatMs+=ms;
        if(dist<5){
          session.movement.totalDistance+=dist;
          if(state==='walking')session.movement.walkingDistance+=dist;
          else if(state==='running')session.movement.runningDistance+=dist;
          else if(state==='airborne')session.movement.airborneDistance+=dist;
          if(offTrail&&state!=='cinematic'&&state!=='chat')session.movement.offTrailDistance+=dist;
        }
        if(session.routes.river||session.routes.woodland||session.routes.ascent){
          session.navigation.furthestProgressZ=Math.min(session.navigation.furthestProgressZ,p.z);
          const backtrack=Math.max(0,p.z-session.navigation.furthestProgressZ);
          session.navigation.maxBacktrackDistance=Math.max(session.navigation.maxBacktrackDistance,backtrack);
          if(backtrack>4&&!session.navigation.activeBacktrack){session.navigation.activeBacktrack=true;session.navigation.backtrackingEpisodes++;logEvent('backtracking_start',{distance:+backtrack.toFixed(2),position:{x:+p.x.toFixed(2),z:+p.z.toFixed(2)}});}
          else if(backtrack<1.5&&session.navigation.activeBacktrack){session.navigation.activeBacktrack=false;logEvent('backtracking_end',{position:{x:+p.x.toFixed(2),z:+p.z.toFixed(2)}});}
        }
        if(state!==lastMovementState){
          if(lastMovementState!=='not_started')session.movement.stateTransitions++;
          logEvent('movement_state',{from:lastMovementState,to:state,position:{x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}});
          lastMovementState=state;
        }
        if(now-lastSample.current>=1000){
          lastSample.current=now;
          session.trajectory.push({
            t:relativeSeconds(),x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),state,
            grounded:!!c.isOnGround,stage:currentChatStage(),runKey:!!inputSnapshot.run,
            nearestTrailDistance:+trailDist.toFixed(2),offTrail,windExposed:!!worldState.windExposed,
            routes:{river:session.routes.river,woodland:session.routes.woodland,ascent:session.routes.ascent}
          });
        }
        prev.current={x:p.x,y:p.y,z:p.z};
      });
      return null;
    }
    function FollowCamera({controllerRef}){
      const controls=useRef(),{camera}=useThree(),started=useRef(false),wasCinematic=useRef(false),up=useMemo(()=>new THREE.Vector3(0,1,0),[]);
      useFrame(()=>{const c=controllerRef.current,cc=controls.current;if(!c||!cc||!c.currPos)return;const p=c.currPos,cin=worldState.cinematic;
        if(cin){
          cc.maxDistance=600;
          const t=Math.min(1,Math.max(0,(performance.now()-cin.started)/Math.max(1,cin.duration))),ease=t*t*(3-2*t);
          const a=cin.from||cin.to,b=cin.to||cin.from;
          const cx=a[0]+(b[0]-a[0])*ease,cy=a[1]+(b[1]-a[1])*ease,cz=a[2]+(b[2]-a[2])*ease;
          cc.setLookAt(cx,cy,cz,cin.lookAt[0],cin.lookAt[1],cin.lookAt[2],true);wasCinematic.current=true;started.current=true;return;
        }
        cc.maxDistance=7.0;
        if(wasCinematic.current){camera.position.set(p.x+4.8,p.y+3.1,p.z+6.2);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+1,p.z,false);wasCinematic.current=false;started.current=true;}
        else if(!started.current){camera.position.set(p.x+4.8,p.y+3.1,p.z+6.2);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+1,p.z,false);started.current=true;}
        else cc.moveTo(p.x,p.y+1,p.z,true);
        if(c.upAxis){up.copy(c.upAxis);camera.up.lerp(up,.12);cc.setUp(camera.up);}
      });
      return h(EcctrlCameraControls,{ref:controls,makeDefault:true,smoothTime:.12,minDistance:3.0,maxDistance:7.0,minPolarAngle:.50,maxPolarAngle:1.28,dollyToCursor:false,truckSpeed:0,azimuthRotateSpeed:.8,polarRotateSpeed:.75});
    }

    function inBirchWindZone(p){ return p.x>9 && p.x<55 && p.z<40 && p.z>-34; }
    function inFordWater(p){ return p.x>24 && p.x<38 && p.z<132 && p.z>116; }

    function updateStudyFromPosition(p){
      if(!gameStarted||session.finishedAt||worldState.cinematic)return;
      updateElapsed();
      lastPlayerPosition={x:p.x,y:p.y,z:p.z};
      refreshChatUI();
      const stage=currentChatStage();
      if(stage!==lastStageLogged){lastStageLogged=stage;logEvent('stage_enter',{stage,position:{...lastPlayerPosition}});}

      const windy=session.routes.woodland==='birch' && inBirchWindZone(p);
      if(!windy)windNote?.classList.remove('active');
      if(windy!==worldState.windExposed){
        worldState.windExposed=windy;
        window.dispatchEvent(new CustomEvent('mera-wind-state',{detail:{active:windy}}));
      }
      if(windy && !fired.has('wind_event_logged')){
        fired.add('wind_event_logged');
        session.environmentalEvents.push({type:'strong_gusts',route:'birch'});
        logEvent('environmental_event',{event:'strong_gusts',route:'birch'});
      }
      if(session.routes.river==='ford' && inFordWater(p) && !fired.has('ford_water_logged')){
        fired.add('ford_water_logged');
        session.environmentalEvents.push({type:'shallow_water',route:'ford'});
        logEvent('environmental_event',{event:'shallow_water',route:'ford'});
      }

      // Decision 1: target forms appear only after route commitment.
      if(p.z<174)showNav('river_choice_prompt','Two crossings ahead. The bridge is faster, but narrow. The rocks are slower, but give you more room. Water levels are rising. Choose.',{duration:12000,voice:true});
      if(!session.routes.river && p.z<133){
        if(p.x<-14)setRoute('river','bridge'); else if(p.x>14)setRoute('river','ford');
      }
      if(session.routes.river){
        const route=session.routes.river,meta=routeMeta('river',route),word=lexicalFor('river',route),ls=session.lexicalState[meta.slot];
        showNav(clipIdFor('river',route,'context'),meta.context(word),{target:word,slot:meta.slot,exposure:'context',duration:10000,voice:true});
        const reinforceThreshold=route==='bridge'?124:129.5;
        if(ls.signEncountered && p.z<reinforceThreshold)showNav(clipIdFor('river',route,'reinforce'),meta.reinforce(word),{target:word,slot:meta.slot,exposure:'reinforce',duration:8500,voice:true});
        if(p.z<106 && ls.reinforceStatus!==null)startConsequence('river');
      }

      // Decision 2: shelter versus exposure.
      if(p.z<69)showNav('wood_choice_prompt','The trail divides again. The forest route is sheltered, but storm debris may slow you down. The open route is faster, but exposed to the wind. The front is getting closer. Choose.',{duration:12000,voice:true});
      if(!session.routes.woodland && p.z<27){
        if(p.x<-9)setRoute('woodland','pine'); else if(p.x>9)setRoute('woodland','birch');
      }
      if(session.routes.woodland){
        const route=session.routes.woodland,meta=routeMeta('woodland',route),word=lexicalFor('woodland',route),ls=session.lexicalState[meta.slot];
        showNav(clipIdFor('woodland',route,'context'),meta.context(word),{target:word,slot:meta.slot,exposure:'context',duration:10000,voice:true});
        const reinforceThreshold=route==='pine'?1:3;
        if(ls.signEncountered && p.z<reinforceThreshold)showNav(clipIdFor('woodland',route,'reinforce'),meta.reinforce(word),{target:word,slot:meta.slot,exposure:'reinforce',duration:8500,voice:true});
        if(p.z<-37 && ls.reinforceStatus!==null)startConsequence('woodland');
      }

      // Decision 3: direct steep ridge versus longer gradual switchback.
      if(p.z<-72)showNav('ascent_choice_prompt','The outpost is directly above us. The ridge is shorter, but steep. The switchback is longer and easier to climb. We are running out of time. Choose.',{duration:12000,voice:true});
      if(!session.routes.ascent && p.z<-107){
        if(p.x>8)setRoute('ascent','ridge'); else if(p.x<-8)setRoute('ascent','switchback');
      }
      if(session.routes.ascent){
        const route=session.routes.ascent,meta=routeMeta('ascent',route),word=lexicalFor('ascent',route),ls=session.lexicalState[meta.slot];
        showNav(clipIdFor('ascent',route,'context'),meta.context(word),{target:word,slot:meta.slot,exposure:'context',duration:10000,voice:true});
        const reinforceThreshold=route==='ridge'?-137:-145;
        if(ls.signEncountered && p.z<reinforceThreshold)showNav(clipIdFor('ascent',route,'reinforce'),meta.reinforce(word),{target:word,slot:meta.slot,exposure:'reinforce',duration:8500,voice:true});
        if(p.z<-196 && ls.reinforceStatus!==null)startConsequence('ascent');
      }

      if(p.z<-210)showNav('final_neutral','Outpost in range. Emergency relay handshake starting.',{duration:7000});
      if(Math.hypot(p.x-OUTPOST.x,p.z-OUTPOST.z)<6.5) finishStudy({x:OUTPOST.x,y:terrainHeight(OUTPOST.x,OUTPOST.z),z:OUTPOST.z});
    }

    function Diagnostics({controllerRef}){
      const animState=useEcctrlAnimationStore(s=>s.animationState),frames=useRef(0),last=useRef(performance.now()),{gl}=useThree();
      useFrame(()=>{
        const c=controllerRef.current;if(c){
          document.getElementById('anim-state').textContent=animState||'—';document.getElementById('grounded').textContent=c.isOnGround?'YES':'NO';const p=c.currPos;
          if(p){
            const region=document.getElementById('region');
            if(p.z>155)region.textContent='SOUTHERN APPROACH';else if(p.z>106)region.textContent='RIVER CROSSING';else if(p.z>45)region.textContent='CENTRAL VALLEY';else if(p.z>-48)region.textContent='WOODLAND';else if(p.z>-88)region.textContent='UPPER BASIN';else if(p.z>-210)region.textContent='FINAL ASCENT';else region.textContent='OUTPOST APPROACH';
            updateStudyFromPosition(p);
          }
        }
        frames.current++;const now=performance.now();if(now-last.current>650){const fps=Math.round(frames.current*1000/(now-last.current));document.getElementById('fps').textContent=String(fps);document.getElementById('draws').textContent=String(gl.info.render.calls);frames.current=0;last.current=now;}
      });return null;
    }
    function Player({onCharacterReady}){
      const controllerRef=useRef();
      const [windMode,setWindMode]=useState('none');
      const prev=useRef(null),modeRef=useRef('none');
      useFrame(()=>{
        const c=controllerRef.current,p=c?.currPos;if(!p)return;
        const active=session.routes.woodland==='birch'&&inBirchWindZone(p);
        let mode='none';
        if(active){
          if(prev.current){const dx=p.x-prev.current.x,dz=p.z-prev.current.z,len=Math.hypot(dx,dz);if(len>.003){const dot=(dx/len)*WIND_DIR.x+(dz/len)*WIND_DIR.y;mode=dot>.35?'tail':dot<-.35?'head':'cross';}else mode='cross';}
          else mode='cross';
        }
        prev.current={x:p.x,z:p.z};
        if(mode!==modeRef.current){modeRef.current=mode;setWindMode(mode);if(windNote){windNote.textContent=mode==='head'?'HEADWIND · MOVEMENT REDUCED':mode==='tail'?'TAILWIND · MOVEMENT BOOSTED':mode==='cross'?'CROSSWIND':'WIND EXPOSURE';windNote.classList.toggle('active',mode!=='none');}logEvent('wind_physics',{mode});}
      });
      const speed=windMode==='head'?{walk:.82,run:1.15,acc:.36}:windMode==='tail'?{walk:2.55,run:4.25,acc:.13}:windMode==='cross'?{walk:1.42,run:2.18,acc:.25}:{walk:1.95,run:3.35,acc:.20};
      return h(React.Fragment,null,
        h(EcctrlAnimationStateController,{ecctrl:controllerRef}),
        h(DirectKeyboardInput,{controllerRef}),
        h(MovementTelemetry,{controllerRef}),
        h(Ecctrl,{
          ref:controllerRef,position:[0,4,216],capsuleHalfHeight:.55,capsuleRadius:.32,floatHeight:.20,
          maxWalkVel:speed.walk,maxRunVel:speed.run,
          accDeltaTime:speed.acc,decDeltaTime:.20,
          jumpVel:4.8,slopeMaxAngle:.90,enableToggleRun:false,groundDetection:'shapeCast',friction:0,linearDamping:.15,angularDamping:1.0
        },h(ModelBoundary,null,h(AnimatedCharacter,{onReady:onCharacterReady}))),
        h(FollowCamera,{controllerRef}),h(Diagnostics,{controllerRef})
      );
    }
    function Scene({onCharacterReady}){
      const materials=useLandscapeMaterials();
      return h(React.Fragment,null,
        h('color',{attach:'background',args:['#4e5b61']}),
        h('fog',{attach:'fog',args:['#5e696c',42,330]}),
        h('hemisphereLight',{intensity:.78,color:'#cbd8dc',groundColor:'#333d35'}),
        h('ambientLight',{intensity:.10,color:'#a9b7b8'}),
        h('directionalLight',{position:[-38,58,28],intensity:.92,color:'#cfdde2'}),
        h('directionalLight',{position:[34,24,-30],intensity:.18,color:'#8ca3ae'}),
        h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},h(Valley,{materials}),h(Player,{onCharacterReady}))
      );
    }
    function App(){
      const [ready,setReady]=useState(false),once=useRef(false);
      const onCharacterReady=React.useCallback(async()=>{if(once.current)return;once.current=true;bootStatus.textContent='Checking field-link audio and final-report photographs…';loadfill.style.width='90%';try{await Promise.all([verifyHeartVoicePack(),verifyGeneralizationPhotos()]);setReady(true);session.timingMilestones.bootReadyAt=new Date().toISOString();bootStatus.textContent='Field link, navigation guide, route geometry and report materials are ready.';loadfill.style.width='100%';enterBtn.disabled=false;}catch(err){showBootError(err);}},[]);
      useEffect(()=>{if(!ready)return;enterBtn.onclick=()=>{if(!session.consent.accepted){session.consent.accepted=true;session.consent.acceptedAt=new Date().toISOString();session.consent.acceptedAtSessionTime=sessionSeconds();session.timingMilestones.consentAcceptedAt=session.consent.acceptedAt;logEvent('consent_accepted',{textVersion:CONSENT_TEXT_VERSION});}startFieldAmbience();boot.classList.add('hidden');beginIntro();};},[ready]);
      return h(Canvas,{shadows:false,dpr:[1,1.18],camera:{position:[4.8,3.2,224],fov:54,near:.1,far:650},gl:{antialias:true,powerPreference:'high-performance'},onCreated:({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.92;loadfill.style.width='78%';}},h(Suspense,{fallback:null},h(Scene,{onCharacterReady})));
    }

    const root=createRoot(document.getElementById('root'));root.render(h(App));
    setTimeout(()=>{if(enterBtn.disabled&&bootError.classList.contains('hidden'))bootStatus.textContent='Still loading the valley or test character. If this persists, check network/CDN access.';},18000);
  } catch(err){ showBootError(err); }
}

bootApp();
