"use client";

import Link from "next/link";
import type { SiteAnnouncement } from "@/content/site-announcements";

type Props = {
  item: SiteAnnouncement;
  line: string;
  className: string;
};

export function AnnouncementLink({ item, line, className }: Props) {
  if (!item.href) {
    return (
      <span className={className} title={line}>
        {line}
      </span>
    );
  }

  const external = /^https?:\/\//i.test(item.href);
  if (external) {
    return (
      <a
        href={item.href}
        className={className}
        title={line}
        target="_blank"
        rel="noopener noreferrer"
      >
        {line}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} title={line}>
      {line}
    </Link>
  );
}
