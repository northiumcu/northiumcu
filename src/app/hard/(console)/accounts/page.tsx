import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAccountsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Accounts
        </h1>
        <p className="mt-1 text-northium-muted">
          Institution-wide account management and oversight.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-northium-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-northium-surface">
              <TableHead>Member</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-sm text-northium-muted"
              >
                No accounts loaded. Connect account services to view portfolio.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
