import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2, Upload, X, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { Tables } from '@/integrations/supabase/types';

type Review = Tables<'business_reviews'>;

interface ReviewSectionProps {
  businessId: string;
  businessOwnerId: string;
}

export default function ReviewSection({ businessId, businessOwnerId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  useEffect(() => {
    loadReviews();
  }, [businessId]);

  const loadReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
      if (user) {
        const myReview = data.find(r => r.reviewer_id === user.id);
        if (myReview) {
          setUserReview(myReview);
          setRating(myReview.rating);
          setComment(myReview.comment || '');
          setMediaPreviews(myReview.media_urls || []);
        }
      }
    }
    setLoading(false);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload new media files
      const newMediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const url = await uploadFile(file, {
          bucket: 'review-media',
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
          maxSizeMB: 50,
        });
        if (url) newMediaUrls.push(url);
      }

      if (userReview) {
        // Update existing review
        const updatedMediaUrls = [...(userReview.media_urls || []), ...newMediaUrls];
        const { error } = await supabase
          .from('business_reviews')
          .update({
            rating,
            comment: comment.trim() || null,
            media_urls: updatedMediaUrls,
          })
          .eq('id', userReview.id);

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Success',
          description: language === 'ar' ? 'تم تحديث تقييمك' : 'Your review has been updated',
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('business_reviews')
          .insert({
            business_id: businessId,
            reviewer_id: user.id,
            rating,
            comment: comment.trim() || null,
            media_urls: newMediaUrls,
          });

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'شكراً' : 'Success',
          description: language === 'ar' ? 'تم إضافة تقييمك' : 'Your review has been added',
        });
      }

      setEditMode(false);
      setMediaFiles([]);
      setMediaPreviews([]);
      loadReviews();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('business_reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف تقييمك' : 'Your review has been deleted',
      });

      setUserReview(null);
      setRating(0);
      setComment('');
      setMediaFiles([]);
      setMediaPreviews([]);
      loadReviews();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const canReview = user && user.id !== businessOwnerId;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {language === 'ar' ? 'التقييمات' : 'Reviews'}
      </h2>

      {/* Review Form */}
      {canReview && (!userReview || editMode) && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'التقييم' : 'Rating'}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl transition-colors"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          (hoverRating || rating) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'التعليق (اختياري)' : 'Comment (Optional)'}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف تعليقك...' : 'Add your comment...'}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة صور أو فيديوهات' : 'Add Photos or Videos'}
                </Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  disabled={uploading}
                />
                {mediaPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {mediaPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        {preview.startsWith('data:video') || preview.includes('.mp4') || preview.includes('.webm') ? (
                          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                            <video src={preview} className="w-full h-full object-cover" />
                            <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <img src={preview} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || rating === 0 || uploading}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading
                    ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                    : userReview
                    ? (language === 'ar' ? 'تحديث التقييم' : 'Update Review')
                    : (language === 'ar' ? 'إضافة تقييم' : 'Submit Review')}
                </Button>
                {editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setRating(userReview?.rating || 0);
                      setComment(userReview?.comment || '');
                      setMediaFiles([]);
                      setMediaPreviews(userReview?.media_urls || []);
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User's existing review (display mode) */}
      {canReview && userReview && !editMode && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      userReview.rating >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(true)}
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
            {userReview.comment && (
              <p className="text-sm text-muted-foreground mt-2">{userReview.comment}</p>
            )}
            {userReview.media_urls && userReview.media_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {userReview.media_urls.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                      <video src={url} controls className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'ar' ? 'تقييمك' : 'Your Review'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* All Reviews */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">User</h4>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              review.rating >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    {review.media_urls && review.media_urls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {review.media_urls.map((url, index) => (
                          <div key={index} className="relative aspect-square">
                            {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                              <video src={url} controls className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <img 
                                src={url} 
                                alt="" 
                                className="w-full h-full object-cover rounded-lg cursor-pointer" 
                                onClick={() => window.open(url, '_blank')}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString(
                        language === 'ar' ? 'ar' : 'en',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}