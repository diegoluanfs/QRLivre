# QR Livre — Web / PWA / Android (v1.1: publicidade preparada)

Gerador gratuito de QR Codes com **React + TypeScript + Vite + Tailwind + Capacitor 7**. O QR Code é criado localmente, sem enviar os campos do formulário para um servidor. Preparado para **Google AdSense no navegador** e **Google AdMob nativo no Android** (iOS planejado).

## Funcionalidades

- QR Codes de link, texto, Wi-Fi, WhatsApp, e-mail, telefone e Pix estático.
- Personalização de cores, formas e logotipo; download PNG, SVG e JPEG.
- Interface mobile-first, pré-visualização instantânea e PWA.
- Três áreas para anúncios da Web: **topo**, **lateral (desktop)** e **inferior**. Os espaços mostram avisos neutros até configurarmos o AdSense.
- Banner **AdMob nativo, adaptativo e fixado embaixo** no Android, com espaço de segurança na tela, IDs de teste e integração de consentimento (UMP).
- **Separação automática**: dentro do app Capacitor, não carregamos AdSense; em navegadores e na PWA, não iniciamos AdMob.

## Correções da v1.1.1

- Ajuste da referência HTML do banner AdSense: `HTMLModElement` no elemento `<ins>` (corrige TS2322 no `npm run build`).
- Atualização da ferramenta de testes para `vitest@^5.0.5`, evitando as vulnerabilidades conhecidas das dependências antigas `@vitest/mocker` e `tinypool` relatadas pelo `npm audit`.
- Exige Node.js **22.12+** para a suíte de testes. A atualização do Vitest é uma mudança de versão principal; executar `npm run test` e `npm run build` após instalar.
- Em uma instalação já existente, execute `npm install` (atualiza também o `package-lock.json` local), `npm audit`, `npm run test` e `npm run build`.

## Instalação

Node.js **22.12+** (necessário para Vitest 5). Abra a pasta no VS Code, execute `INICIAR_WEB.cmd` ou rode:

```powershell
npm install
npm run dev
```

Teste, build e prévia:

```powershell
npm run test
npm run build
npm run preview
```

## Publicidade: configuração fácil

Crie o arquivo `.env.local` copiando `.env.example` (o primeiro é ignorado pelo Git):

```powershell
Copy-Item .env.example .env.local
```

### 1) Web: Google AdSense

Por padrão, `VITE_ADSENSE_ENABLED=false` e `VITE_SHOW_AD_PLACEHOLDERS=true`: os espaços são visíveis, mas **nenhuma solicitação de anúncio real é feita**. O endereço local geralmente não recebe anúncios AdSense.

Depois que seu site for aceito no AdSense, obtenha o ID do publisher e **três IDs de blocos de display responsivos**. Preencha `.env.local`:

```dotenv
VITE_ADSENSE_ENABLED=true
VITE_SHOW_AD_PLACEHOLDERS=true
VITE_ADSENSE_CLIENT=ca-pub-1234567890123456
VITE_ADSENSE_SLOT_TOP=1234567890
VITE_ADSENSE_SLOT_SIDEBAR=1234567891
VITE_ADSENSE_SLOT_BOTTOM=1234567892
```

**Valores ilustrativos:** substitua pelos IDs reais. `VITE_ADSENSE_CLIENT` é `ca-pub-...` (não é o ID AdMob). O script oficial do AdSense é carregado sob demanda, uma vez, somente no site e com IDs válidos. Espaços ocultos não são solicitados. Não coloque anúncios em página da Web exibida no WebView nativo; o app usa o SDK AdMob.

Antes de ativar anúncios reais, configure no AdSense **Privacidade e mensagens** com uma CMP certificada conforme as regiões atendidas; complete a política de privacidade e os dados de contato do operador. Sem essa etapa, deixe `VITE_ADSENSE_ENABLED=false`. Confira também as regras de conteúdo, implementação e posicionamento do Google. **A exibição e a aprovação não são garantidas apenas pela integração técnica.**

O GitHub Actions atual não injeta variáveis `VITE_*` sozinho: para publicar anúncios via GitHub Pages, configure as variáveis de repositório/ambiente no workflow, ou use um provedor de hospedagem que forneça variáveis de build. Veja `.github/workflows/deploy.yml` e as orientações abaixo.

### 2) Android: Google AdMob

O app utiliza **`@capacitor-community/admob@7`**, compatível com o **Capacitor 7** já adotado neste projeto. **Não** instale a versão 8 do plugin sem atualizar a linha principal do Capacitor.

#### Desenvolvimento / banners de teste

O modo padrão é `VITE_ADMOB_MODE=test`. O código usa o ID de banner demonstrativo oficial do Google, que não gera receita. O script `scripts/configure-android-ads.mjs` injeta no AndroidManifest o **ID de APP demonstrativo**, a permissão `AD_ID` e os metadados necessários. Não precisa de conta AdMob para visualizar o banner de teste, mas precisa de dispositivo/emulador com serviços Google e conexão.

Primeira execução:

```powershell
npm install
npm run android:init
npm run android:open
```

Quando alterar código ou anúncios:

```powershell
npm run android:sync
npm run android:open
```

Ou execute `ABRIR_ANDROID_STUDIO.cmd`. O projeto nativo `android/` é gerado na máquina do desenvolvedor.

**Importante:** antes de criar o Android pela primeira vez, troque `appId` em `capacitor.config.ts` por seu pacote único e definitivo (por exemplo `br.seudominio.qrlivre`).

#### Produção: conectar sua conta AdMob

Crie um app e um bloco do tipo **banner** no painel AdMob e copie os identificadores **diferentes**:

- **ID do app** (com `~`), por exemplo `ca-app-pub-1234567890123456~1234567890`, vai no manifesto nativo automaticamente.
- **ID do bloco banner** (com `/`), por exemplo `ca-app-pub-1234567890123456/1234567890`, é usado no JavaScript.

No `.env.local` (valores ilustrativos):

```dotenv
VITE_ADMOB_ENABLED=true
VITE_ADMOB_MODE=live
VITE_ADMOB_ANDROID_APP_ID=ca-app-pub-1234567890123456~1234567890
VITE_ADMOB_ANDROID_BANNER_ID=ca-app-pub-1234567890123456/1234567890
```

Em seguida rode `npm run android:sync`; ele compila, sincroniza o Capacitor **e atualiza o manifesto/strings**. Use o modo teste / dispositivos de teste durante desenvolvimento e valide a coleta de consentimento. **Não publique blocos demonstrativos como monetização de produção**; deixe `VITE_ADMOB_MODE=live` no release e confira as declarações de publicidade, `AD_ID` e **Segurança dos dados** no Google Play Console.

O SDK carrega o consentimento via **Google User Messaging Platform (UMP)** ao abrir o app, antes da primeira solicitação de banner. Os anúncios aparecem apenas quando a API indica que podem ser solicitados. Na área inferior do app há um link “Preferências de anúncios” para reabrir opções UMP quando aplicável. O banner fica na camada nativa do Android (não é uma imagem HTML), usa tamanho adaptativo e comunica sua altura à interface para evitar sobreposição do rodapé. Faça testes reais em telas pequenas, especialmente em orientação horizontal.

> Se desativar os anúncios com `VITE_ADMOB_ENABLED=false`, nenhuma solicitação é feita. Para um app que nunca usa AdMob, remova também o plugin e os metadados que já tiverem sido adicionados ao projeto nativo.

### 3) iOS no futuro

A integração tem identificação do banner de teste iOS, opção de ID em `.env.local` e detecção automática. **O projeto iOS não é gerado nesta entrega.** Quando for criado, será preciso adicionar `@capacitor/ios` da mesma versão, configurar `Info.plist`, `GADApplicationIdentifier`, SKAdNetwork, consentimento/ATT e gerar o app via macOS/Xcode.

## Como funciona a área reservada

| Plataforma | Onde | Comportamento |
|---|---|---|
| Navegador desktop | Topo, lateral e inferior | AdSense responsivo após configuração |
| Navegador de celular / PWA | Topo e inferior | AdSense responsivo; lateral fica oculta |
| App Android (Capacitor) | Banner nativo inferior | AdMob adaptativo; **sem AdSense no WebView** |

Os banners não aparecem dentro do próprio QR Code gerado. Não há intersticiais, nem anúncios obrigatórios para baixar arquivos.

## Privacidade e publicação

A política está em `public/privacidade.html`. **Personalize os dados do responsável**, as integrações usadas e os procedimentos de consentimento antes de publicar. Anúncios podem utilizar cookies/identificadores e rede externa; portanto, não anuncie o aplicativo como “sem coleta de dados” quando a monetização estiver ativa. A geração do conteúdo do QR Code continua local.

### Hospedagem

**Cloudflare Pages:** comando `npm run build`, diretório `dist`, configuração de `VITE_*` nas variáveis de ambiente de build. **GitHub Pages:** workflow em `.github/workflows/deploy.yml`; para adicionar IDs, crie variáveis do repositório (`Settings > Secrets and variables > Actions > Variables`) e deixe o workflow repassá-las no build. Consulte a configuração do pipeline e não commit `.env.local`.

### Organização

```text
src/
  App.tsx                        Interface principal
  style.css                      Responsividade + espaços publicitários
  ads/
    config.ts                    Switch Web / nativo, IDs e validação
    AdSlot.tsx                   Slots AdSense com carregamento sob demanda
    webAds.ts                    Script único do AdSense
    nativeBanner.ts              Banner AdMob, UMP e gerenciamento de altura
  lib/qrPayload.ts               Dados para QR/Pix e CRC16
  lib/qrPayload.test.ts          Testes de payloads
scripts/configure-android-ads.mjs Configura metadados Android automaticamente
.env.example                      Variáveis modelo
public/privacidade.html           Política de privacidade ajustável
```

## Pix

O QR Code Pix estático usa os dados inseridos, sem verificar se a chave pertence ao recebedor. Confira as informações no aplicativo bancário antes de usar um código para pagamentos reais.

## Licença

MIT — veja `LICENSE`.

### Verificação do site e ads.txt

Depois de aprovar seu domínio no AdSense, veja também o arquivo `public/ads.txt.example`: crie um novo arquivo `public/ads.txt` com a **linha exata** indicada pelo Google e seu publisher ID real. O arquivo precisa estar em `https://SEU-DOMINIO/ads.txt`; um arquivo colocado dentro de um subcaminho do GitHub Pages (`/nome-repositorio/ads.txt`) não substitui o ads.txt na raiz do domínio. Veja a documentação oficial em <https://support.google.com/adsense/answer/12171612?hl=pt-BR>.

**Atalho no Windows:** execute `CONFIGURAR_ANUNCIOS.cmd` para criar e editar `.env.local`.
