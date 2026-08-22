"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase/client";
import { Info } from "lucide-react";

interface AdminRow {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: string;
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Admin access is managed outside the UI for security.</p>
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Adding a new admin</AlertTitle>
        <AlertDescription>
          Admin access is intentionally not editable from this page, to prevent any
          signed-in Google account from granting itself access. To add an admin:
          have them sign in once at <code>/login</code> (they&apos;ll see &quot;not
          authorized&quot;), then add their email to <code>ADMIN_EMAILS</code> in
          your server environment and run <code>npm run seed:admin</code>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Admins</CardTitle>
          <CardDescription>Read-only list of accounts with dashboard access.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!admins && !error
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            : admins?.map((admin) => (
                <div key={admin.uid} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="size-9">
                    <AvatarImage src={admin.photoURL ?? undefined} alt={admin.name} />
                    <AvatarFallback>{admin.name?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{admin.name || admin.email}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{admin.role}</Badge>
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  );
}
