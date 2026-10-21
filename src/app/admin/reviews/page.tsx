"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, MessageSquareQuote, RotateCcw, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { deleteReview, listReviews, setReviewStatus } from "@/lib/queries/reviews";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import type { Review, ReviewStatus } from "@/types/review";

const TABS: { value: ReviewStatus; label: string; empty: string }[] = [
  { value: "pending", label: "Waiting", empty: "No reviews waiting for approval." },
  { value: "approved", label: "Approved", empty: "No approved reviews yet. Approved reviews show on the public site." },
  { value: "rejected", label: "Rejected", empty: "No rejected reviews." },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
      ))}
    </span>
  );
}

/**
 * Customer reviews from the public site. Any staff member can approve or
 * reject; deleting is Admin-or-above (mirrors firestore.rules). Only
 * approved reviews are shown on the site (within about a minute).
 */
export default function ReviewsPage() {
  const { user, isAdminOrAbove } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await listReviews());
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load reviews. Are the latest Firestore rules deployed?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const c: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const r of reviews) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [reviews]);
  const shown = reviews.filter((r) => r.status === tab);

  async function changeStatus(review: Review, status: ReviewStatus) {
    if (!user) return;
    setBusyId(review.id);
    try {
      await setReviewStatus(review.id, status, user.uid);
      toast.success(
        status === "approved"
          ? `Approved — ${review.name}'s review is now on the site`
          : status === "rejected"
            ? `Rejected — ${review.name}'s review stays hidden`
            : "Moved back to waiting",
      );
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Customer reviews from the IREWIN website. Only approved reviews are shown on the site.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReviewStatus)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {counts[t.value] > 0 && (
                <Badge variant={t.value === "pending" ? "default" : "secondary"} className="ml-1.5">
                  {counts[t.value]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState icon={MessageSquareQuote} title="Nothing here" description={TABS.find((t) => t.value === tab)!.empty} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={review.photoURL ?? undefined} alt={review.name} referrerPolicy="no-referrer" />
                    <AvatarFallback>{review.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{review.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.updatedAt)}
                      {review.reviewedAt && review.status !== "pending" && ` · ${review.status} ${formatDate(review.reviewedAt)}`}
                    </p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <p className="flex-1 whitespace-pre-line text-sm leading-relaxed">{review.text}</p>
                <div className="flex flex-wrap gap-2">
                  {review.status !== "approved" && (
                    <Button size="sm" disabled={busyId === review.id} onClick={() => changeStatus(review, "approved")}>
                      <Check className="size-4" /> Approve
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={busyId === review.id} onClick={() => changeStatus(review, "rejected")}>
                      <X className="size-4" /> {review.status === "approved" ? "Unpublish" : "Reject"}
                    </Button>
                  )}
                  {review.status === "rejected" && (
                    <Button size="sm" variant="ghost" disabled={busyId === review.id} onClick={() => changeStatus(review, "pending")}>
                      <RotateCcw className="size-4" /> Back to waiting
                    </Button>
                  )}
                  {isAdminOrAbove && (
                    <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setDeleting(review)}>
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete ${deleting.name}'s review?`}
          description="This permanently removes the review. It can't be restored, but the customer can write a new one."
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            await deleteReview(deleting.id);
            toast.success("Review deleted");
            await refresh();
          }}
        />
      )}
    </div>
  );
}
