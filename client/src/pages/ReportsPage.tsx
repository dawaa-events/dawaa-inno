import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6 rtl" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">Reports</h1>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg">
              <Download className="w-4 h-4 ml-2" />
              Download Report
            </Button>
          </div>
          <p className="text-gray-600">View event and guest statistics</p>
        </div>

        <Card className="border border-purple-100 bg-white shadow-sm rounded-[1.625rem]">
          <CardHeader className="border-b border-purple-100 pb-4">
            <CardTitle className="text-2xl text-gray-900">Event Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600">Reports data will be displayed here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
