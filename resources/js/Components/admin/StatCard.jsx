import { Card, CardContent } from "@/Components/ui/card";

export function StatCard({ label, value, icon: Icon }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="size-5" />
                </span>
                <div>
                    <div className="text-2xl font-semibold leading-tight">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}
