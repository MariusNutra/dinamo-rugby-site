import { teamColorOptions } from '@/lib/team-colors'
import { ColorPicker } from './ColorPicker'
import { emptyNewTeamForm } from '../_constants'

type NewTeamFormState = typeof emptyNewTeamForm

interface NewTeamFormProps {
  newTeamForm: NewTeamFormState
  setNewTeamForm: (f: NewTeamFormState) => void
  createTeam: (e: React.FormEvent) => void
  savingNewTeam: boolean
  newTeamError: string
  setShowNewTeamForm: (v: boolean) => void
  setNewTeamError: (v: string) => void
}

export function NewTeamForm({
  newTeamForm, setNewTeamForm, createTeam, savingNewTeam, newTeamError,
  setShowNewTeamForm, setNewTeamError,
}: NewTeamFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-dinamo-red">
      <h2 className="font-heading font-bold text-lg mb-4">Echipă nouă</h2>
      <form onSubmit={createTeam} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume grupă *</label>
            <input type="text" required value={newTeamForm.grupa} placeholder="ex: U8, U20"
              onChange={e => setNewTeamForm({ ...newTeamForm, grupa: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vârstă range</label>
            <input type="text" value={newTeamForm.ageRange} placeholder="ex: 6-8 ani"
              onChange={e => setNewTeamForm({ ...newTeamForm, ageRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anul nașterii</label>
            <input type="text" value={newTeamForm.birthYear} placeholder="ex: 2017-2018"
              onChange={e => setNewTeamForm({ ...newTeamForm, birthYear: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea rows={2} value={newTeamForm.description}
            onChange={e => setNewTeamForm({ ...newTeamForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Culoare card</label>
            <ColorPicker value={newTeamForm.color} onChange={color => setNewTeamForm({ ...newTeamForm, color })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordine afișare</label>
            <input type="number" value={newTeamForm.sortOrder}
              onChange={e => setNewTeamForm({ ...newTeamForm, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red outline-none" />
            <p className="text-xs text-gray-500 mt-1">Număr mic = apare primul pe site</p>
          </div>
        </div>
        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview card</label>
          <div className="inline-block w-40 rounded-xl overflow-hidden shadow-lg">
            <div className={`bg-gradient-to-br ${teamColorOptions.find(c => c.key === newTeamForm.color)?.gradient || 'from-gray-500 to-gray-700'} p-6 text-white text-center`}>
              <div className="text-3xl font-heading font-extrabold mb-1">{newTeamForm.grupa || '?'}</div>
              <div className="text-white/80 text-xs">{newTeamForm.ageRange || '—'}</div>
            </div>
            <div className="bg-white p-3 text-center">
              <p className="text-xs text-gray-600">Descoperă echipa</p>
            </div>
          </div>
        </div>
        {newTeamError && <p className="text-red-600 text-sm">{newTeamError}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={savingNewTeam}
            className="bg-dinamo-red text-white px-6 py-2 rounded-lg font-bold hover:bg-dinamo-dark transition-colors disabled:opacity-50">
            {savingNewTeam ? 'Se creează...' : 'Creează echipa'}
          </button>
          <button type="button" onClick={() => { setShowNewTeamForm(false); setNewTeamError('') }}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">
            Anulează
          </button>
        </div>
      </form>
    </div>
  )
}
