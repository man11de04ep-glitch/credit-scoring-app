import { useNavigate } from "react-router-dom";
import { ProfileForm } from "@/components/ProfileForm";
import { submitAssessment } from "@/lib/engine";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageProvider";

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("onboarding.step")}</p>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">
          {t("onboarding.title")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{t("onboarding.subtitle")}</p>
      </div>

      <div className="warm-card p-6 lg:p-8">
        <ProfileForm
          onSubmit={(profile) => {
            const assessment = submitAssessment(profile);
            toast.success(`${t("dash.label")}: ${assessment.score}`);
            navigate("/app");
          }}
        />
      </div>
    </div>
  );
};

export default Onboarding;
