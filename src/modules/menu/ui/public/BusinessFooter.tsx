import { Stamp } from "./Stamp";
import { safeHttpsUrl, whatsappLink, type BusinessSettings } from "../../domain/catalog";

const linkClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-white px-5 text-sm font-bold text-white";

/** RF-11, RF-12: solo lo que esté configurado. */
export function BusinessFooter({ settings }: { settings: BusinessSettings }) {
  const whatsapp = whatsappLink(settings.whatsapp);
  const instagram = safeHttpsUrl(settings.instagram);
  const facebook = safeHttpsUrl(settings.facebook);
  const loyalty = safeHttpsUrl(settings.loyaltyUrl);

  return (
    <footer className="bg-carlota-wine px-4 pb-8 pt-4 text-center text-sm">
      <Stamp className="mx-auto mb-4 w-44" />
      {settings.hours.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 font-bold">Horario</p>
          {settings.hours.map((h) => (
            <p key={h.days}>
              {h.days}: {h.hours}
            </p>
          ))}
        </div>
      )}
      {settings.address && <p className="mb-4">{settings.address}</p>}

      <div className="flex flex-wrap justify-center gap-2">
        {whatsapp && (
          <a className={linkClass} href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        )}
        {instagram && (
          <a className={linkClass} href={instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        )}
        {facebook && (
          <a className={linkClass} href={facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        )}
        {loyalty && (
          <a className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-carlota-wine" href={loyalty}>
            Cliente Consentido
          </a>
        )}
      </div>

      <p className="mt-6 text-xs opacity-80">{settings.name}</p>
    </footer>
  );
}
