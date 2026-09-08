import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";

export function TempPasswordDialog({ password, onOpenChange }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(password);
        setCopied(true);
    }

    return (
        <Dialog open={password !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Temporary password generated</DialogTitle>
                    <DialogDescription>
                        Share this with the admin now — it won't be shown again, and expires in 1 hour if unused.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
                    <span className="flex-1 select-all">{password}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy temporary password">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
