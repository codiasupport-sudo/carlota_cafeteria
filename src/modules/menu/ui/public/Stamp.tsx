import Image from "next/image";

/** Sello "Sabores que se quedan contigo · Café con amor" del menú impreso. */
export function Stamp({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-[395/346] ${className}`} aria-hidden>
      <Image src="/brand/ilustraciones/sello.png" alt="" fill unoptimized sizes="200px" className="object-contain" />
      <p className="absolute left-[17%] top-[19%] w-[60%] rotate-[8deg] text-center text-[8.5px] font-bold leading-[1.15] text-white sm:text-[9px]">
        Sabores que se quedan contigo
      </p>
      <p className="absolute left-[13%] top-[55%] w-[68%] rotate-[8deg] text-center font-script text-[16px] leading-none text-carlota-red sm:text-[18px]">
        Café con amor
      </p>
    </div>
  );
}
