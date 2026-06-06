export default function LandingHero() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pb-8 z-10">
      {/* Main title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-center leading-[1.1] tracking-tight max-w-4xl">
        <span className="text-bolt-elements-textPrimary font-bold">What will you </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] via-[#3b82f6] to-[#1d4ed8] italic font-serif font-semibold">
          build
        </span>
        <span className="text-bolt-elements-textPrimary font-bold"> today?</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-sm sm:text-base text-bolt-elements-textSecondary text-center max-w-lg font-normal tracking-wide">
        Create stunning apps & websites by chatting with AI.
      </p>
    </div>
  );
}
