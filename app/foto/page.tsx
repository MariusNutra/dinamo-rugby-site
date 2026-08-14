import { redirect } from 'next/navigation'
import { isPhotographerAuthenticated } from '@/lib/photographer-auth'

export const dynamic = 'force-dynamic'

export default async function FotoPage() {
  redirect((await isPhotographerAuthenticated()) ? '/foto/media' : '/foto/login')
}
