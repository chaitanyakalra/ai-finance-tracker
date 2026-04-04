import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { apiService } from "../utils/api";

function MyRequestStatus() {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiService
      .getUserRequests()
      .then((res) => {
        if (!cancelled && res.data.requests?.length > 0) {
          setLatest(res.data.requests[0]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!latest) return null;

  if (latest.status === "PENDING") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30">
          Role Request: Pending Review
        </Badge>
      </div>
    );
  }

  if (latest.status === "APPROVED") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30">
          Role Upgraded to {latest.requestedRole}
        </Badge>
      </div>
    );
  }

  if (latest.status === "REJECTED") {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30 w-fit">
          Request Rejected
        </Badge>
        {latest.rejectionReason && (
          <p className="text-xs text-muted-foreground pl-1">{latest.rejectionReason}</p>
        )}
      </div>
    );
  }

  return null;
}

export default MyRequestStatus;
