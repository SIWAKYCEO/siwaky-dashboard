"use client";

import { useState } from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps every halal-cert download link.
 * On click: HEAD-checks /halal-cert.pdf before letting the browser download.
 * If the file is missing (404), shows an inline Arabic message instead of a blank error page.
 */
export default function HalalCertDownload({ className, children }: Props) {
  const [status, setStatus] = useState<"idle" | "checking" | "unavailable">("idle");

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("checking");

    try {
      const res = await fetch("/halal-cert.pdf", { method: "HEAD" });
      if (res.ok) {
        // File exists — trigger download programmatically
        const a = document.createElement("a");
        a.href = "/halal-cert.pdf";
        a.download = "SIWAKY_Halal_Certificate.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setStatus("idle");
      } else {
        setStatus("unavailable");
      }
    } catch {
      setStatus("unavailable");
    }
  };

  if (status === "unavailable") {
    return (
      <span className={className} style={{ opacity: 0.55, cursor: "default" }}>
        الشهادة ستكون متاحة قريباً
      </span>
    );
  }

  return (
    <a
      href="/halal-cert.pdf"
      download="SIWAKY_Halal_Certificate.pdf"
      className={className}
      onClick={handleClick}
    >
      {status === "checking" ? "..." : children}
    </a>
  );
}
