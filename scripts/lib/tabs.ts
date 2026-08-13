import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { REGION_NAMES } from './config'

export interface TabSectiune {
  nume: string
  $panel: cheerio.Cheerio<AnyNode>
}

/**
 * Scoate sectiunile cu taburi dintr-o pagina rugbyromania.ro, fiecare cu
 * numele ei adevarat.
 *
 * ## Ce mergea prost inainte
 *
 * Vechea varianta aduna titlurile intr-o lista si panourile in alta, apoi le
 * lipea dupa pozitie. Cele doua liste nu se construiau insa la fel: titlurile
 * erau FILTRATE (se pastrau doar cele care contineau „Moldova", „Muntenia" sau
 * „Transilvania"), panourile nu erau filtrate deloc.
 *
 * Pagina U18 are DOUA widgeturi de taburi — unul de play-off (Finale, Grupa A,
 * Grupa B, Play Out) si unul cu regiunile — iar fiecare isi randeaza titlurile
 * de doua ori, o data pentru desktop si o data pentru mobil. Asa incat lista de
 * titluri ajungea [Moldova, Muntenia, Transilvania, Moldova, Muntenia,
 * Transilvania], iar lista de panouri incepea cu cele patru de play-off.
 * Panoul „Play Off - Finale" primea numele „Moldova", si tot asa, decalat.
 *
 * Rezultatul nu arata a eroare: fisierul iesea plin, cu numere plauzibile, doar
 * ca puse pe regiunea gresita. In februarie U16/Muntenia avea 42 de meciuri; in
 * august aceleasi 42 apareau la Moldova. Nimic nu semnala nimic.
 *
 * ## Ce face acum
 *
 * Fiecare widget se ia separat, iar in interiorul lui titlul se leaga de panou
 * prin atributul `data-tab` — care e chiar perechea pe care o foloseste
 * Elementor ca sa stie ce arata la clic. Nu mai exista pozitie de ghicit.
 *
 * Titlurile de mobil se ignora: sunt duplicate ale celor de desktop, cu acelasi
 * `data-tab`.
 */
export function extrageTaburi($: cheerio.CheerioAPI): TabSectiune[] {
  const sectiuni: TabSectiune[] = []

  $('.elementor-tabs').each((_, widget) => {
    const $widget = $(widget)

    $widget.find('.elementor-tab-desktop-title').each((__, titlu) => {
      const $titlu = $(titlu)
      const idTab = $titlu.attr('data-tab')
      if (!idTab) return

      const nume = $titlu.text().trim()
      if (!nume) return

      const $panel = $widget.find(`.elementor-tab-content[data-tab="${idTab}"]`).first()
      if ($panel.length === 0) return

      sectiuni.push({ nume: normalizeazaNume(nume), $panel })
    })
  })

  return sectiuni
}

/**
 * „Moldova - Seria B" devine „Moldova", ca sa ramana cheile stabile intre
 * rulari. Un tab care nu e regiune (play-off, play-out) isi pastreaza numele
 * intreg: e date reale, doar ca nu regionale, si merita aratate ca atare in loc
 * sa fie inghesuite sub o eticheta care minte.
 */
function normalizeazaNume(nume: string): string {
  const regiune = REGION_NAMES.find((r) => nume.includes(r))
  if (regiune) return regiune

  // Cele doua pagini ale aceleiasi competitii isi numesc altfel taburile:
  // pagina de rezultate scrie „Play Off - Grupa A", cea de clasamente doar
  // „Grupa A". Fara sa taiem prefixul, aceeasi grupa ajunge doua chei diferite
  // si iese o sectiune cu meciuri dar fara clasament, plus una cu clasament dar
  // fara meciuri. „Play Out" ramane intreg — acolo numele e acelasi pe ambele.
  return nume.replace(/^Play\s*Off\s*[-–—]\s*/i, '').trim()
}
