"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { bookingPagePath, brand, caseStudies, navItems, services } from "@/data/site";
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

  return (
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
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ),
          )}
        </NavigationMenuList>
      </NavigationMenu>
      <Link className="header-cta" href={bookingPagePath}>
        {brand.bookingLabel}
        <ArrowUpRight aria-hidden="true" size={16} />
      </Link>
    </header>
  );
}
