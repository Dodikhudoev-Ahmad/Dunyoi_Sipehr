import { motion } from 'motion/react'
import type { Service } from '@/types/domain'
import { resolveServiceIcon } from '@/lib/serviceIcons'

export function ServicesEditorial({ services }: { services: Service[] }) {
  return (
    <div className="border-t border-text/10">
      {services.map((service, i) => {
        const Icon = resolveServiceIcon(service.icon)
        return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: Math.min(i, 5) * 0.05 }}
            className="group grid grid-cols-1 gap-4 border-b border-text/10 py-8 md:grid-cols-[5rem_1fr_1.4fr] md:items-center md:gap-8 md:py-10"
          >
            <span className="font-display text-3xl font-medium text-sage md:text-4xl">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <h3 className="font-display text-xl font-medium md:text-2xl">{service.name}</h3>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">{service.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
