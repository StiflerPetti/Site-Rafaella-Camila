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
  const showDashboard = async user => { currentUser=user; panel.hidden=true; dashboard.hidden=false; $('signed-in-email').textContent=user.email||'Conta conectada'; await loadHistory(); };
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
    const history=$('study-history'); history.replaceChildren();
    if(!sessions.length){const p=document.createElement('p');p.textContent='Ainda não há sessões registradas. Sua primeira sessão começa aqui!';history.append(p);return;}
    sessions.forEach(x=>{const card=document.createElement('article');card.className='history-item';const h=document.createElement('h4');h.textContent=x.subject;const date=document.createElement('small');date.textContent=new Date(x.studied_on+'T12:00:00').toLocaleDateString('pt-BR');const details=document.createElement('p');details.textContent=`${x.minutes} min · ${x.questions||0} questões · ${x.correct||0} acertos${x.topic?' · '+x.topic:''}`;card.append(h,date,details);if(x.notes){const n=document.createElement('p');n.textContent=x.notes;card.append(n);}history.append(card);});
  }
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
    const payload={user_id:currentUser.id,subject:$('study-subject').value.trim(),topic:$('study-topic').value.trim()||null,minutes,questions,correct,notes:$('study-notes').value.trim()||null,studied_on:new Date().toISOString().slice(0,10)};
    const {error}=await client.from('study_sessions').insert(payload);
    btn.disabled=false;
    if(error){message('Não foi possível salvar. Verifique se executou supabase-schema.sql. '+friendlyError(error),'error');return;}
    $('session-form').reset();$('study-questions').value='0';$('study-correct').value='0';stopTimer(true);message('Sessão salva com segurança!','success');await loadHistory();
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
