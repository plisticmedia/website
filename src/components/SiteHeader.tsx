"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Compass, LayoutDashboard, LogIn, Menu, Sparkles, Store, X } from "lucide-react";
import { bookingPagePath, brand, caseStudies, navItems, services } from "@/data/site";
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
          {navItems.slice(1).map((item) =>
            item.label === "Services" ? (
              <NavigationMenuItem
                className="nav-mega"
                key={item.href}
                value="services"
                onPointerEnter={() => setActiveMenu("services")}
                onPointerLeave={() => setActiveMenu("")}
                onFocus={() => setActiveMenu("services")}
                onBlur={(event) => {
                  const nextFocus = event.relatedTarget instanceof Node ? event.relatedTarget : null;

                  if (!event.currentTarget.contains(nextFocus)) {
                    setActiveMenu("");
                  }
                }}
              >
                <NavigationMenuTrigger
                  className="nav-mega-trigger"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveMenu((current) => (current === "services" ? "" : "services"));
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronDown aria-hidden="true" size={13} />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="nav-mega-panel" forceMount>
                  <div className="nav-mega-head">
                    <p>Services</p>
                  </div>
                  <div className="nav-mega-grid">
                    {services.map((service, index) => {
                      const href = service.href ?? item.href;

                      return (
                        <NavigationMenuLink asChild key={service.title}>
                          <Link className="nav-mega-card" href={href} aria-label={`${service.title} service`}>
                            <span className="nav-mega-num">
                              {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                            </span>
                            <strong>{service.title}</strong>
                            <span>{service.summary}</span>
                          </Link>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : item.label === "Our Work" ? (
              <NavigationMenuItem
                className="nav-mega"
                key={item.href}
                value="work"
                onPointerEnter={() => setActiveMenu("work")}
                onPointerLeave={() => setActiveMenu("")}
                onFocus={() => setActiveMenu("work")}
                onBlur={(event) => {
                  const nextFocus = event.relatedTarget instanceof Node ? event.relatedTarget : null;

                  if (!event.currentTarget.contains(nextFocus)) {
                    setActiveMenu("");
                  }
                }}
              >
                <NavigationMenuTrigger
                  className="nav-mega-trigger"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveMenu((current) => (current === "work" ? "" : "work"));
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronDown aria-hidden="true" size={13} />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="nav-mega-panel" forceMount>
                  <div className="nav-mega-head">
                    <p>Selected work</p>
                  </div>
                  <div className="nav-mega-grid">
                    {caseStudies.map((study, index) => {
                      const href = study.href ?? item.href;

                      return (
                        <NavigationMenuLink asChild key={study.client}>
                          <Link className="nav-mega-card" href={href} aria-label={`${study.client} case study`}>
                            <span className="nav-mega-num">
                              {String(index + 1).padStart(2, "0")} / {String(caseStudies.length).padStart(2, "0")}
                            </span>
                            <strong>{study.client}</strong>
                            <span>
                              {study.service} - {study.description}
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link href={item.href} className={item.highlight ? "nav-directory" : undefined}>
                    {item.highlight &&
                      (item.href === "/showcase" ? (
                        <Sparkles aria-hidden="true" size={15} />
                      ) : (
                        <Compass aria-hidden="true" size={15} />
                      ))}
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ),
          )}
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
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={item.highlight ? "mobile-nav-directory" : undefined}
                  >
                    {item.highlight &&
                      (item.href === "/showcase" ? (
                        <Sparkles aria-hidden="true" size={18} />
                      ) : (
                        <Compass aria-hidden="true" size={18} />
                      ))}
                    {item.label}
                  </Link>
                </li>
              ))}
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
