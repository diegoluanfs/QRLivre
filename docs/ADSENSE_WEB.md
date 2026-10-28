# QR Livre — Anúncios web e publicação na Cloudflare Workers

Este complemento usa as três posições **já existentes** no QR Livre: `top`, `sidebar` (desktop) e `bottom`. Em telas menores, o banner lateral é ocultado. **AdMob Android não foi modificado.**

## Pré-requisitos

1. O domínio `https://qrlivre.com.br` deve estar associado ao Worker `qrlivre` e acessível em HTTPS.
2. Cadastrar o site em **AdSense → Sites** e obter o ID `ca-pub-...` da conta (NÃO é o `ca-app-pub` do AdMob).
3. Selecionar um método de verificação: com `VITE_ADSENSE_CLIENT` no build, esta atualização injeta automaticamente a metatag `google-adsense-account` no HTML, inclusive quando os banners estão desligados.
4. Depois da aprovação, criar três **blocos de anúncios gráficos responsivos** em AdSense → Anúncios → Por bloco de anúncios; anotar o número `data-ad-slot` de cada um.
5. Configurar **Privacidade e mensagens** do AdSense (CMP certificada/TFC quando aplicável) e completar a política de privacidade com um contato real. Não ative anúncios reais sem revisar consentimento, aviso de cookies e políticas aplicáveis.

## Variáveis de COMPILAÇÃO no Cloudflare Workers

Em **Workers & Pages → qrlivre → Settings → Builds → Variables and secrets**, configure:

```dotenv
# Antes da aprovação, manter FALSE (mostra placeholders):
VITE_ADSENSE_ENABLED=false
VITE_SHOW_AD_PLACEHOLDERS=true

# Após criar conta (metatag de verificação será adicionada ao HTML):
VITE_ADSENSE_CLIENT=ca-pub-1234567890123456

# Depois de obter os três IDs dos blocos:
VITE_ADSENSE_SLOT_TOP=1111111111
VITE_ADSENSE_SLOT_SIDEBAR=2222222222
VITE_ADSENSE_SLOT_BOTTOM=3333333333

# Linha EXATA fornecida no AdSense para ads.txt (variável de BUILD, não runtime):
ADSENSE_ADS_TXT_LINE=google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

**Todos os códigos acima são exemplos.** A Cloudflare incorpora `VITE_...` no build; NÃO use as "Runtime variables" de um Worker somente estático. É necessário disparar um **novo deploy** após qualquer alteração de variável de compilação. O build gera `dist/ads.txt` quando `ADSENSE_ADS_TXT_LINE` é fornecida e válida. Alternativamente, crie `public/ads.txt` com a linha exata do AdSense: nesse caso, o arquivo manual tem precedência.

A metatag de verificação aparece em `dist/index.html` com `VITE_ADSENSE_CLIENT`, sem precisar ativar os banners. Confira no navegador em **Exibir código-fonte** ou no arquivo gerado.

## Em sua máquina, sem perder o AdMob do `.env.local`

Use o helper opcional (PowerShell). Ele preserva as demais variáveis, incluindo AdMob, e **não faz push sozinho**:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\CONFIGURAR_ADSENSE_WEB.ps1 `
  -Client "ca-pub-SEU-ID-REAL" `
  -Top "SEU-SLOT-TOPO" -Sidebar "SEU-SLOT-LATERAL" -Bottom "SEU-SLOT-INFERIOR"

npm run build
```

O comando acima exige valores reais com formatos corretos. O modo padrão **mantém anúncios desativados**. Somente após aprovação do site e configuração do consentimento, acrescente `-EnableAds` e altere as variáveis de build na Cloudflare para `true` / `false`.

## Verificações antes de ativar anúncios

- `https://qrlivre.com.br` abre o site; anúncios web **não** devem aparecer no aplicativo Android Capacitor.
- A conta AdSense/site estão aprovados; os IDs `ca-pub` e `data-ad-slot` pertencem à mesma conta.
- A CMP/política de privacidade estão configuradas de acordo com o tráfego atendido.
- `https://qrlivre.com.br/ads.txt` retorna a linha da conta, sem HTML.
- O banner lateral não aparece no celular; topo e rodapé preservam os controles do gerador.
- Espaços vazios podem ocorrer por revisão pendente, bloqueadores, falta de inventário, privacidade ou rede. Não clique nos próprios anúncios.

## GitHub → Cloudflare Workers

```powershell
git status
git add .env.example vite.config.ts scripts/adsense-vite-plugin.ts scripts/CONFIGURAR_ADSENSE_WEB.ps1 docs/ADSENSE_WEB.md
git commit -m "feat(web): prepara verificacao AdSense e ads.txt no build Cloudflare"
git push origin main
```

Atenção: `.env.local` deve permanecer ignorado pelo Git. IDs públicos de publisher e slot são apropriados para configuração do frontend, mas **não** inclua tokens de API da Cloudflare, senhas ou chaves de assinatura Android.

**Links oficiais:** https://support.google.com/adsense/ ; https://support.google.com/adsense/answer/13554116?hl=pt-BR
