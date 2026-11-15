# Regras de Desenvolvimento — Barragem · Orçamentos

App de orçamentos da Barragem (Elétrica Geral e Climatização). Repositório separado dos apps CTV/Suzano (`VT-CTV`): nunca misturar arquivos, links ou projetos Firebase entre eles.

## Regra de Integridade de Dados (CRÍTICA)
1. **Dados existentes nunca podem ser perdidos** (localStorage e Firestore).
2. **Local → nuvem sincroniza:** o que foi salvo em modo local (`barragem_local_dirty`) é enviado ao Firestore no primeiro login, sem sobrescrever versões mais novas da nuvem (comparação por `updatedAt`).
3. **O listener do Firestore nunca apaga alterações locais pendentes** (`barragem_pending_v1`).
4. Testar sinal fraco: Firebase indisponível, transição local→nuvem e offline.

## Arquitetura
- App single-file `index.html` (CSS/JS inline), mobile-first, pt-BR.
- Boot: `bootLocal()` sempre primeiro; `upgradeToCloud(api)` em segundo plano quando o SDK do Firebase carrega.
- Firebase: projeto **AppBarragem** (`appbarragem-8138e`), Firestore + Auth e-mail/senha.
  - Coleções: `barragem_orcamentos/{id}` e `barragem_config/{catalogo|empresa}`.
  - Regras em `firestore.rules` (e-mails ocultados; cópia real só no console). Publicar **somente** no projeto AppBarragem.
- PDF: `pdf-export.js` + `vendor/` (html2canvas + jsPDF locais).

## Deploy
- GitHub Pages (branch `main`).
- **`CACHE_VERSION` em `service-worker.js` deve ser incrementado a cada deploy.**
- Todo arquivo novo usado pelo app deve entrar no `APP_SHELL`.
- Antes de mergear um PR, conferir com `git diff main...HEAD --stat` que todos os arquivos alterados estão incluídos.

## Cores da marca
Azul-marinho `#023681` · Verde `#037e45` · Amarelo `#fbb603` · Azul `#2076c1`
