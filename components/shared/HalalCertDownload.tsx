interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function HalalCertDownload({ className, children }: Props) {
  return (
    <a
      href="/halal-cert.pdf"
      download="SIWAKY_Halal_Certificate.pdf"
      className={className}
    >
      {children ?? "تحميل شهادة الحلال"}
    </a>
  );
}
