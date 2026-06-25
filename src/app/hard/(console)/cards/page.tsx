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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Cards</h1>
        <p className="mt-1 text-sm text-white/55">
          Card issuance, status management, and fraud controls.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Member</TableHead>
              <TableHead className="text-white/60">Card Type</TableHead>
              <TableHead className="text-white/60">Last Four</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-sm text-white/50"
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
