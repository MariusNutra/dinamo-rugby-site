export const metadata = {
  title: 'Staff Tehnic — Dinamo Rugby Juniori',
  description: 'Staff-ul tehnic al secției de juniori rugby CS Dinamo București.',
}

const TrophyIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

const MedalIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2" /><path d="m13 12 5.88-9.8" /><path d="M8 7h8" />
    <circle cx="12" cy="17" r="5" /><path d="M12 18v-2h-.5" />
  </svg>
)

const WhistleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6h8a2 2 0 0 0 2-2v-4a6 6 0 0 0-6-6h-4Z" />
    <path d="M2 10h4" /><circle cx="16" cy="12" r="1" />
  </svg>
)

function getIcon(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('campion') || lower.includes('câștigător') || lower.includes('cup'))
    return <TrophyIcon />
  if (lower.includes('internațional') || lower.includes('mondial') || lower.includes('național'))
    return <GlobeIcon />
  if (lower.includes('antrenor') || lower.includes('secund') || lower.includes('manager'))
    return <WhistleIcon />
  return <MedalIcon />
}

const coaches = [
  {
    name: 'Hildan Cristian',
    role: 'Antrenor',
    initials: 'HC',
    photo: '/images/antrenori/hildan-cristian.webp',
    achievements: [
      'Fost internațional al echipei naționale de seniori a României',
      'Participant la Cupa Mondială',
      'Multiplu campion național de seniori ca jucător',
      'Antrenor al echipelor naționale de juniori și secund la echipa națională de seniori',
    ],
  },
  {
    name: 'Curea Darie',
    role: 'Antrenor',
    initials: 'CD',
    photo: null,
    achievements: [
      'Fost jucător internațional al echipelor naționale de seniori, tineret și juniori',
      'Multiplu campion național de seniori și juniori',
      'Antrenor al echipei de juniori CS Dinamo',
      'Câștigător al campionatului de juniori la categoriile U16 și U20',
    ],
  },
  {
    name: 'Andrei Guranescu',
    role: 'Antrenor',
    initials: 'AG',
    photo: '/images/antrenori/andrei-guranescu.webp',
    achievements: [
      'Fost jucător internațional de juniori și seniori',
      'Multiplu campion național de seniori și juniori',
      'Fost jucător în campionatele de seniori',
    ],
  },
  {
    name: 'Stefan Demici',
    role: 'Antrenor / Manager',
    initials: 'SD',
    photo: '/images/antrenori/stefan-demici.webp',
    achievements: [
      'Fost internațional de seniori al României',
      'Participant la Cupa Mondială',
      'Multiplu campion național de seniori ca jucător',
      'Antrenor și manager, câștigător al campionatului și Cupei României',
    ],
  },
]

export default function AntrenoriPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative text-white py-24 md:py-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #C8102E 0%, #A30D23 60%, #8F0B1E 100%)' }}>
        <div className="relative max-w-4xl mx-auto px-4 text-center fade-in" style={{ zIndex: 1 }}>
          <p className="uppercase tracking-[0.35em] text-white/60 font-bold text-xs mb-5">CS Dinamo București</p>
          <h1 className="font-heading font-extrabold text-5xl md:text-7xl mb-5 leading-tight">Staff Tehnic</h1>
          <div className="w-16 h-[3px] bg-white/30 mx-auto mb-5 rounded-full" />
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
            Experiență, pasiune și dedicare pentru formarea campionilor
          </p>
        </div>
      </section>

      {/* Coaches Grid */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto px-4" style={{ maxWidth: '1100px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {coaches.map((coach) => (
              <article
                key={coach.name}
                className="coach-card group relative rounded-[18px] overflow-hidden text-white"
                tabIndex={0}
                style={{
                  background: 'linear-gradient(135deg, #C8102E 0%, #A30D23 60%, #8F0B1E 100%)',
                  padding: '28px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                }}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Photo */}
                  {coach.photo ? (
                    <img
                      src={coach.photo}
                      alt={`Portret ${coach.name}`}
                      loading="lazy"
                      className="coach-photo w-[116px] h-[116px] rounded-full object-cover object-top border-[3px] border-white/90 mb-5"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 3px rgba(0,0,0,0.15)' }}
                    />
                  ) : (
                    <div
                      className="coach-photo w-[116px] h-[116px] rounded-full border-[3px] border-white/90 mb-5 flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #A30D23 0%, #8F0B1E 100%)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 3px rgba(0,0,0,0.15)',
                      }}
                      role="img"
                      aria-label={`Placeholder pentru ${coach.name}`}
                    >
                      <span className="text-4xl font-heading font-extrabold text-white/70">
                        {coach.initials}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <h2 className="font-heading font-extrabold text-[22px] md:text-2xl text-white mb-2.5 leading-tight">
                    {coach.name}
                  </h2>

                  {/* Role Badge */}
                  <span
                    className="inline-block px-4 py-1 bg-white text-sm font-bold rounded-full mb-5"
                    style={{ color: '#C8102E', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
                  >
                    {coach.role}
                  </span>

                  {/* Achievements */}
                  <ul className="space-y-2.5 text-left w-full" role="list">
                    {coach.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-center gap-3 text-[17px] leading-relaxed" style={{ color: '#FFECEC' }}>
                        <span className="mt-0.5 self-start">{getIcon(achievement)}</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-16 rounded-[18px] p-8 md:p-12 text-center text-white"
            style={{
              background: 'linear-gradient(135deg, #C8102E 0%, #A30D23 60%, #8F0B1E 100%)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            }}
          >
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl mb-3">
              Vrei să faci parte din echipă?
            </h2>
            <p className="text-white/70 mb-6 max-w-xl mx-auto">
              Contactează-ne pentru a afla mai multe despre programul de antrenamente și înscrieri.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+40767858858"
                className="bg-white font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#C8102E' }}
              >
                +40 767 858 858
              </a>
              <a
                href="mailto:contact@dinamorugby.ro"
                className="bg-white/15 text-white font-bold px-8 py-3 rounded-lg hover:bg-white/25 transition-colors"
              >
                contact@dinamorugby.ro
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
