'use client';

import { useEffect, useRef } from 'react';

interface Feature {
  icon: string;
  title: string;
  titleEn: string;
  description: string;
  bgChar: string;
}

const features: Feature[] = [
  {
    icon: '🧾',
    title: 'Invoice Compliance Payment',
    titleEn: 'INVOICE · TAX COMPLIANCE',
    description: 'Fully compliant with Japan\'s 2023 Invoice System. Automatic qualified invoice issuance and management, automatic consumption tax calculation, and electronic bookkeeping law compliant record storage.',
    bgChar: '税'
  },
  {
    icon: '✅',
    title: 'Quality & Traceability',
    titleEn: 'QUALITY & TRACEABILITY',
    description: 'JAS mark and organic certification display management, trace records from production to table. Also provides automatic coordination of pesticide usage history and nutritional information.',
    bgChar: '品'
  },
  {
    icon: '📊',
    title: 'Market Analysis Dashboard',
    titleEn: 'MARKET INSIGHTS',
    description: 'Integration with wholesale market price data, seasonal fluctuation forecasting, and inventory optimization through demand prediction AI. Make data-driven purchasing decisions.',
    bgChar: '分'
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.feature-card');
            cards.forEach((card, index) => {
              setTimeout(() => {
                (card as HTMLElement).style.opacity = '1';
                (card as HTMLElement).style.transform = 'translateY(0)';
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-8 lg:px-20" id="features" ref={sectionRef}>
      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-ink leading-tight mb-4">
        Platform Features<br/>
        <span className="hidden sm:inline">Specialized for Japanese Market</span>
        <span className="sm:hidden">For Japanese Market</span>
      </h2>
      <p className="text-gray-600 leading-relaxed max-w-2xl text-sm sm:text-base mb-12 sm:mb-16">
        Using MulyaBazaar's global infrastructure while providing features fully compatible 
        with Japanese business practices, regulations, and consumer needs.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-stone-300">
        {features.map((feature, index) => (
          <div
            key={index}
            className="feature-card bg-cream p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:bg-white relative overflow-hidden opacity-0 translate-y-5"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Background Character */}
            <div 
              className="absolute bottom-0 right-2 font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-vermilion/5 leading-none pointer-events-none select-none"
              aria-hidden="true"
            >
              {feature.bgChar}
            </div>
            
            {/* Icon */}
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-vermilion flex items-center justify-center text-lg sm:text-xl mb-4 sm:mb-6 text-white"
              style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}
            >
              {feature.icon}
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="font-serif text-lg sm:text-xl text-ink mb-2">{feature.title}</h3>
              <div className="text-xs text-vermilion mb-3 tracking-wide">{feature.titleEn}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}