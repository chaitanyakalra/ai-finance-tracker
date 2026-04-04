import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../utils/api";

const MIN_REASON_LENGTH = 20;

function RoleRequestModal({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const [requestedRole, setRequestedRole] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = requestedRole && reason.trim().length >= MIN_REASON_LENGTH;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await apiService.requestRoleUpgrade({ requestedRole, reason: reason.trim() });
      toast.success("Role upgrade request submitted! An admin will review it shortly.");
      setRequestedRole("");
      setReason("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("You already have a pending role request.");
      } else {
        toast.error(err.response?.data?.error || "Failed to submit request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRequestedRole("");
      setReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Role Upgrade</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Current role */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Current role:</span>
            <Badge variant="outline" className="capitalize">
              {user?.role || "viewer"}
            </Badge>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Request upgrade to</Label>
            <RadioGroup
              value={requestedRole}
              onValueChange={setRequestedRole}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                <RadioGroupItem value="analyst" id="role-analyst" />
                <Label htmlFor="role-analyst" className="cursor-pointer flex-1">
                  <span className="font-semibold">Analyst</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create and manage your own financial records
                  </p>
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="cursor-pointer flex-1">
                  <span className="font-semibold">Admin</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full access including user management
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  reason.trim().length >= MIN_REASON_LENGTH
                    ? "text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                {reason.trim().length}/{MIN_REASON_LENGTH} min
              </span>
            </div>
            <Textarea
              id="reason"
              placeholder="Explain why you need this role upgrade..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RoleRequestModal;
