import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockActivities } from "@/lib/mock-data";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of important workspace actions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Workspace Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockActivities.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-border pb-3 last:border-none last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.target}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {item.timestamp}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}