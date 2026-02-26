export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 font-sans dark:from-red-900 dark:to-red-950">
      <main className="flex flex-col items-center justify-center text-center px-8 py-16">
        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              🚀 Something amazing is loading...
            </span>
          </div>
          
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-black dark:text-white">
              Coming
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                Soon
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">
              We&apos;re crafting something extraordinary. Stay tuned for an amazing experience.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-sm text-zinc-400 dark:text-zinc-600">
          <p>© 2026 mulya.jp. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
