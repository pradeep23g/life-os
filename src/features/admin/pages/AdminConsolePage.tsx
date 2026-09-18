import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  Activity, Download, Upload, 
  RefreshCw, CheckCircle2, AlertCircle, ShieldAlert, Palette 
} from 'lucide-react'
import { useModuleColors, DEFAULT_MODULE_COLORS } from '../../../lib/useModuleColors'

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<'control' | 'telemetry' | 'health' | 'aesthetics'>('control')
  const [importData, setImportData] = useState('')
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [tableStats, setTableStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const { colors, updateColor } = useModuleColors()

  const fetchTableStats = async () => {
    setIsLoading(true)
    try {
      const tables = ['life_seasons', 'user_achievements', 'telemetry_events', 'focus_sessions']
      const stats: Record<string, number> = {}
      
      for (const table of tables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count, error } = await (supabase.from as any)(table)
          .select('*', { count: 'exact', head: true })
        if (!error) {
          stats[table] = count || 0
        }
      }
      setTableStats(stats)
    } catch (e) {
      console.error('Failed to fetch stats', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'health') {
      fetchTableStats()
    }
  }, [activeTab])

  const handleExport = async (entity: 'life_seasons' | 'user_achievements' | 'learning_roadmaps') => {
    setIsLoading(true)
    try {
      const tableMap = {
        life_seasons: 'life_seasons',
        user_achievements: 'user_achievements',
        learning_roadmaps: 'learning_roadmaps'
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)(tableMap[entity]).select('*')
      if (error) throw error

      const blob = new Blob([JSON.stringify({ entity, data }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      setImportStatus({ type: 'error', message: e instanceof Error ? e.message : 'Export failed' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    setIsLoading(true)
    setImportStatus({ type: null, message: '' })
    try {
      if (!importData.trim()) throw new Error('Please provide JSON payload.')
      const payload = JSON.parse(importData)
      
      if (!payload.entity || !payload.data || !Array.isArray(payload.data)) {
        throw new Error('Invalid schema. Expected { entity: string, data: array }')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)(payload.entity)
        .upsert(payload.data)

      if (error) throw error

      setImportStatus({ type: 'success', message: `Successfully imported ${payload.data.length} records into ${payload.entity}.` })
      setImportData('')
    } catch (e: unknown) {
      setImportStatus({ type: 'error', message: e instanceof Error ? e.message : 'Import failed. Check JSON format.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-text-primary tracking-tight">
            System Admin
          </h1>
        </div>
        <p className="text-text-secondary">Control plane, telemetry, and aesthetic configuration.</p>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border-subtle gap-6 hide-scrollbar">
        <button
          onClick={() => setActiveTab('control')}
          className={`pb-3 font-medium whitespace-nowrap transition-colors ${activeTab === 'control' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-primary'}`}
        >
          Control Plane (JSON Sync)
        </button>
        <button
          onClick={() => setActiveTab('aesthetics')}
          className={`pb-3 font-medium whitespace-nowrap transition-colors ${activeTab === 'aesthetics' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-primary'}`}
        >
          UI Aesthetics
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 font-medium whitespace-nowrap transition-colors ${activeTab === 'telemetry' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-primary'}`}
        >
          Telemetry Queue
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 font-medium whitespace-nowrap transition-colors ${activeTab === 'health' ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-primary'}`}
        >
          Database Health
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'control' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exporter */}
              <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                <div className="flex items-center gap-2 text-text-primary">
                  <Download className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">Export Configurations</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  Download a canonical JSON snapshot of major life configuration systems.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={() => handleExport('life_seasons')}
                    disabled={isLoading}
                    className="flex justify-between items-center px-4 py-2 bg-elevated border border-border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <span>Life Seasons (Vows & Phases)</span>
                    <Download className="h-4 w-4 text-text-tertiary" />
                  </button>
                  <button 
                    onClick={() => handleExport('user_achievements')}
                    disabled={isLoading}
                    className="flex justify-between items-center px-4 py-2 bg-elevated border border-border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <span>User Achievements (Metadata)</span>
                    <Download className="h-4 w-4 text-text-tertiary" />
                  </button>
                  <button 
                    onClick={() => handleExport('learning_roadmaps')}
                    disabled={isLoading}
                    className="flex justify-between items-center px-4 py-2 bg-elevated border border-border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <span>Learning OS (Roadmaps)</span>
                    <Download className="h-4 w-4 text-text-tertiary" />
                  </button>
                </div>
              </div>

              {/* Importer */}
              <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                <div className="flex items-center gap-2 text-text-primary">
                  <Upload className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">Import Payload</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  Paste a canonical JSON array matching the exact Supabase schema to upsert records.
                </p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-32 bg-background border border-border rounded-lg p-3 font-mono text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder='{"entity": "life_seasons", "data": [{...}]}'
                />
                <button
                  onClick={handleImport}
                  disabled={isLoading || !importData.trim()}
                  className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Execute Upsert'}
                </button>
                
                {importStatus.type && (
                  <div className={`p-3 rounded-lg flex gap-2 items-start text-sm ${importStatus.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-threat-critical/10 text-threat-critical border border-threat-critical/20'}`}>
                    {importStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                    <span>{importStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'aesthetics' && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="h-5 w-5 text-text-primary" />
              <h2 className="text-xl font-medium text-text-primary">Orb Module Color Configuration</h2>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Customize the neon signature colors for each module in the Astrolabe Orb Nav. 
              These colors propagate through hovers, tooltips, and ambient glows globally.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(DEFAULT_MODULE_COLORS).map(moduleName => (
                <div key={moduleName} className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">{moduleName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-tertiary">{colors[moduleName] || '#ffffff'}</span>
                    <input 
                      type="color" 
                      value={colors[moduleName] || '#ffffff'}
                      onChange={(e) => updateColor(moduleName, e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded-full bg-transparent border-0 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'telemetry' && (
          <section className="rounded-xl border border-border bg-surface p-6 flex flex-col items-center justify-center min-h-[300px] space-y-4">
             <Activity className="h-10 w-10 text-text-tertiary mb-2" />
             <h2 className="text-xl font-medium text-text-secondary">Telemetry Queue Monitor</h2>
             <p className="text-text-tertiary text-center max-w-md">
               Live event streaming is currently stable. Queue is drained optimally every 15s. No manual flush required.
             </p>
             <button disabled className="px-6 py-2 bg-elevated border border-border rounded-lg text-text-tertiary opacity-50 cursor-not-allowed">
                Force Queue Drain
             </button>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-text-primary">Database Row Counts</h2>
              <button onClick={fetchTableStats} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(tableStats).map(([table, count]) => (
                <div key={table} className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase text-text-tertiary truncate">{table}</span>
                  <span className="text-2xl font-light text-text-primary tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
