import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ticketLink } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

type Props = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className"> & { children: ReactNode };

export function TicketButton({ children, ...props }: Props) {
  return (
    <Button asChild {...props}>
      <a {...ticketLink(siteConfig.ticketUrl)}>{children}</a>
    </Button>
  );
}
