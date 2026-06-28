import type { PendingTransfer } from '../_types'

interface TransferConfirmModalProps {
  pendingTransfer: PendingTransfer
  transferReason: string
  transferring: boolean
  onReasonChange: (value: string) => void
  onBackdropClose: () => void
  onCancel: () => void
  onConfirm: () => void
}

export default function TransferConfirmModal({
  pendingTransfer,
  transferReason,
  transferring,
  onReasonChange,
  onBackdropClose,
  onCancel,
  onConfirm,
}: TransferConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onBackdropClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[slideUp_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">Confirma transferul</h3>
          <p className="text-sm text-gray-500">
            Muti <strong>{pendingTransfer.childName}</strong> de la <strong>{pendingTransfer.fromTeamName}</strong> la <strong>{pendingTransfer.toTeamName}</strong>?
          </p>
        </div>

        <div className="px-6 pb-4">
          {/* Visual transfer indicator */}
          <div className="flex items-center justify-center gap-3 py-4 mb-4 bg-gray-50 rounded-xl">
            <span className="px-3 py-1.5 bg-red-100 text-red-700 font-bold text-sm rounded-lg">
              {pendingTransfer.fromTeamName}
            </span>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="px-3 py-1.5 bg-green-100 text-green-700 font-bold text-sm rounded-lg">
              {pendingTransfer.toTeamName}
            </span>
          </div>

          {/* Reason textarea */}
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Motiv (optional)
          </label>
          <textarea
            value={transferReason}
            onChange={e => onReasonChange(e.target.value)}
            placeholder="ex: Promovare la grupa superioara, restructurare..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dinamo-red outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Prezentele viitoare vor fi actualizate automat. Parintele va fi notificat prin email.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={transferring}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Anuleaza
          </button>
          <button
            onClick={onConfirm}
            disabled={transferring}
            className="flex-1 px-4 py-2.5 bg-dinamo-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {transferring ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Se transfera...
              </>
            ) : (
              'Confirma transferul'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
