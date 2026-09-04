import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function SocialLinkGrid({ links, onEdit, onDeleteRequest }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {links.map((link) => (
                <div key={link.id} className="group relative rounded-lg border border-border bg-card p-4">
                    <img src={link.logo_path} alt={link.platform} className="mx-auto h-16 object-contain" />
                    <p className="mt-2 text-center text-sm font-medium">{link.platform}</p>
                    <p className="truncate text-center text-xs text-muted-foreground">{link.url}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${link.platform}`}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(link.id)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(link)} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    );
}
