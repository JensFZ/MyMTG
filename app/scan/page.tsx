import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";

import { LiveCardScanner } from "@/components/live-card-scanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-6">
      <Button asChild variant="ghost">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck zum Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-3xl">Live-Kartenscanner</CardTitle>
              <CardDescription>
                Scanne mehrere Karten nacheinander direkt mit der Smartphone-Kamera.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LiveCardScanner />
        </CardContent>
      </Card>
    </div>
  );
}
