import { GripVertical, MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

function SortableRow({ plan, onDeleteRequest }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: plan.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
            <button
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${plan.name}`}
                className="cursor-grab text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="size-4" />
            </button>
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
    );
}

export function MembershipPlanList({ plans, onDeleteRequest, onReorder }) {
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        const oldIndex = plans.findIndex((p) => p.id === active.id);
        const newIndex = plans.findIndex((p) => p.id === over.id);
        onReorder(arrayMove(plans, oldIndex, newIndex).map((p) => p.id));
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {plans.map((plan) => (
                        <SortableRow key={plan.id} plan={plan} onDeleteRequest={onDeleteRequest} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
