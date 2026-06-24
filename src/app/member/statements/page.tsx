import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const statements = [
  {
    id: "1",
    period: "March 2026",
    account: "Checking ••••3847",
    date: "Apr 1, 2026",
  },
  {
    id: "2",
    period: "February 2026",
    account: "Checking ••••3847",
    date: "Mar 1, 2026",
  },
  {
    id: "3",
    period: "March 2026",
    account: "Savings ••••4856",
    date: "Apr 1, 2026",
  },
  {
    id: "4",
    period: "February 2026",
    account: "Savings ••••4856",
    date: "Mar 1, 2026",
  },
];

export default function MemberStatementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Statements
        </h1>
        <p className="mt-1 text-northium-muted">
          View and download your account statements.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-northium-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-northium-surface">
              <TableHead>Period</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.map((stmt) => (
              <TableRow key={stmt.id}>
                <TableCell className="font-medium">{stmt.period}</TableCell>
                <TableCell>{stmt.account}</TableCell>
                <TableCell className="text-northium-muted">
                  {stmt.date}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Download PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
