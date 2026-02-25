import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Confidențialitate | Dinamo Rugby Juniori",
  description:
    "Politica de confidențialitate și protecția datelor personale pentru site-ul dinamorugby.ro — Secția Rugby Juniori CS Dinamo București.",
};

export default function PoliticaConfidentialitatePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Politica de Confidențialitate
          </h1>
          <p className="text-gray-300 text-lg">
            Cum colectăm, utilizăm și protejăm datele dumneavoastră personale
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500 italic mb-10">
          Ultima actualizare: 25 februarie 2026
        </p>

        <p className="text-gray-700 leading-relaxed mb-8">
          Clubul Sportiv <strong>Dinamo București — Secția Rugby Juniori</strong>{" "}
          (denumit în continuare &bdquo;Clubul&rdquo;, &bdquo;noi&rdquo; sau
          &bdquo;Operatorul&rdquo;) se angajează să protejeze
          confidențialitatea datelor dumneavoastră personale. Această politică
          descrie modul în care colectăm, utilizăm, stocăm și protejăm datele
          cu caracter personal prin intermediul site-ului{" "}
          <strong>dinamorugby.ro</strong>, în conformitate cu Regulamentul (UE)
          2016/679 (GDPR) și legislația națională aplicabilă.
        </p>

        {/* 1 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          1. Operatorul de date
        </h2>
        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>CS Dinamo București — Secția Rugby Juniori</strong><br />
            Adresă: Șoseaua Ștefan cel Mare nr. 7-9, Sector 2, București<br />
            Email: <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">gdpr@dinamorugby.ro</a><br />
            Telefon: +40 767 858 858
          </p>
        </div>

        {/* 2 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          2. Ce date personale colectăm
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Colectăm date personale în următoarele situații:
        </p>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          2.1. Prin formularul de contact
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Date colectate</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scopul prelucrării</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Temei legal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Nume complet</td>
                <td className="border border-gray-200 px-4 py-3">Identificare și personalizare comunicare</td>
                <td className="border border-gray-200 px-4 py-3">Consimțământ (Art. 6.1.a GDPR)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">Adresă de email</td>
                <td className="border border-gray-200 px-4 py-3">Răspuns la solicitare</td>
                <td className="border border-gray-200 px-4 py-3">Consimțământ (Art. 6.1.a GDPR)</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Conținutul mesajului</td>
                <td className="border border-gray-200 px-4 py-3">Procesarea solicitării</td>
                <td className="border border-gray-200 px-4 py-3">Consimțământ (Art. 6.1.a GDPR)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          2.2. Prin navigarea pe site
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Date colectate</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scopul prelucrării</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Temei legal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Adresă IP</td>
                <td className="border border-gray-200 px-4 py-3">Securitate și funcționare site</td>
                <td className="border border-gray-200 px-4 py-3">Interes legitim (Art. 6.1.f GDPR)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">Tipul browser-ului și dispozitivului</td>
                <td className="border border-gray-200 px-4 py-3">Optimizare experiență utilizator</td>
                <td className="border border-gray-200 px-4 py-3">Interes legitim (Art. 6.1.f GDPR)</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Pagini vizitate, durata vizitei</td>
                <td className="border border-gray-200 px-4 py-3">Statistici și îmbunătățire site</td>
                <td className="border border-gray-200 px-4 py-3">Consimțământ (Art. 6.1.a GDPR)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">Cookie-uri</td>
                <td className="border border-gray-200 px-4 py-3">Funcționalitate, analiză, publicitate</td>
                <td className="border border-gray-200 px-4 py-3">
                  Vezi{" "}
                  <a href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">
                    Politica de Cookies
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          2.3. Date privind sportivii minori
        </h3>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Atenție:</strong> Această secțiune se referă la datele
            colectate offline, în cadrul procesului de înscriere la club, și nu
            prin intermediul site-ului web.
          </p>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          În cadrul activității clubului, pentru înscrierea și participarea
          sportivilor minori la antrenamente și competiții, colectăm cu acordul
          părinților/tutorilor legali:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Numele și prenumele sportivului și ale părintelui/tutorelui legal;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Data nașterii sportivului;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Datele de contact ale părintelui/tutorelui (telefon, email);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Aviz medical sportiv;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Fotografii și videoclipuri de la antrenamente și competiții (cu acordul scris al părintelui/tutorelui).</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-4">
          Aceste date sunt prelucrate exclusiv pentru:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Gestionarea activității sportive (înscrierea la antrenamente și competiții);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Comunicarea cu părinții/tutorii legali;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Obligații legale față de federație și autorități sportive;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Promovarea activității clubului pe site și pe rețelele sociale (doar cu acord).</span>
          </li>
        </ul>

        {/* 3 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          3. Cui transmitem datele
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Nu vindem, nu închiriem și nu transmitem datele dumneavoastră
          personale către terți în scopuri comerciale. Datele pot fi accesate de:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Membrii echipei de conducere a clubului</strong> — antrenori și personal administrativ, strict pentru scopurile menționate;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Federația Română de Rugby</strong> — în cadrul obligațiilor de legitimare și participare la competiții;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Furnizori de servicii tehnice</strong> — hosting web, servicii email (aceștia acționează ca împuterniciți și prelucrează datele doar conform instrucțiunilor noastre);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Servicii de analiză</strong> — Google Analytics (date anonimizate, doar cu consimțământ);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Autorități publice</strong> — atunci când este impus de lege.</span>
          </li>
        </ul>

        {/* 4 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          4. Durata păstrării datelor
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Categorie de date</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durata păstrării</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Date formular de contact</td>
                <td className="border border-gray-200 px-4 py-3">Maximum 12 luni de la ultima comunicare</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">Date sportivi (înscriere club)</td>
                <td className="border border-gray-200 px-4 py-3">Pe durata activității în cadrul clubului + 3 ani după încetare</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Fotografii și videoclipuri</td>
                <td className="border border-gray-200 px-4 py-3">Până la retragerea consimțământului sau solicitarea ștergerii</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">Date de navigare (cookie-uri)</td>
                <td className="border border-gray-200 px-4 py-3">Conform duratelor din <a href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">Politica de Cookies</a></td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3">Log-uri server</td>
                <td className="border border-gray-200 px-4 py-3">Maximum 90 de zile</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          După expirarea termenelor de mai sus, datele sunt șterse sau
          anonimizate ireversibil.
        </p>

        {/* 5 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          5. Drepturile dumneavoastră
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Conform GDPR, aveți următoarele drepturi cu privire la datele
          dumneavoastră personale:
        </p>
        <ul className="space-y-3 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de acces</strong> — puteți solicita confirmarea faptului că prelucrăm datele dumneavoastră și o copie a acestora.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la rectificare</strong> — puteți solicita corectarea datelor inexacte sau completarea celor incomplete.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la ștergere</strong> — puteți solicita ștergerea datelor, în condițiile prevăzute de lege.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la restricționarea prelucrării</strong> — puteți solicita limitarea prelucrării în anumite situații.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la portabilitate</strong> — puteți solicita transferul datelor într-un format structurat, utilizat în mod curent.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la opoziție</strong> — vă puteți opune prelucrării bazate pe interes legitim.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de retragere a consimțământului</strong> — puteți retrage oricând consimțământul acordat, fără a afecta legalitatea prelucrării anterioare.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de a depune plângere</strong> — la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).</span>
          </li>
        </ul>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          Cum vă exercitați drepturile
        </h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Puteți trimite o solicitare la adresa{" "}
          <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
            gdpr@dinamorugby.ro
          </a>{" "}
          indicând:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Numele și datele de contact;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Dreptul pe care doriți să îl exercitați;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Orice detalii suplimentare care ne pot ajuta să identificăm datele vizate.</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-4">
          Vom răspunde în termen de <strong>30 de zile calendaristice</strong>.
          În cazuri complexe, termenul poate fi prelungit cu încă 60 de zile, cu
          notificarea dumneavoastră prealabilă.
        </p>

        {/* 6 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          6. Securitatea datelor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja
          datele personale, inclusiv:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Criptare SSL/TLS pentru toate comunicațiile cu site-ul;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Acces restricționat la datele personale (doar personal autorizat);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Parole criptate pentru conturile de administrare;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Actualizarea periodică a software-ului și a dependențelor;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Backup regulat al bazei de date.</span>
          </li>
        </ul>

        {/* 7 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          7. Transferuri internaționale
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Datele dumneavoastră sunt stocate pe servere situate în Uniunea
          Europeană. În cazul în care utilizăm servicii terțe care implică
          transferul datelor în afara UE/SEE (de exemplu, Google Analytics),
          ne asigurăm că sunt implementate garanții adecvate conform Art. 46
          GDPR, cum ar fi clauzele contractuale standard sau EU-U.S. Data
          Privacy Framework.
        </p>

        {/* 8 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          8. Prelucrarea datelor copiilor
        </h2>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Secțiune importantă:</strong> Activitatea clubului implică
            sportivi cu vârste între 8 și 18 ani.
          </p>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          Nu colectăm în mod intenționat date personale de la copii prin
          intermediul site-ului web. Formularul de contact este destinat
          părinților și tutorilor legali.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Datele sportivilor minori sunt colectate exclusiv offline, în
          procesul de înscriere, cu acordul explicit al părintelui/tutorelui
          legal. Conform Art. 8 GDPR și legislației române, pentru copiii sub
          16 ani, prelucrarea datelor se face doar cu consimțământul
          părintelui/tutorelui legal.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Părinții/tutorii legali pot oricând:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Solicita accesul la datele copilului lor;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Solicita rectificarea sau ștergerea datelor;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Retrage consimțământul pentru publicarea fotografiilor;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Se opune oricărei prelucrări prin email la <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">gdpr@dinamorugby.ro</a>.</span>
          </li>
        </ul>

        {/* 9 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          9. Modificări ale politicii
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Ne rezervăm dreptul de a actualiza această politică periodic. Data
          ultimei actualizări este afișată în partea de sus a paginii. Pentru
          modificări semnificative, vom afișa o notificare vizibilă pe site.
        </p>

        {/* 10 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          10. Contact și reclamații
        </h2>
        <div className="bg-red-50 border-2 border-dinamo-red rounded-lg p-6 mb-8">
          <p className="font-heading font-bold text-lg text-gray-800 mb-3">
            Responsabil protecția datelor
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Email GDPR:</strong>{" "}
              <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
                gdpr@dinamorugby.ro
              </a>
            </li>
            <li>
              <strong>Email general:</strong>{" "}
              <a href="mailto:contact@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
                contact@dinamorugby.ro
              </a>
            </li>
            <li>
              <strong>Adresă:</strong> Șoseaua Ștefan cel Mare nr. 7-9, Sector
              2, București
            </li>
            <li>
              <strong>Telefon:</strong> +40 767 858 858
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            Dacă considerați că drepturile dumneavoastră au fost încălcate,
            aveți dreptul de a depune o plângere la:<br /><br />
            <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong><br />
            Website:{" "}
            <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark">
              www.dataprotection.ro
            </a><br />
            Email: anspdcp@dataprotection.ro<br />
            Telefon: +40 318 059 211
          </p>
        </div>

        {/* Links */}
        <div className="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-500">
          <p>
            Consultați și:{" "}
            <Link href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">
              Politica de Cookies &amp; GDPR
            </Link>
            <span className="mx-2">|</span>
            <Link href="/termeni-si-conditii" className="text-dinamo-red underline hover:text-dinamo-dark">
              Termeni și Condiții
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
