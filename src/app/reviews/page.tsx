"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Star, ThumbsUp, ThumbsDown, AlertOctagon, Archive } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import reviewsService from "@/services/reviewsService";
import { Review } from "@/types/review";

export default function ReviewsPage() {
  const { user, isAdmin, isSeller } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user role for proper filtering
        const userRole = isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'USER';
        
        const res = await reviewsService.getReviews({ page, limit }, userRole);
        if (res.success) {
          setReviews(res.data.reviews);
          setTotal(res.data.total);
        } else {
          setError(res.error || 'Failed to load reviews');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, limit, isAdmin, isSeller]);

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reviews</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <AlertOctagon className="mr-2 h-4 w-4" />
              Reported Reviews
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : total}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 fill-current text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading || reviews.length === 0 ? '—' : (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* Backend does not expose status field; placeholder */}
                —
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reported Reviews</CardTitle>
              <AlertOctagon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                —
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              Manage and moderate user product reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading…</TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7}>{error}</TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No reviews found</TableCell>
                  </TableRow>
                ) : reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.user ? `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || review.user.email : 'Guest'}</TableCell>
                    <TableCell>{review.product?.title || '—'}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? "fill-current text-yellow-400" : "text-gray-300"}`} 
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{review.comment || '—'}</TableCell>
                    <TableCell>{new Date(review.createdAt).toISOString().slice(0,10)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${review.isVerifiedPurchase ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {review.isVerifiedPurchase ? 'Verified' : 'Unverified'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Archive className="h-4 w-4" />
                          <span className="sr-only">Archive</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              Review distribution by star rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(review => review.rating === rating).length;
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center">
                    <div className="w-16 text-sm font-medium">
                      {rating} star{rating !== 1 ? 's' : ''}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                        <div 
                          className={`h-2 bg-yellow-400 rounded-full`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 