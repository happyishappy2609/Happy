import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/misc'
import { buttonVariants } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass />}
      title="Page not found"
      description="The page you're looking for doesn't exist or was moved."
      action={
        <Link to="/dashboard" className={buttonVariants({ variant: 'primary' })}>
          Back to overview
        </Link>
      }
    />
  )
}
