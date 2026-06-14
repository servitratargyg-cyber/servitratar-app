export function abrirMailto({
  to = '',
  subject,
  body,
}: {
  to?:      string;
  subject:  string;
  body:     string;
}) {
  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = `mailto:${encodeURIComponent(to)}?${qs}`;
}
