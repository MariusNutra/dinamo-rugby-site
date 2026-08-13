/**
 * Clubul are DOUA adrese, si nu inseamna acelasi lucru.
 *
 * Sediul social e cel din actele asociatiei — un apartament in Sector 3. Acolo
 * nu se antreneaza nimeni si nu se prezinta nimeni; e adresa la care raspunde
 * asociatia in fata legii, si trebuie sa apara in paginile legale.
 *
 * Adresa de contact e stadionul Dinamo, unde chiar au loc antrenamentele si
 * unde vine un parinte care intreaba „unde va gasim". Pana la 13.08.2026,
 * pagina de contact arata sediul social langa o harta care indica stadionul —
 * doua raspunsuri diferite la aceeasi intrebare, pe acelasi ecran.
 *
 * De aceea stau amandoua aici, cu nume care spun ce sunt: cine adauga maine o
 * pagina noua nu mai are ce sa ghiceasca.
 */

/** Unde se vine: complexul sportiv Dinamo. */
export const ADRESA_CONTACT = {
  strada: 'Șos. Ștefan cel Mare nr. 7-9',
  sector: 'Sector 2',
  oras: 'București',
  intreaga: 'Șos. Ștefan cel Mare nr. 7-9, Sector 2, București',
  scurta: 'Stadionul Dinamo, Șos. Ștefan cel Mare 7-9',
} as const

/** Ce scrie in acte: sediul social al asociatiei. */
export const SEDIU_SOCIAL = {
  intreaga: 'Bd. Camil Ressu nr. 2, bl. R1, sc. 1, et. 5, ap. 18, Sector 3, București',
} as const
