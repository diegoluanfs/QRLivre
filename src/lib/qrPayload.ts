export type QrKind = 'url' | 'text' | 'wifi' | 'whatsapp' | 'email' | 'phone' | 'pix';
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export interface QrForm {
  url: string;
  text: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: WifiSecurity;
  wifiHidden: boolean;
  whatsappPhone: string;
  whatsappMessage: string;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
  pixAmount: string;
  pixTxid: string;
}

export type PayloadResult = { data: string; error: string | null };

export const initialForm: QrForm = {
  url: 'https://example.com', text: '', wifiSsid: '', wifiPassword: '',
  wifiSecurity: 'WPA', wifiHidden: false, whatsappPhone: '', whatsappMessage: '',
  email: '', emailSubject: '', emailBody: '', phone: '',
  pixKey: '', pixName: '', pixCity: '', pixAmount: '', pixTxid: '',
};

const error = (message: string): PayloadResult => ({ data: '', error: message });
const success = (data: string): PayloadResult => new TextEncoder().encode(data).length > 1000
  ? error('O conteúdo é muito longo para gerar um QR Code confiável. Reduza o texto.')
  : ({ data, error: null });
const escapeWifi = (value: string) => value.replace(/([\\;,:\"])/g, '\\$1');
const onlyDigits = (value: string) => value.replace(/\D/g, '');

function tlv(id: string, value: string): string {
  const size = new TextEncoder().encode(value).length;
  if (size > 99) throw new Error('Um dos campos do Pix excedeu o tamanho permitido.');
  return id + String(size).padStart(2, '0') + value;
}

export function crc16Ccitt(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function asciiName(value: string, length: number): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9 .\-/]/g, '').trim().slice(0, length);
}

/** Payload Pix BR Code estático, EMV + CRC16 CCITT-FALSE. */
export function createPixPayload(form: Pick<QrForm, 'pixKey' | 'pixName' | 'pixCity' | 'pixAmount' | 'pixTxid'>): PayloadResult {
  const key = form.pixKey.trim();
  const name = asciiName(form.pixName, 25);
  const city = asciiName(form.pixCity, 15);
  if (!key || !name || !city) return error('Informe chave Pix, nome do recebedor e cidade.');
  if (key.length > 77 || /[^\x20-\x7e]/.test(key)) return error('Informe uma chave Pix válida, com até 77 caracteres ASCII.');
  const amountInput = form.pixAmount.trim();
  let amount = '';
  if (amountInput) {
    const normalized = amountInput.replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return error('Informe um valor válido, como 25,90.');
    const number = Number(normalized);
    if (!Number.isFinite(number) || number <= 0 || number > 99999999.99) return error('O valor Pix precisa ser maior que zero.');
    amount = number.toFixed(2);
  }
  const txid = form.pixTxid.trim() || '***';
  if (txid !== '***' && !/^[A-Za-z0-9]{1,25}$/.test(txid)) {
    return error('O identificador Pix aceita até 25 letras ou números, sem espaços.');
  }
  try {
    const merchant = tlv('00', 'br.gov.bcb.pix') + tlv('01', key);
    const payload = tlv('00', '01') + tlv('26', merchant) + tlv('52', '0000') +
      tlv('53', '986') + (amount ? tlv('54', amount) : '') + tlv('58', 'BR') +
      tlv('59', name) + tlv('60', city) + tlv('62', tlv('05', txid)) + '6304';
    return success(payload + crc16Ccitt(payload));
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : 'Não foi possível montar o Pix.');
  }
}

export function buildQrPayload(kind: QrKind, form: QrForm): PayloadResult {
  switch (kind) {
    case 'url': {
      const raw = form.url.trim();
      if (!raw) return error('Insira um link para começar.');
      let parsed: URL;
      try { parsed = new URL(raw); } catch { return error('Informe um link completo, começando com https://.'); }
      if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) {
        return error('O link deve começar com http:// ou https://.');
      }
      return success(parsed.href);
    }
    case 'text':
      return form.text.trim() ? success(form.text) : error('Escreva o texto que deseja compartilhar.');
    case 'wifi': {
      const ssid = form.wifiSsid.trim();
      if (!ssid) return error('Informe o nome da rede Wi-Fi.');
      if (form.wifiSecurity !== 'nopass' && !form.wifiPassword) return error('Informe a senha da rede Wi-Fi.');
      return success(`WIFI:T:${form.wifiSecurity};S:${escapeWifi(ssid)};${form.wifiSecurity !== 'nopass' ? `P:${escapeWifi(form.wifiPassword)};` : ''}H:${form.wifiHidden ? 'true' : 'false'};;`);
    }
    case 'whatsapp': {
      const phone = onlyDigits(form.whatsappPhone);
      if (phone.length < 10 || phone.length > 15) return error('Informe o número com DDI e DDD (ex.: 5551999999999).');
      const message = form.whatsappMessage.trim();
      return success(`https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`);
    }
    case 'email': {
      const email = form.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Informe um endereço de e-mail válido.');
      const params = new URLSearchParams();
      if (form.emailSubject) params.set('subject', form.emailSubject);
      if (form.emailBody) params.set('body', form.emailBody);
      return success(`mailto:${email}${params.size ? '?' + params.toString() : ''}`);
    }
    case 'phone': {
      const cleaned = form.phone.replace(/[\s()\-.]/g, '');
      if (!/^\+?\d{8,15}$/.test(cleaned)) return error('Informe um telefone válido, com DDD.');
      return success(`tel:${cleaned}`);
    }
    case 'pix': return createPixPayload(form);
  }
}
