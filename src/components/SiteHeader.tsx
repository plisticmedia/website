"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Compass, LayoutDashboard, LogIn, Menu, Sparkles, Store, X } from "lucide-react";
import { bookingPagePath, brand, navItems } from "@/data/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function SiteHeader() {
  const [activeMenu, setActiveMenu] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  // null = still checking; used to avoid a sign-in/dashboard flash.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes. This is the reliable
  // close signal — closing only in each link's onClick can unmount the tapped
  // link mid-navigation on mobile, which can swallow the tap.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (active) setSignedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Dashboard" : "Sign in";
  const AccountIcon = signedIn ? LayoutDashboard : LogIn;

  return (
    <>
      <header className="site-header">
      <Link className="brand-mark" href="/#top" aria-label="Plistic home">
        <Image
          src="/assets/brand/plistic-media.png"
          alt=""
          width={170}
          height={78}
          priority
          style={{ width: "100%", height: "auto" }}
        />
      </Link>
      <NavigationMenu
        className="primary-nav"
        aria-label="Primary navigation"
        value={activeMenu}
        onValueChange={setActiveMenu}
        viewport={false}
      >
        <NavigationMenuList className="primary-nav-list">
          {navItems.slice(1).map((item) => {
            const HighlightIcon = item.icon === "sparkles" ? Sparkles : Compass;

            // Grouped item → dropdown menu.
            if (item.children && item.children.length > 0) {
              const menuKey = item.href;
              return (
                <NavigationMenuItem
                  className="nav-mega"
                  key={item.href}
                  value={menuKey}
                  onPointerEnter={() => setActiveMenu(menuKey)}
                  onPointerLeave={() => setActiveMenu("")}
                  onFocus={() => setActiveMenu(menuKey)}
                  onBlur={(event) => {
                    const nextFocus = event.relatedTarget instanceof Node ? event.relatedTarget : null;
                    if (!event.currentTarget.contains(nextFocus)) {
                      setActiveMenu("");
                    }
                  }}
                >
                  <NavigationMenuTrigger
                    className={item.highlight ? "nav-mega-trigger nav-trigger-pill" : "nav-mega-trigger"}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveMenu((current) => (current === menuKey ? "" : menuKey));
                    }}
                  >
                    {item.highlight && <HighlightIcon aria-hidden="true" size={15} />}
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" size={13} />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="nav-drop-panel" forceMount>
                    {item.children.map((child) => (
                      <NavigationMenuLink asChild key={child.href}>
                        <Link className="nav-drop-link" href={child.href}>
                          <strong>{child.label}</strong>
                          {child.description && <span>{child.description}</span>}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            }

            // Plain / highlighted single link.
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link href={item.href} className={item.highlight ? "nav-directory" : undefined}>
                    {item.highlight && <HighlightIcon aria-hidden="true" size={15} />}
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="header-actions">
        <Link className="header-account" href={accountHref}>
          <AccountIcon aria-hidden="true" size={16} />
          <span>{accountLabel}</span>
        </Link>
        <Link className="header-cta" href={bookingPagePath}>
          {brand.bookingLabel}
          <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
        <button
          type="button"
          className="header-burger"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </div>
      </header>

      {mobileOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mobile-menu-backdrop" onClick={() => setMobileOpen(false)} />
          <nav className="mobile-menu-panel" aria-label="Mobile navigation">
            <div className="mobile-menu-head">
              <span>Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X aria-hidden="true" size={22} />
              </button>
            </div>
            <ul className="mobile-menu-list">
              {navItems.map((item) => {
                const HighlightIcon = item.icon === "sparkles" ? Sparkles : Compass;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={item.highlight ? "mobile-nav-directory" : undefined}
                    >
                      {item.highlight && <HighlightIcon aria-hidden="true" size={18} />}
                      {item.label}
                    </Link>
                    {item.children && item.children.length > 0 && (
                      <ul className="mobile-submenu">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} onClick={() => setMobileOpen(false)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mobile-menu-foot">
              <Link href="/list-your-business" className="p-btn p-btn--ghost" onClick={() => setMobileOpen(false)}>
                <Store aria-hidden="true" size={18} /> List your business
              </Link>
              <Link href={accountHref} className="p-btn p-btn--ghost" onClick={() => setMobileOpen(false)}>
                <AccountIcon aria-hidden="true" size={18} /> {accountLabel}
              </Link>
              <Link href={bookingPagePath} className="p-btn" onClick={() => setMobileOpen(false)}>
                {brand.bookingLabel} <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
