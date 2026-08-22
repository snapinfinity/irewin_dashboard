"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteCompany, deleteCompanyLogo } from "@/lib/queries/companies";
import { useAuth } from "@/lib/auth/useAuth";
import type { Company } from "@/types/company";

export function CompaniesTable({
  companies,
  onEdit,
  onChanged,
}: {
  companies: Company[];
  onEdit: (company: Company) => void;
  onChanged: () => void;
}) {
  const { user, isAdminOrAbove } = useAuth();
  const [deleting, setDeleting] = useState<Company | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Website</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            // Mirrors firestore.rules: Admin/above can edit anything, an
            // Employee only their own.
            const canEdit = isAdminOrAbove || company.createdBy === user?.uid;
            return (
              <TableRow key={company.id}>
                <TableCell>
                  <Avatar className="size-8 rounded-md">
                    <AvatarImage src={company.logoURL ?? undefined} alt={company.name} />
                    <AvatarFallback className="rounded-md">{company.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(company)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        {isAdminOrAbove && (
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(company)}>
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete "${deleting.name}"?`}
          description="This cannot be undone. Jobs referencing this company will keep their denormalized name/logo but the company record will be gone."
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            if (deleting.logoURL) await deleteCompanyLogo(deleting.logoURL);
            await deleteCompany(deleting.id);
            toast.success("Company deleted");
            onChanged();
          }}
        />
      )}
    </>
  );
}
