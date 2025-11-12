// Admin Dashboard - Blueprint: javascript_log_in_with_replit
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, MessageSquare, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Nepřihlášen",
        description: "Přihlašuji...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/admin/leads"],
    enabled: isAuthenticated,
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/admin/conversations"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting...
  }

  const leads = leadsData?.data || [];
  const conversations = conversationsData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text-animated">Admin Panel - Martin</h1>
          <Button variant="outline" onClick={() => window.location.href = "/api/logout"}>
            Odhlásit se
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="leads" data-testid="tab-leads">
              <Mail className="h-4 w-4 mr-2" />
              Leady ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="conversations" data-testid="tab-conversations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Konverzace ({conversations.length})
            </TabsTrigger>
          </TabsList>

          {/* LEADS TAB */}
          <TabsContent value="leads">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Sesbírané Leady</h2>
                <Badge variant="outline">{leads.length} kontaktů</Badge>
              </div>

              {leadsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : leads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Žádné leady zatím</p>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jméno</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Jazyk</TableHead>
                        <TableHead>Zpráva</TableHead>
                        <TableHead>Datum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead: any) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              {lead.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                              {lead.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            {lead.phone ? (
                              <a href={`tel:${lead.phone}`} className="hover:underline">
                                {lead.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{lead.language.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {lead.message || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(lead.createdAt), "d. M. yyyy HH:mm", { locale: cs })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* CONVERSATIONS TAB */}
          <TabsContent value="conversations">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Konverzace s klienty</h2>
                <Badge variant="outline">{conversations.length} sessions</Badge>
              </div>

              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Žádné konverzace zatím</p>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conv: any) => (
                    <Card key={conv.sessionId} className="p-4 hover-elevate active-elevate-2">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            Session: {conv.sessionId.substring(0, 12)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {conv.messageCount} zpráv
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(conv.lastMessage), "d. M. yyyy HH:mm", { locale: cs })}
                            </span>
                          </div>
                        </div>
                        <Badge>{conv.messageCount} msg</Badge>
                      </div>

                      {/* Last few messages preview */}
                      <div className="space-y-2 mt-4">
                        {conv.messages.slice(-3).map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`text-sm p-2 rounded ${
                              msg.role === "user"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span className="font-semibold capitalize">{msg.role}:</span>{" "}
                            {msg.content.substring(0, 100)}
                            {msg.content.length > 100 && "..."}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
