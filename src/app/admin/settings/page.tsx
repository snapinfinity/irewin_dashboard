"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AddAdminDialog } from "@/components/admin/settings/AddAdminDialog";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import type { AdminRole } from "@/types/admin";

interface AdminRow {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: AdminRole;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Super Admin",
  admin: "Admin",
  employee: "Employee",
};

export default function SettingsPage() {
  const { user, isOwner, isAdminOrAbove } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<AdminRow | null>(null);

  const load = useCallback(async () => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    const res = await fetch("/api/admin/list-admins", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      setError("Failed to load admins.");
      return;
    }
    const data = await res.json();
    setAdmins(data.admins);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, [load]);

  async function handleRemove(admin: AdminRow) {
    const idToken = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/admin/remove-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ uid: admin.uid }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to remove admin");
      return;
    }
    toast.success(`${ROLE_LABELS[admin.role]} removed`);
    load();
  }

  // Cosmetic mirror of the server-side rule in /api/admin/remove-admin — the
  // route re-checks this for real, this is only so the button doesn't show
  // for an action that would just fail.
  function canRemove(admin: AdminRow): boolean {
    if (!isAdminOrAbove) return false;
    if (admin.uid === user?.uid) return false; // self
    if (admin.role === "owner") return false; // Super Admin never removable
    if (admin.role === "admin") return isOwner; // only Super Admin removes an Admin
    return true; // employee — any Admin or above
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin Management</h1>
          <p className="text-sm text-muted-foreground">
            {isAdminOrAbove
              ? "Admins and the Super Admin can add other Admins or Employees. Only the Super Admin can remove an Admin; Employees can never be granted delete access."
              : "Accounts with dashboard access. Only an Admin or the Super Admin can add or remove people."}
          </p>
        </div>
        {isAdminOrAbove && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Admin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Admins</CardTitle>
          <CardDescription>Everyone with dashboard access, and their role.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!admins && !error
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            : admins?.map((admin) => {
                const isSelf = admin.uid === user?.uid;
                return (
                  <div key={admin.uid} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="size-9">
                      <AvatarImage src={admin.photoURL ?? undefined} alt={admin.name} />
                      <AvatarFallback>{admin.name?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {admin.name || admin.email}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant={admin.role === "owner" ? "default" : "secondary"} className="gap-1">
                      {admin.role === "owner" && <Shield className="size-3" />}
                      {ROLE_LABELS[admin.role]}
                    </Badge>
                    {canRemove(admin) && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setRemoving(admin)} title="Remove">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
        </CardContent>
      </Card>

      {isAdminOrAbove && <AddAdminDialog open={addOpen} onOpenChange={setAddOpen} onAdded={load} />}

      {removing && (
        <ConfirmDialog
          open={!!removing}
          onOpenChange={(open) => !open && setRemoving(null)}
          title={`Remove "${removing.name || removing.email}"?`}
          description="They immediately lose dashboard access. Their Google/email-password sign-in account itself is not deleted — you can re-add them later."
          confirmLabel="Remove"
          destructive
          onConfirm={() => handleRemove(removing)}
        />
      )}
    </div>
  );
}
