import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import RoleRequestModal from "./RoleRequestModal";

function ViewerBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);

  if (!visible || user?.role !== "viewer") return null;

  return (
    <>
      <Card className="border border-yellow-500/40 bg-yellow-500/10 mb-4">
        <CardContent className="flex items-center justify-between gap-3 py-3 px-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-300">
              You currently have <strong>Viewer</strong> access — you can view
              analytics but cannot create or edit records.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/20 hover:text-yellow-200 text-xs"
              onClick={() => setShowModal(true)}
            >
              Request Access Upgrade
            </Button>
            <button
              onClick={() => setVisible(false)}
              className="text-yellow-400 hover:text-yellow-200 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <RoleRequestModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={() => setShowModal(false)}
      />
    </>
  );
}

export default ViewerBanner;
