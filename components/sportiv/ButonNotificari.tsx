'use client'

import { usePush } from '@/hooks/usePush'

/** Comutatorul de notificari al sportivului, in acelasi rand cu celelalte actiuni. */
export default function ButonNotificari() {
  const { suportat, abonat, seLucreaza, comuta } = usePush()

  if (!suportat) return null

  return (
    <button
      onClick={comuta}
      disabled={seLucreaza}
      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        abonat
          ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-gray-300 text-gray-700 hover:border-dinamo-red hover:text-dinamo-red'
      }`}
    >
      {abonat ? 'Notificari pornite' : 'Porneste notificarile'}
    </button>
  )
}
