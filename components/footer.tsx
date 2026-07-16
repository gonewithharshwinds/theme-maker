import Link from "next/link";
import Logo from "@/assets/logo.svg";
import GitHubIcon from "@/assets/github.svg";
import TwitterIcon from "@/assets/twitter.svg";
import DiscordIcon from "@/assets/discord.svg";

export function Footer() {
  return (
    <footer className="bg-background/95 w-full border-t backdrop-blur-sm">
      <div className="container mx-auto flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 max-w-md space-y-4">
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
              <Link href="/" className="flex items-center gap-2 font-bold">
                <Logo className="size-6" />
                <span className="font-brand text-2xl tracking-wide lowercase">probablyharsh</span>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              A powerful visual theme editor for shadcn/ui components with Tailwind CSS support.
              Customized by mehtaharsh.xyz.
            </p>
            <div className="flex gap-4">
              <a
                href="https://mehtaharsh.xyz"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-brand tracking-widest lowercase"
              >
                mehtaharsh.xyz
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Examples
                </Link>
              </li>
              <li>
                <Link
                  href="/#roadmap"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://mehtaharsh.xyz"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  mehtaharsh.xyz
                </a>
              </li>
              <li>
                <a
                  href="https://mehtaharsh.xyz"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://mehtaharsh.xyz"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border/40 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} probablyharsh. All rights reserved. | mehtaharsh.xyz
          </p>
          <p className="text-muted-foreground text-xs">
            <Link href="/privacy-policy">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
