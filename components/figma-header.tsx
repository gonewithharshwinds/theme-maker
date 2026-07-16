"use client";

import GitHubIcon from "@/assets/github.svg";
import Logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { useGithubStars } from "@/hooks/use-github-stars";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/utils/format";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

interface FigmaHeaderProps {
  isScrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function FigmaHeader({ isScrolled, mobileMenuOpen, setMobileMenuOpen }: FigmaHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-lg",
        isScrolled ? "bg-background/90 border-border/20 border-b shadow-xs" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
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
          <Link href="/">
            <div className="flex items-center gap-2 font-bold">
              <Logo className="size-6" />
              <span className="hidden font-brand text-2xl tracking-wide lowercase lg:block">probablyharsh</span>
            </div>
          </Link>
        </div>

        <div className="hidden cursor-pointer items-center gap-4 md:flex">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Button variant="ghost" asChild>
              <a
                href="https://mehtaharsh.xyz"
                className="font-brand text-lg tracking-wider lowercase font-semibold"
              >
                mehtaharsh.xyz
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ThemeToggle
              variant="secondary"
              size="icon"
              className="rounded-full transition-transform hover:scale-105"
            />
          </motion.div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle variant="ghost" size="icon" />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu - simplified */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-background/95 absolute inset-x-0 top-16 border-b backdrop-blur-lg md:hidden"
        >
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="border-border/30 border-t pt-2"
            >
              <Button variant="ghost" asChild className="w-full justify-start">
                <a
                  href="https://mehtaharsh.xyz"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-brand text-lg tracking-wider lowercase"
                >
                  mehtaharsh.xyz
                </a>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
