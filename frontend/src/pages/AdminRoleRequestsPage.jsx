import { useEffect, useState, useCallback } from "react";
import { apiService } from "../utils/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

const statusBadge = (status) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/40">
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({ request, onClose, onDone }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await apiService.approveRequest(request.id, notes.trim() || undefined);
      toast.success(`Request approved. ${request.user?.name}'s role upgraded to ${request.requestedRole}.`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Approve Role Request
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upgrade <strong>{request.user?.name || request.userId}</strong> to{" "}
            <strong className="capitalize">{request.requestedRole}</strong>?
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add a note for the user..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ request, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = reason.trim().length >= 5;

  const handleReject = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiService.rejectRequest(request.id, reason.trim());
      toast.success("Request rejected.");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Reject Role Request
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Reject the request from{" "}
            <strong>{request.user?.name || request.userId}</strong>?
          </p>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Provide a reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!canSubmit || loading}
            variant="destructive"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminRoleRequestsPage() {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchRequests = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await apiService.getAdminRequests({ status: activeTab, page, limit: 15 });
        setRequests(res.data.requests);
        setPagination(res.data.pagination);
      } catch (err) {
        toast.error("Failed to load role requests.");
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleModalDone = () => {
    setApproveTarget(null);
    setRejectTarget(null);
    fetchRequests(pagination.page);
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Role Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage user role upgrade requests
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  {tab.charAt(0) + tab.slice(1).toLowerCase()} Requests
                  {pagination.total > 0 && (
                    <span className="ml-2 text-muted-foreground font-normal text-sm">
                      ({pagination.total})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Users className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No {tab.toLowerCase()} role requests.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Current Role</TableHead>
                          <TableHead>Requested Role</TableHead>
                          <TableHead className="max-w-[200px]">Reason</TableHead>
                          <TableHead>Requested At</TableHead>
                          <TableHead>Status</TableHead>
                          {tab === "PENDING" && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">
                              {req.user?.name || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {req.user?.email || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {req.user?.role || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs border-primary/40 text-primary">
                                {req.requestedRole}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {req.reason}
                              </p>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatDate(req.createdAt)}
                            </TableCell>
                            <TableCell>{statusBadge(req.status)}</TableCell>
                            {tab === "PENDING" && (
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                                    onClick={() => setApproveTarget(req)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => setRejectTarget(req)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => fetchRequests(pagination.page - 1)}
                        className="h-7 text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page >= pagination.pages || loading}
                        onClick={() => fetchRequests(pagination.page + 1)}
                        className="h-7 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={handleModalDone}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={handleModalDone}
        />
      )}
    </div>
  );
}

export default AdminRoleRequestsPage;
