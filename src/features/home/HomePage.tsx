import { useHomeTelemetry } from './hooks/useHomeTelemetry'
import { HomeAsymmetricStage } from './components/HomeAsymmetricStage'

export default function HomePage() {
  const telemetry = useHomeTelemetry()

  return (
    <main className="w-full min-h-[80vh] flex flex-col justify-start">
      <HomeAsymmetricStage telemetry={telemetry} />
    </main>
  )
}
