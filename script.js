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
    const {data,error}=await client.from('study_sessions').select('id,subject,topic,minutes,questions,correct,notes,studied_on,created_at').eq('user_id',currentUser.id).order('studied_on',{ascending:false}).order('created_at',{ascending:false}).limit(50);
    if(error){$('study-history').textContent='Não foi possível carregar o histórico: '+friendlyError(error);return;}
    const sessions=data||[];
    const totalMinutes=sessions.reduce((sum,x)=>sum+(Number(x.minutes)||0),0);
    $('total-time').textContent=Math.floor(totalMinutes/60)+'h '+String(totalMinutes%60).padStart(2,'0')+'min';
    $('total-sessions').textContent=String(sessions.length);
    const totalQuestions=sessions.reduce((sum,x)=>sum+(Number(x.questions)||0),0);
    const totalCorrect=sessions.reduce((sum,x)=>sum+(Number(x.correct)||0),0);
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
    sessions.forEach(x=>{const card=document.createElement('article');card.className='history-item';const h=document.createElement('h4');h.textContent=x.subject;const date=document.createElement('small');date.textContent=new Date(x.studied_on+'T12:00:00').toLocaleDateString('pt-BR');const details=document.createElement('p');details.textContent=`${x.minutes} min · ${x.questions||0} questões · ${x.correct||0} acertos${x.topic?' · '+x.topic:''}`;card.append(h,date,details);if(x.notes){const n=document.createElement('p');n.textContent=x.notes;card.append(n);}history.append(card);});
  }
  // Planejador de edital. A extração acontece localmente no navegador; apenas o texto revisado e os tópicos são enviados ao Supabase.
  let activeEditalId = null;
  let editalDraft = null;
  let editalTopics = [];
  let editalTopicMinutes = new Map();
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
  async function callEditalAI(action, selectedJob){
    if(!client||!currentUser)throw new Error('Entre na sua conta antes de analisar um edital.');
    if(!editalPdfBase64)throw new Error('Selecione um PDF primeiro.');
    const body={action,pdfBase64:editalPdfBase64,mimeType:'application/pdf',fileName:editalDraft?.filename||'edital.pdf'};
    if(selectedJob)body.selectedJob=selectedJob;
    const {data,error}=await client.functions.invoke('analisar-edital',{body});
    if(error)throw new Error(error.message||'Não foi possível chamar a função de análise.');
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
    }catch(err){console.error(err);editalFeedback('Falha ao analisar o edital: '+(err.message||'erro inesperado')+'. Confira se a função está publicada e se GEMINI_API_KEY está configurada.','error');}
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
    }catch(err){console.error(err);editalFeedback('Não foi possível gerar o plano: '+(err.message||'erro inesperado'),'error');}
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
  $('study-topic-select')?.addEventListener('change',()=>{const opt=$('study-topic-select').selectedOptions[0];if(opt?.value){$('study-subject').value=opt.dataset.subject||'';$('study-topic').value=opt.dataset.topic||'';}});
  async function openEdital(id){
    const {data:ed,error}=await client.from('study_editals').select('id,title').eq('id',id).eq('user_id',currentUser.id).single();
    if(error){editalFeedback('Não foi possível abrir o edital: '+friendlyError(error),'error');return;}
    const {data:topics,error:topicError}=await client.from('study_edital_topics').select('id,edital_id,subject,topic,status,notes,sort_order,last_reviewed_at').eq('edital_id',id).eq('user_id',currentUser.id).order('sort_order',{ascending:true});
    if(topicError){editalFeedback('Não foi possível carregar os tópicos: '+friendlyError(topicError),'error');return;}
    activeEditalId=id;editalTopics=topics||[];editalTopicMinutes=new Map();if(editalTopics.length){const ids=editalTopics.map(t=>t.id);const {data:sessions}=await client.from('study_sessions').select('edital_topic_id,minutes').eq('user_id',currentUser.id).in('edital_topic_id',ids);(sessions||[]).forEach(x=>editalTopicMinutes.set(x.edital_topic_id,(editalTopicMinutes.get(x.edital_topic_id)||0)+(Number(x.minutes)||0)));}$('edital-topics-panel').hidden=false;$('active-edital-title').textContent=ed.title;renderEditalTopics();refreshTopicSelector(editalTopics);await loadEditals();
  }
  function renderEditalTopics(){
    const list=$('edital-topic-list');list.replaceChildren();const done=editalTopics.filter(t=>t.status==='done').length;const pct=editalTopics.length?Math.round(done/editalTopics.length*100):0;$('edital-progress-label').textContent=pct+'%';$('edital-progress-bar').style.width=pct+'%';
    if(!editalTopics.length){list.append(safeText('p','chart-empty','Este edital ainda não tem tópicos.'));return;}
    const groups=new Map();editalTopics.forEach(t=>{if(!groups.has(t.subject))groups.set(t.subject,[]);groups.get(t.subject).push(t);});
    for(const [subject,topics] of groups){const group=document.createElement('section');group.className='edital-subject-group';const h=safeText('h5','',subject);const count=safeText('span','topic-count',`${topics.filter(t=>t.status==='done').length}/${topics.length} concluídos`);const head=document.createElement('div');head.className='saved-edital-head';head.style.marginTop='0';head.style.paddingTop='0';head.style.borderTop='0';head.append(h,count);group.append(head);
      topics.forEach(t=>{const row=document.createElement('div');row.className='edital-topic-row';const nameWrap=document.createElement('div');nameWrap.className='edital-topic-name-wrap';const name=safeText('div','edital-topic-name',t.topic);const mins=editalTopicMinutes.get(t.id)||0;const timeLabel=safeText('small','edital-topic-time',mins?`Tempo registrado: ${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}min`:'Ainda sem tempo registrado');nameWrap.append(name,timeLabel);const select=document.createElement('select');select.className='edital-topic-status status-'+t.status;select.setAttribute('aria-label','Status: '+t.topic);Object.entries(statusLabels).forEach(([value,label])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt);});select.value=t.status;select.addEventListener('change',async()=>{select.disabled=true;const patch={status:select.value,last_reviewed_at:select.value==='review'?new Date().toISOString():t.last_reviewed_at};const {error}=await client.from('study_edital_topics').update(patch).eq('id',t.id).eq('user_id',currentUser.id);select.disabled=false;if(error){select.value=t.status;editalFeedback('Não foi possível atualizar o tópico: '+friendlyError(error),'error');return;}t.status=patch.status;t.last_reviewed_at=patch.last_reviewed_at;select.className='edital-topic-status status-'+t.status;renderEditalTopics();refreshTopicSelector(editalTopics);});row.append(nameWrap,select);group.append(row);});
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
    const linkedTopic=$('study-topic-select')?.value||null;const payload={user_id:currentUser.id,subject:$('study-subject').value.trim(),topic:$('study-topic').value.trim()||null,minutes,questions,correct,notes:$('study-notes').value.trim()||null,studied_on:new Date().toISOString().slice(0,10),...(linkedTopic?{edital_topic_id:linkedTopic}:{})};
    const {error}=await client.from('study_sessions').insert(payload);
    btn.disabled=false;
    if(error){message('Não foi possível salvar. Verifique se executou supabase-schema.sql. '+friendlyError(error),'error');return;}
    if(linkedTopic){await client.from('study_edital_topics').update({status:'studying'}).eq('id',linkedTopic).eq('user_id',currentUser.id).eq('status','pending');if(activeEditalId)await openEdital(activeEditalId);}
    $('session-form').reset();$('study-topic-select').value='';$('study-questions').value='0';$('study-correct').value='0';stopTimer(true);message('Sessão salva com segurança!','success');await loadHistory();
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
