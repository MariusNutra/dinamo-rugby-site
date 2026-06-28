import { days, emptySessionForm } from '../_constants'
import { TrainingSession } from '../_types'

type SessionFormState = typeof emptySessionForm

interface TrainingSessionsProps {
  activeTab: string
  sortedSessions: TrainingSession[]
  showAddSession: boolean
  editingSessionId: number | null
  sessionForm: SessionFormState
  setSessionForm: (f: SessionFormState) => void
  sessionError: string
  savingSession: boolean
  scheduleText: string
  startAddSession: () => void
  saveSession: (e: React.FormEvent) => void
  cancelSessionForm: () => void
  startEditSession: (s: TrainingSession) => void
  deleteSession: (id: number) => void
}

export function TrainingSessions({
  activeTab, sortedSessions, showAddSession, editingSessionId, sessionForm, setSessionForm,
  sessionError, savingSession, scheduleText, startAddSession, saveSession, cancelSessionForm,
  startEditSession, deleteSession,
}: TrainingSessionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg">Sesiuni antrenament — {activeTab}</h2>
        {!showAddSession && !editingSessionId && (
          <button onClick={startAddSession}
            className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors">
            + Adaugă sesiune
          </button>
        )}
      </div>

      {/* Add / Edit session form */}
      {(showAddSession || editingSessionId !== null) && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-dinamo-red">
          <h3 className="font-medium text-sm text-gray-700 mb-3">
            {editingSessionId ? 'Editează sesiune' : 'Sesiune nouă'}
          </h3>
          <form onSubmit={saveSession} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ziua</label>
                <select value={sessionForm.day}
                  onChange={e => setSessionForm({ ...sessionForm, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ora start</label>
                <input type="time" required value={sessionForm.startTime}
                  onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ora end</label>
                <input type="time" required value={sessionForm.endTime}
                  onChange={e => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Locația</label>
                <input type="text" required placeholder="Stadionul Dinamo" value={sessionForm.location}
                  onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Antrenor</label>
                <input type="text" placeholder="(opțional)" value={sessionForm.coachName}
                  onChange={e => setSessionForm({ ...sessionForm, coachName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
              </div>
            </div>
            {sessionError && (
              <p className="text-red-600 text-sm">{sessionError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={savingSession}
                className="bg-dinamo-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
                {savingSession ? 'Se salvează...' : editingSessionId ? 'Salvează' : '+ Adaugă'}
              </button>
              <button type="button" onClick={cancelSessionForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions list */}
      {sortedSessions.length > 0 ? (
        <div className="space-y-2">
          {sortedSessions.map(s => (
            <div key={s.id} className={`flex items-center justify-between rounded-lg p-3 ${
              editingSessionId === s.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <span className="font-medium text-gray-900 min-w-[80px]">{s.day}</span>
                <span className="text-gray-700">{s.startTime} - {s.endTime}</span>
                <span className="text-gray-500">@ {s.location}</span>
                {s.coachName && <span className="text-gray-400">({s.coachName})</span>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEditSession(s)}
                  className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                  Editează
                </button>
                <button onClick={() => deleteSession(s.id)}
                  className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-4 text-sm">
          Nu sunt sesiuni de antrenament pentru {activeTab}.
          {scheduleText && ' Se afișează câmpul text ca fallback pe site.'}
        </p>
      )}
    </div>
  )
}
