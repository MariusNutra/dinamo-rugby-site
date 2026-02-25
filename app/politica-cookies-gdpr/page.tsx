import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Cookies & GDPR | Dinamo Rugby Juniori",
  description:
    "Politica de utilizare cookies și protecția datelor personale (GDPR) pentru site-ul dinamorugby.ro — Secția Rugby Juniori CS Dinamo București.",
};

export default function PoliticaCookiesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Politica de Cookies & GDPR
          </h1>
          <p className="text-gray-300 text-lg">
            Transparență și respect pentru datele tale personale
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500 italic mb-10">
          Ultima actualizare: 25 februarie 2026
        </p>

        <p className="text-gray-700 leading-relaxed mb-8">
          Clubul Sportiv <strong>Dinamo Rugby</strong> (denumit în continuare
          &bdquo;noi&rdquo;, &bdquo;Clubul&rdquo; sau &bdquo;dinamorugby.ro&rdquo;) respectă confidențialitatea
          datelor dumneavoastră personale. Această pagină explică modul în care
          utilizăm cookie-urile pe site-ul{" "}
          <strong>dinamorugby.ro</strong> și drepturile pe care le aveți conform
          Regulamentului General privind Protecția Datelor (GDPR — Regulamentul
          UE 2016/679).
        </p>

        {/* 1 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          1. Ce sunt cookie-urile?
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Cookie-urile sunt fișiere text de mici dimensiuni care sunt stocate pe
          dispozitivul dumneavoastră (computer, telefon, tabletă) atunci când
          vizitați un site web. Acestea permit site-ului să vă recunoască
          dispozitivul și să rețină anumite informații despre vizita
          dumneavoastră, cum ar fi preferințele de limbă sau dacă ați acceptat
          sau nu politica de cookies.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Cookie-urile <strong>nu pot</strong> accesa alte date de pe
          dispozitivul dumneavoastră, nu instalează programe și nu conțin
          viruși.
        </p>

        {/* 2 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          2. Tipuri de cookie-uri
        </h2>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          2.1. După durată
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Tip</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Descriere</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-semibold">Cookie-uri de sesiune</td>
                <td className="border border-gray-200 px-4 py-3">Sunt temporare și se șterg automat când închideți browser-ul.</td>
                <td className="border border-gray-200 px-4 py-3">Până la închiderea browser-ului</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-semibold">Cookie-uri persistente</td>
                <td className="border border-gray-200 px-4 py-3">Rămân pe dispozitiv pentru o perioadă determinată sau până când le ștergeți manual.</td>
                <td className="border border-gray-200 px-4 py-3">De la 30 de zile la 2 ani</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          2.2. După proveniență
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Tip</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Descriere</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-semibold">Cookie-uri first-party</td>
                <td className="border border-gray-200 px-4 py-3">Sunt setate direct de site-ul dinamorugby.ro.</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-semibold">Cookie-uri third-party (terți)</td>
                <td className="border border-gray-200 px-4 py-3">Sunt setate de servicii externe integrate pe site-ul nostru (Google Analytics, Facebook, YouTube etc.).</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          3. Cookie-urile utilizate pe dinamorugby.ro
        </h2>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          3.1. Cookie-uri strict necesare
        </h3>
        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-4">
          <p className="text-gray-700 text-sm">
            Aceste cookie-uri sunt esențiale pentru funcționarea site-ului și nu
            pot fi dezactivate. Nu colectează informații personale identificabile.
          </p>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Cookie</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scop</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">admin_token</td>
                <td className="border border-gray-200 px-4 py-3">Autentificare zona de administrare</td>
                <td className="border border-gray-200 px-4 py-3">7 zile</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">dinamo_cookie_consent</td>
                <td className="border border-gray-200 px-4 py-3">Stochează alegerea dumneavoastră privind cookie-urile</td>
                <td className="border border-gray-200 px-4 py-3">365 zile</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          3.2. Cookie-uri de performanță și analiză
        </h3>
        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-4">
          <p className="text-gray-700 text-sm">
            Ne ajută să înțelegem cum interacționează vizitatorii cu site-ul
            nostru, permițându-ne să îl îmbunătățim.
          </p>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Cookie</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Furnizor</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scop</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">_ga</td>
                <td className="border border-gray-200 px-4 py-3">Google Analytics</td>
                <td className="border border-gray-200 px-4 py-3">Identifică vizitatorii unici</td>
                <td className="border border-gray-200 px-4 py-3">2 ani</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">_ga_*</td>
                <td className="border border-gray-200 px-4 py-3">Google Analytics</td>
                <td className="border border-gray-200 px-4 py-3">Menține starea sesiunii</td>
                <td className="border border-gray-200 px-4 py-3">2 ani</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">_gid</td>
                <td className="border border-gray-200 px-4 py-3">Google Analytics</td>
                <td className="border border-gray-200 px-4 py-3">Identifică vizitatorii pe parcursul unei zile</td>
                <td className="border border-gray-200 px-4 py-3">24 ore</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          3.3. Cookie-uri de geotargeting și funcționalitate
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Cookie</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Furnizor</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scop</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">VISITOR_INFO1_LIVE</td>
                <td className="border border-gray-200 px-4 py-3">YouTube</td>
                <td className="border border-gray-200 px-4 py-3">Estimează lățimea de bandă pentru videoclipuri</td>
                <td className="border border-gray-200 px-4 py-3">6 luni</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">YSC</td>
                <td className="border border-gray-200 px-4 py-3">YouTube</td>
                <td className="border border-gray-200 px-4 py-3">ID unic pentru statistici video</td>
                <td className="border border-gray-200 px-4 py-3">Sesiune</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">NID</td>
                <td className="border border-gray-200 px-4 py-3">Google Maps</td>
                <td className="border border-gray-200 px-4 py-3">Preferințe hartă embed</td>
                <td className="border border-gray-200 px-4 py-3">6 luni</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          3.4. Cookie-uri de publicitate și social media
        </h3>
        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-4">
          <p className="text-gray-700 text-sm">
            Sunt folosite pentru a vă afișa reclame relevante și pentru
            integrarea cu rețelele sociale.
          </p>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-dinamo-red text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">Cookie</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Furnizor</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Scop</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">_fbp</td>
                <td className="border border-gray-200 px-4 py-3">Facebook (Meta)</td>
                <td className="border border-gray-200 px-4 py-3">Identificare vizitatori pentru publicitate</td>
                <td className="border border-gray-200 px-4 py-3">3 luni</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">fr</td>
                <td className="border border-gray-200 px-4 py-3">Facebook (Meta)</td>
                <td className="border border-gray-200 px-4 py-3">Reclame targetate pe Facebook</td>
                <td className="border border-gray-200 px-4 py-3">3 luni</td>
              </tr>
              <tr className="bg-white">
                <td className="border border-gray-200 px-4 py-3 font-mono text-xs">IDE</td>
                <td className="border border-gray-200 px-4 py-3">Google (DoubleClick)</td>
                <td className="border border-gray-200 px-4 py-3">Publicitate targetată Google Ads</td>
                <td className="border border-gray-200 px-4 py-3">1 an</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          4. Drepturile dumneavoastră conform GDPR
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Conform Regulamentului General privind Protecția Datelor (GDPR), aveți
          următoarele drepturi:
        </p>
        <ul className="space-y-3 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la informare</strong> — să fiți informat despre modul în care vă sunt prelucrate datele personale.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de acces</strong> — să solicitați o copie a datelor personale pe care le deținem despre dumneavoastră.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la rectificare</strong> — să solicitați corectarea datelor inexacte sau incomplete.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la ștergere (&ldquo;dreptul de a fi uitat&rdquo;)</strong> — să solicitați ștergerea datelor personale, în anumite condiții.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la restricționarea prelucrării</strong> — să solicitați limitarea modului în care vă prelucrăm datele.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la portabilitatea datelor</strong> — să primiți datele într-un format structurat, utilizat în mod curent și care poate fi citit automat.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul la opoziție</strong> — să vă opuneți prelucrării datelor în anumite situații, inclusiv în scopuri de marketing direct.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de a nu fi supus unei decizii automate</strong> — inclusiv crearea de profiluri care produc efecte juridice.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Dreptul de a depune o plângere</strong> — la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).</span>
          </li>
        </ul>

        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Autoritatea Națională de Supraveghere (ANSPDCP)</strong><br />
            Website:{" "}
            <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark">
              www.dataprotection.ro
            </a><br />
            Email: anspdcp@dataprotection.ro<br />
            Telefon: +40 318 059 211
          </p>
        </div>

        {/* 5 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          5. Cum puteți controla cookie-urile
        </h2>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          5.1. Prin banner-ul nostru de consimțământ
        </h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          La prima vizită pe site-ul nostru, veți vedea un banner care vă
          permite să acceptați toate cookie-urile sau doar pe cele strict
          necesare. Puteți modifica oricând alegerea ștergând cookie-urile din
          browser și revenind pe site.
        </p>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          5.2. Prin setările browser-ului
        </h3>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Google Chrome
            </a>{" "}
            — Gestionare cookie-uri
          </li>
          <li>
            <a href="https://support.mozilla.org/ro/kb/activarea-si-dezactivarea-cookie-urilor" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Mozilla Firefox
            </a>{" "}
            — Activarea și dezactivarea cookie-urilor
          </li>
          <li>
            <a href="https://support.apple.com/ro-ro/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Apple Safari
            </a>{" "}
            — Gestionare cookie-uri
          </li>
          <li>
            <a href="https://support.microsoft.com/ro-ro/microsoft-edge/gestionarea-cookie-urilor-in-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Microsoft Edge
            </a>{" "}
            — Gestionare cookie-uri
          </li>
        </ul>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Atenție:</strong> Dezactivarea cookie-urilor poate afecta
            funcționalitatea anumitor secțiuni ale site-ului.
          </p>
        </div>

        <h3 className="font-heading text-lg font-bold text-gray-800 mt-6 mb-3">
          5.3. Prin platforme de opt-out
        </h3>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li>
            <a href="https://www.youronlinechoices.com/ro/" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Your Online Choices
            </a>{" "}
            — Gestionează preferințele de publicitate online
          </li>
          <li>
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Google Analytics Opt-Out
            </a>{" "}
            — Extensie browser pentru dezactivarea Google Analytics
          </li>
          <li>
            <a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Facebook — Setări reclame
            </a>
          </li>
          <li>
            <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-dinamo-red underline hover:text-dinamo-dark font-semibold">
              Network Advertising Initiative
            </a>
          </li>
        </ul>

        {/* 6 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          6. Temeiul legal pentru prelucrarea datelor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Prelucrăm datele dumneavoastră pe baza următoarelor temeiuri legale,
          conform Art. 6 GDPR:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Consimțământul</strong> (Art. 6 alin. 1 lit. a) — pentru cookie-urile de analiză, publicitate și social media.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>Interesul legitim</strong> (Art. 6 alin. 1 lit. f) — pentru cookie-urile strict necesare funcționării site-ului.</span>
          </li>
        </ul>

        {/* 7 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          7. Transferul datelor în afara UE/SEE
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Unele servicii terțe pe care le folosim (Google, Facebook/Meta) pot
          transfera date în afara Spațiului Economic European, în special către
          SUA. Aceste transferuri sunt protejate prin:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>EU-U.S. Data Privacy Framework;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Clauze contractuale standard aprobate de Comisia Europeană;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Alte garanții adecvate conform Art. 46 GDPR.</span>
          </li>
        </ul>

        {/* 8 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          8. Păstrarea datelor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Datele colectate prin cookie-uri sunt păstrate conform duratelor
          menționate în tabelele de mai sus. Datele personale colectate prin
          formulare de contact sau înscriere sunt păstrate doar atât timp cât
          este necesar scopului pentru care au fost colectate sau conform
          obligațiilor legale aplicabile.
        </p>

        {/* 9 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          9. Securitatea datelor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Luăm măsuri tehnice și organizatorice adecvate pentru a proteja datele
          dumneavoastră personale împotriva accesului neautorizat, pierderii sau
          distrugerii, inclusiv:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Certificat SSL/TLS (HTTPS) pe întregul site;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Actualizarea regulată a platformei și a dependențelor;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Limitarea accesului la datele personale doar la persoanele autorizate.</span>
          </li>
        </ul>

        {/* 10 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          10. Modificări ale acestei politici
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Ne rezervăm dreptul de a actualiza această politică periodic. Data
          ultimei actualizări este afișată în partea de sus a acestei pagini. Vă
          recomandăm să verificați această pagină periodic.
        </p>

        {/* 11 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          11. Contact
        </h2>
        <div className="bg-red-50 border-2 border-dinamo-red rounded-lg p-6 mb-8">
          <p className="font-heading font-bold text-lg text-gray-800 mb-3">
            Clubul Sportiv Dinamo Rugby
          </p>
          <p className="text-gray-700 mb-4">
            Pentru orice întrebări sau solicitări legate de cookie-uri, protecția
            datelor personale sau exercitarea drepturilor dumneavoastră GDPR, ne
            puteți contacta la:
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
              <strong>Website:</strong>{" "}
              <Link href="/" className="text-dinamo-red underline hover:text-dinamo-dark">
                dinamorugby.ro
              </Link>
            </li>
          </ul>
          <p className="text-gray-600 text-sm mt-4">
            Vom răspunde solicitărilor dumneavoastră în termen de maximum{" "}
            <strong>30 de zile calendaristice</strong> de la primirea acestora,
            conform cerințelor GDPR.
          </p>
        </div>
      </section>
    </div>
  );
}
