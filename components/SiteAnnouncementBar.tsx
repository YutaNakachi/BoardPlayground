import { AnnouncementRotator } from "@/components/AnnouncementRotator";
import { getActiveAnnouncements } from "@/lib/site-announcements";

export function SiteAnnouncementBar() {
  const items = getActiveAnnouncements();
  if (items.length === 0) return null;

  return (
    <section
      role="region"
      aria-label="お知らせ"
      className="border-b border-surface-border bg-accent/10"
    >
      <div className="mx-auto flex max-w-6xl items-center px-4 py-2 text-sm sm:px-6 lg:px-8">
        <AnnouncementRotator items={items} />
      </div>
    </section>
  );
}
