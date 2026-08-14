/**
 * Trimite o eroare din browser catre /api/client-error.
 * Nu arunca niciodata mai departe: daca raportarea pica, pagina de eroare
 * trebuie sa ramana afisata, nu sa intre in bucla.
 */
export function reportClientError(error: Error & { digest?: string }): void {
  try {
    const body = JSON.stringify({
      message: error?.message || String(error),
      stack: error?.stack || '',
      digest: error?.digest || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })

    // keepalive, ca raportul sa plece si daca utilizatorul inchide pagina imediat
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // intentionat tacut
  }
}
