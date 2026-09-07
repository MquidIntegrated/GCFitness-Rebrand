import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function MembershipPlanList({ plans, onDeleteRequest }) {
    return (
        <div className="space-y-3">
            {plans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{plan.name}</span>
                            {plan.popular && <Badge>Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ${plan.monthly_price}/mo · ${plan.annual_price}/mo billed annually
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${plan.name}`}>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/membership-plans/${plan.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(plan)} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    );
}
