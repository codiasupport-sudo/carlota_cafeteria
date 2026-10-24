/**
 * Configuración centralizada de servicios e integraciones externas de La Carlota.
 * Define la URL canónica del menú digital independiente para comensales.
 */
export const DIGITAL_MENU_URL: string =
  process.env.NEXT_PUBLIC_DIGITAL_MENU_URL ||
  "https://la-carlota-menu-digital.vercel.app/m";
