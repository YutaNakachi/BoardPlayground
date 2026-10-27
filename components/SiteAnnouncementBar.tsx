import { AnnouncementRotator } from "@/components/AnnouncementRotator";
import { SITE_CONTAINER_CLASS } from "@/lib/site-layout";
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
      <div
        className={`${SITE_CONTAINER_CLASS} flex items-center py-1.5 text-sm`}
      >
        <AnnouncementRotator
          key={items.map((item) => item.id).join("\u0000")}
          items={items}
        />
      </div>
    </section>
  );
}
