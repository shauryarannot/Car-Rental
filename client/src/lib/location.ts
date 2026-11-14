/** Every rental is picked up and dropped off at the same branch. */
export const BRANCH = {
  name: 'Ryde.exe Noida',
  address: 'Sector 2, Noida, Uttar Pradesh 201301',
  hours: 'Open daily · 8 AM – 9 PM',
}

const query = encodeURIComponent(`${BRANCH.address}, India`)

export const BRANCH_MAP_EMBED = `https://maps.google.com/maps?q=${query}&z=15&output=embed`
export const BRANCH_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${query}`
