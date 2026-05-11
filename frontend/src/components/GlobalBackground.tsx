import heroImage from "@/assets/hero-cards.jpg";

export const GlobalBackground = () => (
  <>
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <img src={heroImage} alt="" className="h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/65 via-background/88 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(48_100%_50%/0.12),transparent_55%)]" />
    </div>
    {/* Pokébolas decorativas */}
    <svg viewBox="0 0 200 200" className="fixed right-0 top-0 w-[500px] text-primary opacity-[0.03] pointer-events-none -z-10 hidden lg:block" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 4,100 A 96,96 0 0 1 196,100 Z" fill="currentColor" fillOpacity="0.06" />
      <rect x="4" y="97" width="192" height="6" fill="currentColor" fillOpacity="0.12" />
      <circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="10" fill="currentColor" fillOpacity="0.15" />
    </svg>
    <svg viewBox="0 0 200 200" className="fixed left-0 bottom-40 w-[300px] text-primary opacity-[0.02] pointer-events-none -z-10 hidden lg:block" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 4,100 A 96,96 0 0 1 196,100 Z" fill="currentColor" fillOpacity="0.06" />
      <rect x="4" y="97" width="192" height="6" fill="currentColor" fillOpacity="0.12" />
      <circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="10" fill="currentColor" fillOpacity="0.15" />
    </svg>
  </>
);
