    const TOOL_NAMES = ['Timer', 'Counter', 'Calculator', 'Dilution', 'Medium / Buffer maker', 'Molarity calculator', 'Cell counter', 'Cell culture', 'Calibration curve'];
    let protocols = [];
    let protocolSeq = 0;

    // ---- New experiment: name -> first step -> done/add more ----
    let draftProtocol = null;
    let editingStepIndex = null; // index into draftProtocol.steps or an open protocol's steps
    let openProtocolId = null;   // protocol currently shown in the editor
    let toolPickerTarget = null; // { protocol, stepIndex }

    function openNewProtocol() {
      document.querySelector('#new-protocol-name').value = '';
      closeAllProtoModals();
      document.querySelector('#new-protocol-modal').classList.add('open');
    }
    function closeNewProtocol() { document.querySelector('#new-protocol-modal').classList.remove('open'); }

    function confirmProtocolName() {
      const name = document.querySelector('#new-protocol-name').value.trim();
      if (!name) return;
      draftProtocol = { id: 'p' + (++protocolSeq), name, steps: [], notes: '' };
      closeAllProtoModals();
      openStepEntry('draft', 'Step 1');
    }

    // step-entry modal handles both: adding to a not-yet-saved draft, and adding to an already-saved protocol
    let stepEntryMode = 'draft'; // 'draft' | 'existing'
    function openStepEntry(mode, title) {
      stepEntryMode = mode;
      document.querySelector('#step-entry-title').textContent = title;
      document.querySelector('#step-entry-name').value = '';
      document.querySelector('#step-entry-desc').value = '';
      closeAllProtoModals();
      document.querySelector('#step-entry-modal').classList.add('open');
    }
    function closeStepEntry() { document.querySelector('#step-entry-modal').classList.remove('open'); }
    function closeAllProtoModals() {
      document.querySelectorAll('.proto-modal').forEach(m => m.classList.remove('open'));
    }

    function readStepEntry() {
      const name = document.querySelector('#step-entry-name').value.trim();
      const description = document.querySelector('#step-entry-desc').value.trim();
      if (!name) return null;
      return { name, description, done: false, tools: [] };
    }

    function addAnotherStepFromEntry() {
      const step = readStepEntry();
      if (!step) { document.querySelector('#step-entry-name').focus(); return; }
      if (stepEntryMode === 'draft') {
        draftProtocol.steps.push(step);
        openStepEntry('draft', 'Step ' + (draftProtocol.steps.length + 1));
      } else {
        const proto = protocols.find(p => p.id === openProtocolId);
        proto.steps.push(step);
        renderProtocolLists();
        openStepEntry('existing', 'Step ' + (proto.steps.length + 1));
      }
    }

    function finishStepEntry() {
      const step = readStepEntry();
      if (stepEntryMode === 'draft') {
        if (step) draftProtocol.steps.push(step);
        closeStepEntry();
        if (!draftProtocol || !draftProtocol.steps.length) { draftProtocol = null; return; }
        protocols.unshift(draftProtocol);
        const savedId = draftProtocol.id;
        draftProtocol = null;
        renderProtocolLists();
        openProtocolEditor(savedId);
      } else {
        if (step) {
          const proto = protocols.find(p => p.id === openProtocolId);
          proto.steps.push(step);
          renderProtocolLists();
        }
        closeStepEntry();
        openProtocolEditor(openProtocolId);
      }
    }

    // ---- Protocol cards (home + archive) ----
    function protocolMeta(proto) {
      const total = proto.steps.length, done = proto.steps.filter(s => s.done).length;
      const pct = total ? Math.round(done / total * 100) : 0;
      return { total, done, pct };
    }
    function renderProtocolLists() {
      const homeList = document.querySelector('#protocols');
      const archiveList = document.querySelector('#archive');
      homeList.innerHTML = ''; archiveList.innerHTML = '';
      protocols.forEach(proto => {
        const { total, done, pct } = protocolMeta(proto);
        const sub = total ? `${done} / ${total} steps complete` : 'No steps yet';
        const card = `<article class="protocol" onclick="openProtocolEditor('${proto.id}')" style="cursor:pointer"><div class="bar"></div><div><h3></h3><p></p></div><div class="progress">${pct}%<span><i style="width:${pct}%"></i></span></div><button class="protocol-del" title="Delete protocol" onclick="event.stopPropagation(); deleteProtocol('${proto.id}')">✕</button></article>`;
        [homeList, archiveList].forEach(list => {
          const wrap = document.createElement('div'); wrap.innerHTML = card;
          const article = wrap.firstElementChild;
          article.querySelector('h3').textContent = proto.name;
          article.querySelector('p').textContent = sub;
          list.append(article);
        });
      });
      document.querySelector('#protocol-count').textContent = String(protocols.length).padStart(2, '0') + ' active';
      // Cloud sync bridge (see the Firebase module script near the end of the file).
      // window.onProtocolsChanged is only defined once Firebase has loaded, and it
      // no-ops while nobody is signed in, so this is always safe to call.
      if (typeof window.onProtocolsChanged === 'function') window.onProtocolsChanged(protocols);
    }
    // Triggers the same cloud-sync bridge as renderProtocolLists(), without
    // rebuilding the home/archive card DOM. Used for edits that only change
    // data already in memory (protocol notes, step descriptions) so a save
    // still fires when the field loses focus, without disrupting whatever
    // the user is doing in the editor mid-edit.
    function syncProtocolsToCloud() {
      if (typeof window.onProtocolsChanged === 'function') window.onProtocolsChanged(protocols);
    }
    function deleteProtocol(id) {
      if (!confirm('Delete this protocol? This cannot be undone.')) return;
      protocols = protocols.filter(p => p.id !== id);
      if (openProtocolId === id) closeProtocolEditor();
      renderProtocolLists();
    }
    // Lets the Firebase module replace local state with a signed-in user's cloud
    // copy (on sign-in) without the two scripts needing to share scope directly.
    window.replaceAllProtocols = function(nextProtocols) {
      protocols = Array.isArray(nextProtocols) ? nextProtocols : [];
      renderProtocolLists();
    };
    window.getCurrentProtocols = function() { return protocols; };

    // ---- Protocol editor (view/edit an existing protocol's steps) ----
    function openProtocolEditor(id) {
      openProtocolId = id;
      renderProtocolEditor();
      closeAllProtoModals();
      document.querySelector('#protocol-editor-modal').classList.add('open');
    }
    function closeProtocolEditor() { document.querySelector('#protocol-editor-modal').classList.remove('open'); openProtocolId = null; }

    function renderProtocolEditor() {
      const proto = protocols.find(p => p.id === openProtocolId);
      if (!proto) return;
      if (typeof proto.notes !== 'string') proto.notes = '';
      const nameInput = document.querySelector('#editor-protocol-name');
      if (document.activeElement !== nameInput) nameInput.value = proto.name;
      nameInput.oninput = e => { proto.name = e.target.value; };
      nameInput.onblur = () => {
        if (!proto.name.trim()) proto.name = 'Untitled protocol';
        renderProtocolEditor();
        renderProtocolLists();
      };
      const { total, done, pct } = protocolMeta(proto);
      document.querySelector('#editor-progress-label').textContent = `${done} / ${total}`;
      document.querySelector('#editor-progress-fill').style.width = pct + '%';

      const notesArea = document.querySelector('#editor-notes');
      if (document.activeElement !== notesArea) notesArea.value = proto.notes;
      notesArea.oninput = e => { proto.notes = e.target.value; };
      notesArea.onblur = () => syncProtocolsToCloud();

      const wrap = document.querySelector('#editor-steps');
      wrap.innerHTML = '';
      proto.steps.forEach((step, i) => {
        const el = document.createElement('div');
        el.className = 'proto-step' + (step.done ? ' done' : '');
        el.innerHTML = `
          <div class="proto-step-top">
            <button class="proto-step-check" title="Mark done"></button>
            <div class="proto-step-body">
              <input class="proto-step-name" value="${step.name.replace(/"/g,'&quot;')}">
              <textarea class="proto-step-desc" rows="2">${step.description}</textarea>
              <div class="proto-step-tools"></div>
              <button class="proto-refer-btn">🔧 Refer tool</button>
            </div>
            <button class="proto-step-del" title="Remove step">×</button>
          </div>
        `;
        el.querySelector('.proto-step-check').onclick = () => { step.done = !step.done; renderProtocolEditor(); renderProtocolLists(); };
        el.querySelector('.proto-step-name').oninput = e => { step.name = e.target.value; };
        el.querySelector('.proto-step-name').onblur = () => renderProtocolLists();
        el.querySelector('.proto-step-desc').oninput = e => { step.description = e.target.value; };
        el.querySelector('.proto-step-desc').onblur = () => syncProtocolsToCloud();
        el.querySelector('.proto-step-del').onclick = () => { proto.steps.splice(i, 1); renderProtocolEditor(); renderProtocolLists(); };
        el.querySelector('.proto-refer-btn').onclick = () => openToolPicker(proto, i);
        const toolsWrap = el.querySelector('.proto-step-tools');
        step.tools.forEach(t => { const chip = document.createElement('span'); chip.className = 'proto-tool-chip'; chip.textContent = t; toolsWrap.append(chip); });
        wrap.append(el);
      });
    }

    function addStepToOpenProtocol() {
      const proto = protocols.find(p => p.id === openProtocolId);
      openStepEntry('existing', 'Step ' + (proto.steps.length + 1));
    }

    // ---- Refer-tool picker ----
    function openToolPicker(proto, stepIndex) {
      toolPickerTarget = { proto, stepIndex };
      const list = document.querySelector('#tool-picker-list');
      list.innerHTML = '';
      const selected = proto.steps[stepIndex].tools;
      TOOL_NAMES.forEach(name => {
        const row = document.createElement('label');
        row.className = 'proto-tool-option';
        row.innerHTML = `<input type="checkbox" ${selected.includes(name) ? 'checked' : ''}><span>${name}</span>`;
        row.querySelector('input').onchange = e => {
          const step = toolPickerTarget.proto.steps[toolPickerTarget.stepIndex];
          if (e.target.checked) { if (!step.tools.includes(name)) step.tools.push(name); }
          else { step.tools = step.tools.filter(t => t !== name); }
        };
        list.append(row);
      });
      document.querySelector('#tool-picker-modal').classList.add('open');
    }
    function closeToolPicker() {
      document.querySelector('#tool-picker-modal').classList.remove('open');
      if (toolPickerTarget) renderProtocolEditor();
      toolPickerTarget = null;
    }

    renderProtocolLists();
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('.tab, .view').forEach(el => el.classList.remove('active'));
      tab.classList.add('active'); document.getElementById(tab.dataset.view).classList.add('active');
    }));
    function goToTool(toolId) {
      document.querySelectorAll('.tab, .view').forEach(el => el.classList.remove('active'));
      document.querySelector('.tab[data-view="tools"]').classList.add('active');
      document.getElementById('tools').classList.add('active');
      const card = document.getElementById(toolId);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 1600);
    }
    document.querySelectorAll('.tool-tabs:not([data-group="viability"])').forEach(group => group.querySelectorAll('.tool-tab').forEach(tab => tab.addEventListener('click', () => {
    group.querySelectorAll('.tool-tab').forEach(x => x.classList.remove('active')); tab.classList.add('active');
    group.closest('.tool-card, section').querySelectorAll('.tool-view').forEach(x => x.classList.remove('active'));
    document.getElementById(tab.dataset.toolView).classList.add('active');
    })));
    const timers = [];
    let timerSeq = 0;
    function fmt(seconds) { const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60; return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
    function createTimer() { const name=document.querySelector('#timer-name').value.trim()||'Untitled timer'; const seconds=(+document.querySelector('#timer-hours').value||0)*3600+(+document.querySelector('#timer-minutes').value||0)*60+(+document.querySelector('#timer-seconds').value||0); if(!seconds) return; timers.push({id:'t'+(++timerSeq),name,seconds,running:false,done:false}); renderTimers(); }
    function renderTimers() {
      const list=document.querySelector('#timer-list'); list.innerHTML='';
      timers.forEach((timer,i) => {
        const row=document.createElement('div');
        row.className='timer-row' + (timer.done ? ' alarming' : '');
        const actionBtn = timer.done ? `<button class="small-btn">STOP</button>` : `<button class="small-btn">${timer.running?'PAUSE':'START'}</button>`;
        row.innerHTML=`<div><small>${timer.name}${timer.done ? ' — done' : ''}</small><strong>${fmt(timer.seconds)}</strong></div>${actionBtn}<button class="small-btn">×</button>`;
        row.querySelectorAll('button')[0].onclick=()=>{
          if (timer.done) { timer.done=false; stopTimerAlarm(timer.id); }
          else { timer.running=!timer.running; }
          renderTimers();
        };
        row.querySelectorAll('button')[1].onclick=()=>{
          stopTimerAlarm(timer.id); // deleting a timer must silence its alarm, if it's the one ringing
          timers.splice(i,1);
          renderTimers();
        };
        list.append(row);
      });
    }
    setInterval(()=>{
      let change=false;
      timers.forEach(t=>{
        if (t.running && t.seconds>0) {
          t.seconds--; change=true;
          if (!t.seconds) { t.running=false; t.done=true; playTimerAlarm(t.id); }
        }
      });
      if (change) renderTimers();
    }, 1000);

    // ---- Timer alarm sound (synthesized via Web Audio API — no external
    // audio file needed, works fully offline). One alarm can be looping at a
    // time per timer id; stopping/deleting that specific timer tears down
    // exactly its own oscillator loop and nothing else's.
    let alarmAudioCtx = null;
    const activeAlarms = {}; // timer id -> { stop() }
    function getAlarmAudioCtx() {
      if (!alarmAudioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        alarmAudioCtx = new Ctx();
      }
      return alarmAudioCtx;
    }
    function playTimerAlarm(timerId) {
      if (activeAlarms[timerId]) return; // already ringing
      const ctx = getAlarmAudioCtx();
      if (!ctx) return; // Web Audio unsupported — timer still shows as done visually
      if (ctx.state === 'suspended') ctx.resume();

      let stopped = false;
      const beepOnce = (when) => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, when);
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(0.35, when + 0.02);
        gain.gain.linearRampToValueAtTime(0, when + 0.28);
        osc.connect(gain).connect(ctx.destination);
        osc.start(when);
        osc.stop(when + 0.3);
      };
      let beatIndex = 0;
      const scheduleNext = () => {
        if (stopped) return;
        const now = ctx.currentTime;
        beepOnce(now);
        beepOnce(now + 0.35);
        beatIndex++;
        // repeat the double-beep every 1.2s until dismissed or deleted
        activeAlarms[timerId].timeoutId = setTimeout(scheduleNext, 1200);
      };
      activeAlarms[timerId] = { timeoutId: null, stop() { stopped = true; clearTimeout(activeAlarms[timerId].timeoutId); } };
      scheduleNext();
    }
    function stopTimerAlarm(timerId) {
      if (activeAlarms[timerId]) { activeAlarms[timerId].stop(); delete activeAlarms[timerId]; }
    }
    let swElapsed=0, swRunning=false, swStart=0, laps=[];
    function swCurrent(){return swElapsed+(swRunning?(performance.now()-swStart):0)} function renderStopwatch(){const n=swCurrent();document.querySelector('#stopwatch-time').textContent=String(Math.floor(n/60000)).padStart(2,'0')+':'+String(Math.floor(n/1000)%60).padStart(2,'0')+'.'+Math.floor(n/100)%10;document.querySelector('#stopwatch-start').textContent=swRunning?'PAUSE':'START';}
    function toggleStopwatch(){if(swRunning){swElapsed=swCurrent();swRunning=false}else{swStart=performance.now();swRunning=true}renderStopwatch()} function resetStopwatch(){swElapsed=0;swRunning=false;laps=[];document.querySelector('#lap-list').innerHTML='';renderStopwatch()} function lapStopwatch(){if(!swRunning)return; const value=document.querySelector('#stopwatch-time').textContent;laps.unshift(value);document.querySelector('#lap-list').innerHTML=laps.map((x,i)=>`<div class="lap"><span>LAP ${laps.length-i}</span><b>${x}</b></div>`).join('');} setInterval(()=>{if(swRunning)renderStopwatch()},80);
    let single=0; function changeSingle(n){single=Math.max(0,single+n);document.querySelector('#single-value').textContent=single;}
    const counters=[]; function createCounter(){const name=document.querySelector('#counter-name').value.trim()||'Untitled';counters.push({name,value:0});document.querySelector('#counter-name').value='';renderCounters()} function renderCounters(){const list=document.querySelector('#counter-list');list.innerHTML='';counters.forEach((counter,i)=>{const row=document.createElement('div');row.className='counter-row';row.innerHTML=`<b>${counter.name}</b><div class="counter-box">${counter.value}</div><button>+</button><button>−</button>`;row.querySelectorAll('button')[0].onclick=()=>{counter.value++;renderCounters()};row.querySelectorAll('button')[1].onclick=()=>{counter.value=Math.max(0,counter.value-1);renderCounters()};list.append(row)})}
    const blood={RBC:0,WBC:0,Platelets:0}; function renderBlood(){const grid=document.querySelector('#blood-grid');grid.innerHTML='';Object.entries(blood).forEach(([name,value])=>{const box=document.createElement('div');box.className='blood';box.innerHTML=`<b>${name}</b><div class="blood-value">${value}</div><div class="blood-controls"><button>+</button><button>−</button></div>`;box.querySelectorAll('button')[0].onclick=()=>{blood[name]++;renderBlood()};box.querySelectorAll('button')[1].onclick=()=>{blood[name]=Math.max(0,blood[name]-1);renderBlood()};grid.append(box)})} renderBlood();
    let expression='';
    let justEvaluated=false; // true right after "=" — the next key press starts a fresh expression instead of appending
    function updateLivePreview(){
      const previewEl = document.querySelector('#calc-expression');
      if (!expression) { previewEl.textContent=''; return; }
      // Don't preview a bare number with no operation yet (e.g. just "9") —
      // only once there's an actual calculation to show ahead of "=".
      if (!/[+\-*/^]|ln\(|log\(|exp\(|√|∛/.test(expression)) { previewEl.textContent=''; return; }
      try {
        const x = calcToEvalString(expression);
        if (!/^[\d+\-*/().,\sA-Za-z]+$/.test(x)) { previewEl.textContent=''; return; }
        const answer = Function('return ('+x+')')();
        if (!Number.isFinite(answer)) { previewEl.textContent=''; return; }
        // Only preview once the expression actually reads as a complete
        // calculation — e.g. don't preview "9*" or "9+(3" mid-typing, only
        // once there's a full valid statement like "9*4".
        previewEl.textContent = '= ' + (+answer.toPrecision(12));
      } catch { previewEl.textContent=''; }
    }
    const display=()=>{document.querySelector('#calc-output').textContent=expression||'0'; updateLivePreview();};
    function calcAppend(x){
      if (justEvaluated) { expression=''; justEvaluated=false; }
      expression+=x;
      display();
    }
    function calcClear(){expression='';justEvaluated=false;display()}
    function calcBack(){if(justEvaluated){expression='';justEvaluated=false;}else{expression=expression.slice(0,-1);}display()}
    function calcToEvalString(expr){
      // Convert the user-facing expression (which uses e, ^, √, ∛, π, ln(, log(, exp())
      // into a JS-evaluable string. Function-name tokens are swapped for unique
      // placeholders first so later replacements can never collide with each other
      // (e.g. "ln(" turning into "Math.log(" must not then get re-matched by the
      // "log(" -> "Math.log10(" rule).
      let x = expr
        .replaceAll('ln(', '\u0001(')
        .replaceAll('log(', '\u0002(')
        .replaceAll('exp(', '\u0003(')
        .replaceAll('√', '\u0004')
        .replaceAll('∛', '\u0005')
        .replaceAll('π', '\u0006')
        .replaceAll('^', '**')
        .replace(/(\d|\)|\u0007)!/g, '$1')
        // standalone e (Euler's number), not part of a longer identifier
        .replace(/(^|[^A-Za-z0-9_])e(?![A-Za-z0-9_])/g, '$1\u0007');
      x = x
        .replaceAll('\u0001(', 'Math.log(')
        .replaceAll('\u0002(', 'Math.log10(')
        .replaceAll('\u0003(', 'Math.exp(')
        .replaceAll('\u0004', 'Math.sqrt')
        .replaceAll('\u0005', 'Math.cbrt')
        .replaceAll('\u0006', 'Math.PI')
        .replaceAll('\u0007', 'Math.E');
      return x;
    }
    function calcEval(){if(!expression)return;try{let x=calcToEvalString(expression); if(!/^[\d+\-*/().,\sA-Za-z]+$/.test(x))throw Error();const answer=Function('return ('+x+')')();if(!Number.isFinite(answer))throw Error();const out=+answer.toPrecision(12);const item=document.createElement('div');item.className='history-item';item.innerHTML=`${expression}<b>= ${out}</b>`;const list=document.querySelector('#history-list');if(list.children[0]?.textContent.includes('No calculations'))list.innerHTML='';list.prepend(item);expression=String(out);justEvaluated=true;document.querySelector('#calc-expression').textContent='';document.querySelector('#calc-output').textContent=expression}catch{document.querySelector('#calc-output').textContent='ERROR';document.querySelector('#calc-expression').textContent='';justEvaluated=true;expression=''}}
    const calcKeys=[['(', '('],[')', ')'],['π','π'],['e','e'],['AC','clear'],['7','7'],['8','8'],['9','9'],['÷','/'],['←','back'],['4','4'],['5','5'],['6','6'],['×','*'],['+','+'],['1','1'],['2','2'],['3','3'],['^','^'],['−','-'],['0','0'],['.','.'],['1/x','inv'],['10ˣ','10^'],['=','eval']];
    const keys=document.querySelector('#calc-keys');calcKeys.forEach(([label,value])=>{const b=document.createElement('button');b.className='calc-key '+(['÷','×','−','+','^'].includes(label)?'op ':'')+(label==='='?'eq':'');b.textContent=label;b.onclick=()=>{if(value==='clear')calcClear();else if(value==='back')calcBack();else if(value==='eval')calcEval();else if(value==='inv')calcAppend('1/');else calcAppend(value)};keys.append(b)}); [['log/ln',['log(','ln(']],['x²/x³',['^2','^3']],['√/∛',['√(','∛(']]].forEach(([label,opts])=>{const wrap=document.createElement('div');wrap.className='key-wrap';const button=document.createElement('button');button.className='calc-key';button.textContent=label;const menu=document.createElement('div');menu.className='key-menu';opts.forEach(v=>{const x=document.createElement('button');x.textContent=v;x.onclick=()=>{calcAppend(v);menu.classList.remove('open')};menu.append(x)});button.onclick=()=>menu.classList.toggle('open');wrap.append(button,menu);keys.append(wrap)}); display();
    function clearCalcHistory(){document.querySelector('#history-list').innerHTML='<span style="font-size:11px;color:var(--muted)">No calculations yet.</span>'}
    const unitFactor = { M:1, mM:1e-3, 'µM':1e-6, L:1, mL:1e-3, 'µL':1e-6, mol:1, mmol:1e-3, 'µmol':1e-6, g:1, mg:1e-3, 'µg':1e-6 };
    const num = id => +document.querySelector('#'+id).value || 0, unit = id => document.querySelector('#'+id).value;
    function show(id, html){document.querySelector('#'+id).innerHTML=html}
    function calcDilution(){const c1=num('d-c1')*unitFactor[unit('d-c1u')],c2=num('d-c2')*unitFactor[unit('d-c2u')],v2=num('d-v2')*unitFactor[unit('d-v2u')];if(!c1||!c2||!v2)return;const v1=c2*v2/c1;show('d-result',`Use <b>${(v1*1e6).toFixed(2)} µL</b> stock and <b>${((v2-v1)*1e6).toFixed(2)} µL</b> diluent.`)}
    function calcSerial(){const f=num('s-factor'), tubes=Math.max(1,Math.floor(num('s-tubes'))),vol=num('s-volume'),u=unit('s-unit'),start=num('s-start')*unitFactor[unit('s-startu')];if(f<=1||!vol||!start)return;const transfer=vol/f;let rows=[];for(let i=1;i<=tubes;i++){const conc=start/(f**i);rows.push(`<b>Tube ${i}</b> — transfer <b>${transfer.toFixed(3)} ${u}</b> from ${i===1?'the starting stock':'Tube '+(i-1)} into <b>${(vol-transfer).toFixed(3)} ${u}</b> diluent. Final: <b>${(conc*1e3).toPrecision(4)} mM</b> (1:${f**i}).`)}show('s-result',rows.join('<br><br>'))}
    function calcReverse(){const c2=num('r-c2')*unitFactor[unit('r-c2u')],v2=num('r-v2')*unitFactor[unit('r-v2u')],v1=num('r-v1')*unitFactor[unit('r-v1u')];if(!c2||!v2||!v1)return;const c1=c2*v2/v1;show('r-result',`Your ${num('r-v1')} ${unit('r-v1u')} starting volume must be <b>${(c1*1e3).toFixed(3)} mM</b> to yield the target.`)}
    function calcSolution(){const m=num('sol-m')*unitFactor[unit('sol-mu')],mw=num('sol-mw'),v=num('sol-v')*unitFactor[unit('sol-vu')];if(!m||!mw||!v)return;const mass=m*mw*v;show('sol-result',`Weigh <b>${(mass*1000).toFixed(3)} mg</b> (${mass.toPrecision(5)} g), then bring to final volume.`)}
    let componentIndex = 0;

function addComponent(type = 'stock', data = { name: '', desired: '', param1: '' }) {
  componentIndex++;
  const row = document.createElement('div');
  row.className = 'component';
  row.dataset.type = type;
  
  if (type === 'stock') {
    row.innerHTML = `
      <input class="comp-name" value="${data.name}" placeholder="Component name">
      <div class="unit-input"><input class="comp-desired" type="number" value="${data.desired}" placeholder="Desired conc."><select class="comp-du"><option>M</option><option selected>mM</option><option>µM</option></select></div>
      <div class="unit-input"><input class="comp-stock" type="number" value="${data.param1}" placeholder="Stock conc."><select class="comp-su"><option>M</option><option selected>mM</option><option>µM</option></select></div>
      <button title="Remove component">×</button>
    `;
  } else {
    row.innerHTML = `
      <input class="comp-name" value="${data.name}" placeholder="Component name">
      <div class="unit-input"><input class="comp-desired" type="number" value="${data.desired}" placeholder="Desired conc."><select class="comp-du"><option>M</option><option selected>mM</option><option>µM</option></select></div>
      <div class="unit-input"><input class="comp-mw" type="number" value="${data.param1}" placeholder="Mol. weight"><select><option>g/mol</option></select></div>
      <button title="Remove component">×</button>
    `;
  }
  
  row.querySelector('button').onclick = () => { row.remove(); updateBuffer(); };
  row.querySelectorAll('input, select').forEach(x => x.oninput = updateBuffer);
  document.querySelector('#components').append(row);
  updateBuffer();
}

function formatVolumeMl(ml) {
  // Lab convention: use L for large volumes (>=1000 mL), µL for very small
  // volumes (<1 mL), and mL for everything in between.
  if (ml >= 1000) return (ml / 1000).toFixed(3).replace(/\.?0+$/, '') + ' L';
  if (ml < 1 && ml > 0) return (ml * 1000).toFixed(1) + ' µL';
  return ml.toFixed(2) + ' mL';
}

function computeBufferBreakdown() {
  const v = num('buffer-volume') * unitFactor[unit('buffer-unit')]; // Volume in Liters
  let totalSoluteVolumeMl = 0;
  let totalMassGrams = 0;
  const components = [];

  document.querySelectorAll('.component').forEach(row => {
    const type = row.dataset.type;
    const name = row.querySelector('.comp-name').value.trim() || 'Component';
    const desiredConc = +(row.querySelector('.comp-desired').value || 0) * unitFactor[row.querySelector('.comp-du').value];

    if (type === 'stock') {
      const stockConc = +(row.querySelector('.comp-stock').value || 0) * unitFactor[row.querySelector('.comp-su').value];
      let addMl = 0;
      if (stockConc > 0) {
        const reqVolLiters = (desiredConc * v) / stockConc;
        addMl = reqVolLiters * 1000;
        totalSoluteVolumeMl += addMl;
      }
      components.push({ name, type, addMl });
    } else {
      const mw = +(row.querySelector('.comp-mw').value || 0);
      let addGrams = 0;
      if (mw > 0) {
        addGrams = desiredConc * v * mw;
        totalMassGrams += addGrams;
      }
      components.push({ name, type, addGrams });
    }
  });

  const totalMl = v * 1000;
  const solventMl = Math.max(0, totalMl - totalSoluteVolumeMl);
  return { components, totalMl, totalSoluteVolumeMl, totalMassGrams, solventMl };
}

function updateBuffer() {
  const { components, totalMl, totalSoluteVolumeMl, totalMassGrams, solventMl } = computeBufferBreakdown();

  const rows = components.map(c => {
    const amount = c.type === 'stock' ? formatVolumeMl(c.addMl) : c.addGrams.toFixed(3) + ' g';
    return `<div class="buffer-summary-component"><span>${c.name}</span><b>${amount}</b></div>`;
  }).join('');

  document.querySelector('#buffer-summary').innerHTML = `
    ${rows}
    <div><span>Final volume</span><b>${totalMl.toFixed(2)} mL</b></div>
    <div><span>Stock added</span><b>${totalSoluteVolumeMl.toFixed(2)} mL</b> | <b>${totalMassGrams.toFixed(3)} g</b> powder</div>
    <div><span>Solvent (Water/Buffer)</span><b>${formatVolumeMl(solventMl)}</b></div>
  `;
}

['buffer-volume', 'buffer-unit'].forEach(id => document.querySelector('#' + id).oninput = updateBuffer);
    function saveBuffer(){
      const name = document.querySelector('#buffer-name').value.trim() || 'Medium / Buffer';
      const { components, solventMl } = computeBufferBreakdown();
      const lines = components.map((c, i) => {
        const amount = c.type === 'stock' ? formatVolumeMl(c.addMl) + ' of stock' : c.addGrams.toFixed(3) + ' g powder';
        return `Component ${i + 1} (${c.name}): ${amount}`;
      });
      lines.push(`Buffer/Solvent: ${formatVolumeMl(solventMl)}`);
      const desc = lines.join('\n');
      protocols.unshift({
        id: 'p' + (++protocolSeq),
        name,
        steps: [{ name: 'Prepare recipe', description: desc, done: true, tools: ['Medium / Buffer maker'] }],
        notes: ''
      });
      renderProtocolLists();
      alert('Recipe saved as a protocol.');
    }
    function calcMolesVolume(){const n=num('mv-n')*unitFactor[unit('mv-nu')],v=num('mv-v')*unitFactor[unit('mv-vu')];if(!n||!v)return;const m=n/v;show('mv-result',`Molarity: <b>${m.toPrecision(6)} M</b> (${(m*1e3).toPrecision(5)} mM).`)}
    function calcMassMW(){const mass=num('mm-mass')*unitFactor[unit('mm-massu')],mw=num('mm-mw'),v=num('mm-vol')*unitFactor[unit('mm-volu')];if(!mass||!mw||!v)return;const m=mass/(mw*v);show('mm-result',`Molarity: <b>${m.toPrecision(6)} M</b> (${(m*1e3).toPrecision(5)} mM).`)}
    // Cell counter: each mode (wbc/rbc) tracks its own selected squares, with a
    // separate count array per viability state (viable / nonviable). The active
    // viability sub-tab decides which array a square tap/minus affects, and the
    // grid badge on each square always reflects the currently active sub-tab's
    // count for that square — switching sub-tabs re-renders the badges.
    const cellData = {
      wbc: { selected: [0,2,6,8], viable: [0,0,0,0], nonviable: [0,0,0,0] },
      rbc: { selected: [0,4,12,20,24], viable: [0,0,0,0,0], nonviable: [0,0,0,0,0] }
    };
    let activeCellMode = 'wbc';
    let activeViability = 'viable';

    function renderCellGrid(mode) {
      const config = cellData[mode], size = mode==='wbc'?9:25, target = document.querySelector('#cell-'+mode);
      target.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'count-grid ' + mode + '-grid';
      for (let i=0; i<size; i++) {
        const b = document.createElement('button'), picked = config.selected.indexOf(i), label = mode==='wbc' ? 'C'+(picked+1) : 'S'+(picked+1);
        b.textContent = picked>-1 ? label : '';
        if (picked>-1) {
          b.className = 'selected';
          b.dataset.count = config[activeViability][picked];
          b.onclick = () => { config[activeViability][picked]++; b.dataset.count = config[activeViability][picked]; syncCellTotals(); };
          const minus = document.createElement('button');
          minus.className = 'square-minus';
          minus.textContent = '−';
          minus.title = 'Remove one';
          minus.onclick = (ev) => { ev.stopPropagation(); config[activeViability][picked] = Math.max(0, config[activeViability][picked]-1); b.dataset.count = config[activeViability][picked]; syncCellTotals(); };
          b.appendChild(minus);
        }
        grid.append(b);
      }
      target.append(grid);
    }
    function syncCellTotals() {
      const config = cellData[activeCellMode];
      document.querySelector('#viable-count').textContent = config.viable.reduce((a,b)=>a+b,0);
      document.querySelector('#dead-count').textContent = config.nonviable.reduce((a,b)=>a+b,0);
    }
    function setCellMode(mode) {
      activeCellMode = mode;
      syncCellTotals();
      document.querySelector('#cell-formula').innerHTML = mode==='wbc' ? 'Tap each selected large corner square to tally cells. Formula: <code>average count × dilution × 10⁴</code> cells/mL.' : 'Tap each of the five selected central RBC squares to tally cells. Formula: <code>total count × dilution × 5 × 10⁴</code> cells/mL.';
      renderCellGrid('wbc'); renderCellGrid('rbc');
    }
    function setCellViability(viability) {
      activeViability = viability;
      renderCellGrid('wbc'); renderCellGrid('rbc');
    }
    document.querySelectorAll('[data-group="celltype"] .tool-tab').forEach(tab=>tab.addEventListener('click',()=>setCellMode(tab.dataset.toolView==='cell-wbc'?'wbc':'rbc')));
    document.querySelectorAll('[data-group="viability"] .tool-tab').forEach(tab=>tab.addEventListener('click',(e)=>{
      document.querySelectorAll('[data-group="viability"] .tool-tab').forEach(x=>x.classList.remove('active'));
      e.currentTarget.classList.add('active');
      setCellViability(tab.dataset.toolView==='viable'?'viable':'nonviable');
    }));
    setCellMode('wbc'); // render both grids and totals on first load, instead of leaving them blank until a tab is clicked
    function calcCells() {
      const config = cellData[activeCellMode];
      const squares = config.selected.length;
      const factor = num('cell-dilution') || 1;
      const viableSum = config.viable.reduce((a,b)=>a+b,0);
      const nonviableSum = config.nonviable.reduce((a,b)=>a+b,0);
      const totalSum = viableSum + nonviableSum;
      const avg = totalSum / squares;
      const conc = activeCellMode==='wbc' ? avg*factor*1e4 : totalSum*factor*5e4;
      const viability = totalSum ? viableSum/totalSum*100 : 0;
      show('cell-result', `${activeCellMode==='wbc'?'WBC / large-square':'RBC / central-square'} average: <b>${avg.toFixed(1)}</b> cells / selected square<br>Estimated concentration: <b>${conc.toExponential(2)}</b> cells/mL<br>Viability: <b>${viability.toFixed(1)}%</b> (${viableSum} viable / ${nonviableSum} non-viable)`);
    }
    function renderCultureTrack(){
      const current = +document.querySelector('#culture-current').value;
      const target = +document.querySelector('#culture-target').value;
      document.querySelector('#culture-current-label').textContent = current + '%';
      document.querySelector('#culture-target-label').textContent = target + '%';
      document.querySelector('#culture-track-fill').style.width = current + '%';
      document.querySelector('#culture-dot-start').style.left = current + '%';
      document.querySelector('#culture-marker-start').style.left = current + '%';
      document.querySelector('#culture-marker-start').textContent = 'Current: ' + current + '%';
      document.querySelector('#culture-dot-target').style.left = target + '%';
      document.querySelector('#culture-marker-target').style.left = target + '%';
      document.querySelector('#culture-marker-target').textContent = 'Target: ' + target + '%';
    }
    function calcCultureTiming(){
      const current = +document.querySelector('#culture-current').value;
      const target = +document.querySelector('#culture-target').value;
      const td = num('culture-doubling');
      const out = document.querySelector('#culture-eta-value');
      if (!td || current <= 0 || target <= current) { out.textContent = 'Enter a valid doubling time and target above current'; return; }
      const hours = td * Math.log2(target / current);
      const days = Math.floor(hours / 24), rem = Math.round(hours % 24);
      out.textContent = `${hours.toFixed(1)} h (≈ ${days}d ${rem}h)`;
    }
    let passageNumber = 0;
    function adjustPassage(n){ passageNumber = Math.max(0, passageNumber + n); document.querySelector('#passage-number').textContent = 'P' + passageNumber; }
    function logPassage(){
      const medium = document.querySelector('#culture-medium').value.trim();
      const antibiotic = document.querySelector('#culture-antibiotic').value.trim();
      const incubation = document.querySelector('#culture-incubation').value.trim();
      const stamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      document.querySelector('#passage-date').textContent = 'Logged ' + stamp;
      const row = document.createElement('div');
      row.className = 'timer-row';
      row.innerHTML = `<div><small>P${passageNumber} · ${stamp}</small><strong style="font-size:13px">${medium || 'No medium noted'}</strong></div><div style="font-size:10px;color:var(--muted);text-align:right">${antibiotic || '—'}<br>${incubation || '—'}</div><button class="small-btn" title="Remove passage entry" onclick="this.closest('.timer-row').remove()">✕</button>`;
      document.querySelector('#passage-log').prepend(row);
      adjustPassage(1);
    }
    renderCultureTrack();

    // ---- Calibration Curve Logic with Smooth SVG Spline/Curve ----
    let calibPoints = [];
    let calibSamples = [];

    function renderCalibrationPointsUI() {
      const container = document.getElementById('calib-points');
      if (!container) return;
      container.innerHTML = '';
      calibPoints.forEach((pt, i) => {
        const row = document.createElement('div');
        row.className = 'calib-row';
        row.innerHTML = `
          <input type="number" placeholder="X value" value="${pt.x}" oninput="updateCalibPoint(${i}, 'x', this.value)">
          <input type="number" placeholder="Y value" value="${pt.y}" oninput="updateCalibPoint(${i}, 'y', this.value)">
          <button class="calib-del" onclick="removeCalibPoint(${i})">×</button>
        `;
        container.appendChild(row);
      });
      renderCalibrationSamplesUI();
      renderCalibrationGraph();
    }

    function addCalibPoint() {
      calibPoints.push({ x: '', y: '' });
      renderCalibrationPointsUI();
    }

    function updateCalibPoint(i, field, val) {
      // Keep the raw string the user is typing (so "0." or "-" or a trailing
      // decimal point isn't stripped mid-keystroke); only the calculation
      // layer parses this to a number. Re-rendering the whole row on every
      // keystroke would reset the cursor and swallow characters like ".".
      calibPoints[i][field] = val;
      renderCalibrationGraph();
      updateCalibSampleValuesOnly();
    }

    function removeCalibPoint(i) {
      calibPoints.splice(i, 1);
      renderCalibrationPointsUI();
    }

    function renderCalibrationSamplesUI() {
      const container = document.getElementById('calib-samples');
      if (!container) return;
      container.innerHTML = '';
      calibSamples.forEach((sample, i) => {
        const sampleEl = document.createElement('div');
        sampleEl.className = 'calib-sample';
        const isXMode = sample.mode === 'x';
        sampleEl.innerHTML = `
          <div class="calib-sample-head">
            <input type="text" value="${sample.name}" placeholder="Sample name" oninput="calibSamples[${i}].name = this.value">
            <button class="calib-del" onclick="removeCalibSample(${i})" style="width:34px;height:34px;font-size:13px">×</button>
          </div>
          <div class="calib-sample-vals">
            <input type="number" placeholder="${isXMode ? 'Enter X' : 'Calculated X'}" value="${isXMode ? sample.x : (sample.x !== '' && !isNaN(sample.x) ? (+sample.x).toFixed(2) : '')}" ${isXMode ? '' : 'readonly'} oninput="updateCalibSample(${i}, 'x', this.value)">
            <input type="number" placeholder="${!isXMode ? 'Enter Y' : 'Calculated Y'}" value="${!isXMode ? sample.y : (sample.y !== '' && !isNaN(sample.y) ? (+sample.y).toFixed(2) : '')}" ${!isXMode ? '' : 'readonly'} oninput="updateCalibSample(${i}, 'y', this.value)">
          </div>
        `;
        container.appendChild(sampleEl);
      });
    }

    function updateCalibSample(i, field, val) {
      // Same principle as updateCalibPoint: keep the raw typed string, only
      // the graph/calculation layer parses it, so a trailing "." or "-"
      // isn't wiped out on every keystroke.
      calibSamples[i][field] = val;
      renderCalibrationGraph();
    }

    // Recomputes each sample's derived value (the one calculated FROM the
    // fitted curve) without rebuilding the sample input rows — rebuilding on
    // every data-point keystroke would blow away whatever the user is
    // currently typing into a sample field.
    function updateCalibSampleValuesOnly() {
      calibSamples.forEach((sample, i) => {
        const row = document.querySelectorAll('#calib-samples .calib-sample')[i];
        if (!row) return;
        const isXMode = sample.mode === 'x';
        const readonlyInput = row.querySelector(isXMode ? '.calib-sample-vals input:last-child' : '.calib-sample-vals input:first-child');
        if (!readonlyInput) return;
        const val = isXMode ? sample.y : sample.x;
        readonlyInput.value = (val !== '' && !isNaN(val)) ? (+val).toFixed(2) : '';
      });
    }

    function addCalibSample() {
      calibSamples.push({ name: '', x: '', y: '', mode: 'x' });
      renderCalibrationSamplesUI();
      renderCalibrationGraph();
    }

    function removeCalibSample(i) {
      calibSamples.splice(i, 1);
      renderCalibrationSamplesUI();
      renderCalibrationGraph();
    }

    function renderCalibrationGraph() {
      const svg = document.getElementById('calib-svg');
      const empty = document.getElementById('calib-empty');
      if (!svg || !empty) return;

      const validPts = calibPoints
        .map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y));
      if (validPts.length < 2) {
        svg.style.display = 'none';
        empty.style.display = 'grid';
        return;
      }

      svg.style.display = 'block';
      empty.style.display = 'none';

      validPts.sort((a, b) => a.x - b.x);

      let minX = validPts[0].x, maxX = validPts[validPts.length - 1].x;
      let minY = Math.min(...validPts.map(p => p.y)), maxY = Math.max(...validPts.map(p => p.y));

      if (minX === maxX) maxX += 1;
      if (minY === maxY) maxY += 1;

      const paddingX = (maxX - minX) * 0.15 || 1;
      const paddingY = (maxY - minY) * 0.15 || 1;
      minX -= paddingX; maxX += paddingX;
      minY -= paddingY; maxY += paddingY;

      const width = 300, height = 257;
      const xLabel = (document.getElementById('calib-xlabel')?.value || '').trim();
      const yLabel = (document.getElementById('calib-ylabel')?.value || '').trim();
      const padLeft = 40 + (yLabel ? 12 : 0), padRight = 15, padTop = 15, padBottom = 28 + (xLabel ? 14 : 0);
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      function scaleX(x) {
        return padLeft + ((x - minX) / (maxX - minX)) * plotW;
      }
      function scaleY(y) {
        return height - padBottom - ((y - minY) / (maxY - minY)) * plotH;
      }

      const activeTab = document.querySelector('.tool-tabs[data-group="calibration"] .tool-tab.active');
      const tabViewId = activeTab ? activeTab.getAttribute('data-tool-view') : 'calib-linear';

      let svgContent = '';

      svgContent += `<line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#182034" stroke-width="1.5"/>`;
      svgContent += `<line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#182034" stroke-width="1.5"/>`;

      if (xLabel) {
        svgContent += `<text x="${padLeft + plotW / 2}" y="${height - 4}" font-size="9" font-weight="bold" text-anchor="middle" fill="#182034">${xLabel}</text>`;
      }
      if (yLabel) {
        svgContent += `<text x="10" y="${padTop + plotH / 2}" font-size="9" font-weight="bold" text-anchor="middle" transform="rotate(-90, 10, ${padTop + plotH / 2})" fill="#182034">${yLabel}</text>`;
      }

      // Data-driven axis scale: a handful of evenly spaced "nice" tick values
      // across the actual plotted range, rather than only the two endpoints.
      function niceTicks(min, max, targetCount) {
        const span = max - min;
        if (!isFinite(span) || span <= 0) return [min, max];
        const rawStep = span / targetCount;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const residual = rawStep / magnitude;
        let niceStep;
        if (residual > 5) niceStep = 10 * magnitude;
        else if (residual > 2) niceStep = 5 * magnitude;
        else if (residual > 1) niceStep = 2 * magnitude;
        else niceStep = magnitude;
        const start = Math.ceil(min / niceStep) * niceStep;
        const ticks = [];
        for (let v = start; v <= max + niceStep * 1e-6; v += niceStep) ticks.push(+v.toFixed(10));
        return ticks.length ? ticks : [min, max];
      }
      const decimalsFor = step => Math.max(0, -Math.floor(Math.log10(step || 1)));

      const xTicks = niceTicks(minX, maxX, 4);
      const yTicks = niceTicks(minY, maxY, 4);
      const xDecimals = xTicks.length > 1 ? decimalsFor(xTicks[1] - xTicks[0]) : 1;
      const yDecimals = yTicks.length > 1 ? decimalsFor(yTicks[1] - yTicks[0]) : 1;

      xTicks.forEach(tx => {
        const sx = scaleX(tx);
        svgContent += `<line x1="${sx}" y1="${height - padBottom}" x2="${sx}" y2="${height - padBottom + 4}" stroke="#182034" stroke-width="1"/>`;
        svgContent += `<text x="${sx}" y="${height - padBottom + (xLabel ? 17 : 13)}" font-size="8" text-anchor="middle" fill="#697087">${tx.toFixed(xDecimals)}</text>`;
      });
      yTicks.forEach(ty => {
        const sy = scaleY(ty);
        svgContent += `<line x1="${padLeft - 4}" y1="${sy}" x2="${padLeft}" y2="${sy}" stroke="#182034" stroke-width="1"/>`;
        svgContent += `<text x="${padLeft - 6}" y="${sy + 3}" font-size="8" text-anchor="end" fill="#697087">${ty.toFixed(yDecimals)}</text>`;
      });

      if (tabViewId === 'calib-linear') {
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, n = validPts.length;
        validPts.forEach(p => {
          sumX += p.x; sumY += p.y; sumXY += (p.x * p.y); sumX2 += (p.x * p.x);
        });
        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 0.0001);
        const c = (sumY - m * sumX) / n;

        const x1 = minX, y1 = m * x1 + c;
        const x2 = maxX, y2 = m * x2 + c;
        svgContent += `<line x1="${scaleX(x1)}" y1="${scaleY(y1)}" x2="${scaleX(x2)}" y2="${scaleY(y2)}" stroke="#7655e7" stroke-width="2.5"/>`;

        calibSamples.forEach(sample => {
          const sx = parseFloat(sample.x), sy = parseFloat(sample.y);
          if (sample.mode === 'x' && sample.x !== '' && !isNaN(sx)) {
            sample.y = m * sx + c;
          } else if (sample.mode === 'y' && sample.y !== '' && !isNaN(sy)) {
            sample.x = (sy - c) / (m || 0.0001);
          }
        });
      } else if (tabViewId === 'calib-exponential') {
        let validExp = validPts.filter(p => p.y > 0);
        if (validExp.length >= 2) {
          let sumX = 0, sumLnY = 0, sumXLnY = 0, sumX2 = 0, n = validExp.length;
          validExp.forEach(p => {
            sumX += p.x; sumLnY += Math.log(p.y); sumXLnY += p.x * Math.log(p.y); sumX2 += p.x * p.x;
          });
          const b = (n * sumXLnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX || 0.0001);
          const lnA = (sumLnY - b * sumX) / n;
          const a = Math.exp(lnA);

          let pathD = '';
          const steps = 50;
          for (let i = 0; i <= steps; i++) {
            const x = minX + (i / steps) * (maxX - minX);
            const y = a * Math.exp(b * x);
            const sx = scaleX(x), sy = scaleY(y);
            pathD += (i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`);
          }
          svgContent += `<path d="${pathD}" fill="none" stroke="#ff9f43" stroke-width="2.5"/>`;

          calibSamples.forEach(sample => {
            const sx = parseFloat(sample.x), sy = parseFloat(sample.y);
            if (sample.mode === 'x' && sample.x !== '' && !isNaN(sx)) {
              sample.y = a * Math.exp(b * sx);
            } else if (sample.mode === 'y' && sample.y !== '' && !isNaN(sy) && sy > 0) {
              sample.x = Math.log(sy / a) / (b || 0.0001);
            }
          });
        }
      } else if (tabViewId === 'calib-logarithmic') {
        // y = a + b*ln(x) — only defined for x > 0.
        let validLog = validPts.filter(p => p.x > 0);
        if (validLog.length >= 2) {
          let sumLnX = 0, sumY = 0, sumLnXY = 0, sumLnX2 = 0, n = validLog.length;
          validLog.forEach(p => {
            const lx = Math.log(p.x);
            sumLnX += lx; sumY += p.y; sumLnXY += lx * p.y; sumLnX2 += lx * lx;
          });
          const b = (n * sumLnXY - sumLnX * sumY) / (n * sumLnX2 - sumLnX * sumLnX || 0.0001);
          const a = (sumY - b * sumLnX) / n;

          const plotMinX = Math.max(minX, 1e-6);
          let pathD = '';
          const steps = 50;
          for (let i = 0; i <= steps; i++) {
            const x = plotMinX + (i / steps) * (maxX - plotMinX);
            const y = a + b * Math.log(x);
            const sx = scaleX(x), sy = scaleY(y);
            pathD += (i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`);
          }
          svgContent += `<path d="${pathD}" fill="none" stroke="#62c8ff" stroke-width="2.5"/>`;

          calibSamples.forEach(sample => {
            const sx = parseFloat(sample.x), sy = parseFloat(sample.y);
            if (sample.mode === 'x' && sample.x !== '' && !isNaN(sx) && sx > 0) {
              sample.y = a + b * Math.log(sx);
            } else if (sample.mode === 'y' && sample.y !== '' && !isNaN(sy)) {
              sample.x = Math.exp((sy - a) / (b || 0.0001));
            }
          });
        }
      } else if (tabViewId === 'calib-curve') {
        let pathD = `M ${scaleX(validPts[0].x)} ${scaleY(validPts[0].y)}`;
        for (let i = 0; i < validPts.length - 1; i++) {
          const p0 = i > 0 ? validPts[i - 1] : validPts[0];
          const p1 = validPts[i];
          const p2 = validPts[i + 1];
          const p3 = i < validPts.length - 2 ? validPts[i + 2] : p2;

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          pathD += ` C ${scaleX(cp1x)} ${scaleY(cp1y)}, ${scaleX(cp2x)} ${scaleY(cp2y)}, ${scaleX(p2.x)} ${scaleY(p2.y)}`;
        }
        svgContent += `<path d="${pathD}" fill="none" stroke="#ff76b7" stroke-width="2.5"/>`;

        calibSamples.forEach(sample => {
          const sx = parseFloat(sample.x), sy = parseFloat(sample.y);
          if (sample.mode === 'x' && sample.x !== '' && !isNaN(sx)) {
            let targetX = sx;
            if (targetX <= validPts[0].x) { sample.y = validPts[0].y; return; }
            if (targetX >= validPts[validPts.length - 1].x) { sample.y = validPts[validPts.length - 1].y; return; }
            for (let i = 0; i < validPts.length - 1; i++) {
              if (targetX >= validPts[i].x && targetX <= validPts[i+1].x) {
                const ratio = (targetX - validPts[i].x) / (validPts[i+1].x - validPts[i].x || 1);
                sample.y = validPts[i].y + ratio * (validPts[i+1].y - validPts[i].y);
                break;
              }
            }
          } else if (sample.mode === 'y' && sample.y !== '' && !isNaN(sy)) {
            let targetY = sy;
            for (let i = 0; i < validPts.length - 1; i++) {
              if ((targetY >= validPts[i].y && targetY <= validPts[i+1].y) || (targetY <= validPts[i].y && targetY >= validPts[i+1].y)) {
                const ratio = (targetY - validPts[i].y) / (validPts[i+1].y - validPts[i].y || 1);
                sample.x = validPts[i].x + ratio * (validPts[i+1].x - validPts[i].x);
                break;
              }
            }
          }
        });
      }

      validPts.forEach(p => {
        const cx = scaleX(p.x), cy = scaleY(p.y);
        svgContent += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#182034" stroke="#c7f34f" stroke-width="1.5"/>`;
      });

      calibSamples.forEach(sample => {
        if (!isNaN(sample.x) && !isNaN(sample.y) && sample.x !== '' && sample.y !== '') {
          const sx = scaleX(sample.x), sy = scaleY(sample.y);
          svgContent += `<circle cx="${sx}" cy="${sy}" r="5" fill="#ff76b7" stroke="#182034" stroke-width="1.5"/>`;
          svgContent += `<text x="${sx + 6}" y="${sy - 6}" font-size="9" font-weight="bold" fill="#182034">${sample.name}</text>`;
        }
      });

      svg.innerHTML = svgContent;
      updateCalibSampleValuesOnly();
    }


    document.querySelectorAll('.tool-tabs[data-group="calibration"] .tool-tab').forEach(tab => tab.addEventListener('click', renderCalibrationGraph));
    renderCalibrationPointsUI();
    function toggleLibrary(button){button.parentElement.classList.toggle('open')}
    const aminoGroups=[['Basic / positively charged','#c5b3ff',[['Histidine','H','His','155.16'],['Lysine','K','Lys','146.19'],['Arginine','R','Arg','174.20']]],['Acidic / negatively charged','#ff9eaa',[['Aspartic acid','D','Asp','133.10'],['Glutamic acid','E','Glu','147.13']]],['Polar uncharged','#d7f5a0',[['Serine','S','Ser','105.09'],['Threonine','T','Thr','119.12'],['Asparagine','N','Asn','132.12'],['Glutamine','Q','Gln','146.15'],['Cysteine','C','Cys','121.15'],['Tyrosine','Y','Tyr','181.19']]],['Hydrophobic / nonpolar','#ffc97c',[['Glycine','G','Gly','75.07'],['Alanine','A','Ala','89.09'],['Valine','V','Val','117.15'],['Leucine','L','Leu','131.18'],['Isoleucine','I','Ile','131.18'],['Methionine','M','Met','149.21'],['Phenylalanine','F','Phe','165.19'],['Tryptophan','W','Trp','204.23'],['Proline','P','Pro','115.13']]]];
    const aaRoot=document.querySelector('#amino-acids');aminoGroups.forEach(([title,color,items])=>{const section=document.createElement('div');section.className='aa-category';section.style.setProperty('--aa-color',color);section.innerHTML=`<button>${title}<span>${items.length} amino acids +</span></button><div class="aa-list"></div>`;section.querySelector('button').onclick=()=>section.classList.toggle('open');items.forEach(([name,one,three,mass])=>{const card=document.createElement('article');card.className='aa-card';card.innerHTML=`<b>${name}</b><div class="aa-codes"><span>${one}</span><span>${three}</span></div><div class="aa-mass">Molar mass: <b>${mass} g/mol</b></div>`;section.querySelector('.aa-list').append(card)});aaRoot.append(section)});

    // ---- Media / Buffers library subsections ----
    // Rendering logic lives in media-buffers.js (loaded as a separate script),
    // reading its data from media-buffers-data.js. This keeps the composition
    // data and its rendering out of the main app bundle, per request.
    if (typeof renderMediaBuffers === 'function') renderMediaBuffers();
    const codons={Phe:'UUU UUC',Leu:'UUA UUG CUU CUC CUA CUG',Ile:'AUU AUC AUA',Met:'AUG',Val:'GUU GUC GUA GUG',Ser:'UCU UCC UCA UCG AGU AGC',Pro:'CCU CCC CCA CCG',Thr:'ACU ACC ACA ACG',Ala:'GCU GCC GCA GCG',Tyr:'UAU UAC',Stop:'UAA UAG UGA',His:'CAU CAC',Gln:'CAA CAG',Asn:'AAU AAC',Lys:'AAA AAG',Asp:'GAU GAC',Glu:'GAA GAG',Cys:'UGU UGC',Trp:'UGG',Arg:'CGU CGC CGA CGG AGA AGG',Gly:'GGU GGC GGA GGG'};Object.entries(codons).forEach(([aa,list])=>list.split(' ').forEach(c=>{const x=document.createElement('div');x.className='codon '+(aa==='Stop'?'stop':'');x.innerHTML=`<b>${c}</b>${aa}`;document.querySelector('#codon-chart').append(x)}));
    const symbols=['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'];
    const periodRows=[['H','','','','','','','','','','','','','','','','','He'],['Li','Be','','','','','','','','','','','B','C','N','O','F','Ne'],['Na','Mg','','','','','','','','','','','Al','Si','P','S','Cl','Ar'],['K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr'],['Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe'],['Cs','Ba','','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn'],['Fr','Ra','','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og']];
    const colors={alkali:'#ffadad',alkaline:'#ffd59b',transition:'#bae3ff',post:'#d9ddff',metalloid:'#c9f3b4',nonmetal:'#fff1a7',halogen:'#ffb4dd',noble:'#cdb8ff',lanthanide:'#a7eee4',actinide:'#b2d5ff'};const named={alkali:'Alkali metals',alkaline:'Alkaline earth',transition:'Transition metals',post:'Post-transition',metalloid:'Metalloids',nonmetal:'Nonmetals',halogen:'Halogens',noble:'Noble gases',lanthanide:'Lanthanides',actinide:'Actinides'};
    const group=(s,n)=>{if([3,11,19,37,55,87].includes(n))return'alkali';if([4,12,20,38,56,88].includes(n))return'alkaline';if([9,17,35,53,85,117].includes(n))return'halogen';if([2,10,18,36,54,86,118].includes(n))return'noble';if(n>=57&&n<=71)return'lanthanide';if(n>=89&&n<=103)return'actinide';if(['B','Si','Ge','As','Sb','Te','Po'].includes(s))return'metalloid';if(['H','C','N','O','P','S','Se'].includes(s))return'nonmetal';if(['Al','Ga','In','Tl','Sn','Pb','Bi','Nh','Fl','Mc','Lv'].includes(s))return'post';return'transition'};
    Object.entries(named).forEach(([k,label])=>{const x=document.createElement('span');x.textContent=label;x.style.background=colors[k];document.querySelector('#periodic-legend').append(x)});
    function createElement(s,row,col){if(!s)return;const n=symbols.indexOf(s)+1,cat=group(s,n),b=document.createElement('button');b.className='element';b.style.setProperty('--element-color',colors[cat]);b.style.gridColumn=col;b.style.gridRow=row;b.innerHTML=`<small>${n}</small><b>${s}</b>`;b.onclick=()=>showElement({s,n,cat});document.querySelector('#periodic-table').append(b)}periodRows.forEach((row,r)=>row.forEach((s,c)=>createElement(s,r+1,c+1)));symbols.slice(56,71).forEach((s,i)=>createElement(s,8,i+4));symbols.slice(88,103).forEach((s,i)=>createElement(s,9,i+4));
    let periodicReference;async function showElement(e){const modal=document.querySelector('#element-modal');modal.classList.add('open');document.querySelector('#element-title').textContent=`${e.s} · atomic no. ${e.n}`;const info=document.querySelector('#element-info');info.innerHTML=`<dt>Category</dt><dd>${named[e.cat]}</dd><dt>Atomic mass</dt><dd>Loading reference data…</dd><dt>Electron config.</dt><dd>Loading reference data…</dd><dt>Melting point</dt><dd>Loading reference data…</dd><dt>Boiling point</dt><dd>Loading reference data…</dd>`;try{if(!periodicReference){const res=await fetch('https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json');periodicReference=(await res.json()).elements}const d=periodicReference.find(x=>x.number===e.n);info.innerHTML=`<dt>Category</dt><dd>${named[e.cat]}</dd><dt>Atomic mass</dt><dd>${d.atomic_mass ?? '—'}</dd><dt>Electron config.</dt><dd>${d.electron_configuration ?? '—'}</dd><dt>Melting point</dt><dd>${d.melt ?? '—'} K</dd><dt>Boiling point</dt><dd>${d.boil ?? '—'} K</dd>`}catch{info.innerHTML=`<dt>Category</dt><dd>${named[e.cat]}</dd><dt>Atomic mass</dt><dd>Reference lookup unavailable</dd><dt>Electron config.</dt><dd>Reference lookup unavailable</dd><dt>Melting point</dt><dd>Reference lookup unavailable</dd><dt>Boiling point</dt><dd>Reference lookup unavailable</dd>`}}
    function resetCells() {
    // 1. Zero out every count array for both modes and both viability states
    cellData.wbc.viable = [0, 0, 0, 0];
    cellData.wbc.nonviable = [0, 0, 0, 0];
    cellData.rbc.viable = [0, 0, 0, 0, 0];
    cellData.rbc.nonviable = [0, 0, 0, 0, 0];
    // 2. Update the UI text
    document.querySelector('#viable-count').textContent = '0';
    document.querySelector('#dead-count').textContent = '0';
    document.querySelector('#cell-result').innerHTML = 'Select a count mode and tap the chosen squares.';
    // 3. Visually clear both grids (badges reset regardless of which is on screen)
    renderCellGrid('wbc');
    renderCellGrid('rbc');
    }

    // 1. Live Date Initialization
    const dateEl = document.querySelector('.date');
    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('en-US', options).toUpperCase();
    }

  // ---- Home notes + tasks: real JS state (not just DOM), so it can sync to
  // Firebase the same way protocols do. ----
  let homeData = { notes: '', tasks: [] }; // tasks: [{ text, done }]
  let homeTaskSeq = 0;

  function renderHomeNotes() {
    const area = document.querySelector('#home-notes');
    if (document.activeElement !== area) area.value = homeData.notes;
  }
  function renderHomeTasks() {
    const list = document.querySelector('#task-list');
    list.innerHTML = '';
    homeData.tasks.forEach((task, i) => {
      const el = document.createElement('div');
      el.className = 'task' + (task.done ? ' done' : '');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'space-between';
      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <div class="check"></div>
          <span style="word-break: break-word;">${task.text}</span>
        </div>
        <button class="small-btn remove-task" style="background: #ffe2e2; margin-left: 8px;">−</button>
      `;
      el.querySelector('.check').onclick = () => { task.done = !task.done; renderHomeTasks(); homeDataChanged(); };
      el.querySelector('span').onclick = () => { task.done = !task.done; renderHomeTasks(); homeDataChanged(); };
      el.querySelector('.remove-task').onclick = () => { homeData.tasks.splice(i, 1); renderHomeTasks(); homeDataChanged(); };
      list.append(el);
    });
    updateTaskCount();
  }
  // Cloud sync bridge, mirroring window.onProtocolsChanged for protocols.
  // window.onHomeDataChanged is only defined once Firebase has loaded, and
  // no-ops while nobody is signed in, so this is always safe to call.
  function homeDataChanged() {
    if (typeof window.onHomeDataChanged === 'function') window.onHomeDataChanged(homeData);
  }
  // Lets the Firebase module replace local state with a signed-in user's
  // cloud copy (on sign-in), the same way window.replaceAllProtocols does.
  window.replaceHomeData = function (nextHomeData) {
    homeData = (nextHomeData && typeof nextHomeData === 'object')
      ? { notes: nextHomeData.notes || '', tasks: Array.isArray(nextHomeData.tasks) ? nextHomeData.tasks : [] }
      : { notes: '', tasks: [] };
    renderHomeNotes();
    renderHomeTasks();
  };
  window.getCurrentHomeData = function () { return homeData; };

  document.querySelector('#home-notes').addEventListener('input', (e) => {
    homeData.notes = e.target.value;
    homeDataChanged();
  });

  // Task Counting Logic
function updateTaskCount() {
  const tasks = homeData.tasks;
  const doneTasks = tasks.filter(t => t.done);
  const taskCountDisplay = document.querySelector('#task-count');

  if (tasks.length > 0) {
    taskCountDisplay.textContent = `${String(doneTasks.length).padStart(2, '0')} / ${String(tasks.length).padStart(2, '0')}`;
  } else {
    taskCountDisplay.textContent = '00 / 00';
  }
}

// Add New Task via Input
document.querySelector('#new-task-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.target.value.trim() !== '') {
    homeData.tasks.push({ id: 'ht' + (++homeTaskSeq), text: e.target.value.trim(), done: false });
    e.target.value = ''; // Clear input field
    renderHomeTasks();
    homeDataChanged();
  }
});

// Hide/Show task count based on active tab
document.querySelectorAll('[data-group="sidebar"] .tool-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const countDisplay = document.querySelector('#task-count');
    if (tab.dataset.toolView === 'side-tasks') {
      countDisplay.style.display = 'block';
      updateTaskCount();
    } else {
      countDisplay.style.display = 'none';
    }
  });
});

// Run once on load
renderHomeNotes();
renderHomeTasks();
