import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Mail, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const contactFormSchema = z.object({
  name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatná emailová adresa"),
  phone: z.string().optional(),
  message: z.string().optional(),
  gdprConsent: z.boolean().refine((val) => val === true, "Musíte souhlasit se zpracováním osobních údajů"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      gdprConsent: false,
    },
  });

  const gdprConsent = watch("gdprConsent");

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest("POST", "/api/contacts", {
        ...data,
        language,
        gdprConsent: data.gdprConsent ? 1 : 0,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: t.contact.successTitle,
        description: t.contact.successMessage,
      });
      reset();
    },
    onError: (error: any) => {
      console.error("Contact form error:", error);
      toast({
        title: t.contact.errorTitle,
        description: t.contact.errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <section id="contact" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="text-center border-2 backdrop-blur-xl bg-card/80">
              <CardContent className="pt-16 pb-16">
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-chart-2 to-accent flex items-center justify-center shadow-xl float-animation">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t.contact.successTitle}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t.contact.successMessage}
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  data-testid="button-send-another"
                >
                  Odeslat další zprávu
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  if (!showForm) {
    return (
      <section id="contact" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8 shadow-2xl float-animation">
              <Zap className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text-animated mb-6">
              Připraveni ušetřit?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Martin vám připraví nabídku na míru. Stačí jedno kliknutí.
            </p>
            <Button
              size="lg"
              onClick={() => setShowForm(true)}
              className="text-xl px-12 h-16 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-2xl"
              data-testid="button-show-form"
            >
              <Zap className="mr-3 h-6 w-6" />
              {t.contact.showFormButton}
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-2 backdrop-blur-xl bg-card/80">
            <CardHeader className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-bold gradient-text-animated">{t.contact.title}</CardTitle>
              <CardDescription className="text-lg md:text-xl">
                {t.contact.subtitle}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.contact.nameLabel}</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder={t.contact.namePlaceholder}
                    className={errors.name ? "border-destructive" : ""}
                    data-testid="input-name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder={t.contact.emailPlaceholder}
                    className={errors.email ? "border-destructive" : ""}
                    data-testid="input-email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.contact.phoneLabel}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder={t.contact.phonePlaceholder}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t.contact.messageLabel}</Label>
                  <Textarea
                    id="message"
                    {...register("message")}
                    placeholder={t.contact.messagePlaceholder}
                    rows={4}
                    data-testid="input-message"
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="gdprConsent"
                    checked={gdprConsent}
                    onCheckedChange={(checked) => setValue("gdprConsent", checked as boolean)}
                    className={errors.gdprConsent ? "border-destructive" : ""}
                    data-testid="checkbox-gdpr"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="gdprConsent" className="text-sm font-normal cursor-pointer">
                      {t.contact.gdprLabel}.{" "}
                      <a href="#" className="text-primary hover:underline">
                        {t.contact.gdprLink}
                      </a>
                    </Label>
                    {errors.gdprConsent && (
                      <p className="text-sm text-destructive">{errors.gdprConsent.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all"
                  disabled={createContactMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  {createContactMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t.contact.submitting}
                    </>
                  ) : (
                    t.contact.submit
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
