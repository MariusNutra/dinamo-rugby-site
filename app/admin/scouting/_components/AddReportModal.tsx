import type { Dispatch, SetStateAction } from 'react'

interface ReportForm {
  eventName: string
  eventDate: string
  location: string
  notes: string
}

interface AddReportModalProps {
  reportForm: ReportForm
  setReportForm: Dispatch<SetStateAction<ReportForm>>
  onClose: () => void
  onCreate: () => void
}

export function AddReportModal({
  reportForm,
  setReportForm,
  onClose,
  onCreate,
}: AddReportModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-dinamo-blue">Raport Nou</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numele evenimentului *</label>
            <input
              type="text"
              value={reportForm.eventName}
              onChange={e => setReportForm(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="ex: Turneu U14 Brasov"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              value={reportForm.eventDate}
              onChange={e => setReportForm(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
            <input
              type="text"
              value={reportForm.location}
              onChange={e => setReportForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="ex: Stadionul Municipal, Brasov"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notite</label>
            <textarea
              value={reportForm.notes}
              onChange={e => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Observatii generale..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCreate}
              className="flex-1 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Creaza raport
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Anuleaza
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
