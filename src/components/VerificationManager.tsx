import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { 
  ShieldCheck, Upload, FileText, Loader2, AlertCircle, 
  CheckCircle2, Clock, XCircle, Download 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DOCUMENT_TYPES = [
  { value: 'business_license', labelEn: 'Business License', labelAr: 'رخصة العمل' },
  { value: 'tax_certificate', labelEn: 'Tax Certificate', labelAr: 'شهادة ضريبية' },
  { value: 'commercial_registration', labelEn: 'Commercial Registration', labelAr: 'السجل التجاري' },
  { value: 'identity_document', labelEn: 'Identity Document', labelAr: 'وثيقة هوية' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

interface VerificationRequest {
  id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

interface VerificationDocument {
  id: string;
  document_type: string;
  document_url: string;
  document_name: string;
  uploaded_at: string;
}

interface VerificationManagerProps {
  businessId: string;
  isVerified: boolean;
  onVerificationChange: () => void;
}

export default function VerificationManager({ businessId, isVerified, onVerificationChange }: VerificationManagerProps) {
  const { language } = useLanguage();
  const { uploadFile, uploading } = useFileUpload();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('');

  useEffect(() => {
    loadVerificationData();
  }, [businessId]);

  const loadVerificationData = async () => {
    console.log('🔍 VerificationManager: Loading verification data for business:', businessId);
    setLoading(true);

    try {
      // Load verification request
      const { data: requestData, error: requestError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError && requestError.code !== 'PGRST116') throw requestError;

      console.log('✅ VerificationManager: Loaded verification request:', requestData);
      setVerificationRequest(requestData);

      // Load documents if request exists
      if (requestData) {
        const { data: docsData, error: docsError } = await supabase
          .from('verification_documents')
          .select('*')
          .eq('verification_request_id', requestData.id)
          .order('uploaded_at', { ascending: false });

        if (docsError) throw docsError;

        console.log('✅ VerificationManager: Loaded documents:', docsData);
        setDocuments(docsData || []);
      }
    } catch (error: any) {
      console.error('❌ VerificationManager: Error loading data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!selectedDocType) {
      toast.error(language === 'ar' ? 'يرجى اختيار نوع المستند' : 'Please select document type');
      return;
    }

    if (!verificationRequest) {
      toast.error(language === 'ar' ? 'يرجى إنشاء طلب توثيق أولاً' : 'Please create verification request first');
      return;
    }

    console.log('📄 VerificationManager: Uploading document...', {
      fileName: file.name,
      documentType: selectedDocType,
    });

    const url = await uploadFile(file, { 
      bucket: 'business-documents', 
      maxSizeMB: 10
    });

    if (url) {
      try {
        const { error } = await supabase
          .from('verification_documents')
          .insert({
            verification_request_id: verificationRequest.id,
            business_id: businessId,
            document_type: selectedDocType,
            document_url: url,
            document_name: file.name,
          });

        if (error) throw error;

        console.log('✅ VerificationManager: Document uploaded successfully');
        toast.success(language === 'ar' ? 'تم رفع المستند' : 'Document uploaded');
        setSelectedDocType('');
        loadVerificationData();
      } catch (error: any) {
        console.error('❌ VerificationManager: Error saving document:', error);
        toast.error(language === 'ar' ? 'خطأ في حفظ المستند' : 'Error saving document');
      }
    }
  };

  const handleSubmitRequest = async () => {
    if (!verificationRequest) {
      console.log('📝 VerificationManager: Creating new verification request...');
      setSubmitting(true);

      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .insert({
            business_id: businessId,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ VerificationManager: Verification request created');
        toast.success(language === 'ar' ? 'تم إنشاء طلب التوثيق' : 'Verification request created');
        setVerificationRequest(data);
      } catch (error: any) {
        console.error('❌ VerificationManager: Error creating request:', error);
        toast.error(language === 'ar' ? 'خطأ في إنشاء الطلب' : 'Error creating request');
      } finally {
        setSubmitting(false);
      }
    } else if (verificationRequest.status === 'pending' && documents.length > 0) {
      setSubmitting(true);

      try {
        const { error } = await supabase
          .from('verification_requests')
          .update({ status: 'under_review' })
          .eq('id', verificationRequest.id);

        if (error) throw error;

        console.log('✅ VerificationManager: Request submitted for review');
        toast.success(language === 'ar' ? 'تم إرسال الطلب للمراجعة' : 'Request submitted for review');
        loadVerificationData();
      } catch (error: any) {
        console.error('❌ VerificationManager: Error submitting request:', error);
        toast.error(language === 'ar' ? 'خطأ في إرسال الطلب' : 'Error submitting request');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: any; label: string; labelAr: string; variant: any; color: string }> = {
      pending: { 
        icon: Clock, 
        label: 'Pending', 
        labelAr: 'قيد الانتظار', 
        variant: 'secondary',
        color: 'text-yellow-600'
      },
      under_review: { 
        icon: AlertCircle, 
        label: 'Under Review', 
        labelAr: 'قيد المراجعة', 
        variant: 'default',
        color: 'text-blue-600'
      },
      approved: { 
        icon: CheckCircle2, 
        label: 'Approved', 
        labelAr: 'موافق عليه', 
        variant: 'default',
        color: 'text-green-600'
      },
      rejected: { 
        icon: XCircle, 
        label: 'Rejected', 
        labelAr: 'مرفوض', 
        variant: 'destructive',
        color: 'text-red-600'
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    return language === 'ar' ? docType?.labelAr : docType?.labelEn;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isVerified) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertDescription className="flex items-center gap-2">
          <span className="font-semibold">
            {language === 'ar' ? 'عملك موثق بنجاح!' : 'Your business is verified!'}
          </span>
          <ShieldCheck className="h-5 w-5 text-green-600" />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {language === 'ar' ? 'توثيق العمل' : 'Business Verification'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'احصل على شارة التوثيق لزيادة مصداقية عملك' 
                  : 'Get verified to increase your business credibility'}
              </CardDescription>
            </div>
            {verificationRequest && (
              <Badge 
                variant={getStatusInfo(verificationRequest.status).variant}
                className="gap-1"
              >
                {React.createElement(getStatusInfo(verificationRequest.status).icon, { 
                  className: "h-3 w-3" 
                })}
                {language === 'ar' 
                  ? getStatusInfo(verificationRequest.status).labelAr 
                  : getStatusInfo(verificationRequest.status).label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!verificationRequest ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                {language === 'ar' 
                  ? 'ابدأ بإنشاء طلب التوثيق وقم برفع المستندات المطلوبة' 
                  : 'Start by creating a verification request and upload required documents'}
              </p>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <ShieldCheck className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء طلب توثيق' : 'Create Verification Request'}
              </Button>
            </div>
          ) : (
            <>
              {verificationRequest.status === 'rejected' && verificationRequest.rejection_reason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}</strong>
                    <p className="mt-1">{verificationRequest.rejection_reason}</p>
                  </AlertDescription>
                </Alert>
              )}

              {(verificationRequest.status === 'pending' || verificationRequest.status === 'rejected') && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">
                      {language === 'ar' ? 'رفع المستندات' : 'Upload Documents'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{language === 'ar' ? 'نوع المستند' : 'Document Type'}</Label>
                        <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select type'} />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {language === 'ar' ? type.labelAr : type.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="w-full">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            disabled={!selectedDocType || uploading}
                            asChild
                          >
                            <span>
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file);
                            }}
                            className="hidden"
                            disabled={!selectedDocType || uploading}
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' 
                        ? 'صيغ مدعومة: PDF, JPG, PNG, DOC, DOCX (حد أقصى 10 ميجابايت)' 
                        : 'Supported: PDF, JPG, PNG, DOC, DOCX (max 10MB)'}
                    </p>
                  </div>

                  {documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">
                        {language === 'ar' ? 'المستندات المرفوعة' : 'Uploaded Documents'} ({documents.length})
                      </h4>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{doc.document_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getDocumentTypeLabel(doc.document_type)}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(doc.document_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {documents.length > 0 && verificationRequest.status === 'pending' && (
                    <Button 
                      onClick={handleSubmitRequest} 
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {language === 'ar' ? 'إرسال للمراجعة' : 'Submit for Review'}
                    </Button>
                  )}
                </div>
              )}

              {verificationRequest.status === 'under_review' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' 
                      ? 'طلبك قيد المراجعة. سنقوم بإعلامك بالنتيجة قريباً.' 
                      : 'Your request is under review. We will notify you of the result soon.'}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export React for the createElement usage
import React from 'react';