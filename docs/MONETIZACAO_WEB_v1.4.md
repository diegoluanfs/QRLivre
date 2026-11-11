# QR Livre v1.4 — Estrutura de publicidade web

## Objetivo

Preparar cinco posições responsivas para Google AdSense, sem tornar a publicidade uma condição para usar o gerador e sem alterar o AdMob do Android.

| Chave | Local |
| --- | --- |
| `generator` | Depois dos destaques do blog na página do gerador, longe dos campos e botões |
| `blogIndexFirst` | Entre o 3º e o 4º cartão de artigos |
| `blogIndexLast` | Depois do catálogo do blog |
| `articleMiddle` | Aproximadamente na metade do texto de um artigo com pelo menos seis parágrafos |
| `articleEnd` | Após os artigos relacionados, no fim da leitura |

**Não há publicidade** nas páginas Sobre, Privacidade, erro ou navegação. Não há anúncios no aplicativo Android através desta atualização.

## Condições para exibir anúncios

Tudo é controlado em `config/web-ads.json`. Inicialmente:

- `enabled: false` (desliga todo o portal)
- `siteApproved: false` (manter até o status “Pronto” no painel AdSense)
- `privacyIntegrationReady: false` (manter até integrar uma CMP/consentimento adequado para a região e o uso)
- `publisherId`: já preenchido com ID público da conta, usado para verificação (não é segredo)
- `slots`: **vazios** até criar as unidades de anúncio específicas no AdSense
- `placements`: liga ou desliga posições individualmente quando as outras condições estão satisfeitas

O runtime só tenta carregar `pagead2.googlesyndication.com` depois que todos os controles estiverem aptos, a unidade tiver ID válido e um sistema de consentimento apropriado sinalizar `window.qrlivreAdConsentGranted === true` e emitir o evento `qrlivre:ads-consent-changed`. **Esse evento não é fornecido por esta atualização:** deve ser integrado a uma CMP conforme requisitos aplicáveis, inclusive a CMP certificada exigida pelo Google em determinadas regiões. A escolha de *métricas* do GTM não constitui consentimento para publicidade.

**Não ative `privacyIntegrationReady` sem essa integração.** A metatag de verificação do AdSense deve permanecer, mesmo quando anúncios estiverem desativados.

### Testar

```powershell
cd C:\Users\diego\Desktop\projetos\QRLivre
npm run check:blog
npm run check:ads
npm run test
npm run build
npm run dev
```

Confira `http://localhost:5173/`, `/blog/` e dois artigos. Enquanto o AdSense estiver pendente, não devem existir caixas publicitárias vazias. O build estático gera os arquivos JS/CSS internos do sistema, mas **não** injeta anúncios nem solicita publicidade externa.

### Observações importantes

- `config/web-ads.json` é uma configuração de build. Requer novo build/deploy após alterar flags e IDs.
- O Google AdSense não garante preenchimento do espaço nem receita, mesmo depois de aprovado.
- Para não quebrar o app Android, o componente React verifica `isNativeApp`; o `startNativeBanner` existente não foi tocado.
- As opções AdSense herdadas do `.env.local` não ligam esta nova estrutura: a configuração v1.4 é a fonte de verdade para estes cinco espaços. Evite manter outro carregamento automático ou duplicar unidades de anúncio no mesmo endereço.
- A publicação na Cloudflare deve incluir os arquivos estáticos de `dist/assets` e `dist/blog`.
- Não suba o ZIP ou a pasta extraída para o Git; envie apenas os arquivos da atualização integrados ao projeto.
