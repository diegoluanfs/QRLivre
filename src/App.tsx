import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import QRCodeStyling, { type Options } from 'qr-code-styling';
import {
  ArrowDownToLine, ArrowRight, BadgeCheck, Check, CheckCheck, ChevronDown,
  CircleHelp, ClipboardCopy, CloudOff, Code2, Download, ExternalLink,
  FileText, Globe2, ImagePlus, Layers3, Link2, LockKeyhole, Mail,
  MessageCircle, Palette, Phone, QrCode, RefreshCcw, ShieldCheck,
  SlidersHorizontal, Sparkles, Trash2, Wifi, X,
} from 'lucide-react';
import { buildQrPayload, initialForm, type QrForm, type QrKind } from './lib/qrPayload';
import { AdSlot } from './ads/AdSlot';
import { openNativeAdPrivacyOptions, startNativeBanner } from './ads/nativeBanner';
import { isNativeApp, nativeAdConfig } from './ads/config';

type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy';
type ExportType = 'png' | 'svg' | 'jpeg';

const kinds = [
  { id: 'url', label: 'Link', icon: Link2 },
  { id: 'text', label: 'Texto', icon: FileText },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'phone', label: 'Telefone', icon: Phone },
  { id: 'pix', label: 'Pix', icon: QrCode },
] as const;
const dotStyles: { id: DotStyle; label: string }[] = [
  { id: 'rounded', label: 'Suave' }, { id: 'square', label: 'Clássico' },
  { id: 'dots', label: 'Pontos' }, { id: 'extra-rounded', label: 'Redondo' },
  { id: 'classy', label: 'Elegante' },
];

interface FieldProps {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}
function Field({ label, hint, optional, children }: FieldProps) {
  return <label className="field">
    <span className="field-label">{label}{optional && <span className="optional">Opcional</span>}</span>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </label>;
}

function Logo() {
  return <span className="brand-lockup">
    <span className="brand-symbol"><QrCode size={25} strokeWidth={2.2} /></span>
    <span className="brand-text">QR<span>Livre</span><span className="brand-dot">.</span></span>
  </span>;
}

function App() {
  useEffect(() => {
    if (isNativeApp) void startNativeBanner();
  }, []);

  const [kind, setKind] = useState<QrKind>('url');
  const [form, setForm] = useState<QrForm>(initialForm);
  const [darkColor, setDarkColor] = useState('#163c32');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [logo, setLogo] = useState<string>('');
  const [format, setFormat] = useState<ExportType>('png');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const qrContainer = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const result = useMemo(() => buildQrPayload(kind, form), [kind, form]);
  const valid = Boolean(result.data && !result.error);
  const update = <K extends keyof QrForm>(name: K, value: QrForm[K]) =>
    setForm(previous => ({ ...previous, [name]: value }));

  const qrOptions = useMemo<Options>(() => ({
    width: 960, height: 960, type: 'svg',
    data: result.data || 'https://example.com', margin: 28,
    qrOptions: { errorCorrectionLevel: logo ? 'H' : 'Q' },
    dotsOptions: { color: darkColor, type: dotStyle },
    cornersSquareOptions: { color: darkColor, type: 'extra-rounded' },
    cornersDotOptions: { color: darkColor, type: 'dot' },
    backgroundOptions: { color: lightColor },
    ...(logo ? { image: logo } : { image: '' }),
    imageOptions: { hideBackgroundDots: true, saveAsBlob: true, imageSize: 0.24, margin: 8, crossOrigin: 'anonymous' },
  }), [result.data, darkColor, lightColor, dotStyle, logo]);

  useEffect(() => {
    if (!qrContainer.current) return;
    qrContainer.current.replaceChildren();
    qrInstance.current = new QRCodeStyling(qrOptions);
    qrInstance.current.append(qrContainer.current);
    return () => { qrInstance.current = null; };
    // Instância criada uma única vez por montagem; atualizações ocorrem abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!valid) return;
    qrInstance.current?.update(qrOptions);
  }, [qrOptions, valid]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const onLogo = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice('Use um logotipo PNG, JPEG ou WebP.'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice('O logotipo deve ter, no máximo, 2 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setNotice('Não foi possível ler essa imagem.');
    reader.readAsDataURL(file);
  };

  const download = async () => {
    if (!valid || !qrInstance.current || busy) return;
    setBusy(true);
    try {
      await qrInstance.current.download({ name: `qr-livre-${kind}`, extension: format });
      setNotice(`QR Code ${format.toUpperCase()} exportado com sucesso.`);
    } catch {
      setNotice('Não foi possível baixar o arquivo. Tente outro formato.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(result.data);
      setNotice('Conteúdo copiado para a área de transferência.');
    } catch {
      setNotice('Permita o acesso à área de transferência ou use uma conexão HTTPS.');
    }
  };

  const resetStyle = () => {
    setDarkColor('#163c32'); setLightColor('#ffffff');
    setDotStyle('rounded'); setLogo('');
    if (logoInput.current) logoInput.current.value = '';
    setNotice('Personalização redefinida.');
  };

  const scrollToGenerator = useCallback(() => {
    document.getElementById('gerador')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const activeLabel = kinds.find(item => item.id === kind)?.label || 'QR Code';
  const colorWarning = (() => {
    const hex = (value: string) => [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255)
      .map(n => n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4));
    const luminance = (rgb: number[]) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    const a = luminance(hex(darkColor)); const b = luminance(hex(lightColor));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < 4.5;
  })();

  return <div id="inicio" className="site-shell">
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand-link" href="#inicio" aria-label="QR Livre — voltar ao topo">
          <Logo />
        </a>
        {!isNativeApp && (
          <>
            <nav className="header-nav" aria-label="Navegação principal">
              <button type="button" onClick={scrollToGenerator}>Gerador</button>
              <a href="#como-funciona">Como funciona</a>
              <a href={`${import.meta.env.BASE_URL}privacidade.html`}>Privacidade</a>
            </nav>
            <div className="header-actions">
              <span className="header-free"><span className="status-light" /> 100% gratuito</span>
            </div>
          </>
        )}
      </div>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> SIMPLES, RÁPIDO E SEU</div>
          <h1>Transforme qualquer ideia em um <em>QR Code.</em></h1>
          <p>Links, Wi-Fi, Pix e muito mais. Crie, personalize e baixe códigos incríveis em segundos — sem cadastro, sem limites artificiais.</p>
          <div className="hero-chips">
            <span><CheckCheck size={16} /> Sem cadastro</span>
            <span><ShieldCheck size={16} /> Dados no seu dispositivo</span>
            <span><CloudOff size={16} /> Funciona offline*</span>
          </div>
        </div>
        <div className="hero-decoration" aria-hidden="true"><div className="decoration-swoosh"><QrCode strokeWidth={1.2} size={140}/></div><div className="decoration-sticker"><Check size={16}/> Tudo pronto para compartilhar</div></div>
      </section>

      <div className="container ad-horizontal"><AdSlot placement="top" /></div>

      <section className="container editor-layout" id="gerador" aria-label="Gerador de QR Code">
        <div className="editor-column">
          <div className="editor-card content-card">
            <div className="card-heading"><span className="step-number">01</span><div><h2>O que vamos compartilhar?</h2><p>Escolha o tipo de conteúdo do seu QR Code.</p></div></div>
            <div className="kind-tabs" role="tablist" aria-label="Tipo de QR Code">
              {kinds.map(item => <button key={item.id} type="button" className={`kind-tab ${kind === item.id ? 'active' : ''}`} role="tab" aria-selected={kind === item.id} onClick={() => setKind(item.id)}>
                <item.icon size={18} strokeWidth={1.9}/><span>{item.label}</span>
              </button>)}
            </div>

            <div className="fields-panel" role="tabpanel" aria-label={`Formulário ${activeLabel}`}>
              {kind === 'url' && <Field label="URL do site" hint="Inclua https:// para que o link abra corretamente.">
                <div className="input-with-icon"><Globe2 size={19}/><input type="url" placeholder="https://meusite.com.br" value={form.url} onChange={e => update('url', e.target.value)} autoComplete="url" /></div>
              </Field>}
              {kind === 'text' && <Field label="Seu texto" hint="Textos menores são mais fáceis de escanear.">
                <textarea rows={5} maxLength={1800} placeholder="Escreva sua mensagem aqui..." value={form.text} onChange={e => update('text', e.target.value)} />
              </Field>}
              {kind === 'wifi' && <div className="field-stack">
                <Field label="Nome da rede (SSID)"><input placeholder="Nome da sua rede Wi-Fi" value={form.wifiSsid} onChange={e => update('wifiSsid', e.target.value)}/></Field>
                <div className="two-fields">
                  <Field label="Segurança"><select value={form.wifiSecurity} onChange={e => update('wifiSecurity', e.target.value as QrForm['wifiSecurity'])}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Sem senha</option></select></Field>
                  {form.wifiSecurity !== 'nopass' && <Field label="Senha"><input type="text" placeholder="Senha da rede" value={form.wifiPassword} onChange={e => update('wifiPassword', e.target.value)}/></Field>}
                </div>
                <label className="check-field"><input type="checkbox" checked={form.wifiHidden} onChange={e => update('wifiHidden', e.target.checked)}/> Rede oculta</label>
              </div>}
              {kind === 'whatsapp' && <div className="field-stack">
                <Field label="Número do WhatsApp" hint="Inclua o código do país: 55 + DDD + número."><input type="tel" placeholder="55 51 99999-9999" value={form.whatsappPhone} onChange={e => update('whatsappPhone', e.target.value)}/></Field>
                <Field label="Mensagem inicial" optional><textarea rows={3} placeholder="Olá! Gostaria de saber mais..." value={form.whatsappMessage} onChange={e => update('whatsappMessage', e.target.value)}/></Field>
              </div>}
              {kind === 'email' && <div className="field-stack">
                <Field label="E-mail do destinatário"><input type="email" placeholder="contato@exemplo.com" value={form.email} onChange={e => update('email', e.target.value)} /></Field>
                <Field label="Assunto" optional><input placeholder="Assunto da mensagem" value={form.emailSubject} onChange={e => update('emailSubject', e.target.value)} /></Field>
                <Field label="Mensagem" optional><textarea rows={3} placeholder="Sua mensagem..." value={form.emailBody} onChange={e => update('emailBody', e.target.value)} /></Field>
              </div>}
              {kind === 'phone' && <Field label="Número de telefone" hint="Inclua o DDD ou o código internacional.">
                <div className="input-with-icon"><Phone size={19}/><input type="tel" placeholder="+55 51 99999-9999" value={form.phone} onChange={e => update('phone', e.target.value)}/></div>
              </Field>}
              {kind === 'pix' && <div className="field-stack">
                <div className="info-note"><ShieldCheck size={18} /><span>Este é um <strong>Pix estático</strong>. Confira os dados e faça um pagamento de teste antes de compartilhar.</span></div>
                <Field label="Chave Pix" hint="CPF, CNPJ, e-mail, telefone ou chave aleatória."><input placeholder="sua-chave@exemplo.com" value={form.pixKey} onChange={e => update('pixKey', e.target.value)}/></Field>
                <div className="two-fields">
                  <Field label="Nome do recebedor"><input placeholder="Nome ou empresa" maxLength={60} value={form.pixName} onChange={e => update('pixName', e.target.value)}/></Field>
                  <Field label="Cidade"><input placeholder="Santa Maria" maxLength={40} value={form.pixCity} onChange={e => update('pixCity', e.target.value)}/></Field>
                </div>
                <div className="two-fields">
                  <Field label="Valor (R$)" optional><input inputMode="decimal" placeholder="25,90" value={form.pixAmount} onChange={e => update('pixAmount', e.target.value)}/></Field>
                  <Field label="Identificador / TxID" optional><input placeholder="PEDIDO123" maxLength={25} value={form.pixTxid} onChange={e => update('pixTxid', e.target.value)}/></Field>
                </div>
              </div>}
            </div>
            <div className={`validation-bar ${valid ? 'is-valid' : 'is-invalid'}`} role="status">
              {valid ? <><Check size={16}/><span>Perfeito! Seu código está pronto para personalização.</span></> : <><CircleHelp size={16}/><span>{result.error || 'Preencha os campos para começar.'}</span></>}
            </div>
          </div>

          <div className="editor-card style-card">
            <div className="card-heading"><span className="step-number">02</span><div><h2>Deixe com a sua cara</h2><p>Personalize as cores e o visual do código.</p></div><button className="reset-btn" type="button" onClick={resetStyle} title="Restaurar visual"><RefreshCcw size={15}/> <span>Redefinir</span></button></div>
            <div className="style-body">
              <div className="style-row-head"><Palette size={16}/><h3>Cores do QR Code</h3></div>
              <div className="color-grid">
                <label className="color-select"><span className="swatch" style={{background: darkColor}}><input type="color" aria-label="Cor dos pontos" value={darkColor} onChange={e => setDarkColor(e.target.value)}/></span><span><strong>Cor principal</strong><small>{darkColor.toUpperCase()}</small></span><ChevronDown size={15}/></label>
                <label className="color-select"><span className="swatch" style={{background: lightColor}}><input type="color" aria-label="Cor de fundo" value={lightColor} onChange={e => setLightColor(e.target.value)}/></span><span><strong>Cor do fundo</strong><small>{lightColor.toUpperCase()}</small></span><ChevronDown size={15}/></label>
              </div>
              {colorWarning && <p className="contrast-warning"><CircleHelp size={16}/> Baixo contraste: o QR Code pode ficar difícil de escanear.</p>}
              <div className="section-separator" />
              <div className="style-row-head"><SlidersHorizontal size={16}/><h3>Estilo dos pontos</h3></div>
              <div className="style-options" role="group" aria-label="Estilo dos pontos">
                {dotStyles.map(style => <button type="button" key={style.id} className={`style-option ${dotStyle === style.id ? 'selected' : ''}`} onClick={() => setDotStyle(style.id)} aria-pressed={dotStyle === style.id}>
                  <span className={`dots-icon dots-${style.id}`} aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span><small>{style.label}</small>
                </button>)}
              </div>
              <div className="section-separator" />
              <div className="style-row-head"><ImagePlus size={16}/><h3>Seu logotipo</h3><span className="optional">Opcional</span></div>
              <input ref={logoInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void onLogo(e.target.files?.[0])}/>
              <div className="logo-upload-row">
                <button type="button" className="upload-box" onClick={() => logoInput.current?.click()}><ImagePlus size={19}/><span>{logo ? 'Trocar imagem' : 'Adicionar imagem'}</span><small>PNG, JPG ou WebP • até 2 MB</small></button>
                {logo && <div className="uploaded-logo"><img src={logo} alt="Logotipo selecionado"/><button type="button" aria-label="Remover logotipo" title="Remover logotipo" onClick={() => {setLogo(''); if (logoInput.current) logoInput.current.value = '';}}><Trash2 size={17}/></button></div>}
              </div>
              <p className="helper-text">Logotipos muito complexos podem afetar a leitura. Teste o QR Code antes de imprimir.</p>
            </div>
          </div>
        </div>

        <aside className="preview-column" aria-label="Pré-visualização e exportação">
          <div className="preview-card">
            <div className="preview-top"><div><span className="preview-kicker">RESULTADO EM TEMPO REAL</span><h2>Seu QR Code <span className="live-dot" /></h2></div><span className="preview-type"><Layers3 size={15}/>{activeLabel}</span></div>
            <div className="preview-stage">
              <span className="stage-orb stage-orb-a"/><span className="stage-orb stage-orb-b"/>
              <div className="qr-paper" style={{ backgroundColor: lightColor }}>
                <div className={`qr-render ${valid ? '' : 'render-disabled'}`} ref={qrContainer} aria-label={valid ? 'Prévia do QR Code gerado' : 'Prévia aguardando dados'} />
                {!valid && <div className="preview-empty"><QrCode size={43}/><strong>Seu código aparece aqui</strong><span>Preencha os dados ao lado para gerar</span></div>}
              </div>
              <span className="stage-label"><Check size={15}/> Pré-visualização instantânea</span>
            </div>
            <div className="export-area">
              <div className="export-heading"><div><h3>Seu código está pronto?</h3><p>Escolha o formato e faça o download.</p></div><Download size={20}/></div>
              <div className="format-options" role="radiogroup" aria-label="Formato do arquivo">
                {(['png', 'svg', 'jpeg'] as const).map(item => <label key={item} className={`format-option ${format === item ? 'selected' : ''}`}><input type="radio" name="file-format" value={item} checked={format === item} onChange={() => setFormat(item)}/><span>{item.toUpperCase()}</span>{format === item && <Check size={14}/>}</label>)}
              </div>
              <button className="download-btn" type="button" disabled={!valid || busy} onClick={() => void download()}><ArrowDownToLine size={19}/>{busy ? 'Preparando arquivo...' : `Baixar QR Code em ${format.toUpperCase()}`}<ArrowRight size={18}/></button>
              <button className="copy-btn" type="button" onClick={() => void copy()} disabled={!valid}><ClipboardCopy size={16}/> Copiar conteúdo do QR Code</button>
              <p className="export-disclaimer"><LockKeyhole size={14}/> Gerado localmente. Seus dados não são enviados ao nosso servidor.</p>
            </div>
          </div>
          <div className="tip-card"><div className="tip-icon"><CircleHelp size={20}/></div><div><strong>Uma dica importante</strong><p>Antes de compartilhar ou imprimir, escaneie o QR Code com a câmera do celular para confirmar que está tudo certo.</p></div></div>
          <div className="ad-sidebar"><AdSlot placement="sidebar" /></div>
        </aside>
      </section>

      <section id="como-funciona" className="how-section container">
        <div className="how-top"><div><span className="eyebrow"><BadgeCheck size={15}/> FEITO PARA SER FÁCIL</span><h2>Três passos. Infinitas possibilidades.</h2></div><p>Do primeiro clique ao QR Code final, tudo acontece diretamente no seu navegador.</p></div>
        <div className="how-grid">
          <div className="how-item"><span className="how-number">01</span><div className="how-icon"><Link2 size={24}/></div><h3>Escolha o conteúdo</h3><p>Um link, texto, rede Wi-Fi, Pix ou outro tipo de informação.</p></div>
          <div className="how-item"><span className="how-number">02</span><div className="how-icon"><Palette size={24}/></div><h3>Personalize o visual</h3><p>Mude cores, pontos e adicione o logotipo da sua marca.</p></div>
          <div className="how-item"><span className="how-number">03</span><div className="how-icon"><Download size={24}/></div><h3>Baixe e compartilhe</h3><p>Salve em PNG, SVG ou JPEG. Pronto para usar onde quiser.</p></div>
        </div>
      </section>
      <div className="container ad-horizontal ad-horizontal--bottom"><AdSlot placement="bottom" /></div>
      <section className="bottom-cta container"><div><span><Sparkles size={16}/> SIMPLES ASSIM</span><h2>Sua próxima ideia merece ser compartilhada.</h2></div><button onClick={scrollToGenerator}>Criar meu QR Code <ArrowRight size={18}/></button></section>
    </main>

    <footer className="site-footer"><div className="container footer-inner"><div><Logo/><p>Compartilhar deveria ser simples.</p></div><div className="footer-right"><a href={`${import.meta.env.BASE_URL}privacidade.html`}>Privacidade <ExternalLink size={13}/></a>{isNativeApp && nativeAdConfig.enabled && <button type="button" className="privacy-options-button" onClick={() => void openNativeAdPrivacyOptions()}>Preferências de anúncios</button>}<span><Code2 size={15}/> Feito com carinho, sem complicação.</span><small>© {new Date().getFullYear()} QR Livre</small></div></div></footer>
    {notice && <div className="toast" role="status"><Check size={17}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15}/></button></div>}
  </div>;
}

export default App;
