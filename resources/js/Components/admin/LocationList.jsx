import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function LocationList({ locations, onEdit, onDeleteRequest }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
                <div key={location.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                        <h3 className="font-medium">{location.name}</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${location.name}`}>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(location.id)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteRequest(location)} className="text-destructive">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{location.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{location.hours}</p>
                </div>
            ))}
        </div>
    );
}
