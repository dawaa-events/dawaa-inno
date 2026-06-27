import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Building2, MessageSquare, QrCode, Users, Save, Plus } from "lucide-react";
import { toast } from "sonner";

interface SettingsData {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  whatsappPhoneNumber: string;
  whatsappBusinessAccountId: string;
  defaultTemplate: string;
  companyNotes: string;
}

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    companyName: "DAWAA EVENTS",
    companyPhone: "+968 9989 0431",
    companyEmail: "dawaa.events@gmail.com",
    whatsappPhoneNumber: "+968 9989 0431",
    whatsappBusinessAccountId: "123456789",
    defaultTemplate: "dawaa_rsvp_invitation",
    companyNotes: "Professional event management system",
  });

  const handleSaveSettings = () => {
    toast.success("تم حفظ الإعدادات بنجاح");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6 rtl" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">الإعدادات</h1>
          </div>
          <p className="text-gray-600">إدارة إعدادات الشركة والمتكاملات</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Settings */}
          <Card className="border border-purple-100 bg-white shadow-sm rounded-[1.625rem]">
            <CardHeader className="border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-xl text-gray-900">بيانات الشركة</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">اسم الشركة</Label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">رقم الهاتف</Label>
                    <Input
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">البريد الإلكتروني</Label>
                    <Input
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">ملاحظات</Label>
                    <Textarea
                      value={settings.companyNotes}
                      onChange={(e) => setSettings({ ...settings, companyNotes: e.target.value })}
                      rows={3}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">اسم الشركة</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.companyName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.companyPhone}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.companyEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">الملاحظات</p>
                    <p className="text-gray-700">{settings.companyNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Settings */}
          <Card className="border border-purple-100 bg-white shadow-sm rounded-[1.625rem]">
            <CardHeader className="border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <CardTitle className="text-xl text-gray-900">إعدادات WhatsApp</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">رقم الهاتف</Label>
                    <Input
                      value={settings.whatsappPhoneNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappPhoneNumber: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">معرف حساب العمل</Label>
                    <Input
                      value={settings.whatsappBusinessAccountId}
                      onChange={(e) => setSettings({ ...settings, whatsappBusinessAccountId: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">القالب الافتراضي</Label>
                    <Input
                      value={settings.defaultTemplate}
                      onChange={(e) => setSettings({ ...settings, defaultTemplate: e.target.value })}
                      className="mt-2 rounded-lg border-gray-200"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.whatsappPhoneNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">معرف حساب العمل</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.whatsappBusinessAccountId}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">القالب الافتراضي</p>
                    <p className="text-lg font-semibold text-gray-900">{settings.defaultTemplate}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* QR Code Settings */}
          <Card className="border border-purple-100 bg-white shadow-sm rounded-[1.625rem]">
            <CardHeader className="border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-xl text-gray-900">إعدادات رمز QR</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-900 font-semibold mb-2">تنسيق رمز QR</p>
                  <p className="text-sm text-blue-700">تنسيق معياري يتضمن معرف الحجز ومعرف الضيف</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg">
                  <QrCode className="w-4 h-4 ml-2" />
                  اختبار رمز QR
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Settings */}
          <Card className="border border-purple-100 bg-white shadow-sm rounded-[1.625rem]">
            <CardHeader className="border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-xl text-gray-900">الصلاحيات</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-gray-900">إدارة الحجوزات</p>
                    <p className="text-sm text-gray-600">إنشاء وتعديل وحذف الحجوزات</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-gray-900">إدارة الضيوف</p>
                    <p className="text-sm text-gray-600">إضافة وتعديل وحذف الضيوف</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-gray-900">إرسال الدعوات</p>
                    <p className="text-sm text-gray-600">إرسال الدعوات عبر WhatsApp</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-end">
          {isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border-gray-200 hover:bg-gray-50"
            >
              إلغاء
            </Button>
          )}
          <Button
            onClick={() => {
              if (isEditing) {
                handleSaveSettings();
              } else {
                setIsEditing(true);
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 ml-2" />
                تعديل الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
