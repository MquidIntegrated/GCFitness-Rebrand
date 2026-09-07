import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/Components/ui/chart";

const CHART_CONFIG = {
    count: {
        label: "Edits",
        color: "var(--brand)",
    },
};

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayLabel(isoDate) {
    const [, month, day] = isoDate.split("-").map(Number);
    return `${MONTH_ABBREVIATIONS[month - 1]} ${day}`;
}

export function DashboardActivityChart({ data }) {
    return (
        <div>
            <h2 className="text-sm font-medium text-muted-foreground">Content last edited (last 14 days)</h2>
            <ChartContainer config={CHART_CONFIG} className="mt-2 aspect-auto h-64 w-full">
                <BarChart data={data} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDayLabel} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatDayLabel(String(value))} />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
