import EventCoverageTable from '../components/EventCoverageTable'
import ModuleConsistencyTable from '../components/ModuleConsistencyTable'
import RecentActivityLog from '../components/RecentActivityLog'
import WeeklyScoreCard from '../components/WeeklyScoreCard'

function DataLabPage() {
  return (
    <section className="space-y-4 bg-[#000000]">
      <header className="rounded-none border border-[#222222] bg-[#0a0a0a] p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Data Lab</h1>
        <p className="mt-1 text-sm text-slate-300">Read-only behavioral analytics.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeeklyScoreCard />
        <RecentActivityLog />
        <div className="md:col-span-2">
          <ModuleConsistencyTable />
        </div>
        <div className="md:col-span-2">
          <EventCoverageTable />
        </div>
      </div>
    </section>
  )
}

export default DataLabPage
