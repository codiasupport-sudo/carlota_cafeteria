import { getPublicMenu } from "@/modules/menu/application/get-public-menu";
import { getMenuRepository } from "@/modules/menu/infrastructure/repository-factory";
import { BusinessFooter } from "@/modules/menu/ui/public/BusinessFooter";
import { MenuHeader } from "@/modules/menu/ui/public/MenuHeader";
import { MenuView } from "@/modules/menu/ui/public/MenuView";
import { VisitBeacon } from "@/modules/menu/ui/public/VisitBeacon";

export default async function PublicMenuPage() {
  const menu = await getPublicMenu(getMenuRepository());

  if (menu.unpublished) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-carlota-red px-6 text-center text-white">
        <p className="font-script text-3xl leading-snug" role="status">
          Menú no disponible por el momento
        </p>
      </main>
    );
  }

  const { settings, categories } = menu;
  return (
    <div className="min-h-screen bg-carlota-red text-white">
      <MenuHeader settings={settings} />
      <main className="mx-auto max-w-2xl">
        <MenuView categories={categories} />
      </main>
      <BusinessFooter settings={settings} />
      <VisitBeacon />
    </div>
  );
}
