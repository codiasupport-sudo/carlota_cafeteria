import Image from "next/image";
import type { BusinessSettings } from "../../domain/catalog";

/** RF-1, RF-2: logo blanco sobre vino y lema en listón, como la portada del menú impreso. */
export function MenuHeader({ settings }: { settings: BusinessSettings }) {
  return (
    <header className="bg-carlota-wine px-4 pb-6 pt-6 text-center">
      {settings.logoUrl ? (
        // unoptimized: el logo es un PNG ya reducido; así no depende del optimizador de imágenes.
        <Image
          src={settings.logoUrl}
          alt={settings.name}
          width={900}
          height={676}
          priority
          unoptimized
          className="mx-auto h-auto w-[210px] max-w-[70vw]"
        />
      ) : (
        <p className="font-script text-4xl">{settings.name}</p>
      )}
      <h1 className="sr-only">{settings.name}</h1>

      {settings.tagline && (
        <p
          className="mx-auto mt-3 w-fit bg-white px-7 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-carlota-red"
          style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%, 10px 50%)" }}
        >
          {settings.tagline}
        </p>
      )}

      {settings.menuNotice && (
        <p className="mx-auto mt-4 max-w-sm rounded-card border border-carlota-line px-3 py-2 text-[13px]">{settings.menuNotice}</p>
      )}
    </header>
  );
}
