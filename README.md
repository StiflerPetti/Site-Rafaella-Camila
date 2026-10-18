# Site Rafaella Camila Peixoto de Freitas

Site estático compatível com GitHub Pages, com login por e-mail/senha e área privada de estudos usando Supabase. O pacote inclui a estrutura do front-end; o login só ficará ativo depois de configurar o projeto Supabase seguindo os passos abaixo.

## Arquivos
- `index.html`: site e telas de login/painel.
- `estilo.css`: visual responsivo.
- `script.js`: autenticação, cronômetro, salvamento e histórico.
- `supabase-config.js`: URL e chave pública do projeto (preencher antes de publicar).
- `supabase-schema.sql`: tabela e políticas de segurança por usuário.
- `foto-rafaella.jpeg`: foto do site.

## Configuração do Supabase (gratuito para começar)
1. Crie um projeto em https://supabase.com/ e guarde a senha do banco em local seguro.
2. No painel, abra **SQL Editor**, crie uma consulta, cole o conteúdo de `supabase-schema.sql` e execute.
3. Em **Project Settings > API** (ou Connect), copie a **Project URL** e a chave **publishable/anon**. Nunca use `service_role` ou outra chave secreta no site público.
4. Abra `supabase-config.js` e substitua os dois valores `COLE_AQUI...` pelos valores do seu projeto. Esse arquivo é público por estar no GitHub; isso é esperado para a chave publicável, desde que as políticas RLS do SQL estejam ativas.
5. Em **Authentication > URL Configuration**, defina `https://stiflerpetti.github.io/Site-Rafaella-Camila/` como Site URL e adicione a mesma URL em Redirect URLs. Se usar um domínio diferente, ajuste a URL.
6. Em **Authentication > Providers > Email**, mantenha habilitada a autenticação por e-mail. Recomendado: exigir confirmação de e-mail.
7. No GitHub, envie todos os arquivos deste pacote para a raiz do repositório e confirme o commit. Aguarde o Pages publicar.
8. Teste criando uma conta com um e-mail real, confirme pelo e-mail recebido e entre. Teste também recuperação de senha. Se o e-mail de recuperação não voltar ao site, confira as Redirect URLs e o template de e-mail do Supabase.

## Privacidade
- A tabela ativa Row Level Security (RLS) e usa `auth.uid() = user_id`, portanto cada conta consulta e grava somente as próprias sessões.
- Não coloque senhas, chaves privadas, `service_role` ou credenciais do Google Sheets no HTML/JS público.
- Se a chave pública for exposta, isso não substitui RLS: nunca desative as políticas para “fazer funcionar”.
- Para produção, configure SMTP próprio se os limites de e-mail do serviço gratuito forem insuficientes.

## O que já funciona após configurar o Supabase
- Cadastro, login, logout e envio de link para recuperação de senha.
- Cronômetro iniciar/pausar/zerar e registro manual de minutos.
- Registro de matéria, assunto, questões, acertos e observações.
- Histórico recente e totais por conta autenticada.

## Google Sheets
A integração não está conectada ainda. A estrutura fica preparada para uma etapa seguinte. Para enviar dados ao Sheets com segurança, use Google Apps Script como endpoint validado ou uma função server-side/Edge Function; não coloque tokens privados do Google no JavaScript público. Antes de implementar, decidir se a planilha será um relatório exportado ou um espelho automático dos registros.


## Novo recurso: planejamento por edital (migração adicional)
1. Publique os arquivos atualizados do pacote. Preserve seu `supabase-config.js` atual.
2. No Supabase, abra **SQL Editor > New query** e execute uma única vez o arquivo `supabase-edital-schema.sql`. Ele cria as tabelas privadas de editais/tópicos e adiciona o vínculo opcional do tópico à tabela de sessões existente; não apaga o histórico.
3. Entre no site, abra **Meu edital de estudos**, selecione o PDF e informe o nome do concurso. A extração é uma sugestão automática; revise e corrija as linhas no formato `Disciplina | tópico` antes de salvar.
4. Selecione um tópico no formulário de sessão para vincular o estudo. As sessões continuam aparecendo no histórico, gráficos e ranking existentes. O checklist permite marcar Não iniciado, Estudando, Concluído ou Revisar.

**Limites da extração:** PDFs com texto selecionável funcionam melhor. PDFs digitalizados como imagem precisam de OCR; este pacote informa quando não há texto extraível e permite revisão manual. O PDF é processado localmente no navegador; o sistema guarda o texto extraído e os tópicos revisados, não o arquivo PDF original.
