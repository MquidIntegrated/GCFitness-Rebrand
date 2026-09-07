import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function TrainerList({ trainers, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {trainers.map((trainer) => (
                    <TableRow key={trainer.id}>
                        <TableCell className="font-medium">{trainer.name}</TableCell>
                        <TableCell>{trainer.specialty}</TableCell>
                        <TableCell>{trainer.years_experience}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${trainer.name}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/trainers/${trainer.id}/edit?mode=view`}>View</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/trainers/${trainer.id}/edit`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(trainer)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(trainer)} className="text-destructive">
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
