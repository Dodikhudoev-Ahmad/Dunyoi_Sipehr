import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import type { Testimonial } from '@/types/domain'
import { optimizeImageUrl } from '@/lib/imageOptimize'

export function TestimonialCard({ testimonial, index = 0 }: { testimonial: Testimonial; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(index, 4) * 0.05 }}
    >
      <Card className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center gap-1 text-brand">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} fill={i < testimonial.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
          ))}
        </div>
        <p className="flex-1 text-sm leading-relaxed text-slate">&ldquo;{testimonial.quote}&rdquo;</p>
        <div className="flex items-center gap-3">
          {testimonial.avatarUrl ? (
            <img
              src={optimizeImageUrl(testimonial.avatarUrl, 96)}
              alt={testimonial.authorName}
              loading="lazy"
              decoding="async"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand">
              {testimonial.authorName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{testimonial.authorName}</p>
            <p className="text-xs text-slate">{testimonial.authorCountry}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
