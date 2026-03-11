export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white/60 py-16 px-8 lg:px-20" id="contact">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* Brand Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <div className="font-serif text-xl font-extrabold text-white tracking-wide">
                Mulya
              </div>
              <div className="font-mono text-xs text-vermilion tracking-widest uppercase">
                Japan Marketplace
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-md mb-6">
            Japan market module of MulyaBazzar Global. Transforming Japan's food distribution 
            with marketplace technology from Nepal.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-vermilion">📍</span>
              <span>Tokyo, Japan</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-white text-lg font-bold mb-4">Platform</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#features" className="hover:text-vermilion transition-colors duration-200">Features</a></li>
            <li><a href="#supply-chain" className="hover:text-vermilion transition-colors duration-200">Supply Chain</a></li>
            <li><a href="#register" className="hover:text-vermilion transition-colors duration-200">Register</a></li>
            <li><a href="/dashboard" className="hover:text-vermilion transition-colors duration-200">Dashboard</a></li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div>
          <h4 className="font-serif text-white text-lg font-bold mb-4">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="/help" className="hover:text-vermilion transition-colors duration-200">Help Center</a></li>
            <li><a href="/contact" className="hover:text-vermilion transition-colors duration-200">Contact</a></li>
            <li><a href="/privacy" className="hover:text-vermilion transition-colors duration-200">Privacy</a></li>
            <li><a href="/terms" className="hover:text-vermilion transition-colors duration-200">Terms</a></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xs text-center md:text-left">
          © {currentYear} Mulya by MulyaBazzar · All rights reserved.
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/40">Made with ❤️ in Nepal for Japan</span>
        </div>
      </div>
    </footer>
  );
}
