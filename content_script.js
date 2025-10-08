(() => {
  if (window.__TWW_LOADED) return;
  window.__TWW_LOADED = true;

  // ---------- STYLES ----------
  const style = document.createElement("style");
  style.textContent = `
.tww-card{all:initial;position:fixed;z-index:2147483646;right:20px;bottom:20px;width:340px;border-radius:14px;
background:linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));border:1px solid rgba(255,255,255,0.15);
backdrop-filter:blur(12px) saturate(130%);color:#eaf2ff;font-family:system-ui,Segoe UI,Inter,Roboto,Arial;user-select:none;
box-shadow:0 10px 25px rgba(0,0,0,0.4);transition:all .3s ease;}
.tww-header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;cursor:grab}
.tww-title{font-weight:700;font-size:13px}
.tww-btn{all:unset;cursor:pointer;padding:5px 8px;border-radius:8px;font-size:12px;
background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);transition:.2s}
.tww-btn:hover{background:rgba(255,255,255,0.12)}
.tww-body{padding:10px;max-height:60vh;overflow:auto;transition:opacity .25s ease}
.tww-input{all:unset;display:block;width:100%;min-height:50px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.05);
border:1px solid rgba(255,255,255,0.08);color:#eef5ff;font-size:12px;line-height:1.4}
.tww-chip{display:inline-block;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,0.05);margin-right:6px;font-size:11px}
.tww-status{font-size:11px;margin-top:6px;opacity:.9}
.tww-picked{outline:2px solid rgba(100,160,255,0.9);outline-offset:2px;border-radius:6px}
.tww-minimized{transform:scale(0.9) translateY(80px);opacity:0.5}
.tww-mic{margin-left:6px;padding:4px 6px;border-radius:50%;background:rgba(255,255,255,0.05);cursor:pointer;transition:.2s}
.tww-mic.recording{animation:twwPulse 1s infinite alternate;background:rgba(255,70,70,0.4)}
@keyframes twwPulse{from{box-shadow:0 0 0 rgba(255,70,70,0.4);}to{box-shadow:0 0 10px rgba(255,70,70,0.8);}}
`;
  document.head.appendChild(style);

  // ---------- CREATE PANEL ----------
  const panel = document.createElement("div");
  panel.className = "tww-card";
  panel.innerHTML = `
  <div class="tww-header" id="tww-drag">
    <div class="tww-title">Text Wingman ✨</div>
    <div style="display:flex;gap:6px">
      <button class="tww-btn" id="tww-clear">Clear</button>
      <button class="tww-btn" id="tww-pick">Pick</button>
      <button class="tww-btn" id="tww-reply">Reply</button>
      <button class="tww-btn" id="tww-min">–</button>
      <button class="tww-btn" id="tww-close">✕</button>
    </div>
  </div>
  <div class="tww-body">
    <div style="font-size:12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">
      <span>Optional context</span>
      <div class="tww-mic" id="tww-mic">🎙️</div>
    </div>
    <div id="tww-context" class="tww-input" contenteditable="true"></div>
    <div style="margin-top:8px"><span class="tww-chip">click-to-pick</span><span class="tww-chip">ctrl+enter</span></div>
    <div id="tww-status" class="tww-status"></div>
  </div>`;
  document.body.appendChild(panel);

  const els = {
    drag: panel.querySelector("#tww-drag"),
    pick: panel.querySelector("#tww-pick"),
    clear: panel.querySelector("#tww-clear"),
    reply: panel.querySelector("#tww-reply"),
    min: panel.querySelector("#tww-min"),
    close: panel.querySelector("#tww-close"),
    ctx: panel.querySelector("#tww-context"),
    status: panel.querySelector("#tww-status"),
    mic: panel.querySelector("#tww-mic")
  };
  const say = s => (els.status.textContent = s);

  // ---------- DRAGGING ----------
  (() => {
    let sx=0,sy=0,ol=0,ot=0,drag=false;
    els.drag.addEventListener("pointerdown",e=>{
      if(e.button!==0||e.target.closest("button"))return;
      drag=true;sx=e.clientX;sy=e.clientY;
      const r=panel.getBoundingClientRect();ol=r.left;ot=r.top;
      panel.style.left=ol+"px";panel.style.top=ot+"px";
      panel.style.right="auto";panel.style.bottom="auto";
      panel.setPointerCapture(e.pointerId);
    });
    window.addEventListener("pointermove",e=>{
      if(!drag)return;
      panel.style.left=ol+e.clientX-sx+"px";
      panel.style.top=ot+e.clientY-sy+"px";
    });
    window.addEventListener("pointerup",e=>{drag=false;panel.releasePointerCapture?.(e.pointerId);});
  })();

  // ---------- MINIMIZE ----------
  let minimized=false;
  els.min.onclick=()=>{minimized=!minimized;panel.classList.toggle("tww-minimized",minimized);};

  // ---------- CLOSE ----------
  els.close.onclick=()=>panel.remove();

  // ---------- PICK SYSTEM ----------
  let picking=false;const picked=new Set();
  function togglePick(){picking?stopPick():startPick();}
  function startPick(){picking=true;say("Pick mode: click messages.");document.addEventListener("click",onClick,true);els.pick.textContent="Done";}
  function stopPick(){picking=false;document.removeEventListener("click",onClick,true);els.pick.textContent="Pick";say(picked.size+" selected.");}
  function clearPicks(){picked.forEach(n=>n.classList.remove("tww-picked"));picked.clear();say("Cleared.");}
  function onClick(e){if(!picking)return;const n=closestMsg(e.target);if(!n)return;e.stopPropagation();e.preventDefault();
    if(picked.has(n)){picked.delete(n);n.classList.remove("tww-picked");}else{picked.add(n);n.classList.add("tww-picked");}
    say(picked.size+" selected.");}
  function closestMsg(n){if(!n||n===document.body)return null;
    if(n.matches("[data-message-id],.message,.msg,.bubble,.text,.chat-message,[role=listitem]"))return n;
    return closestMsg(n.parentElement);}
  els.pick.onclick=togglePick;els.clear.onclick=clearPicks;

  // ---------- PROMPT ----------
  function buildPrompt(arr,ctx){
    const convo=arr.map((t,i)=>`${i+1}. ${t}`).join("\n");
    const extra=ctx?.trim()?`Extra context: ${ctx}\n`:"";
    return `You are my texting copilot.
Voice: chill Gen-Z, minimal words, lowercase.
Rules:
- only output message text, no quotes
- keep it 4-12 words
- casual & natural, slight humor ok
${extra}
Chat:
${convo}
Write my next message.`;
  }

  // ---------- MSG HELPERS ----------
  const visible=n=>{const r=n.getBoundingClientRect?.();return !!r&&r.width>0&&r.height>0;};
  const texty=n=>(n.textContent||"").replace(/\s+/g," ").trim().slice(0,2000);
  const allMsgs=()=>Array.from(document.querySelectorAll("[data-message-id],.message,.msg,.bubble,.text,.chat-message,[role=listitem]")).filter(visible);
  function lastN(n=7){const t=allMsgs().map(texty).filter(Boolean);const u=[];for(const x of t)if(u[u.length-1]!==x)u.push(x);return u.slice(-n);}

  // ---------- INSERT ----------
  function insertText(txt){
    const a=document.activeElement;
    const ok=a&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT"||a.isContentEditable);
    let node=ok?a:null;
    if(!node){const c=Array.from(document.querySelectorAll("textarea,input,[contenteditable=true],[role=textbox]")).filter(visible);
      c.sort((x,y)=>y.getBoundingClientRect().top-x.getBoundingClientRect().top);node=c[0];}
    if(!node)return navigator.clipboard.writeText(txt).then(()=>say("Copied."),()=>say("Copy failed"));
    if(node.tagName==="TEXTAREA"||node.tagName==="INPUT"){const val=node.value||"";const proto=Object.getPrototypeOf(node);
      const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;const newVal=val?val+" "+txt:txt;
      setter?setter.call(node,newVal):(node.value=newVal);node.dispatchEvent(new Event("input",{bubbles:true}));}
    else{node.focus();document.execCommand("insertText",false,txt);}
  }

  // ---------- GENERATE ----------
  function generate(){
    if(picking)stopPick();
    const arr=[...picked].map(texty).filter(Boolean);
    const msgs=arr.length?arr:lastN(7);
    if(!msgs.length)return say("No context.");
    const prompt=buildPrompt(msgs,els.ctx.innerText);
    say("Thinking…");
    chrome.runtime.sendMessage({type:"generate",prompt},resp=>{
      if(chrome.runtime.lastError)return say("Error: "+chrome.runtime.lastError.message);
      if(!resp?.ok)return say("Error: "+(resp.error||"unknown"));
      insertText(resp.text.trim());
      say("Inserted (not sent).");
    });
  }
  els.reply.onclick=generate;

  // ---------- KEYBOARD SHORTCUTS ----------
  window.addEventListener("keydown",e=>{
    if(e.ctrlKey&&e.key==="Enter"){e.preventDefault();generate();}
    if(e.key==="Escape"&&picking){stopPick();}
  });

  // ---------- SPEECH TO TEXT ----------
  let recognizing=false,recognizer=null;
  els.mic.onclick=()=>{
    if(recognizing){recognizer?.stop();return;}
    if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window)){
      say("SpeechRecognition not supported.");return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    recognizer=new SR();
    recognizer.lang="en-US";
    recognizer.continuous=false;
    recognizer.interimResults=true;
    recognizer.onstart=()=>{recognizing=true;els.mic.classList.add("recording");say("Listening…");};
    recognizer.onresult=e=>{
      const t=[...e.results].map(r=>r[0].transcript).join(" ");
      els.ctx.innerText=t;};
    recognizer.onerror=e=>{say("Mic error: "+e.error);recognizing=false;els.mic.classList.remove("recording");};
    recognizer.onend=()=>{recognizing=false;els.mic.classList.remove("recording");say("Voice captured.");};
    recognizer.start();
  };

  // ---------- TOGGLE PANEL ----------
  chrome.runtime.onMessage.addListener(msg=>{
    if(msg.type==="toggle_panel")panel.style.display=panel.style.display==="none"?"":"none";
  });

  say("Ready 🎙 Ctrl+Enter to reply.");
})();

