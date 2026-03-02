import { useAuthContext } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import ExportButton from '@/components/ExportButton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import NaflTracker from '@/components/trackers/NaflTracker';
import QuranTracker from '@/components/trackers/QuranTracker';
import SajdaTracker from '@/components/trackers/SajdaTracker';
import QazaTracker from '@/components/trackers/QazaTracker';
import CharityTracker from '@/components/trackers/CharityTracker';
import IftarTimeTracker from '@/components/trackers/IftarTimeTracker';
import { BookOpen, User, Sun, Clock, Heart, LogOut, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, logout } = useAuthContext();

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 w-full glass-panel border-x-0 border-t-0 rounded-none px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-display font-bold text-lg leading-none tracking-tight">Deen</span>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Tracker
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <ExportButton />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <p className="text-muted-foreground font-medium px-2 mb-8">
          Peace be upon you, {user?.displayName?.split(' ')[0] || 'friend'}. Track your spiritual journey.
        </p>

        <Accordion type="single" collapsible className="space-y-4">

          <AccordionItem value="quran" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><BookOpen className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Quran</h2>
                  <p className="text-sm font-normal text-muted-foreground">Recitation progress</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <QuranTracker />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="qaza" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><Clock className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Qaza Prayers</h2>
                  <p className="text-sm font-normal text-muted-foreground">Missed prayers makeup</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <QazaTracker />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nafl" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><Sun className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Nafl</h2>
                  <p className="text-sm font-normal text-muted-foreground">Voluntary prayer log</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <NaflTracker />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sajda" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><User className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Sajda Tilawat</h2>
                  <p className="text-sm font-normal text-muted-foreground">Prostration counter</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <SajdaTracker />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="charity" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><Heart className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Charity</h2>
                  <p className="text-sm font-normal text-muted-foreground">Financial giving</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <CharityTracker />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="iftar" className="border-none bg-card rounded-[2rem] shadow-sm border border-border/50 px-2 sm:px-4 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-5 px-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-secondary rounded-xl text-primary"><Utensils className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Iftar Time</h2>
                  <p className="text-sm font-normal text-muted-foreground">Sahur & Iftar for this month</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <IftarTimeTracker />
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </main>
    </div>
  );
}
