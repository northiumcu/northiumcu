import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cards = [
  {
    id: "1",
    name: "Northium Debit",
    lastFour: "4821",
    type: "debit",
    status: "active",
  },
  {
    id: "2",
    name: "Rewards Visa",
    lastFour: "7392",
    type: "rewards",
    status: "active",
  },
];

export default function MemberCardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Your Cards
        </h1>
        <p className="mt-1 text-northium-muted">
          Manage card settings, limits, and security controls.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.id} className="rounded-2xl border-northium-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {card.name}
              </CardTitle>
              <Badge className="bg-northium-success/10 text-northium-success">
                {card.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl tracking-widest text-northium-primary">
                •••• •••• •••• {card.lastFour}
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="sm">
                  Freeze Card
                </Button>
                <Button variant="outline" size="sm">
                  Set Limits
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
