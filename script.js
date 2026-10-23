const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '✕' : '☰';
  });
  navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navMenu.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.textContent = '☰';
  }));
}

(() => {
  const $ = id => document.getElementById(id);
  const status = $('auth-status');
  const panel = $('auth-panel');
  const dashboard = $('study-dashboard');
  if (!status || !panel || !dashboard) return;
  const config = window.SUPABASE_CONFIG || {};
  const configured = config.url && config.anonKey && config.url.startsWith('https://') && !config.url.includes('COLE_AQUI') && !config.anonKey.includes('COLE_AQUI');
  // Estilos locais: cartões compactos e detalhes/anotações em balão flutuante.
  if(!document.getElementById('history-edit-polish')){
    const historyStyle=document.createElement('style');historyStyle.id='history-edit-polish';historyStyle.textContent=`
      #study-history .daily-history-item{min-width:0;overflow:hidden;overflow-wrap:anywhere;box-sizing:border-box}
      #study-history .daily-history-subjects{overflow-wrap:anywhere;line-height:1.4;margin:.35rem 0}
      #study-history .daily-history-meta{display:block;line-height:1.4;margin:.4rem 0;color:#6d4b93;font-weight:600}
      #study-history .history-day-sessions{margin-top:.5rem;border-top:1px solid #eadcf8;padding-top:.4rem;min-width:0}
      #study-history .history-day-sessions>summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;color:#6c3bb0;background:#f6efff;border:1px solid #e6d5fa;border-radius:999px;padding:.32rem .58rem;font-size:.73rem;font-weight:600;max-width:100%;box-sizing:border-box}
      #study-history .history-day-sessions>summary::-webkit-details-marker{display:none}
      #study-history .history-session-list{display:grid;gap:.4rem;margin-top:.5rem;min-width:0}
      #study-history .history-session-row{display:flex;flex-direction:column;align-items:stretch;gap:.35rem;padding:.45rem;background:rgba(255,255,255,.98);border:1px solid #eadcf8;border-radius:10px;box-sizing:border-box;min-width:0;max-width:100%}
      #study-history .history-session-detail{display:grid;gap:.15rem;min-width:0;max-width:100%;font-size:.7rem;line-height:1.35;color:#49345f}
      #study-history .history-session-subject{display:block;font-size:.72rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      #study-history .history-session-topic{display:block;color:#77658d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      #study-history .history-session-meta{display:block;color:#6d4b93;font-size:.66rem;line-height:1.35;overflow-wrap:anywhere}
      #study-history .history-session-actions{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap;min-width:0}
      #study-history .history-session-edit,#study-history .history-session-open{appearance:none;border:1px solid #d9c1f1;background:#f4eaff;color:#60359a;border-radius:8px;padding:.3rem .42rem;font-size:.68rem;font-weight:600;cursor:pointer;white-space:nowrap;line-height:1.2}
      #study-history .history-session-open{background:#fbf8ff;border-color:#e5d5f7}
      #study-history .history-session-edit:hover,#study-history .history-session-open:hover{background:#eaddfa}
      #study-history .history-session-edit:disabled{opacity:.55;cursor:wait}
      .history-notes-overlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(41,27,59,.28);backdrop-filter:blur(3px)}
      .history-notes-bubble{position:relative;width:min(100%,440px);max-height:min(78vh,620px);overflow:auto;padding:1.15rem 1.2rem 1.2rem;background:linear-gradient(145deg,#fff 0%,#fcf8ff 100%);border:1px solid #e6d4f6;border-radius:20px;box-shadow:0 20px 60px rgba(56,32,82,.25);color:#39264f;box-sizing:border-box}
      .history-notes-bubble-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.8rem;padding-bottom:.7rem;border-bottom:1px solid #eee3f8}
      .history-notes-bubble-head h3{font-family:inherit;font-size:1rem;line-height:1.35;margin:0;overflow-wrap:anywhere}
      .history-notes-bubble-close{flex:0 0 auto;border:0;background:#f1e5fc;color:#5c368b;border-radius:50%;width:32px;height:32px;font-size:1.15rem;cursor:pointer}
      .history-notes-label{margin:.85rem 0 .2rem;color:#826a99;font-size:.7rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
      .history-notes-value{margin:0;font-size:.88rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
      .history-notes-stats{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.75rem}
      .history-notes-stats span{padding:.25rem .5rem;border-radius:999px;background:#f1e8ff;color:#624286;font-size:.72rem;font-weight:700}
      .history-notes-text{margin:.35rem 0 0;padding:.75rem .85rem;border-left:4px solid #b896e6;border-radius:0 12px 12px 0;background:#f7f0ff;color:#59436d;font-size:.88rem;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
      .history-notes-text.empty{color:#897a96;font-style:italic;background:#fbf9fe}
      @media(max-width:500px){.history-notes-overlay{padding:.75rem}.history-notes-bubble{padding:1rem;border-radius:17px}}
    `;document.head.append(historyStyle);
  }
  function openSessionDetails(session, returnFocus){
    const overlay=document.createElement('div');overlay.className='history-notes-overlay';
    const bubble=document.createElement('section');bubble.className='history-notes-bubble';bubble.setAttribute('role','dialog');bubble.setAttribute('aria-modal','true');bubble.setAttribute('aria-label','Detalhes da sessão de estudo');
    const header=document.createElement('div');header.className='history-notes-bubble-head';
    const title=document.createElement('h3');title.textContent=session.subject||'Sessão de estudo';
    const close=document.createElement('button');close.type='button';close.className='history-notes-bubble-close';close.textContent='×';close.setAttribute('aria-label','Fechar detalhes');
    header.append(title,close);bubble.append(header);
    const addLabel=(txt)=>{const el=document.createElement('p');el.className='history-notes-label';el.textContent=txt;bubble.append(el);};
    const addValue=(txt)=>{const el=document.createElement('p');el.className='history-notes-value';el.textContent=txt;bubble.append(el);};
    addLabel('Tópico / assunto');addValue(String(session.topic||'Nenhum assunto informado'));
    addLabel('Tipo de atividade');addValue(String(session.activity_type||'Estudo / revisão'));
    const stats=document.createElement('div');stats.className='history-notes-stats';
    const dateLabel=session.studied_on?new Date(session.studied_on+'T12:00:00').toLocaleDateString('pt-BR'):'Data não informada';
    [`${Number(session.minutes)||0} min`,`${Number(session.questions)||0} questões`,`${Number(session.correct)||0} acertos`,dateLabel].forEach(t=>{const chip=document.createElement('span');chip.textContent=t;stats.append(chip);});
    bubble.append(stats);
    addLabel('Anotações da sessão');const note=document.createElement('div');note.className='history-notes-text';note.textContent=String(session.notes||'').trim()||'Nenhuma anotação foi registrada nesta sessão.';if(!String(session.notes||'').trim())note.classList.add('empty');bubble.append(note);
    overlay.append(bubble);document.body.append(overlay);
    const closeDialog=()=>{overlay.remove();document.removeEventListener('keydown',onKeyDown);if(returnFocus&&returnFocus.isConnected)returnFocus.focus();};
    const onKeyDown=(event)=>{if(event.key==='Escape')closeDialog();};
    close.addEventListener('click',closeDialog);overlay.addEventListener('click',event=>{if(event.target===overlay)closeDialog();});document.addEventListener('keydown',onKeyDown);close.focus();
  }
  let client = null, mode = 'login', currentUser = null, elapsed = 0, startedAt = null, ticker = null;
  const fmt = seconds => { const h=Math.floor(seconds/3600), m=Math.floor(seconds%3600/60), s=seconds%60; return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':'); };
  const message = (text, kind='info') => { status.textContent=text; status.className='auth-message '+kind; };
  const friendlyError = e => ({'Invalid login credentials':'E-mail ou senha incorretos.','Email not confirmed':'Confirme seu e-mail antes de entrar.','User already registered':'Este e-mail já possui cadastro.','Password should be at least 6 characters':'Use uma senha mais longa.'}[e?.message] || e?.message || 'Não foi possível concluir. Tente novamente.');
  const setMode = next => {
    mode=next;
    document.querySelectorAll('.auth-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    $('password-wrap').hidden=mode==='reset'; $('auth-password').required=mode!=='reset';
    $('auth-submit').textContent=({login:'Entrar ↗',signup:'Criar minha conta',reset:'Enviar link de recuperação'})[mode];
    message(({login:'Entre com seu e-mail e senha.',signup:'Crie uma conta com seu e-mail e uma senha de pelo menos 8 caracteres.',reset:'Enviaremos um link para redefinir sua senha.'})[mode]);
  };
  document.querySelectorAll('.auth-tab').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  const showDashboard = async user => { currentUser=user; panel.hidden=true; dashboard.hidden=false; $('signed-in-email').textContent=user.email||'Conta conectada'; await loadHistory(); await loadEditals(); };
  const showAuth = () => { currentUser=null; panel.hidden=false; dashboard.hidden=true; };
  async function loadHistory(){
    if(!client||!currentUser)return;
    const {data,error}=await client.from('study_sessions').select('id,subject,topic,activity_type,minutes,questions,correct,performance_reported,notes,studied_on,created_at').eq('user_id',currentUser.id).order('studied_on',{ascending:false}).order('created_at',{ascending:false});
    if(error){$('study-history').textContent='Não foi possível carregar o histórico: '+friendlyError(error);return;}
    const sessions=data||[];
    const {data:catalogData} = await client.from('study_subjects').select('name').eq('user_id',currentUser.id).order('name');
    const subjectList = [...new Set([...(catalogData||[]).map(x=>x.name), ...sessions.map(x => (x.subject || '').trim())].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const subjectSelect = $('study-subject');
    if(subjectSelect){
      const selectedSubject = subjectSelect.value;
      subjectSelect.replaceChildren();
      const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Selecione uma matéria';subjectSelect.append(placeholder);
      subjectList.forEach(subject=>{const option=document.createElement('option');option.value=subject;option.textContent=subject;subjectSelect.append(option);});
      const addOption=document.createElement('option');addOption.value='__add_subject__';addOption.textContent='＋ Adicionar nova matéria...';subjectSelect.append(addOption);
      if(subjectList.includes(selectedSubject))subjectSelect.value=selectedSubject;
    }
    const totalMinutes=sessions.reduce((sum,x)=>sum+(Number(x.minutes)||0),0);
    $('total-time').textContent=Math.floor(totalMinutes/60)+'h '+String(totalMinutes%60).padStart(2,'0')+'min';
    $('total-sessions').textContent=String(sessions.length);
    const measuredSessions=sessions.filter(x=>x.performance_reported!==false);
    const totalQuestions=measuredSessions.reduce((sum,x)=>sum+(Number(x.questions)||0),0);
    const totalCorrect=measuredSessions.reduce((sum,x)=>sum+(Number(x.correct)||0),0);
    $('total-questions').textContent=String(totalQuestions);
    $('chart-questions').textContent=totalQuestions.toLocaleString('pt-BR');
    const accuracy=totalQuestions ? Math.min(100,Math.round(totalCorrect/totalQuestions*100)) : 0;
    $('accuracy-rate').textContent=totalQuestions ? accuracy+'%' : '—%';
    $('accuracy-bar').style.width=accuracy+'%';
    const chart=$('weekly-chart'); chart.replaceChildren();
    const days=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const minutes=sessions.filter(x=>x.studied_on===key).reduce((sum,x)=>sum+(Number(x.minutes)||0),0);days.push({key,label:d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),minutes});}
    const maxMinutes=Math.max(60,...days.map(d=>d.minutes));
    days.forEach(d=>{const item=document.createElement('div');item.className='chart-day';const value=document.createElement('span');value.className='chart-value';value.textContent=d.minutes? (d.minutes>=60?Math.floor(d.minutes/60)+'h'+(d.minutes%60?String(d.minutes%60).padStart(2,'0'):''):d.minutes+'m'):'0';const track=document.createElement('div');track.className='chart-bar-track';const bar=document.createElement('div');bar.className='chart-bar';bar.style.height=Math.max(4,d.minutes/maxMinutes*100)+'%';track.append(bar);const label=document.createElement('small');label.textContent=d.label;item.append(value,track,label);chart.append(item);});
    const ranking=$('subject-ranking'); 
    if(ranking){
      ranking.replaceChildren();
      const totals=new Map();
      sessions.forEach(x=>{const subject=(x.subject||'Sem matéria').trim();totals.set(subject,(totals.get(subject)||0)+(Number(x.minutes)||0));});
      const sorted=[...totals.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
      if(!sorted.length){const p=document.createElement('p');p.className='chart-empty';p.textContent='Registre suas sessões para montar seu ranking.';ranking.append(p);}
      else{
        const max=sorted[0][1]||1;
        sorted.forEach(([subject,minutes],i)=>{
          const row=document.createElement('div');row.className='ranking-row';
          const head=document.createElement('div');head.className='ranking-row-head';
          const rank=document.createElement('span');rank.className='ranking-position';rank.textContent=String(i+1).padStart(2,'0');
          const name=document.createElement('strong');name.textContent=subject;
          const time=document.createElement('b');time.textContent=Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'min';
          head.append(rank,name,time);
          const track=document.createElement('div');track.className='ranking-track';
          const bar=document.createElement('span');bar.style.width=Math.max(3,minutes/max*100)+'%';track.append(bar);
          row.append(head,track);ranking.append(row);
        });
      }
    }
    const history=$('study-history'); history.replaceChildren();
    if(!sessions.length){const p=document.createElement('p');p.textContent='Ainda não há sessões registradas. Sua primeira sessão começa aqui!';history.append(p);return;}
    // Resumo diário: mostra apenas os últimos sete dias, as matérias e o tempo total.
    // Datas ISO do banco são interpretadas como datas locais, sem conversão de fuso horário.
    const localKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayMap = new Map();
    sessions.forEach(x=>{
      if(!x.studied_on) return;
      if(!dayMap.has(x.studied_on)) dayMap.set(x.studied_on,{subjects:new Set(),minutes:0,sessions:0});
      const day=dayMap.get(x.studied_on); day.subjects.add((x.subject||'Sem matéria').trim()); day.minutes+=Number(x.minutes)||0; day.sessions++;
    });
    const today=new Date(); today.setHours(12,0,0,0);
    for(let offset=6;offset>=0;offset--){
      const date=new Date(today); date.setDate(today.getDate()-offset);
      const key=localKey(date), day=dayMap.get(key);
      const card=document.createElement('article'); card.className='history-item daily-history-item';
      const heading=document.createElement('h4');
      const dateLabel=date.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
      heading.textContent=dateLabel.charAt(0).toLocaleUpperCase('pt-BR')+dateLabel.slice(1);
      const subjects=document.createElement('p'); subjects.className='daily-history-subjects';
      const minutes=document.createElement('small'); minutes.className='daily-history-meta';
      if(day){
        subjects.textContent=[...day.subjects].sort((a,b)=>a.localeCompare(b,'pt-BR')).join(' · ');
        minutes.textContent=`${Math.floor(day.minutes/60)}h ${String(day.minutes%60).padStart(2,'0')}min de estudo · ${day.sessions} ${day.sessions===1?'sessão':'sessões'}`;
      } else {
        subjects.textContent='Nenhum estudo registrado';
        minutes.textContent='0 min de estudo';
      }
      card.append(heading,subjects,minutes);
      // Resumo diário compacto; detalhes e anotações são exibidos em um balão flutuante.
      const daySessions=sessions.filter(x=>x.studied_on===key);
      if(daySessions.length){
        const details=document.createElement('details');details.className='history-day-sessions';
        const summary=document.createElement('summary');summary.textContent=`Ver/editar ${daySessions.length} ${daySessions.length===1?'sessão':'sessões'}`;
        const list=document.createElement('div');list.className='history-session-list';
        daySessions.forEach(session=>{
          const line=document.createElement('div');line.className='history-session-row';
          const detail=document.createElement('div');detail.className='history-session-detail';
          const subjectLine=document.createElement('strong');subjectLine.className='history-session-subject';subjectLine.textContent=session.subject||'Sem matéria';subjectLine.title=session.subject||'Sem matéria';
          const topicLine=document.createElement('span');topicLine.className='history-session-topic';topicLine.textContent=session.topic||'Sem tópico informado';topicLine.title=session.topic||'Sem tópico informado';
          const meta=document.createElement('span');meta.className='history-session-meta';meta.textContent=`${Number(session.minutes)||0} min · ${Number(session.questions)||0} questões · ${Number(session.correct)||0} acertos`;
          detail.append(subjectLine,topicLine,meta);
          const actions=document.createElement('div');actions.className='history-session-actions';
          const open=document.createElement('button');open.type='button';open.className='history-session-open';open.textContent='💬 Detalhes';open.setAttribute('aria-label','Ver tópico e anotações de '+(session.subject||'sessão'));open.addEventListener('click',()=>openSessionDetails(session,open));
          const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.className='history-session-edit';
          edit.addEventListener('click',async()=>{
            const subject=prompt('Matéria:',session.subject||'');if(subject===null)return;
            const topic=prompt('Assunto (ex.: DC ou DCIVIL):',session.topic||'');if(topic===null)return;
            const minutesText=prompt('Minutos estudados:',String(Number(session.minutes)||0));if(minutesText===null)return;
            const questionsText=prompt('Total de questões:',String(Number(session.questions)||0));if(questionsText===null)return;
            const correctText=prompt('Total de acertos:',String(Number(session.correct)||0));if(correctText===null)return;
            const notesText=prompt('Anotações desta sessão:',String(session.notes||''));if(notesText===null)return;
            const dateText=prompt('Data do estudo (AAAA-MM-DD):',session.studied_on||key);if(dateText===null)return;
            const mins=Number(minutesText),qs=Number(questionsText),hits=Number(correctText);
            if(!subject.trim()||!Number.isInteger(mins)||mins<0||!Number.isInteger(qs)||qs<0||!Number.isInteger(hits)||hits<0||hits>qs||!/^\d{4}-\d{2}-\d{2}$/.test(dateText)){
              alert('Confira os dados. Use números inteiros, acertos não podem superar questões e data no formato AAAA-MM-DD.');return;
            }
            const [yy,mm,dd]=dateText.split('-').map(Number);const checkDate=new Date(yy,mm-1,dd);
            if(checkDate.getFullYear()!==yy||checkDate.getMonth()!==mm-1||checkDate.getDate()!==dd){alert('Essa data não é válida.');return;}
            edit.disabled=true;
            const {error:updateError}=await client.from('study_sessions').update({subject:subject.trim(),topic:topic.trim()||null,minutes:mins,questions:qs,correct:hits,notes:notesText.trim()||null,studied_on:dateText,performance_reported:true}).eq('id',session.id).eq('user_id',currentUser.id);
            edit.disabled=false;
            if(updateError){message('Não foi possível editar a sessão: '+friendlyError(updateError),'error');return;}
            message('Sessão corrigida. Os totais serão recalculados.','success');await loadHistory();if(activeEditalId)await openEdital(activeEditalId);
          });
          actions.append(open,edit);line.append(detail,actions);list.append(line);
        });
        details.append(summary,list);card.append(details);
      }
      history.append(card);
    }
  }
  // Planejador de edital. A extração acontece localmente no navegador; apenas o texto revisado e os tópicos são enviados ao Supabase.
  let activeEditalId = null;
  let editalDraft = null;
  let editalTopics = [];
  let editalTopicMinutes = new Map();
  let editalTopicHistoryMatches = new Map();
  let editalTopicFilter = 'all';
  let editalTopicSearch = '';
  const statusLabels = {pending:'Não iniciado', studying:'Estudando', done:'Concluído', review:'Revisar'};
  const editalFeedback = (text, kind='info') => { const el=$('edital-extract-status'); if(el){el.textContent=text;el.className='edital-feedback '+kind;} };
  const safeText = (tag, className, text) => { const el=document.createElement(tag); if(className)el.className=className; el.textContent=text; return el; };
  function parseProgramText(raw){
    const cleaned=raw.split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(line=>line.length>2);
    const start=cleaned.findIndex(line=>/conte[uú]do program[aá]tico|conhecimentos (gerais|b[aá]sicos|espec[ií]ficos)|programa de (provas|estudos)|objeto de avalia[cç][aã]o/i.test(line));
    const lines=(start>=0?cleaned.slice(start+1):cleaned).slice(0,5000);
    const out=[]; let subject='Conteúdo programático';
    const seen=new Set();
    for(let line of lines){
      line=line.replace(/^([•●▪◦\-–—]+\s*)/,'').trim();
      if(!line||/^\d{1,4}$/.test(line)||/^(p[aá]gina|www\.|https?:\/\/|edital n[ºo])/i.test(line))continue;
      line=line.replace(/^\(?\d+(?:\.\d+)*[.)]?\s+/, '').trim();
      if(!line||line.length<3)continue;
      const letters=line.replace(/[^A-Za-zÀ-ÿ]/g,'');
      const upper=letters.length>3 && letters===letters.toLocaleUpperCase('pt-BR');
      const looksHeading=upper && line.length<130 && !/[.;:]$/.test(line);
      if(looksHeading){subject=line.replace(/\s*[:\-–—]+$/,'').trim();continue;}
      // Ignora linhas de rodapé muito curtas e evita duplicatas exatas.
      if(line.length>500)line=line.slice(0,500);
      const key=(subject+'|'+line).toLocaleLowerCase('pt-BR');
      if(seen.has(key))continue; seen.add(key);
      out.push(subject+' | '+line);
      if(out.length>=1500)break;
    }
    return out;
  }
  let editalPdfBase64 = null;
  let editalAiJobs = [];
  function fileToBase64(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{const value=String(reader.result||'');const comma=value.indexOf(',');resolve(comma>=0?value.slice(comma+1):value);};
      reader.onerror=()=>reject(new Error('Não foi possível ler o arquivo PDF.'));
      reader.readAsDataURL(file);
    });
  }
  function friendlyEditalAIError(error){
    const raw=String(error?.message||error||'');
    if(/high demand|overload|temporarily unavailable|503|429|resource exhausted|capacity/i.test(raw))return 'O servidor de IA está sobrecarregado neste momento. Aguarde alguns minutos e tente novamente. Seu edital e seus dados continuam seguros.';
    if(/model.*not available|model not found|gemini-2\.5-flash/i.test(raw))return 'O modelo de IA está temporariamente indisponível. Avise o suporte ou tente novamente mais tarde.';
    return raw||'Não foi possível concluir a análise. Tente novamente em alguns minutos.';
  }
  async function callEditalAI(action, selectedJob){
    if(!client||!currentUser)throw new Error('Entre na sua conta antes de analisar um edital.');
    if(!editalPdfBase64)throw new Error('Selecione um PDF primeiro.');
    const body={action,pdfBase64:editalPdfBase64,mimeType:'application/pdf',fileName:editalDraft?.filename||'edital.pdf'};
    if(selectedJob)body.selectedJob=selectedJob;
    const {data,error}=await client.functions.invoke('analisar-edital',{body});
    if(error){let detail='';try{detail=error.context?.body?.detalhe||error.context?.body?.error||'';}catch{};throw new Error(friendlyEditalAIError(detail||error.message||'Não foi possível chamar a função de análise.'));}
    if(!data?.ok||!data?.result)throw new Error(data?.error||'A IA não retornou uma análise válida.');
    return data.result;
  }
  $('edital-pdf')?.addEventListener('change', async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    $('pdf-file-name').textContent=file.name;
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){editalFeedback('Selecione um arquivo PDF válido.','error');return;}
    if(file.size>12*1024*1024){editalFeedback('O PDF ultrapassa aproximadamente 12 MB. Envie uma versão menor.','error');return;}
    if(!client||!currentUser){editalFeedback('Entre na sua conta antes de analisar um edital.','error');return;}
    const fileInput=$('edital-pdf'); if(fileInput)fileInput.disabled=true;
    $('edital-ai-job-wrap').hidden=true;$('edital-review-wrap').hidden=true;
    try{
      editalFeedback('Preparando o PDF para análise segura…');
      editalPdfBase64=await fileToBase64(file);
      editalDraft={filename:file.name,text:''};
      editalFeedback('A IA está identificando o concurso, a banca e os cargos. Isso pode levar um pouco…');
      const result=await callEditalAI('identify');
      if(result.concurso)$('edital-name').value=String(result.concurso).slice(0,160);
      else if(!$('edital-name').value.trim())$('edital-name').value=file.name.replace(/\.pdf$/i,'');
      if(result.banca)$('edital-board').value=String(result.banca).slice(0,120);
      const jobs=Array.isArray(result.cargos)?result.cargos.filter(j=>j&&typeof j.nome==='string'&&j.nome.trim()):[];
      editalAiJobs=jobs;
      const jobSelect=$('edital-ai-job');jobSelect.replaceChildren();
      jobs.forEach(job=>{const opt=document.createElement('option');opt.value=job.nome;opt.textContent=job.nome+(job.descricao?' — '+job.descricao:'');jobSelect.append(opt);});
      if(jobs.length){
        $('edital-ai-job-wrap').hidden=false;
        if(jobs.length===1){$('edital-role').value=jobs[0].nome;editalFeedback('Concurso identificado. Foi encontrado um cargo: '+jobs[0].nome+'. Clique em “Gerar matérias e tópicos” para continuar.','success');}
        else editalFeedback(`Concurso identificado: ${result.concurso||'nome não confirmado'}. Foram encontrados ${jobs.length} cargos. Escolha o cargo antes de gerar o conteúdo programático.`, 'success');
      }else{
        $('edital-ai-job-wrap').hidden=true;
        editalFeedback('A IA não conseguiu identificar cargos com segurança. Confira o PDF ou tente um arquivo mais legível. Observações: '+(result.observacoes||[]).join(' '),'error');
      }
    }catch(err){console.error(err);editalFeedback('Falha ao analisar o edital: '+friendlyEditalAIError(err),'error');}
    finally{if(fileInput)fileInput.disabled=false;}
  });
  $('edital-ai-generate')?.addEventListener('click',async()=>{
    const selectedJob=$('edital-ai-job')?.value;
    if(!selectedJob)return editalFeedback('Escolha um cargo para continuar.','error');
    const btn=$('edital-ai-generate');btn.disabled=true;
    try{
      $('edital-role').value=selectedJob;
      editalFeedback('Extraindo somente as matérias e os tópicos do cargo '+selectedJob+'…');
      const result=await callEditalAI('generate_plan',selectedJob);
      const subjects=Array.isArray(result.materias)?result.materias:[];
      const rows=[];
      subjects.forEach(subject=>{
        const name=String(subject?.nome||'').trim();
        (Array.isArray(subject?.topicos)?subject.topicos:[]).forEach(topic=>{
          const topicName=String(topic?.nome||'').trim();
          const detail=String(topic?.detalhe||'').trim();
          if(name&&topicName)rows.push(name+' | '+topicName+(detail?' — '+detail:''));
        });
      });
      if(!rows.length)throw new Error('A IA não encontrou tópicos estruturados para esse cargo. Tente outro PDF ou use a revisão manual.');
      if(rows.length>1500)throw new Error('A IA encontrou mais de 1.500 tópicos. Reduza o edital ou revise a lista antes de salvar.');
      $('edital-topic-text').value=rows.join('\n');
      $('edital-review-wrap').hidden=false;
      const notes=Array.isArray(result.observacoes)&&result.observacoes.length?' Observações: '+result.observacoes.join(' '):'';
      editalFeedback(`Plano gerado para ${selectedJob}: ${subjects.length} matérias e ${rows.length} tópicos. Revise a lista e salve quando estiver correta.${notes}`,'success');
      $('edital-review-wrap').scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){console.error(err);editalFeedback('Não foi possível gerar o plano: '+friendlyEditalAIError(err),'error');}
    finally{btn.disabled=false;}
  });
    $('cancel-edital-review')?.addEventListener('click',()=>{$('edital-review-wrap').hidden=true;editalDraft=null;});
  $('save-edital')?.addEventListener('click',async()=>{
    if(!client||!currentUser)return editalFeedback('Entre na conta para salvar um edital.','error');
    const title=$('edital-name').value.trim();
    const rows=$('edital-topic-text').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!title)return editalFeedback('Informe o nome do concurso.','error');
    const parsed=[];
    for(const row of rows){const pos=row.indexOf('|');if(pos<1||pos===row.length-1){return editalFeedback('Revise esta linha: '+row+' — use o formato Disciplina | tópico.','error');}const subject=row.slice(0,pos).trim(),topic=row.slice(pos+1).trim();if(subject&&topic)parsed.push({subject:subject.slice(0,160),topic:topic.slice(0,500)});}
    if(!parsed.length)return editalFeedback('Adicione pelo menos um tópico no formato Disciplina | tópico.','error');
    if(parsed.length>1500)return editalFeedback('O limite por importação é de 1.500 tópicos.','error');
    const btn=$('save-edital');btn.disabled=true;
    try{
      const {data:edital,error}=await client.from('study_editals').insert({user_id:currentUser.id,title,role:$('edital-role').value.trim()||null,exam_board:$('edital-board').value.trim()||null,source_filename:editalDraft?.filename||null,extracted_text:editalDraft?.text||null}).select('id').single();
      if(error)throw error;
      const topicRows=parsed.map((x,i)=>({user_id:currentUser.id,edital_id:edital.id,subject:x.subject,topic:x.topic,sort_order:i}));
      for(let i=0;i<topicRows.length;i+=250){const {error:topicError}=await client.from('study_edital_topics').insert(topicRows.slice(i,i+250));if(topicError){await client.from('study_editals').delete().eq('id',edital.id).eq('user_id',currentUser.id);throw topicError;}}
      editalDraft=null;$('edital-review-wrap').hidden=true;$('edital-pdf').value='';$('pdf-file-name').textContent='Nenhum arquivo selecionado';$('edital-name').value='';$('edital-role').value='';$('edital-board').value='';
      editalFeedback(`Edital salvo com ${parsed.length} tópicos. Confira a lista e corrija qualquer item que a extração não tenha identificado corretamente.`, 'success');
      await loadEditals();await openEdital(edital.id);
    }catch(err){console.error(err);editalFeedback('Não foi possível salvar o edital. Execute o arquivo supabase-edital-schema.sql no SQL Editor do Supabase e tente novamente. '+friendlyError(err),'error');}
    finally{btn.disabled=false;}
  });
  async function loadEditals(){
    if(!client||!currentUser)return;
    const box=$('saved-editals');box.replaceChildren();
    const {data,error}=await client.from('study_editals').select('id,title,role,exam_board,created_at').eq('user_id',currentUser.id).order('created_at',{ascending:false});
    if(error){box.append(safeText('p','chart-empty','Para ativar editais, execute supabase-edital-schema.sql no Supabase. '+friendlyError(error)));return;}
    if(!data?.length){box.append(safeText('p','chart-empty','Nenhum edital salvo ainda. Importe o primeiro PDF acima.'));return;}
    data.forEach(ed=>{
      const row=document.createElement('div');row.className='saved-edital-item'+(ed.id===activeEditalId?' active':'');
      const open=document.createElement('button');open.type='button';open.className='saved-edital-open';open.append(safeText('strong','',ed.title),safeText('small','',[ed.role,ed.exam_board].filter(Boolean).join(' · ')||'Concurso'));
      open.addEventListener('click',()=>openEdital(ed.id));
      const del=document.createElement('button');del.type='button';del.className='saved-edital-delete';del.textContent='Excluir';del.setAttribute('aria-label','Excluir edital '+ed.title);del.addEventListener('click',async()=>{if(!confirm(`Excluir o edital “${ed.title}” e seu checklist? As sessões de estudo existentes serão mantidas.`))return;const {error}=await client.from('study_editals').delete().eq('id',ed.id).eq('user_id',currentUser.id);if(error){editalFeedback('Não foi possível excluir: '+friendlyError(error),'error');return;}if(activeEditalId===ed.id){activeEditalId=null;$('edital-topics-panel').hidden=true;refreshTopicSelector([]);}await loadEditals();});
      row.append(open,del);box.append(row);
    });
  }
  function refreshTopicSelector(topics){
    const select=$('study-topic-select');if(!select)return;select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Estudo livre — sem edital';select.append(blank);
    topics.filter(t=>t.status!=='done').forEach(t=>{const opt=document.createElement('option');opt.value=t.id;opt.textContent=`${t.subject} — ${t.topic}`;opt.dataset.subject=t.subject;opt.dataset.topic=t.topic;select.append(opt);});
  }
  $('study-subject')?.addEventListener('change',async()=>{
    const select=$('study-subject');
    if(select.value==='__add_subject__'){
      const name=prompt('Digite o nome da nova matéria:');
      const clean=(name||'').trim().slice(0,100);
      if(!clean){select.value='';return;}
      const existing=[...select.options].find(o=>o.value.toLocaleLowerCase('pt-BR')===clean.toLocaleLowerCase('pt-BR'));
      if(existing){select.value=existing.value;return;}
      const option=document.createElement('option');option.value=clean;option.textContent=clean;
      const add=select.querySelector('option[value="__add_subject__"]');select.insertBefore(option,add||null);select.value=clean;
    }
  });
  $('study-topic-select')?.addEventListener('change',()=>{const opt=$('study-topic-select').selectedOptions[0];if(opt?.value){const subjectSelect=$('study-subject');const name=opt.dataset.subject||'';if(name&&!Array.from(subjectSelect.options).some(o=>o.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name;subjectSelect.insertBefore(option,subjectSelect.querySelector('option[value="__add_subject__"]')||null);}subjectSelect.value=name;$('study-topic').value=opt.dataset.topic||'';}});
  function normalizeForMatch(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  }
  function topicOverlap(a,b){
    const stop=new Set(['de','da','do','das','dos','e','a','o','as','os','em','no','na','nos','nas','por','para','com','sem','sobre','geral','direito','direitos']);
    const aa=new Set(normalizeForMatch(a).split(' ').filter(w=>w.length>2&&!stop.has(w)));
    const bb=new Set(normalizeForMatch(b).split(' ').filter(w=>w.length>2&&!stop.has(w)));
    if(!aa.size||!bb.size)return 0;
    let common=0;aa.forEach(w=>{if(bb.has(w))common++;});
    return common/Math.max(aa.size,bb.size);
  }
  async function openEdital(id){
    const {data:ed,error}=await client.from('study_editals').select('id,title').eq('id',id).eq('user_id',currentUser.id).single();
    if(error){editalFeedback('Não foi possível abrir o edital: '+friendlyError(error),'error');return;}
    const {data:topics,error:topicError}=await client.from('study_edital_topics').select('id,edital_id,subject,topic,status,notes,sort_order,last_reviewed_at').eq('edital_id',id).eq('user_id',currentUser.id).order('sort_order',{ascending:true});
    if(topicError){editalFeedback('Não foi possível carregar os tópicos: '+friendlyError(topicError),'error');return;}
    activeEditalId=id;editalTopics=topics||[];editalTopicMinutes=new Map();editalTopicHistoryMatches=new Map();
    if(editalTopics.length){
      const ids=editalTopics.map(t=>t.id);
      const {data:linkedSessions}=await client.from('study_sessions').select('edital_topic_id,subject,topic,minutes,studied_on').eq('user_id',currentUser.id).in('edital_topic_id',ids);
      (linkedSessions||[]).forEach(x=>editalTopicMinutes.set(x.edital_topic_id,(editalTopicMinutes.get(x.edital_topic_id)||0)+(Number(x.minutes)||0)));
      // Compare older, unlinked study records conservatively. Matches are suggestions only and never change checklist status.
      const {data:historySessions}=await client.from('study_sessions').select('subject,topic,minutes,studied_on,edital_topic_id').eq('user_id',currentUser.id).is('edital_topic_id',null).order('studied_on',{ascending:false}).limit(1500);
      const history=historySessions||[];
      editalTopics.forEach(t=>{
        const candidates=history.filter(s=>normalizeForMatch(s.subject)===normalizeForMatch(t.subject)&&String(s.topic||'').trim().length>2)
          .map(s=>({...s,score:topicOverlap(s.topic,t.topic)})).filter(s=>s.score>=0.55).sort((a,b)=>b.score-a.score);
        if(candidates.length)editalTopicHistoryMatches.set(t.id,candidates.slice(0,5));
      });
    }
    $('edital-topics-panel').hidden=false;$('active-edital-title').textContent=ed.title;
    const search=$('edital-topic-search');if(search)search.value='';editalTopicSearch='';editalTopicFilter='all';const filter=$('edital-topic-filter');if(filter)filter.value='all';
    renderEditalTopics();refreshTopicSelector(editalTopics);await loadEditals();
  }
  $('edital-topic-search')?.addEventListener('input',e=>{editalTopicSearch=normalizeForMatch(e.target.value);renderEditalTopics();});
  $('edital-topic-filter')?.addEventListener('change',e=>{editalTopicFilter=e.target.value;renderEditalTopics();});
  function renderEditalTopics(){
    const list=$('edital-topic-list');if(!list)return;list.replaceChildren();
    const done=editalTopics.filter(t=>t.status==='done').length;
    const studying=editalTopics.filter(t=>t.status==='studying').length;
    const pending=editalTopics.filter(t=>t.status==='pending'||t.status==='review').length;
    const pct=editalTopics.length?Math.round(done/editalTopics.length*100):0;
    $('edital-progress-label').textContent=pct+'%';$('edital-progress-bar').style.width=pct+'%';
    if($('edital-done-count'))$('edital-done-count').textContent=String(done);
    if($('edital-studying-count'))$('edital-studying-count').textContent=String(studying);
    if($('edital-pending-count'))$('edital-pending-count').textContent=String(pending);
    if(!editalTopics.length){list.append(safeText('p','edital-empty-filter','Este edital ainda não tem tópicos.'));return;}
    const filtered=editalTopics.filter(t=>{
      const haystack=normalizeForMatch(t.subject+' '+t.topic);
      if(editalTopicSearch&&!haystack.includes(editalTopicSearch))return false;
      if(editalTopicFilter==='history'&&!editalTopicHistoryMatches.has(t.id)&&!editalTopicMinutes.get(t.id))return false;
      if(['pending','studying','review','done'].includes(editalTopicFilter)&&t.status!==editalTopicFilter)return false;
      return true;
    });
    if(!filtered.length){list.append(safeText('p','edital-empty-filter','Nenhum tópico corresponde à busca ou ao filtro selecionado.'));return;}
    const groups=new Map();filtered.forEach(t=>{if(!groups.has(t.subject))groups.set(t.subject,[]);groups.get(t.subject).push(t);});
    for(const [subject,topics] of groups){
      const allInSubject=editalTopics.filter(t=>t.subject===subject);const subjectDone=allInSubject.filter(t=>t.status==='done').length;const subjectPct=allInSubject.length?Math.round(subjectDone/allInSubject.length*100):0;
      const group=document.createElement('section');group.className='edital-subject-group';
      const head=document.createElement('button');head.type='button';head.className='edital-subject-heading';head.setAttribute('aria-expanded','true');
      const main=document.createElement('div');main.className='subject-heading-main';main.append(safeText('h5','',subject));
      const track=document.createElement('div');track.className='edital-subject-progress-track';const fill=document.createElement('span');fill.style.width=subjectPct+'%';track.append(fill);main.append(track);
      const count=safeText('span','topic-count',`${subjectDone}/${allInSubject.length} concluídos`);const chevron=safeText('span','edital-subject-chevron','⌄');chevron.setAttribute('aria-hidden','true');head.append(main,count,chevron);
      const body=document.createElement('div');body.className='edital-subject-body';head.addEventListener('click',()=>{const collapsed=group.classList.toggle('is-collapsed');body.hidden=collapsed;head.setAttribute('aria-expanded',String(!collapsed));});group.append(head,body);
      topics.forEach(t=>{
        const row=document.createElement('div');row.className='edital-topic-row';
        const nameWrap=document.createElement('div');nameWrap.className='edital-topic-name-wrap';
        nameWrap.append(safeText('div','edital-topic-name',t.topic));
        const mins=editalTopicMinutes.get(t.id)||0;
        nameWrap.append(safeText('small','edital-topic-time',mins?`Tempo registrado neste tópico: ${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}min`:'Ainda sem tempo vinculado a este tópico'));
        const matches=editalTopicHistoryMatches.get(t.id)||[];
        if(matches.length){
          const matchMinutes=matches.reduce((sum,s)=>sum+(Number(s.minutes)||0),0);
          const badge=safeText('span','edital-history-match possible',`◷ Possível relação com ${matches.length} ${matches.length===1?'registro antigo':'registros antigos'} · ${matchMinutes} min`);
          badge.title='Sugestão por semelhança entre matéria e assunto registrado. Confira antes de atualizar o status.';nameWrap.append(badge);
        } else if(mins){nameWrap.append(safeText('span','edital-history-match','✓ Há sessões vinculadas a este tópico'));}
        const select=document.createElement('select');select.className='edital-topic-status status-'+t.status;select.setAttribute('aria-label','Status: '+t.topic);
        Object.entries(statusLabels).forEach(([value,label])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt);});select.value=t.status;
        select.addEventListener('change',async()=>{
          const previous=t.status;select.disabled=true;const patch={status:select.value,last_reviewed_at:select.value==='review'?new Date().toISOString():t.last_reviewed_at};
          const {error}=await client.from('study_edital_topics').update(patch).eq('id',t.id).eq('user_id',currentUser.id);select.disabled=false;
          if(error){select.value=previous;editalFeedback('Não foi possível atualizar o tópico: '+friendlyError(error),'error');return;}
          t.status=patch.status;t.last_reviewed_at=patch.last_reviewed_at;select.className='edital-topic-status status-'+t.status;renderEditalTopics();refreshTopicSelector(editalTopics);
        });
        row.append(nameWrap,select);body.append(row);
      });
      list.append(group);
    }
  }
  $('reload-editals')?.addEventListener('click',loadEditals);

  $('auth-form').addEventListener('submit',async e=>{
    e.preventDefault(); if(!client){message('Antes de usar o login, configure a URL e a chave pública no arquivo supabase-config.js e execute supabase-schema.sql no Supabase.','error');return;}
    const email=$('auth-email').value.trim(), password=$('auth-password').value;
    $('auth-submit').disabled=true;
    try{
      if(mode==='login'){const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;await showDashboard(data.user);message('Login realizado com sucesso.','success');}
      else if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname+'#estudos'}});if(error)throw error;if(data.session)await showDashboard(data.user);else message('Cadastro iniciado! Confira seu e-mail para confirmar a conta antes de entrar.','success');}
      else {const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+'#estudos'});if(error)throw error;message('Se o e-mail estiver cadastrado, você receberá um link de recuperação. Confira também o spam.','success');}
    }catch(err){message(friendlyError(err),'error');}finally{$('auth-submit').disabled=false;}
  });
  $('logout-button').addEventListener('click',async()=>{if(client)await client.auth.signOut();showAuth();message('Você saiu da sua conta.');});
  $('refresh-history').addEventListener('click',loadHistory);
  $('session-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client||!currentUser)return message('Entre na sua conta para salvar uma sessão.','error');
    const timerMinutes=Math.floor(elapsed/60);const manual=Number($('study-minutes').value)||0;const minutes=manual||timerMinutes;
    const questions=Number($('study-questions').value)||0,correct=Number($('study-correct').value)||0;
    if(minutes<1)return message('Use o cronômetro ou informe pelo menos 1 minuto de estudo.','error');
    if(correct>questions)return message('O número de acertos não pode ser maior que o de questões resolvidas.','error');
    const btn=e.submitter;btn.disabled=true;
    const linkedTopic=$('study-topic-select')?.value||null;const subject=$('study-subject').value.trim();
    const {error:subjectError}=await client.from('study_subjects').upsert({user_id:currentUser.id,name:subject},{onConflict:'user_id,name',ignoreDuplicates:true});
    if(subjectError){btn.disabled=false;message('Não foi possível atualizar o cadastro de matérias. '+friendlyError(subjectError),'error');return;}
    const payload={user_id:currentUser.id,subject,topic:$('study-topic').value.trim()||null,activity_type:$('study-activity-type').value||'Estudo / revisão',minutes,questions,correct,performance_reported:true,notes:$('study-notes').value.trim()||null,studied_on:(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})(),...(linkedTopic?{edital_topic_id:linkedTopic}:{})};
    const {error}=await client.from('study_sessions').insert(payload);
    btn.disabled=false;
    if(error){message('Não foi possível salvar. Verifique se executou supabase-schema.sql. '+friendlyError(error),'error');return;}
    if(linkedTopic){await client.from('study_edital_topics').update({status:'studying'}).eq('id',linkedTopic).eq('user_id',currentUser.id).eq('status','pending');if(activeEditalId)await openEdital(activeEditalId);}
    $('session-form').reset();$('study-topic-select').value='';$('study-activity-type').value='Estudo / revisão';$('study-questions').value='0';$('study-correct').value='0';stopTimer(true);message('Sessão salva com segurança!','success');await loadHistory();
  });
  function paintTimer(){$('timer-display').textContent=fmt(elapsed+(startedAt?Math.floor((Date.now()-startedAt)/1000):0));}
  function startTimer(){if(startedAt)return;startedAt=Date.now();ticker=setInterval(paintTimer,1000);$('timer-start').disabled=true;$('timer-pause').disabled=false;}
  function pauseTimer(){if(!startedAt)return;elapsed+=Math.floor((Date.now()-startedAt)/1000);startedAt=null;clearInterval(ticker);ticker=null;paintTimer();$('timer-start').disabled=false;$('timer-pause').disabled=true;}
  function stopTimer(reset=false){pauseTimer();if(reset)elapsed=0;paintTimer();$('timer-start').disabled=false;$('timer-pause').disabled=true;}
  $('timer-start').addEventListener('click',startTimer);$('timer-pause').addEventListener('click',pauseTimer);$('timer-reset').addEventListener('click',()=>stopTimer(true));
  if(!configured){message('A interface está pronta, mas o login ainda precisa das credenciais públicas do seu projeto Supabase. Siga o README; não compartilhe senhas nem chaves secretas.','warning');}
  else if(!window.supabase){message('Não foi possível carregar a biblioteca de autenticação. Confira sua conexão e recarregue a página.','error');}
  else {client=window.supabase.createClient(config.url,config.anonKey);client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){showAuth();setMode('reset');message('Abra o link de recuperação recebido por e-mail para redefinir a senha.');}else if(session?.user&&!currentUser){showDashboard(session.user);}else if(!session&&currentUser){showAuth();}});client.auth.getSession().then(({data})=>{if(data.session?.user)showDashboard(data.session.user);});}
})();
