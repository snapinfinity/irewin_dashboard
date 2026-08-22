"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompaniesTable } from "@/components/admin/companies/CompaniesTable";
import { CompanyForm } from "@/components/admin/companies/CompanyForm";
import { useDebounce } from "@/hooks/use-debounce";
import { listCompanies } from "@/lib/queries/companies";
import type { Company } from "@/types/company";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCompanies(await listCompanies());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(term));
  }, [companies, debouncedSearch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">Manage companies that jobs are posted under.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Company
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Add a company to start posting jobs under it."
            />
          ) : (
            <CompaniesTable
              companies={filtered}
              onEdit={(company) => {
                setEditing(company);
                setFormOpen(true);
              }}
              onChanged={refresh}
            />
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <CompanyForm open={formOpen} onOpenChange={setFormOpen} company={editing} onSaved={refresh} />
      )}
    </div>
  );
}
