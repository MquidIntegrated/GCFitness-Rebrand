import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function ProgramList({ programs, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Featured?</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {programs.map((program) => (
                    <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.title}</TableCell>
                        <TableCell>{program.tag}</TableCell>
                        <TableCell>{program.duration}</TableCell>
                        <TableCell>{program.level}</TableCell>
                        <TableCell>{program.featured && <Badge>Featured</Badge>}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${program.title}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/programs/${program.id}/edit?mode=view`}>View</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/programs/${program.id}/edit`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(program)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(program)} className="text-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
