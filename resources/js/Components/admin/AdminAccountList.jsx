import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function AdminAccountList({ admins, onResetAccess, onDeactivate, onReactivate, onDeleteRequest }) {
    return (
        <div className="space-y-3">
            {admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{admin.name}</span>
                            {admin.role === "super_admin" && <Badge>Super Admin</Badge>}
                            {!admin.is_active && <Badge variant="outline">Deactivated</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    {admin.role !== "super_admin" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${admin.name}`}>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onResetAccess(admin)}>Reset access</DropdownMenuItem>
                                {admin.is_active ? (
                                    <DropdownMenuItem onClick={() => onDeactivate(admin)}>Deactivate</DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onReactivate(admin)}>Reactivate</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onDeleteRequest(admin)} className="text-destructive">
                                    Remove
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            ))}
        </div>
    );
}
