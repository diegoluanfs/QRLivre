# QR Livre v1.6 — Analytics direto

Substitui a integração GTM anterior `GTM-NSP5WG4F` por uma única Google tag `G-TKHY6BQRTF`. Não requer publicar contêiner GTM, API secret, nem alterar AdSense/AdMob. Instalação incremental sobre v1.5. Não muda a versão do pacote Android/número de build.

O fluxo Web de produção é **QR Livre Web** (16375367617), em https://qrlivre.com.br. A exportação concluída pela biblioteca dispara `qr_export` com `qr_type` e `file_format` após consentimento.

## Configuração única na conta GA4

Em Administrador > Fluxos de dados > QR Livre > Medição otimizada, desative a medição otimizada nesta primeira etapa (em especial interações de formulário, buscas, cliques externos e páginas por histórico). A integração envia uma visualização explícita por documento. Não envie dados de QR, termos de busca, textos, senhas ou chaves. Não habilite coleta de dados fornecidos por usuários ou vinculação publicitária para esta integração. A tag do Google pode coletar dados automáticos conforme a configuração remota; a desativação deve ser confirmada na conta. O código não modifica o painel GA4. O consentimento de métricas não substitui CMP publicitária.

## Validação

`npm run check:analytics`, `npm run check:blog`, `npm run check:ads`, `npm run check:seo`, `npm run test`, `npm run build`, `npm run check:analytics:dist`, `npm run check:seo:dist`.

O runtime bloqueia a tag fora do domínio público HTTPS (localhost apenas exibe o consentimento); a guarda nativa impede coleta no Android. Testes do runtime em VM simulam DOM e chamadas Google, não enviam dados reais. O consentimento fica no localStorage. Recusar não carrega a tag; revogar desativa a propriedade e recarrega. A URL explícita de página não contém query/hash e só aponta a páginas canônicas do portal. Os cookies e dados já enviados ao Google anteriormente não são apagados dos servidores por revogação.

## Produção

Após deploy na Cloudflare, abra uma janela privada sem bloqueador, aceite métricas, visite o blog e um artigo. DevTools > Network: `gtag/js?id=G-TKHY6BQRTF` e `g/collect` (ID `tid=G-TKHY6BQRTF`), nenhuma requisição `gtm.js?id=GTM-NSP5WG4F`. Abra o relatório Tempo real ou Tag Assistant. Em outra janela, recuse métricas e confirme que a tag não carrega. Use janela nova se a PWA antiga estiver em cache. O alerta de instalação do fluxo pode demorar a atualizar. Nenhum evento personalizado de produto é habilitado nesta etapa; primeiro confirme page_view e revise as configurações de coleta.

Arquivos de instalação podem ser movidos para fora do repositório após o teste; não use `git clean -fdx`. O AdSense conserva os cinco slots/configurações e o mecanismo de revisão da v1.5, sem ligá-los automaticamente. A aceitação de métricas não habilita os anúncios.
