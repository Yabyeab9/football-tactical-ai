import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header
}) => {
  return (
    <div className="min-h-screen bg-midnight-black text-foreground">
      {header && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {header}
        </motion.header>
      )}

      <div className="flex">
        {sidebar && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-80 border-r border-border/40 bg-slate-dark/50 backdrop-blur-md"
          >
            {sidebar}
          </motion.aside>
        )}

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 p-6 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

interface DashboardGridProps {
  children: React.ReactNode
  columns?: number
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns = 3
}) => {
  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {children}
    </div>
  )
}

interface DashboardCardProps {
  title: string
  children: React.ReactNode
  className?: string
  glassmorphic?: boolean
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  className,
  glassmorphic = true
}) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card glassmorphic={glassmorphic} className={className}>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-electric-lime">{title}</h3>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}