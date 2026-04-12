import MatchReport from "./(views)/MatchReport";
import PaymentReport from "./(views)/PaymentReport";
import PlayerReport from "./(views)/PlayerReport";
import TournamentReport from "./(views)/TournamentReport";
import TurfReport from "./(views)/TurfReport";

export default function ReportsPage() {
  return (
    <main className="flex flex-col gap-6 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select filters and generate a report. Results can be exported as CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PlayerReport />
        <MatchReport />
        <PaymentReport />
        <TurfReport />
        <TournamentReport />
      </div>
    </main>
  );
}
