import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function PartnerGrid({ partners, onEdit, onDeleteRequest }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {partners.map((partner) => (
                <div key={partner.id} className="group relative rounded-lg border border-border bg-card p-4">
                    <img src={partner.logo_path} alt={partner.name} className="mx-auto h-16 object-contain" />
                    <p className="mt-2 text-center text-sm text-muted-foreground">{partner.name}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${partner.name}`}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(partner.id)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(partner)} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    );
}
