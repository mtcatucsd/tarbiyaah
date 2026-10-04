import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ticketHref } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

type Props = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className"> & { children: ReactNode };

export function TicketButton({ children, ...props }: Props) {
  const href = ticketHref(siteConfig.ticketUrl);
  const external = href.startsWith("http");
  return (
    <Button asChild {...props}>
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>
    </Button>
  );
}
