import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

export interface ConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "normal" | "danger";
  onConfirm: () => void;
}

export default function ConfirmActionDialog({
  action,
  onClose,
}: {
  action: ConfirmAction | null;
  onClose: () => void;
}) {
  const { tr } = useI18n();
  return (
    <AlertDialog open={Boolean(action)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="border-border/70 bg-card/95 text-foreground backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{action?.title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line text-muted-foreground">
            {action?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{tr("Not now", "ไว้ก่อน")}</AlertDialogCancel>
          <AlertDialogAction
            className={action?.tone === "danger" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            onClick={() => { action?.onConfirm(); onClose(); }}
          >
            {action?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
