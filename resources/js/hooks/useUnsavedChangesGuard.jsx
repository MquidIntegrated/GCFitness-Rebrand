import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";

export function useUnsavedChangesGuard(isDirty) {
    const [pendingVisit, setPendingVisit] = useState(null);
    const bypassRef = useRef(false);

    useEffect(() => {
        if (!isDirty) return;

        function handleBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener("beforeunload", handleBeforeUnload);

        const removeInertiaListener = router.on("before", (event) => {
            if (bypassRef.current) {
                bypassRef.current = false;
                return true;
            }
            if (event.detail.visit.method !== "get") return;

            setPendingVisit(event.detail.visit);
            return false;
        });

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            removeInertiaListener();
        };
    }, [isDirty]);

    function handleConfirmLeave() {
        bypassRef.current = true;
        router.visit(pendingVisit.url.href);
        setPendingVisit(null);
    }

    return (
        <AlertDialog open={pendingVisit !== null} onOpenChange={(open) => !open && setPendingVisit(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
                    <AlertDialogDescription>You have unsaved changes. If you leave now, they'll be lost.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Stay</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmLeave}>Leave</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
