import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, CheckCircle2, Mail, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const leadFormSchema = z.object({
  name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatná emailová adresa"),
  phone: z.string().optional(),
  gdprConsent: z.boolean().refine((val) => val === true, "Musíte souhlasit se zpracováním osobních údajů"),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadCollectionFormProps {
  onSuccess?: (data: LeadFormData) => void;
  context?: string; // Kontext - např. "Pro kalkulaci úspor potřebuji pár údajů"
}

export function LeadCollectionForm({ onSuccess, context }: LeadCollectionFormProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      gdprConsent: false,
    },
  });

  const gdprConsent = watch("gdprConsent");

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      return await apiRequest("POST", "/api/contacts", {
        ...data,
        language,
        message: context || "Lead z chatu s Martinem",
        gdprConsent: data.gdprConsent ? 1 : 0,
      });
    },
    onSuccess: (response, variables) => {
      setIsSubmitted(true);
      toast({
        title: language === "cs" ? "Děkujeme!" : "Ďakujeme!",
        description: language === "cs" 
          ? "Brzy vás budeme kontaktovat s personalizovanou nabídkou."
          : "Čoskoro vás budeme kontaktovať s personalizovanou ponukou.",
      });
      onSuccess?.(variables);
    },
    onError: (error: any) => {
      console.error("Lead form error:", error);
      toast({
        title: language === "cs" ? "Chyba" : "Chyba",
        description: language === "cs" 
          ? "Něco se pokazilo. Zkuste to prosím znovu."
          : "Niečo sa pokazilo. Skúste to prosím znova.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  {language === "cs" ? "Děkujeme za důvěru!" : "Ďakujeme za dôveru!"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === "cs"
                    ? "Brzy se vám ozveme s detailním výpočtem úspor a nabídkou."
                    : "Čoskoro sa vám ozveme s detailným výpočtom úspor a ponukou."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-primary/30 bg-card">
        <CardContent className="pt-6 pb-6">
          {context && (
            <p className="text-sm text-muted-foreground mb-4">{context}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* JMÉNO */}
            <div className="space-y-2">
              <Label htmlFor="lead-name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {language === "cs" ? "Jméno a příjmení" : "Meno a priezvisko"}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                {...register("name")}
                placeholder={language === "cs" ? "Jan Novák" : "Ján Novák"}
                className={errors.name ? "border-destructive" : ""}
                data-testid="input-lead-name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="lead-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-email"
                type="email"
                {...register("email")}
                placeholder="jan.novak@email.cz"
                className={errors.email ? "border-destructive" : ""}
                data-testid="input-lead-email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* TELEFON */}
            <div className="space-y-2">
              <Label htmlFor="lead-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                {language === "cs" ? "Telefon (volitelné)" : "Telefón (voliteľné)"}
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                {...register("phone")}
                placeholder="+420 123 456 789"
                data-testid="input-lead-phone"
              />
            </div>

            {/* GDPR */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="lead-gdpr"
                checked={gdprConsent}
                onCheckedChange={(checked) => setValue("gdprConsent", checked as boolean)}
                className={errors.gdprConsent ? "border-destructive" : ""}
                data-testid="checkbox-lead-gdpr"
              />
              <Label
                htmlFor="lead-gdpr"
                className="text-xs leading-relaxed cursor-pointer"
              >
                {language === "cs" ? (
                  <>
                    Souhlasím se{" "}
                    <a href="/gdpr" className="text-primary hover:underline">
                      zpracováním osobních údajů
                    </a>{" "}
                    za účelem kontaktování ohledně nabídky spotových cen elektřiny. *
                  </>
                ) : (
                  <>
                    Súhlasím so{" "}
                    <a href="/gdpr" className="text-primary hover:underline">
                      spracovaním osobných údajov
                    </a>{" "}
                    za účelom kontaktovania ohľadom ponuky spotových cien elektriny. *
                  </>
                )}
              </Label>
            </div>
            {errors.gdprConsent && (
              <p className="text-xs text-destructive ml-6">{errors.gdprConsent.message}</p>
            )}

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full"
              disabled={createLeadMutation.isPending}
              data-testid="button-submit-lead"
            >
              {createLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "cs" ? "Odesílám..." : "Odosielam..."}
                </>
              ) : (
                language === "cs" ? "Odeslat a pokračovat" : "Odoslať a pokračovať"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {language === "cs"
                ? "* Povinné pole. Vaše údaje budou použity pouze pro kontaktování."
                : "* Povinné pole. Vaše údaje budú použité iba pre kontaktovanie."
              }
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
