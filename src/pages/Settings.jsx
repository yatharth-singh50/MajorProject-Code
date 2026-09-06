import { useState } from "react";
import { Sun, Moon, Laptop, RotateCcw, Cpu } from "lucide-react";
import Button from "../components/common/Button";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { resetMockData } from "../services/api";
import { LANGUAGES } from "../services/mockData";
import { cx } from "../utils/format";

function SettingsSection({ title, description, children }) {
  return (
    <section className="border-b border-border px-4 py-5">
      <h2 className="font-serif text-[17px] font-semibold text-text">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-text-faint">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left"
    >
      <span>
        <span className="block text-[14px] text-text">{label}</span>
        {description && <span className="block text-[12px] text-text-faint">{description}</span>}
      </span>
      <span
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-border-strong"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { push } = useToast();

  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [showTranslations, setShowTranslations] = useState(true);
  const [threshold, setThreshold] = useState(65);
  const [defaultLang, setDefaultLang] = useState("auto");

  const handleReset = async () => {
    await resetMockData();
    push("Demo data reset — reload the page to see fresh seed data");
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-text">Settings</h1>
      </header>

      <SettingsSection title="Appearance" description="Dark mode is the default for this prototype.">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "dark", label: "Dark", Icon: Moon },
            { id: "light", label: "Light", Icon: Sun },
            { id: "system", label: "System", Icon: Laptop },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === "system") {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  setTheme(prefersDark ? "dark" : "light");
                } else {
                  setTheme(id);
                }
              }}
              className={cx(
                "focus-ring flex flex-col items-center gap-2 rounded-xl border py-4 text-[13px] transition-colors",
                theme === id ? "border-brand bg-brand-soft text-text" : "border-border text-text-dim hover:bg-surface-hover"
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Detection & verification"
        description="Controls for the fake-news detection pipeline used across the app."
      >
        <Toggle
          checked={autoAnalyze}
          onChange={setAutoAnalyze}
          label="Auto-analyze new posts"
          description="Run the model pipeline automatically when a post is published"
        />
        <Toggle
          checked={showTranslations}
          onChange={setShowTranslations}
          label="Offer translations"
          description="Show “See translation” on posts written in a regional language"
        />

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[13px] text-text">
            <span>Disputed-content threshold</span>
            <span className="text-text-faint">{threshold}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={90}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <p className="mt-1 text-[12px] text-text-faint">
            Confidence above this value labels a post “Disputed” rather than “Needs context.”
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg-inset px-3 py-2.5 text-[13px] text-text-dim">
          <Cpu size={15} className="text-brand" />
          Active model: <span className="font-medium text-text">IndicBERT-FND v0.4</span>
        </div>
      </SettingsSection>

      <SettingsSection title="Language" description="Used for composing and default translation preferences.">
        <label className="mb-1 block text-[12px] font-medium text-text-faint">Default post language</label>
        <select
          value={defaultLang}
          onChange={(e) => setDefaultLang(e.target.value)}
          className="focus-ring w-full rounded-lg border border-border bg-bg-inset px-3 py-2 text-[14px] text-text"
        >
          <option value="auto">Auto-detect</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </SettingsSection>

      <SettingsSection title="Account">
        <div className="flex items-center justify-between text-[14px] text-text">
          <span>Signed in as @{user?.username}</span>
          <Button as="a" href={`/profile/${user?.username}`} variant="outline" size="sm">
            View profile
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Demo data" description="This is a frontend-only prototype backed by mock data in your browser.">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw size={14} />
          Reset demo data
        </Button>
      </SettingsSection>
    </div>
  );
}
