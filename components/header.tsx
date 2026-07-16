"use client";

import DiscordIcon from "@/assets/discord.svg";
import FigmaIcon from "@/assets/figma.svg";
import GitHubIcon from "@/assets/github.svg";
import Logo from "@/assets/logo.svg";
import TwitterIcon from "@/assets/twitter.svg";
import { FigmaExportDialog } from "@/components/figma-export-dialog";
import { SocialLink } from "@/components/social-link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import { useGithubStars } from "@/hooks/use-github-stars";
import { formatCompactNumber } from "@/utils/format";
import Link from "next/link";
import { useState } from "react";
import { GetProCTA } from "./get-pro-cta";

export function Header() {
  const [figmaDialogOpen, setFigmaDialogOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <a
            href="https://mehtaharsh.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center size-5 bg-foreground hover:bg-primary text-background rounded-[35%] transition-all hover:scale-105 active:scale-95 shrink-0 mr-1"
            title="mehtaharsh.xyz"
          >
            <span className="text-[11px] font-bold font-brand select-none leading-none">h</span>
          </a>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-6" title="probablyharsh" />
            <span className="hidden font-brand text-2xl tracking-wide lowercase md:block">probablyharsh</span>
          </Link>
        </div>
        <div className="flex items-center gap-3.5">
          <GetProCTA className="h-8" />

          <SocialLink
            href="https://mehtaharsh.xyz"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <span className="font-brand text-xl tracking-wider lowercase">mehtaharsh.xyz</span>
          </SocialLink>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-3.5">
            <div className="hidden items-center gap-3.5 md:flex">
              <SocialLink href="https://mehtaharsh.xyz">
                <span className="text-xs text-muted-foreground hover:text-foreground">About</span>
              </SocialLink>
            </div>
            <SocialLink href="https://mehtaharsh.xyz">
              <span className="text-xs text-muted-foreground hover:text-foreground">Contact</span>
            </SocialLink>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <Button
            onClick={() => setFigmaDialogOpen(true)}
            variant="outline"
            className="flex h-8 items-center gap-2"
          >
            <FigmaIcon className="size-4" />
            <span className="hidden md:inline">Export to Figma</span>
          </Button>
          <UserProfileDropdown />
        </div>
      </div>

      <FigmaExportDialog open={figmaDialogOpen} onOpenChange={setFigmaDialogOpen} />
    </header>
  );
}
