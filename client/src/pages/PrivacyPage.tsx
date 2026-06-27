import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">سياسة الخصوصية</h1>
        <p className="text-sm text-gray-500 mb-8">آخر تحديث: يونيو 2026</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">1. المقدمة</h2>
          <p className="text-gray-600 leading-relaxed">
            منصة دعوة هي منصة لإدارة دعوات الأفراح والمناسبات عبر واتساب. نحن نلتزم بحماية
            خصوصية بياناتك الشخصية وبيانات ضيوفك وفقاً لأفضل الممارسات الدولية.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">2. البيانات التي نجمعها</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>أسماء الضيوف وأرقام هواتفهم لأغراض إرسال الدعوات</li>
            <li>حالة الرد على الدعوة (حضور / اعتذار)</li>
            <li>بيانات الحجز والمناسبة (التاريخ، المكان، عدد الضيوف)</li>
            <li>بيانات تسجيل الدخول عبر OAuth</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">3. كيف نستخدم البيانات</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>إرسال دعوات المناسبات عبر واتساب</li>
            <li>تتبع ردود الضيوف وتحديث قوائم الحضور</li>
            <li>إرسال رسائل تأكيد الحضور أو الاعتذار</li>
            <li>إدارة بطاقات الدخول للمناسبات</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">4. مشاركة البيانات</h2>
          <p className="text-gray-600 leading-relaxed">
            لا نشارك بياناتك مع أي طرف ثالث باستثناء:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
            <li>
              <strong>Meta (WhatsApp):</strong> لإرسال الرسائل عبر WhatsApp Business API
            </li>
            <li>
              <strong>مزود قاعدة البيانات:</strong> لتخزين البيانات بشكل آمن
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">5. حقوق المستخدم</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>حق الوصول إلى بياناتك الشخصية</li>
            <li>حق تصحيح البيانات غير الدقيقة</li>
            <li>حق حذف بياناتك من النظام</li>
            <li>حق الاعتراض على معالجة بياناتك</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">6. أمان البيانات</h2>
          <p className="text-gray-600 leading-relaxed">
            نستخدم تشفير SSL/TLS لجميع الاتصالات، وقواعد بيانات مشفرة، وصلاحيات وصول محدودة
            لحماية بياناتك من الوصول غير المصرح به.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">7. استخدام WhatsApp</h2>
          <p className="text-gray-600 leading-relaxed">
            نستخدم WhatsApp Business API من Meta لإرسال الدعوات ورسائل التأكيد. يخضع استخدامنا
            لـ{" "}
            <a
              href="https://www.whatsapp.com/legal/business-policy"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              سياسة WhatsApp Business
            </a>{" "}
            و{" "}
            <a
              href="https://www.facebook.com/privacy/policy"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              سياسة خصوصية Meta
            </a>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">8. التواصل معنا</h2>
          <p className="text-gray-600 leading-relaxed">
            لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر الموقع.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          © 2026 منصة دعوة - جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
