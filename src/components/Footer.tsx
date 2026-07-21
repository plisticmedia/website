import Image from "next/image";
import Link from "next/link";
import { brand, services } from "@/data/site";

// Explicit footer list (not derived from the header nav, so restructuring the
// header dropdowns never silently drops footer links).
const companyLinks = [
  { label: "Media Directory", href: "/directory" },
  { label: "Compare Prices", href: "/compare" },
  { label: "Scotland's Showcase", href: "/showcase" },
  { label: "List Your Business", href: "/list-your-business" },
  { label: "Pricing", href: "/pricing" },
  { label: "Earn With Us", href: "/earn" },
  { label: "About", href: "/about" },
];
const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="footer-logo-link" href="/#top" aria-label="Plistic home">
              <Image
                src="/assets/brand/plistic-media.png"
                alt="Plistic Media"
                width={260}
                height={120}
                loading="eager"
                className="footer-logo"
              />
            </Link>
            <p className="footer-note">Glasgow-based. Recording across the UK and internationally.</p>
          </div>
          <nav className="footer-column" aria-labelledby="footer-services-title">
            <h2 id="footer-services-title">Services</h2>
            {services.map((service) => (
              <Link key={service.title} href={service.href ?? "/#services"}>
                {service.title}
              </Link>
            ))}
          </nav>

          <nav className="footer-column" aria-labelledby="footer-company-title">
            <h2 id="footer-company-title">Company</h2>
            {companyLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Plistic. All rights reserved.</p>
          <div>
            <Link href="/#top">Back to top</Link>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
