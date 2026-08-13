'use client'

import { useId, useState } from 'react'

/**
 * Camp de parola cu ochi de dezvaluire.
 *
 * De ce o componenta si nu un `type` schimbat pe loc in fiecare formular:
 * campuri de parola sunt in cinci locuri (logare admin, logare antrenor,
 * activare cont, resetare parola, gestionare administratori). Scris de mana in
 * fiecare, ochiul ar fi ajuns sa arate si sa se poarte altfel de la un ecran la
 * altul — si oricine adauga al saselea formular l-ar fi uitat.
 *
 * Doua lucruri care se strica usor aici:
 *
 *  - `type="button"` pe buton. Fara el, un buton dintr-un `<form>` e implicit
 *    de trimitere: primul clic pe ochi ar incerca sa te autentifice cu parola
 *    pe jumatate scrisa.
 *  - `pr-12` pe input. Fara spatiu rezervat la dreapta, textul lung trece pe
 *    sub ochi si ultimele caractere nu se mai vad — exact cand omul se uita la
 *    ele ca sa verifice ce a scris.
 *
 * Starea nu e pastrata intre randari: parola se ascunde la loc de fiecare data
 * cand ecranul se redeschide. Asta e intentionat — o parola lasata vizibila
 * peste ecrane e o parola aratata cuiva care trece prin spate.
 */
type Props = {
  value: string
  onChange: (valoare: string) => void
  className: string
  label?: string
  required?: boolean
  minLength?: number
  placeholder?: string
  autoComplete?: string
  id?: string
}

export default function PasswordInput({
  value,
  onChange,
  className,
  label,
  required,
  minLength,
  placeholder,
  autoComplete,
  id,
}: Props) {
  const [vizibila, setVizibila] = useState(false)
  const idAuto = useId()
  const idCamp = id ?? idAuto

  return (
    <div className="relative">
      <input
        id={idCamp}
        type={vizibila ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-12`}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setVizibila((v) => !v)}
        aria-label={vizibila ? 'Ascunde parola' : 'Arată parola'}
        aria-pressed={vizibila}
        aria-controls={idCamp}
        title={vizibila ? 'Ascunde parola' : 'Arată parola'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-dinamo-red focus-visible:rounded-r-lg"
      >
        {vizibila ? (
          // Ochi taiat = parola e ACUM vizibila, apasa ca s-o ascunzi.
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>
    </div>
  )
}
