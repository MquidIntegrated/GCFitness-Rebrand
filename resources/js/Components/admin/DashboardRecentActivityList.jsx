import { ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

export function DashboardRecentActivityList({ activity }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Recently edited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <ArrowUpRight className="size-3.5" />
                        </span>
                        <div>
                            <p className="text-sm font-medium">{entry.description}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
