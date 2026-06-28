export const days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

export const emptySessionForm = { day: 'Luni', startTime: '16:00', endTime: '18:00', location: '', coachName: '' }
export const emptyCoachForm = { name: '', description: '', photo: '' }
export const emptyNewTeamForm = { grupa: '', ageRange: '', birthYear: '', description: '', color: 'green', sortOrder: 0 }

// Sort sessions by day order
export const dayOrder: Record<string, number> = {
  'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 7,
}
