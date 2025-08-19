import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { fetchItems } from "@/components/actions/items-action";
import { DeleteButton } from "./deleteButton";
import { ReadItemResponse } from "@/app/openapi-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageSizeSelector } from "@/components/page-size-selector";
import { PagePagination } from "@/components/page-pagination";
import StudentDirectory from "./StudentDirectory";
import StudentDirectorySummary from "./StudentDirectorySummary";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 10;

  const items = (await fetchItems(page, size)) as ReadItemResponse;
  const totalPages = Math.ceil((items.total || 0) / size);

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
