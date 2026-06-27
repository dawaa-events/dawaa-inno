import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Download, Share2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

interface QRCard {
  id: string;
  guestName: string;
  bookingName: string;
  shortCode: string;
  cardsCount: number;
  status: "pending" | "sent" | "delivered";
}

const mockQRCards: QRCard[] = [
  {
    id: "1",
    guestName: "وصخي",
    bookingName: "اي شي",
    shortCode: "ABC123",
    cardsCount: 1,
    status: "sent",
  },
  {
    id: "2",
    guestName: "وصوحة",
    bookingName: "اي شي",
    shortCode: "DEF456",
    cardsCount: 3,
    status: "delivered",
  },
  {
    id: "3",
    guestName: "احمد",
    bookingName: "اختبار",
    shortCode: "GHI789",
    cardsCount: 1,
    status: "pending",
  },
  {
    id: "4",
    guestName: "وصخي",
    bookingName: "اختبار",
    shortCode: "JKL012",
    cardsCount: 1,
    status: "delivered",
  },
];

export default function QRCardsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "sent" | "delivered">("all");

  const filteredCards = mockQRCards.filter((card) => {
    const matchesSearch =
      card.guestName.includes(searchTerm) ||
      card.bookingName.includes(searchTerm) ||
      card.shortCode.includes(searchTerm);
    const matchesFilter = selectedFilter === "all" || card.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "sent":
        return "تم الإرسال";
      case "delivered":
        return "تم التسليم";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6 rtl" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">بطاقات QR</h1>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بطاقة جديدة
            </Button>
          </div>
          <p className="text-gray-600">إدارة وتوزيع بطاقات الدخول QR</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="ابحث عن ضيف أو حجز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 rounded-lg border-gray-200 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "sent", "delivered"].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter as any)}
                className={`rounded-lg ${
                  selectedFilter === filter
                    ? "bg-purple-600 text-white"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {filter === "all" ? "الكل" : getStatusLabel(filter)}
              </Button>
            ))}
          </div>
        </div>

        {/* QR Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="border border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-[1.625rem] overflow-hidden"
            >
              <CardContent className="p-0">
                {/* QR Code Preview */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 flex items-center justify-center min-h-[200px]">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QrCode className="w-24 h-24 text-purple-600" />
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">اسم الضيف</p>
                    <p className="font-semibold text-gray-900">{card.guestName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">الحجز</p>
                    <p className="text-sm text-gray-700">{card.bookingName}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">الكود</p>
                      <p className="font-mono text-sm font-semibold text-purple-600">{card.shortCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">البطاقات</p>
                      <p className="text-lg font-bold text-purple-600">{card.cardsCount}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border text-center ${getStatusColor(card.status)}`}>
                    {getStatusLabel(card.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-lg border-gray-200 hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => toast.success("تم نسخ الرابط")}
                    >
                      <Share2 className="w-3 h-3 ml-1" />
                      مشاركة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-lg border-gray-200 hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => toast.success("تم تحميل البطاقة")}
                    >
                      <Download className="w-3 h-3 ml-1" />
                      تحميل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">لا توجد بطاقات QR</p>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بطاقة جديدة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
