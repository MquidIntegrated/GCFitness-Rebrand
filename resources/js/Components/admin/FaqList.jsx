import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function FaqList({ faqs, onView, onEdit, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                        <TableCell className="max-w-xs font-medium">{faq.question}</TableCell>
                        <TableCell className="max-w-md truncate">{faq.answer}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${faq.question}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(faq.id)}>View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(faq.id)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(faq)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(faq)} className="text-destructive">
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
