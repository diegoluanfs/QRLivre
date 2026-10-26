import { describe, expect, it } from 'vitest';
import { buildQrPayload, crc16Ccitt, createPixPayload, initialForm } from './qrPayload';

describe('geração de payload', () => {
  it('preserva URLs válidas e rejeita protocolos inseguros', () => {
    expect(buildQrPayload('url', { ...initialForm, url: 'https://exemplo.com/p' }).data).toBe('https://exemplo.com/p');
    expect(buildQrPayload('url', { ...initialForm, url: 'javascript:alert(1)' }).error).toBeTruthy();
  });
  it('escapa caracteres especiais no Wi-Fi', () => {
    expect(buildQrPayload('wifi', { ...initialForm, wifiSsid: 'Casa;1', wifiPassword: 'a:b\\c' }).data)
      .toBe('WIFI:T:WPA;S:Casa\\;1;P:a\\:b\\\\c;H:false;;');
  });
  it('cria link correto do WhatsApp', () => {
    expect(buildQrPayload('whatsapp', { ...initialForm, whatsappPhone: '+55 (51) 99999-9999', whatsappMessage: 'Olá!' }).data)
      .toContain('https://wa.me/5551999999999?text=Ol%C3%A1!');
  });
  it('rejeita pix inválido e gera CRC consistente', () => {
    expect(createPixPayload({ ...initialForm, pixKey: '', pixName: '', pixCity: '' }).error).toBeTruthy();
    const pix = createPixPayload({ ...initialForm, pixKey: 'teste@example.com', pixName: 'Jose da Silva', pixCity: 'Sao Paulo', pixAmount: '15,90' });
    expect(pix.error).toBeNull();
    expect(pix.data).toContain('540515.90');
    expect(pix.data.slice(-4)).toBe(crc16Ccitt(pix.data.slice(0, -4)));
    expect(pix.data).toContain('br.gov.bcb.pix');
  });
  it('protege contra conteúdo excessivo', () => {
    expect(buildQrPayload('text', { ...initialForm, text: 'x'.repeat(1801) }).error).toBeTruthy();
  });
});
