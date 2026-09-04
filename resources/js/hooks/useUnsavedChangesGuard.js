import { router } from "@inertiajs/react";
import { useEffect } from "react";

export function useUnsavedChangesGuard(isDirty) {
    useEffect(() => {
        if (!isDirty) return;

        function handleBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener("beforeunload", handleBeforeUnload);

        const removeInertiaListener = router.on("before", () => {
            return window.confirm("You have unsaved changes. Leave without saving?");
        });

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            removeInertiaListener();
        };
    }, [isDirty]);
}
