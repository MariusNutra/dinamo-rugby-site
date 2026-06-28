import ImageUpload from '@/components/ImageUpload'
import { emptyCoachForm } from '../_constants'
import { Coach } from '../_types'

type CoachFormState = typeof emptyCoachForm

interface CoachesSectionProps {
  activeTab: string
  coaches: Coach[]
  showAddCoach: boolean
  editingCoachId: string | null
  coachForm: CoachFormState
  setCoachForm: (f: CoachFormState) => void
  savingCoach: boolean
  startAddCoach: () => void
  saveCoach: (e: React.FormEvent) => void
  cancelCoachForm: () => void
  handleCoachPhotoUpload: (files: File[]) => void
  startEditCoach: (c: Coach) => void
  deleteCoach: (id: string) => void
  moveCoach: (id: string, direction: 'up' | 'down') => void
}

export function CoachesSection({
  activeTab, coaches, showAddCoach, editingCoachId, coachForm, setCoachForm, savingCoach,
  startAddCoach, saveCoach, cancelCoachForm, handleCoachPhotoUpload, startEditCoach, deleteCoach, moveCoach,
}: CoachesSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg">Antrenori — {activeTab}</h2>
        {!showAddCoach && editingCoachId === null && (
          <button onClick={startAddCoach}
            className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
            + Adaugă antrenor
          </button>
        )}
      </div>

      {/* Add / Edit coach form */}
      {(showAddCoach || editingCoachId !== null) && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-dinamo-red">
          <h3 className="font-medium text-sm text-gray-700 mb-3">
            {editingCoachId ? 'Editează antrenor' : 'Antrenor nou'}
          </h3>
          <form onSubmit={saveCoach} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nume antrenor *</label>
                <input type="text" required value={coachForm.name}
                  onChange={e => setCoachForm({ ...coachForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Poză antrenor</label>
                {coachForm.photo ? (
                  <div className="flex items-center gap-2">
                    <img src={coachForm.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <button type="button" onClick={() => setCoachForm({ ...coachForm, photo: '' })}
                      className="text-red-500 text-xs">Elimină</button>
                  </div>
                ) : (
                  <ImageUpload onUpload={handleCoachPhotoUpload} multiple={false} label="Încarcă poză" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descriere</label>
              <textarea rows={3} value={coachForm.description}
                onChange={e => setCoachForm({ ...coachForm, description: e.target.value })}
                placeholder="Experiență, certificări, filosofie..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingCoach}
                className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                {savingCoach ? 'Se salvează...' : editingCoachId ? 'Salvează' : '+ Adaugă'}
              </button>
              <button type="button" onClick={cancelCoachForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coaches list */}
      {coaches.length > 0 ? (
        <div className="space-y-2">
          {coaches.map((c, idx) => (
            <div key={c.id} className={`flex items-center justify-between rounded-lg p-3 ${
              editingCoachId === c.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {c.photo ? (
                  <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg shrink-0">?</div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-gray-500 truncate max-w-[300px]">
                      {c.description.length > 100 ? c.description.substring(0, 100) + '...' : c.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveCoach(c.id, 'up')} disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-700 px-1 py-1 rounded text-xs disabled:opacity-30"
                  title="Mută sus">▲</button>
                <button onClick={() => moveCoach(c.id, 'down')} disabled={idx === coaches.length - 1}
                  className="text-gray-400 hover:text-gray-700 px-1 py-1 rounded text-xs disabled:opacity-30"
                  title="Mută jos">▼</button>
                <button onClick={() => startEditCoach(c)}
                  className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                  Editează
                </button>
                <button onClick={() => deleteCoach(c.id)}
                  className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-4 text-sm">
          Nu sunt antrenori adăugați pentru {activeTab}.
        </p>
      )}
    </div>
  )
}
