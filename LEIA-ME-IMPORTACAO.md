# Atualização do espaço de estudos

## O que vem neste pacote
- `estudos.html`, `script.js`, `estilo.css`: interface com tipo de atividade, matéria sugerida e subtema livre.
- `supabase-migracao-importacao-junho-2026.sql`: migração de banco e importação das atividades da primeira aba.
- `importacao-estudos-junho-2026.csv`: cópia conferível dos registros a importar.

## Regras da importação
- Primeira aba somente; a aba `Direito Penal` foi ignorada.
- Datas no padrão brasileiro DD/MM/AAAA. Datas sem ano receberam 2026.
- Foram preparados 190 registros. Quando havia valor numérico na coluna T da mesma linha, ele foi usado como duração; nos demais casos, foi aplicada a estimativa de 30 minutos. As anotações identificam os valores estimados.
- Não foram inferidas questões respondidas nem acertos; ficam em zero quando a planilha não traz números estruturados.
- `Jurisprudência` e `Sumulas STJ` são disciplinas/matérias conforme os cabeçalhos da planilha; termos dentro das células classificam o tipo de atividade, não alteram a matéria.

## Como aplicar com segurança
1. No Supabase, faça um backup/exportação da tabela `study_sessions`.
2. Abra `supabase-migracao-importacao-junho-2026.sql` e confira os registros e as datas. O script identifica a conta `rafaellacpf@gmail.com`.
3. Execute o SQL completo no SQL Editor. Ele verifica a conta e carrega o lote em tabela temporária antes de substituir as sessões dessa conta, dentro de uma transação.
4. Publique no GitHub os arquivos do site (`estudos.html`, `script.js`, `estilo.css`) substituindo os correspondentes no repositório. Preserve `supabase-config.js` e os demais arquivos existentes, inclusive a função Edge.
5. Abra o site e faça login para conferir os totais e os registros.

Não compartilhe chaves secretas. O SQL não contém chaves nem senhas.
