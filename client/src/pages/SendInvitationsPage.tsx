import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Eye, AlertCircle, CheckCircle, XCircle, Clock, MessageSquare, Users, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SendInvitationsPageProps {
  bookingId: string;
}

export default function SendInvitationsPage({ bookingId }: SendInvitationsPageProps) {
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendMode, setSendMode] = useState<"one" | "selected" | "all">("selected");
  const [selectedGuestForSingle, setSelectedGuestForSingle] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: guests = [], isLoading, refetch } = trpc.guests.getByBooking.useQuery({ bookingId });
  const { data: booking } = trpc.bookings.getById.useQuery({ bookingId });
  const { data: stats } = trpc.bookings.getStats.useQuery({ bookingId });

  const sendMutation = trpc.invitations.sendToGuests.useMutation();

  const pendingGuests = useMemo(() => guests.filter((g: any) => g.rsvpStatus === "pending"), [guests]);
  const failedGuests = useMemo(() => guests.filter((g: any) => g.rsvpStatus === "failed"), [guests]);
  const sentGuests = useMemo(() => guests.filter((g: any) => g.rsvpStatus !== "pending" && g.rsvpStatus !== "failed"), [guests]);
  
  const filteredGuests = useMemo(() => {
    return guests.filter((g: any) => 
      g.guestName.includes(searchTerm) || 
      g.guestPhone.includes(searchTerm)
    );
  }, [guests, searchTerm]);

  const getGuestsToSend = () => {
    if (sendMode === "one") {
      return selectedGuestForSingle ? [selectedGuestForSingle] : [];
    } else if (sendMode === "all") {
      return pendingGuests.map((g: any) => g.id);
    } else {
      return Array.from(selectedGuests);
    }
  };

  const handleSendInvitations = async () => {
    const guestsToSend = getGuestsToSend();

    if (guestsToSend.length === 0) {
      toast.error("يرجى تحديد الضيوف للإرسال");
      return;
    }

    setIsSending(true);
    setSendingProgress(0);

    try {
      const result = await sendMutation.mutateAsync({
        bookingId,
        guestIds: guestsToSend,
      }) as { success: boolean; sentCount: number; errors: string[] };

      setSendingProgress(100);
      toast.success(`تم إرسال الدعوات بنجاح إلى ${result.sentCount} ضيف`);
      
      setSelectedGuests(new Set());
      setSelectedGuestForSingle("");
      setSendMode("selected");
      
      setTimeout(() => {
        refetch();
        setIsSending(false);
        setSendingProgress(0);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال الدعوات");
      setIsSending(false);
      setSendingProgress(0);
    }
  };

  const handleSelectGuest = (guestId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filteredGuests.map((g: any) => g.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6 rtl" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إرسال الدعوات</h1>
          <p className="text-gray-600">أرسل دعوات المناسبة إلى الضيوف عبر WhatsApp</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الضيوف</p>
                  <p className="text-3xl font-bold text-purple-900">{guests.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">في الانتظار</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingGuests.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">فشل الإرسال</p>
                  <p className="text-3xl font-bold text-red-600">{failedGuests.length}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">تم الإرسال</p>
                  <p className="text-3xl font-bold text-green-600">{sentGuests.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Send Options */}
          <div className="lg:col-span-2">
            <Card className="border border-purple-100 bg-white shadow-sm">
              <CardHeader className="border-b border-purple-100 pb-4">
                <CardTitle className="text-2xl text-gray-900">خيارات الإرسال</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Send Mode Selection */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id="mode-one"
                      name="sendMode"
                      value="one"
                      checked={sendMode === "one"}
                      onChange={(e) => setSendMode(e.target.value as any)}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                    <label htmlFor="mode-one" className="text-gray-700 cursor-pointer">إرسال لضيف واحد</label>
                  </div>

                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id="mode-selected"
                      name="sendMode"
                      value="selected"
                      checked={sendMode === "selected"}
                      onChange={(e) => setSendMode(e.target.value as any)}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                    <label htmlFor="mode-selected" className="text-gray-700 cursor-pointer">إرسال لضيوف محددين</label>
                  </div>

                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id="mode-all"
                      name="sendMode"
                      value="all"
                      checked={sendMode === "all"}
                      onChange={(e) => setSendMode(e.target.value as any)}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                    <label htmlFor="mode-all" className="text-gray-700 cursor-pointer">إرسال لجميع الضيوف المعلقين</label>
                  </div>
                </div>

                {/* Single Guest Selection */}
                {sendMode === "one" && (
                  <div className="mb-6">
                    <Label className="text-gray-700 font-semibold mb-2 block">اختر ضيف</Label>
                    <select
                      value={selectedGuestForSingle}
                      onChange={(e) => setSelectedGuestForSingle(e.target.value)}
                      className="w-full px-4 py-3 border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="">-- اختر ضيف --</option>
                      {pendingGuests.map((guest: any) => (
                        <option key={guest.id} value={guest.id}>
                          {guest.guestName} ({guest.guestPhone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selected Guests Count */}
                {sendMode === "selected" && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-purple-900 font-semibold">
                      {selectedGuests.size} ضيف محدد
                    </p>
                  </div>
                )}

                {/* All Guests Count */}
                {sendMode === "all" && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-orange-900 font-semibold">
                      سيتم الإرسال إلى {pendingGuests.length} ضيف معلق
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    معاينة الرسالة
                  </Button>

                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={isSending || getGuestsToSend().length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        إرسال الدعوات
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isSending && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendingProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">{sendingProgress}% مكتمل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Guest List */}
          <div>
            <Card className="border border-purple-100 bg-white shadow-sm">
              <CardHeader className="border-b border-purple-100 pb-4">
                <CardTitle className="text-xl text-gray-900">قائمة الضيوف</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Search */}
                <div className="mb-4">
                  <Input
                    placeholder="ابحث عن ضيف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-purple-200 rounded-xl focus:ring-purple-500"
                  />
                </div>

                {/* Select All */}
                {sendMode === "selected" && (
                  <div className="mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="select-all"
                      checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                      onChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-700 cursor-pointer">
                      تحديد الكل
                    </label>
                  </div>
                )}

                {/* Guest List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sendMode === "selected" ? (
                    filteredGuests.map((guest: any) => (
                      <div
                        key={guest.id}
                        className="flex items-center space-x-2 rtl:space-x-reverse p-3 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Checkbox
                          id={`guest-${guest.id}`}
                          checked={selectedGuests.has(guest.id)}
                          onChange={() => handleSelectGuest(guest.id)}
                        />
                        <label htmlFor={`guest-${guest.id}`} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium text-gray-900">{guest.guestName}</p>
                          <p className="text-xs text-gray-500">{guest.guestPhone}</p>
                        </label>
                        {guest.rsvpStatus === "confirmed" && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {guest.rsvpStatus === "declined" && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        {guest.rsvpStatus === "pending" && (
                          <Clock className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-600 text-center py-4">
                      اختر وضع الإرسال أعلاه
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md bg-white rounded-3xl border border-purple-100">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900">معاينة الرسالة</DialogTitle>
          </DialogHeader>
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
            <p className="text-gray-900 leading-relaxed mb-4">
              أهلاً {selectedGuestForSingle ? guests.find((g: any) => g.id === selectedGuestForSingle)?.guestName : "الضيف"}،
            </p>
            <p className="text-gray-800 leading-relaxed mb-4">
              نتشرف بدعوتك لحضور مناسبتنا الخاصة.
            </p>
            <p className="text-gray-800 leading-relaxed mb-4">
              يرجى تأكيد حضورك بالنقر على الزر أدناه.
            </p>
            <div className="bg-white p-4 rounded-xl border border-purple-200 text-center">
              <p className="text-purple-600 font-semibold">✓ تأكيد الحضور</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-white rounded-3xl border border-purple-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-gray-900">تأكيد الإرسال</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              هل تريد إرسال الدعوات إلى {getGuestsToSend().length} ضيف؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="border-purple-200 text-purple-600 hover:bg-purple-50">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendInvitations}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              تأكيد الإرسال
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
