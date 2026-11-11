import { ArrowUpRight, BookOpen, ShieldCheck, BriefcaseBusiness } from 'lucide-react';

const highlights = [
  { title: 'O que é um QR Code e como ele funciona?', kind: 'Aprenda', href: '/blog/o-que-e-qr-code/', description: 'Os conceitos essenciais para criar códigos que funcionam.', icon: BookOpen },
  { title: '10 formas de aplicar QR Codes em pequenos negócios', kind: 'Negócios', href: '/blog/qr-code-para-pequenos-negocios/', description: 'Ideias úteis para atendimento, catálogo, embalagem e mais.', icon: BriefcaseBusiness },
  { title: 'QR Codes e golpes: como identificar sinais de risco', kind: 'Segurança', href: '/blog/qr-code-seguranca-golpes/', description: 'Cuidados importantes antes de abrir links ou pagar.', icon: ShieldCheck },
];

export default function BlogHighlights() {
  return (
    <section className="qr-blog-teaser container" aria-labelledby="qr-blog-title">
      <div className="qr-blog-teaser__heading">
        <div><span className="qr-blog-teaser__eyebrow">APRENDA COM O QR LIVRE</span><h2 id="qr-blog-title">Mais do que gerar. <em>Entenda e aproveite.</em></h2><p>Guias e exemplos para criar QR Codes úteis, seguros e fáceis de compartilhar.</p></div>
        <a className="qr-blog-teaser__all" href="/blog/">Explorar o blog <ArrowUpRight size={16}/></a>
      </div>
      <div className="qr-blog-teaser__grid">
        {highlights.map(({title,description,href,kind,icon: Icon}) => <a href={href} className="qr-blog-teaser__card" key={href}>
          <span className="qr-blog-teaser__icon"><Icon size={21}/></span>
          <span className="qr-blog-teaser__category">{kind}</span>
          <strong>{title}</strong><span>{description}</span>
          <span className="qr-blog-teaser__read">Ler artigo <ArrowUpRight size={15}/></span>
        </a>)}
      </div>
    </section>
  );
}
