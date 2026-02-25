import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termeni și Condiții | Dinamo Rugby Juniori",
  description:
    "Termenii și condițiile de utilizare a site-ului dinamorugby.ro — Secția Rugby Juniori CS Dinamo București.",
};

export default function TermeniSiConditiiPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Termeni și Condiții
          </h1>
          <p className="text-gray-300 text-lg">
            Condițiile de utilizare a site-ului dinamorugby.ro
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500 italic mb-10">
          Ultima actualizare: 25 februarie 2026
        </p>

        <p className="text-gray-700 leading-relaxed mb-8">
          Vă rugăm să citiți cu atenție acești termeni și condiții înainte de a
          utiliza site-ul <strong>dinamorugby.ro</strong>, operat de Clubul
          Sportiv <strong>Dinamo București — Secția Rugby Juniori</strong>{" "}
          (denumit în continuare &bdquo;Clubul&rdquo;, &bdquo;noi&rdquo; sau
          &bdquo;site-ul&rdquo;). Prin accesarea și utilizarea acestui site,
          confirmați că ați citit, înțeles și acceptat acești termeni în
          integralitatea lor.
        </p>

        {/* 1 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          1. Definiții
        </h2>
        <ul className="space-y-3 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>&bdquo;Site-ul&rdquo;</strong> — platforma web accesibilă la adresa dinamorugby.ro, inclusiv toate paginile, subpaginile și conținutul aferent.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>&bdquo;Utilizator&rdquo;</strong> — orice persoană fizică sau juridică care accesează și/sau utilizează site-ul.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>&bdquo;Conținut&rdquo;</strong> — orice text, imagine, fotografie, grafică, video, logo, date sau alte materiale publicate pe site.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span><strong>&bdquo;Clubul&rdquo;</strong> — CS Dinamo București — Secția Rugby Juniori, operatorul site-ului.</span>
          </li>
        </ul>

        {/* 2 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          2. Acceptarea termenilor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Prin accesarea site-ului dinamorugby.ro, sunteți de acord cu acești
          termeni și condiții. Dacă nu sunteți de acord cu oricare dintre
          prevederile de mai jos, vă rugăm să nu utilizați site-ul.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Ne rezervăm dreptul de a modifica acești termeni în orice moment, fără
          notificare prealabilă. Modificările intră în vigoare imediat după
          publicarea lor pe site. Continuarea utilizării site-ului după
          publicarea modificărilor constituie acceptarea noilor termeni.
        </p>

        {/* 3 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          3. Scopul site-ului
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Site-ul dinamorugby.ro are ca scop principal:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Prezentarea activității Secției de Rugby Juniori a CS Dinamo București;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Informarea publicului despre echipele de juniori (U10, U12, U14, U16, U18), antrenori, programul de antrenamente și calendarul competițional;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Publicarea de știri, povești și galerii foto din activitatea clubului;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Facilitarea contactului între părinți, sportivi și club.</span>
          </li>
        </ul>

        {/* 4 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          4. Proprietate intelectuală
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Întregul conținut al site-ului — inclusiv, dar fără a se limita la
          texte, fotografii, imagini, logo-uri, grafică, videoclipuri, design și
          structura site-ului — este proprietatea CS Dinamo București sau este
          utilizat cu acordul titularilor drepturilor de autor și este protejat
          de legislația română și internațională privind drepturile de autor și
          proprietatea intelectuală.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Este interzisă reproducerea, distribuirea, modificarea, afișarea
          publică sau exploatarea în orice mod a conținutului site-ului fără
          acordul scris prealabil al Clubului, cu excepția utilizării personale,
          necomerciale.
        </p>
        <div className="bg-blue-50 border-l-4 border-dinamo-red p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Logo-urile și emblemele</strong> CS Dinamo București sunt
            mărci înregistrate și nu pot fi utilizate fără autorizare explicită.
          </p>
        </div>

        {/* 5 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          5. Utilizarea site-ului
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Utilizatorii se obligă să folosească site-ul în conformitate cu
          legislația în vigoare și cu prezentii termeni. Este interzis:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Utilizarea site-ului în scopuri ilegale, frauduloase sau care pot aduce prejudicii Clubului sau terților;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Încercarea de a obține acces neautorizat la sistemele informatice ale site-ului;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Transmiterea de conținut ofensator, defăimător, obscen sau ilegal prin intermediul formularelor de contact;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Colectarea automată de date de pe site (scraping, crawling) fără acordul Clubului;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Introducerea de viruși, malware sau alt cod dăunător.</span>
          </li>
        </ul>

        {/* 6 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          6. Fotografii și imagini cu minori
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Site-ul poate conține fotografii și videoclipuri de la antrenamente,
          meciuri și alte evenimente sportive în care apar sportivi minori.
          Aceste materiale sunt publicate exclusiv în scopuri informative și
          promoționale legate de activitatea clubului.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Publicarea fotografiilor se face cu acordul părinților/tutorilor
          legali, obținut la momentul înscrierii sportivilor în cadrul clubului.
          Părinții/tutorii legali au dreptul de a solicita oricând eliminarea
          fotografiilor în care apar copiii lor, prin trimiterea unei cereri la
          adresa{" "}
          <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
            gdpr@dinamorugby.ro
          </a>.
        </p>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r mb-6">
          <p className="text-gray-700 text-sm">
            <strong>Important:</strong> Este strict interzisă descărcarea,
            redistribuirea sau utilizarea în orice alt scop a fotografiilor cu
            minori publicate pe acest site fără acordul scris al Clubului și al
            părinților/tutorilor legali.
          </p>
        </div>

        {/* 7 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          7. Formularul de contact
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Site-ul pune la dispoziție un formular de contact prin care
          utilizatorii pot trimite mesaje echipei Clubului. Datele furnizate
          prin acest formular (nume, adresă de email, mesaj) sunt utilizate
          exclusiv pentru a răspunde solicitărilor primite și nu sunt transmise
          către terți.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Prin trimiterea unui mesaj prin formularul de contact, confirmați că
          informațiile furnizate sunt corecte și că sunteți de acord cu
          prelucrarea acestora conform{" "}
          <Link href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">
            Politicii de Cookies &amp; GDPR
          </Link>.
        </p>

        {/* 8 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          8. Linkuri către site-uri terțe
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Site-ul poate conține link-uri către site-uri web terțe (de exemplu,
          Facebook, Federația Română de Rugby, alte cluburi etc.). Aceste
          link-uri sunt furnizate exclusiv pentru comoditatea utilizatorilor.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Clubul nu controlează și nu este responsabil pentru conținutul,
          politicile de confidențialitate sau practicile site-urilor terțe. Vă
          recomandăm să citiți termenii și politicile de confidențialitate ale
          oricărui site terț pe care îl accesați.
        </p>

        {/* 9 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          9. Limitarea răspunderii
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Conținutul site-ului este furnizat &bdquo;așa cum este&rdquo;, fără
          garanții de niciun fel, explicite sau implicite. Clubul depune
          eforturi rezonabile pentru a menține informațiile de pe site corecte și
          actualizate, însă nu garantează:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Exactitatea, completitudinea sau actualitatea informațiilor publicate (inclusiv programul de antrenamente, rezultatele meciurilor sau componența echipelor);</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Disponibilitatea neîntreruptă a site-ului;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Absența erorilor tehnice sau a vulnerabilităților de securitate.</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-4">
          Clubul nu va fi responsabil pentru niciun prejudiciu direct, indirect,
          accidental sau consecvent rezultat din utilizarea sau imposibilitatea
          utilizării site-ului.
        </p>

        {/* 10 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          10. Disponibilitatea site-ului
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Ne rezervăm dreptul de a modifica, suspenda sau întrerupe, temporar
          sau permanent, funcționarea site-ului sau a oricărei părți a acestuia,
          cu sau fără notificare prealabilă. Clubul nu va fi răspunzător față de
          utilizatori sau terți pentru orice modificare, suspendare sau
          întrerupere a site-ului.
        </p>

        {/* 11 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          11. Protecția datelor personale
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Prelucrarea datelor dumneavoastră personale este reglementată de{" "}
          <Link href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">
            Politica de Cookies &amp; GDPR
          </Link>
          , care face parte integrantă din acești Termeni și Condiții. Vă rugăm
          să o consultați pentru informații detaliate privind:
        </p>
        <ul className="space-y-2 text-gray-700 mb-6">
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Ce date colectăm și cum le utilizăm;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Drepturile dumneavoastră conform GDPR;</span>
          </li>
          <li className="flex gap-2">
            <span className="text-dinamo-red font-bold">—</span>
            <span>Cum puteți exercita aceste drepturi.</span>
          </li>
        </ul>

        {/* 12 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          12. Legislație aplicabilă și jurisdicție
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Acești termeni și condiții sunt guvernați de legislația din România.
          Orice litigiu apărut în legătură cu utilizarea site-ului va fi
          soluționat pe cale amiabilă. În cazul în care nu se ajunge la o
          înțelegere, litigiul va fi supus spre soluționare instanțelor
          judecătorești competente din București, România.
        </p>

        {/* 13 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          13. Modificarea termenilor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Clubul își rezervă dreptul de a actualiza sau modifica acești Termeni
          și Condiții în orice moment. Data ultimei actualizări va fi afișată în
          partea de sus a acestei pagini. Vă recomandăm să consultați periodic
          această pagină pentru a fi la curent cu eventualele modificări.
        </p>

        {/* 14 */}
        <h2 className="font-heading text-2xl font-bold text-dinamo-red mt-12 mb-4 border-b-2 border-dinamo-red pb-2">
          14. Contact
        </h2>
        <div className="bg-red-50 border-2 border-dinamo-red rounded-lg p-6 mb-8">
          <p className="font-heading font-bold text-lg text-gray-800 mb-3">
            Clubul Sportiv Dinamo Rugby
          </p>
          <p className="text-gray-700 mb-4">
            Pentru orice întrebări sau clarificări legate de acești termeni și
            condiții, ne puteți contacta la:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Adresă:</strong> Șoseaua Ștefan cel Mare nr. 7-9, Sector
              2, București
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
                contact@dinamorugby.ro
              </a>
            </li>
            <li>
              <strong>Email GDPR:</strong>{" "}
              <a href="mailto:gdpr@dinamorugby.ro" className="text-dinamo-red underline hover:text-dinamo-dark">
                gdpr@dinamorugby.ro
              </a>
            </li>
            <li>
              <strong>Telefon:</strong> +40 767 858 858
            </li>
          </ul>
        </div>

        {/* Links */}
        <div className="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-500">
          <p>
            Consultați și{" "}
            <Link href="/politica-cookies-gdpr" className="text-dinamo-red underline hover:text-dinamo-dark">
              Politica de Cookies &amp; GDPR
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
