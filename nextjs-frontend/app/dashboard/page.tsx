
import StudentDirectory from "./StudentDirectory";
import StudentDirectorySummary from "./StudentDirectorySummary";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
  }>;
}

export default async function DashboardPage({
}: DashboardPageProps) {


  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Welcome to your Dashboard</h2>
      <p className="text-lg mb-6">
      </p>



      {/* Student stats Section */}
      <section className="p-6 bg-white rounded-lg shadow-lg mb-8">
                <StudentDirectorySummary />

      </section>

        {/* Student Directory Section */}
      <section className="p-6 bg-white rounded-lg shadow-lg mb-8">

        <StudentDirectory />
      </section>


    </div>
  );
}
