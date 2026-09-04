import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function TestimonialList({ testimonials, onView, onEdit, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Quote</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                        <TableCell className="max-w-md truncate">{testimonial.quote}</TableCell>
                        <TableCell className="font-medium">{testimonial.name}</TableCell>
                        <TableCell>{testimonial.role}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${testimonial.name}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(testimonial.id)}>View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(testimonial.id)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(testimonial)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(testimonial)} className="text-destructive">
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
