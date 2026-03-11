'use client';

import { useEffect, useRef } from 'react';

interface ChainStep {
  icon: string;
  title: string;
  titleJp: string;
  description: string;
  stepNumber: number;
}

const chainSteps: ChainStep[] = [
  {
    icon: '🌱',
    title: 'Producer Registration',
    titleJp: 'PRODUCER',
    description: 'Farmers, fishermen, and food manufacturers list directly. Automatic registration of origin certificates and certification information.',
    stepNumber: 1
  },
  {
    icon: '🏭',
    title: 'Quality Inspection',
    titleJp: 'QUALITY CHECK',
    description: 'Quality checks based on JAS standards. Also supports distribution of non-standard products to welfare facilities.',
    stepNumber: 2
  },
  {
    icon: '📦',
    title: 'Inventory Management',
    titleJp: 'INVENTORY',
    description: 'AI demand forecasting maintains optimal inventory. Aiming for loss reduction and zero waste.',
    stepNumber: 3
  },
  {
    icon: '❄️',
    title: 'Cold Transport',
    titleJp: 'COLD DELIVERY',
    description: 'Nationwide next-day delivery in temperature-controlled dedicated vehicles. Real-time product temperature tracking with IoT sensors.',
    stepNumber: 4
  },
  {
    icon: '😊',
    title: 'Customer Satisfaction',
    titleJp: 'SATISFACTION',
    description: 'Post-delivery review and repeat purchase promotion. Complaint resolution guaranteed within 24 hours.',
    stepNumber: 5
  }
];

export default function SupplyChainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const steps = entry.target.querySelectorAll('.chain-step');
            steps.forEach((step, index) => {
              setTimeout(() => {
                (step as HTMLElement).style.opacity = '1';
                (step as HTMLElement).style.transform = 'translateY(0)';
              }, index * 200);
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
    <section className="bg-ink text-white py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-8 lg:px-20" id="supply" ref={sectionRef}>
      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4">
        <span className="hidden sm:inline">From Producer to Table</span>
        <span className="sm:hidden">Producer to Table</span><br/>
        <span className="text-gold">Transparent Supply Chain</span>
      </h2>
      <p className="text-white/55 leading-relaxed max-w-2xl text-sm sm:text-base mb-12 sm:mb-16">
        Building an efficient and transparent distribution system that directly connects 
        producers nationwide with retailers, restaurants, and consumers.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-4 relative">
        {/* Connection Line - Hidden on mobile and tablet */}
        <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-vermilion via-gold to-moss z-0"></div>
        
        {chainSteps.map((step, index) => (
          <div
            key={index}
            className="chain-step flex flex-col items-center text-center relative z-10 px-2 opacity-0 translate-y-5 sm:flex-row sm:text-left lg:flex-col lg:text-center"
          >
            {/* Step Circle */}
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-full bg-ink border-2 border-vermilion flex items-center justify-center text-xl relative z-10">
                {step.icon}
              </div>
              {/* Step Number */}
              <div className="absolute -top-2 -right-2 bg-vermilion text-white font-mono text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {step.stepNumber}
              </div>
            </div>
            
            {/* Content */}
            <h3 className="font-serif text-base text-white mb-1">{step.title}</h3>
            <div className="text-xs text-white/40 tracking-wide mb-2">{step.titleJp}</div>
            <p className="text-xs text-white/50 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}