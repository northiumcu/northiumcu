import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminCardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Cards
        </h1>
        <p className="mt-1 text-northium-muted">
          Card issuance, status management, and fraud controls.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-northium-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-northium-surface">
              <TableHead>Member</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Last Four</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-sm text-northium-muted"
              >
                No cards loaded. Connect card services to view issuance.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
