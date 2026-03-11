'use client';

import { useState } from 'react';

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('fresh');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const products = [
    {
      id: 1,
      name: "Organic Apples",
      nameJp: "Aomori Apple",
      emoji: "🍎",
      origin: "🗾 Aomori Prefecture",
      price: "¥480 /kg",
      badge: "Organic",
      searchTerms: "apple organic fruit"
    },
    {
      id: 2,
      name: "Fresh Veggie Set",
      nameJp: "Fresh Veggie Set", 
      emoji: "🥦",
      origin: "🗾 Chiba Prefecture",
      price: "¥1,200 /box",
      searchTerms: "vegetables fresh veggie"
    },
    {
      id: 3,
      name: "Premium Rice",
      nameJp: "Premium Rice",
      emoji: "🌾",
      origin: "🗾 Niigata Prefecture", 
      price: "¥2,800 /5kg",
      badge: "New Harvest",
      searchTerms: "rice grain premium"
    },
    {
      id: 4,
      name: "Japanese Strawberry",
      nameJp: "Japanese Strawberry",
      emoji: "🍓",
      origin: "🗾 Tochigi Prefecture",
      price: "¥880 /pack",
      searchTerms: "strawberry berry fruit"
    }
  ];

  const filteredProducts = products.filter(product =>
    searchQuery === '' || product.searchTerms.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden" id="home">
      {/* Left Side */}
      <div className="bg-ink flex flex-col justify-center px-4 sm:px-8 lg:px-20 py-16 sm:py-24 lg:py-16 relative">
        {/* Background Character */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 font-serif text-[8rem] sm:text-[12rem] lg:text-[20rem] text-white/[0.04] leading-none pointer-events-none select-none">
          市
        </div>
        
        <div className="relative z-10 space-y-8 animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-vermilion/20 border border-vermilion/40 text-red-300 px-3 sm:px-4 py-2 font-mono text-xs tracking-wider w-fit">
            <span className="w-2 h-2 bg-vermilion rounded-full"></span>
            <span className="hidden sm:inline">JAPAN MARKET MODULE · Mulya Global</span>
            <span className="sm:hidden">JAPAN MARKET</span>
          </div>
          
          {/* Main Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
            <span className="block sm:inline">Connecting</span> <span className="block sm:inline">Japan's</span><br/>
            <span className="text-vermilion">Marketplace</span>
          </h1>
          
          <div className="font-mono text-sm text-white/40 tracking-[0.2em] uppercase">
            Transparent Supply Chain Platform
          </div>
          
          {/* Description */}
          <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-sm sm:max-w-md">
            A Japan-focused module of Nepal's Mulya Global marketplace. 
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={() => scrollToSection('register')}
              className="bg-vermilion text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-medium border-none cursor-pointer transition-all duration-200 hover:bg-deep-red hover:-translate-y-1 tracking-wide text-center"
            >
              <span className="hidden sm:inline">Business Registration</span>
              <span className="sm:hidden">Register Business</span> →
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="bg-transparent text-white/80 px-6 sm:px-8 py-3 text-sm sm:text-base font-medium border border-white/25 cursor-pointer transition-all duration-200 hover:border-white hover:text-white text-center"
            >
              View Features
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-white/10">
            <div className="flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl text-gold font-extrabold">¥0</span>
              <span className="text-xs text-white/45 tracking-wider mt-1">SETUP FEE</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl text-gold font-extrabold">100%</span>
              <span className="text-xs text-white/45 tracking-wider mt-1">QUALITY GUARANTEE</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side */}
      <div className="bg-rice flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-12 sm:py-16 relative overflow-hidden">
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vermilion via-gold to-moss"></div>
        
        {/* Marketplace Preview */}
        <div className="bg-white border border-black/8 rounded-sm w-full max-w-xs sm:max-w-sm shadow-2xl overflow-hidden animate-fade-up-delayed">
          {/* Header */}
          <div className="bg-ink text-white px-4 py-3 flex items-center justify-between font-mono text-xs">
            <span>Mulya — Live Market</span>
            <span className="text-green-400">● LIVE</span>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('fresh')}
              className={`px-3 sm:px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === 'fresh' 
                  ? 'text-vermilion border-vermilion' 
                  : 'text-white/50 border-transparent'
              }`}
            >
              <span className="hidden sm:inline">Fresh Food</span>
              <span className="sm:hidden">Fresh</span>
            </button>
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-3 sm:px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === 'daily' 
                  ? 'text-vermilion border-vermilion' 
                  : 'text-white/50 border-transparent'
              }`}
            >
              <span className="hidden sm:inline">Daily Goods</span>
              <span className="sm:hidden">Daily</span>
            </button>
            <button 
              onClick={() => setActiveTab('produce')}
              className={`px-3 sm:px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === 'produce' 
                  ? 'text-vermilion border-vermilion' 
                  : 'text-white/50 border-transparent'
              }`}
            >
              Produce
            </button>
          </div>
          
          {/* Search and Products */}
          <div className="p-3 sm:p-5">
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 sm:px-3 py-2 border border-gray-200 text-xs sm:text-sm outline-none text-ink focus:border-vermilion transition-colors"
              />
              <button className="bg-vermilion text-white px-3 sm:px-4 text-xs sm:text-sm border-none cursor-pointer">
                🔍
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="border border-gray-100 p-2 sm:p-3 cursor-pointer transition-all duration-200 hover:border-vermilion hover:-translate-y-1 relative group"
                >
                  {product.badge && (
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-moss text-white text-xs px-1 sm:px-2 py-1 font-medium">
                      {product.badge}
                    </div>
                  )}
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{product.emoji}</div>
                  <div className="text-xs text-ink font-medium mb-1 leading-tight">
                    <span className="hidden sm:block">{product.name}<br/>{product.nameJp}</span>
                    <span className="sm:hidden">{product.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1 sm:mb-2 hidden sm:block">{product.origin}</div>
                  <div className="font-mono text-xs text-vermilion font-bold">
                    {product.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-moss rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs text-gray-600">Real-time updates · {filteredProducts.length} items</span>
            </div>
            <div className="font-mono text-xs text-gold font-bold">JPY Support</div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 sm:mt-6 text-center leading-relaxed px-2">
          <span className="hidden sm:inline">Consumption Tax & Invoice System Compliant ·<br/>
          For Registered Business Number Holders</span>
          <span className="sm:hidden">Tax & Invoice System Compliant</span>
        </p>
      </div>
    </section>
  );
}