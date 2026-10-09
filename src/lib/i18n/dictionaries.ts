export type UiLanguage = "de" | "en";

export const UI_LANG_COOKIE = "ui_lang";

export interface Dictionary {
  nav: {
    dashboard: string;
    profile: string;
    cv: string;
    jobs: string;
    companies: string;
    prep: string;
    interview: string;
    history: string;
    german: string;
    progress: string;
  };
  dashboard: {
    greetingTitle: (name: string) => string;
    greetingSub: string;
    profileCompletion: string;
    noDataYet: string;
    completeProfileTitle: string;
    completeProfileSub: string;
    completeProfileCta: string;
    logout: string;
  };
  profile: {
    title: string;
    subtitle: string;
    name: string;
    currentCountry: string;
    degree: string;
    university: string;
    germanLevel: string;
    englishLevel: string;
    targetLocation: string;
    targetCompanyType: string;
    careerGoals: string;
    save: string;
    saved: string;
  };
  interviewSetup: {
    title: string;
    subtitle: string;
    difficultyLabel: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    typeLabel: string;
    general: string;
    germanyFocused: string;
    companyFocused: string;
    jobFocused: string;
    languageLabel: string;
    german: string;
    english: string;
    startButton: string;
  };
  interview: {
    questionLabel: string;
    answerPlaceholder: string;
    submitButton: string;
    submitting: string;
    completeTitle: string;
    completeSub: string;
    backToDashboard: string;
  };
  auth: {
    email: string;
    password: string;
    fullName: string;
    logIn: string;
    createAccount: string;
    noAccount: string;
    haveAccount: string;
    loggingIn: string;
    creatingAccount: string;
  };
  landing: {
    tagline: string;
    subtitle: string;
    createAccount: string;
    logIn: string;
  };
}

export const dictionaries: Record<UiLanguage, Dictionary> = {
  de: {
    nav: {
      dashboard: "Übersicht",
      profile: "Mein Profil",
      cv: "Lebenslauf",
      jobs: "Jobs finden",
      companies: "Firmen",
      prep: "Interview-Vorbereitung",
      interview: "KI-Interview",
      history: "Verlauf",
      german: "Deutsch lernen",
      progress: "Fortschritt",
    },
    dashboard: {
      greetingTitle: (name: string) => `Hallo, ${name}!`,
      greetingSub: "Willkommen zurück. Hier ist dein Fortschritt.",
      profileCompletion: "Profil vollständig",
      noDataYet: "Noch keine Daten",
      completeProfileTitle: "Profil vervollständigen",
      completeProfileSub: "Fehlende Angaben ergänzen",
      completeProfileCta: "Öffnen",
      logout: "Abmelden",
    },
    profile: {
      title: "Mein Profil",
      subtitle: "Diese Angaben personalisieren deine Interviews.",
      name: "Name",
      currentCountry: "Aktuelles Land",
      degree: "Abschluss",
      university: "Universität",
      germanLevel: "Deutschniveau",
      englishLevel: "Englischniveau",
      targetLocation: "Zielregion",
      targetCompanyType: "Zielfirmentyp",
      careerGoals: "Karriereziele",
      save: "Speichern",
      saved: "Gespeichert.",
    },
    interviewSetup: {
      title: "Interview einrichten",
      subtitle: "Wähle Schwierigkeit und Interviewtyp für dein Übungsgespräch.",
      difficultyLabel: "Schwierigkeit",
      beginner: "Anfänger",
      intermediate: "Mittel",
      advanced: "Fortgeschritten",
      typeLabel: "Interviewtyp",
      general: "Allgemein",
      germanyFocused: "Deutschland-Fokus",
      companyFocused: "Firmen-Fokus",
      jobFocused: "Job-Fokus",
      languageLabel: "Interviewsprache",
      german: "Deutsch",
      english: "Englisch",
      startButton: "Interview starten",
    },
    interview: {
      questionLabel: "Frage",
      answerPlaceholder: "Schreibe deine Antwort hier …",
      submitButton: "Antwort senden",
      submitting: "Wird gesendet …",
      completeTitle: "Interview abgeschlossen ✓",
      completeSub: "Gut gemacht! Die Auswertung folgt in einer späteren Phase.",
      backToDashboard: "Zurück zur Übersicht",
    },
    auth: {
      email: "E-Mail",
      password: "Passwort",
      fullName: "Vollständiger Name",
      logIn: "Einloggen",
      createAccount: "Konto erstellen",
      noAccount: "Neu hier? Konto erstellen",
      haveAccount: "Schon registriert? Einloggen",
      loggingIn: "Wird eingeloggt …",
      creatingAccount: "Konto wird erstellt …",
    },
    landing: {
      tagline: "Lerne die Sprache. Verstehe die Kultur. Bereite dich auf das Interview vor.",
      subtitle: "Ein KI-gestützter HR-Interview-Simulator für internationale Kandidaten, die in Deutschland arbeiten möchten.",
      createAccount: "Konto erstellen",
      logIn: "Einloggen",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      profile: "My Profile",
      cv: "CV",
      jobs: "Find Jobs",
      companies: "Companies",
      prep: "Interview Prep",
      interview: "AI Interview",
      history: "History",
      german: "German for Work",
      progress: "Progress",
    },
    dashboard: {
      greetingTitle: (name: string) => `Hello, ${name}!`,
      greetingSub: "Welcome back. Here is your progress.",
      profileCompletion: "Profile completeness",
      noDataYet: "No data yet",
      completeProfileTitle: "Complete your profile",
      completeProfileSub: "Fill in missing details",
      completeProfileCta: "Open",
      logout: "Log out",
    },
    profile: {
      title: "My Profile",
      subtitle: "This information personalizes your interviews.",
      name: "Name",
      currentCountry: "Current country",
      degree: "Degree",
      university: "University",
      germanLevel: "German level",
      englishLevel: "English level",
      targetLocation: "Target region",
      targetCompanyType: "Target company type",
      careerGoals: "Career goals",
      save: "Save",
      saved: "Saved.",
    },
    interviewSetup: {
      title: "Set up interview",
      subtitle: "Choose a difficulty and interview type for your practice session.",
      difficultyLabel: "Difficulty",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      typeLabel: "Interview type",
      general: "General",
      germanyFocused: "Germany-focused",
      companyFocused: "Company-focused",
      jobFocused: "Job-focused",
      languageLabel: "Interview language",
      german: "German",
      english: "English",
      startButton: "Start interview",
    },
    interview: {
      questionLabel: "Question",
      answerPlaceholder: "Write your answer here …",
      submitButton: "Submit answer",
      submitting: "Submitting …",
      completeTitle: "Interview complete ✓",
      completeSub: "Well done! Scoring and feedback arrive in a later phase.",
      backToDashboard: "Back to dashboard",
    },
    auth: {
      email: "Email",
      password: "Password",
      fullName: "Full name",
      logIn: "Log in",
      createAccount: "Create account",
      noAccount: "New here? Create an account",
      haveAccount: "Already registered? Log in",
      loggingIn: "Logging in …",
      creatingAccount: "Creating account …",
    },
    landing: {
      tagline: "Learn the language. Understand the culture. Prepare for the interview.",
      subtitle: "An AI-powered HR interview simulator for international candidates applying for jobs in Germany.",
      createAccount: "Create account",
      logIn: "Log in",
    },
  },
};
