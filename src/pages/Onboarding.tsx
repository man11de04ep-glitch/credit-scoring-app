import { useNavigate } from "react-router-dom";
import { ProfileForm } from "@/components/ProfileForm";
import { computeScore } from "@/lib/scoring";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 1</p>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">
          Tell us about your money habits
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          We use 7 simple signals — no credit history needed. Your answers stay on your device.
        </p>
      </div>

      <div className="warm-card p-6 lg:p-8">
        <ProfileForm
          onSubmit={(profile) => {
            const result = computeScore(profile);
            storage.saveProfile(profile);
            storage.saveAttempt({
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              profile,
              score: result.score,
              band: result.band,
            });
            toast.success(`Your score: ${result.score}`);
            navigate("/app");
          }}
        />
      </div>
    </div>
  );
};

export default Onboarding;
