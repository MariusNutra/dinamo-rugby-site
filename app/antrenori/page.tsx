export const metadata = {
  title: 'Antrenori — Dinamo Rugby Juniori',
  description: 'Staff-ul tehnic al secției de juniori rugby CS Dinamo București.',
}

const coaches = [
  {
    name: 'Hildan Cristian',
    role: 'Antrenor Principal',
    initials: 'HC',
    color: 'from-dinamo-red to-dinamo-dark',
    achievements: [
      'Fost internațional al echipei naționale de seniori a României',
      'Participant la Cupa Mondială',
      'Multiplu campion național de seniori ca jucător',
      'Antrenor al echipelor naționale de juniori și secund la echipa națională de seniori',
      'Câștigător de campionat național de seniori și Cupa României',
    ],
  },
  {
    name: 'Curea Darie',
    role: 'Antrenor Juniori',
    initials: 'CD',
    color: 'from-blue-600 to-blue-900',
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
    color: 'from-green-600 to-green-900',
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
    color: 'from-purple-600 to-purple-900',
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
      <section className="bg-gradient-to-br from-dinamo-red to-dinamo-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">Antrenori</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Staff-ul tehnic al secției de juniori rugby CS Dinamo București
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {coaches.map((coach) => (
            <div key={coach.name} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Photo placeholder */}
                <div className={`bg-gradient-to-br ${coach.color} md:w-64 flex-shrink-0 flex items-center justify-center p-8 md:p-0`}>
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-heading font-extrabold text-white/90">
                      {coach.initials}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 md:p-8 flex-1">
                  <div className="mb-4">
                    <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-gray-900">
                      {coach.name}
                    </h2>
                    <span className="inline-block mt-2 px-4 py-1 bg-dinamo-red/10 text-dinamo-red font-bold text-sm rounded-full">
                      {coach.role}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {coach.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="w-2 h-2 bg-dinamo-red rounded-full mt-2 flex-shrink-0"></span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-dinamo-red to-dinamo-dark rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl mb-3">
            Vrei să faci parte din echipă?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Contactează-ne pentru a afla mai multe despre programul de antrenamente și înscrieri.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+40767858858"
              className="bg-white text-dinamo-red font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              +40 767 858 858
            </a>
            <a href="mailto:contact@dinamorugby.ro"
              className="bg-white/20 text-white font-bold px-8 py-3 rounded-lg hover:bg-white/30 transition-colors">
              contact@dinamorugby.ro
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
