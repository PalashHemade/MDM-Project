-- CreateEnum
CREATE TYPE "CEFRLevel" AS ENUM ('NONE', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "TargetLocation" AS ENUM ('GERMANY', 'ABROAD', 'OPEN');

-- CreateEnum
CREATE TYPE "TargetCompanyType" AS ENUM ('GERMAN_COMPANY', 'INTERNATIONAL', 'OPEN');

-- CreateEnum
CREATE TYPE "CVStatus" AS ENUM ('DRAFT', 'AI_REVIEWED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL', 'CANDIDATE_REPORTED', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "LanguageRequirement" AS ENUM ('EXPLICIT', 'PREFERRED', 'NOT_EXPLICIT', 'UNCLEAR');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('INTRODUCTION', 'MOTIVATION', 'WHY_GERMANY', 'WHY_COMPANY', 'WHY_ROLE', 'EDUCATION', 'EXPERIENCE', 'INTERNSHIP', 'STRENGTHS', 'WEAKNESSES', 'TEAMWORK', 'CONFLICT', 'LEADERSHIP', 'FAILURE', 'PRESSURE', 'PROBLEM_SOLVING', 'CAREER_GOALS', 'RELOCATION', 'WORK_AUTHORIZATION', 'SALARY', 'GERMAN_WORKPLACE_CULTURE', 'QUESTIONS_FOR_INTERVIEWER', 'SITUATIONAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "InterviewLanguage" AS ENUM ('DE', 'EN');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('GENERAL', 'GERMANY_FOCUSED', 'COMPANY_FOCUSED', 'JOB_FOCUSED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SETUP', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('BANK', 'GENERATED_FOLLOWUP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentCountry" TEXT,
    "degree" TEXT,
    "university" TEXT,
    "germanLevel" "CEFRLevel" NOT NULL DEFAULT 'NONE',
    "englishLevel" "CEFRLevel" NOT NULL DEFAULT 'NONE',
    "targetLocation" "TargetLocation" NOT NULL DEFAULT 'OPEN',
    "targetCompanyType" "TargetCompanyType" NOT NULL DEFAULT 'OPEN',
    "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workAuthorizationStatus" TEXT,
    "careerGoals" TEXT,
    "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "isInternship" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "role" TEXT,

    CONSTRAINT "ProjectEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiency" TEXT,

    CONSTRAINT "SkillEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CV" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rawUploadUrl" TEXT,
    "structuredData" JSONB,
    "aiSuggestions" JSONB,
    "status" "CVStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "overview" TEXT,
    "germanyLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiringProcessNotes" TEXT,
    "languageInfo" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "content" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "companyId" TEXT,
    "companyNameRaw" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "rawDescription" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationReq" TEXT,
    "experienceReq" TEXT,
    "germanRequirement" "LanguageRequirement" NOT NULL DEFAULT 'UNCLEAR',
    "englishRequirement" "LanguageRequirement" NOT NULL DEFAULT 'UNCLEAR',
    "otherLanguageReq" TEXT,
    "visaInfoExtracted" TEXT,
    "potentialTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestionBank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "textDe" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "cefrRelevance" TEXT,
    "purpose" TEXT,
    "followUpTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companyRelevance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleRelevance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expectedCompetency" TEXT,

    CONSTRAINT "InterviewQuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "companyId" TEXT,
    "language" "InterviewLanguage" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "type" "InterviewType" NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SETUP',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewTurn" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionSource" "QuestionSource" NOT NULL,
    "parentTurnId" TEXT,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "transcriptWordTimestamps" JSONB,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "InterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewClaim" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "firstMentionedTurnId" TEXT NOT NULL,
    "revisitedTurnIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "InterviewClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeechMetric" (
    "id" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "speakingDurationSec" DOUBLE PRECISION NOT NULL,
    "wordsPerMinute" DOUBLE PRECISION NOT NULL,
    "pauseCount" INTEGER NOT NULL,
    "longPauseCount" INTEGER NOT NULL,
    "fillerWordCount" INTEGER NOT NULL,
    "fillerWords" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SpeechMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageAssessment" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "grammarScore" INTEGER NOT NULL,
    "vocabularyScore" INTEGER NOT NULL,
    "fluencyScore" INTEGER NOT NULL,
    "comprehensionScore" INTEGER NOT NULL,
    "professionalLangScore" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "LanguageAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPerformanceAssessment" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "structureScore" INTEGER NOT NULL,
    "motivationScore" INTEGER NOT NULL,
    "professionalismScore" INTEGER NOT NULL,
    "followUpHandlingScore" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "InterviewPerformanceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalCommunicationAssessment" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "formalityScore" INTEGER NOT NULL,
    "sieDuNotes" TEXT,
    "clarityScore" INTEGER NOT NULL,
    "culturalAwarenessScore" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "CulturalCommunicationAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overallReadiness" INTEGER NOT NULL,
    "mainStrength" TEXT NOT NULL,
    "mainWeakness" TEXT NOT NULL,
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "basedOnInterviewId" TEXT,
    "focusArea" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "Experience_profileId_idx" ON "Experience"("profileId");

-- CreateIndex
CREATE INDEX "ProjectEntry_profileId_idx" ON "ProjectEntry"("profileId");

-- CreateIndex
CREATE INDEX "SkillEntry_profileId_idx" ON "SkillEntry"("profileId");

-- CreateIndex
CREATE INDEX "CV_profileId_idx" ON "CV"("profileId");

-- CreateIndex
CREATE INDEX "CoverLetter_profileId_idx" ON "CoverLetter"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeSource_companyId_idx" ON "KnowledgeSource"("companyId");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewQuestionBank_code_key" ON "InterviewQuestionBank"("code");

-- CreateIndex
CREATE INDEX "Interview_profileId_idx" ON "Interview"("profileId");

-- CreateIndex
CREATE INDEX "InterviewTurn_interviewId_idx" ON "InterviewTurn"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewClaim_interviewId_idx" ON "InterviewClaim"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeechMetric_turnId_key" ON "SpeechMetric"("turnId");

-- CreateIndex
CREATE UNIQUE INDEX "LanguageAssessment_interviewId_key" ON "LanguageAssessment"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPerformanceAssessment_interviewId_key" ON "InterviewPerformanceAssessment"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalCommunicationAssessment_interviewId_key" ON "CulturalCommunicationAssessment"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_interviewId_key" ON "InterviewFeedback"("interviewId");

-- CreateIndex
CREATE INDEX "PracticeSession_profileId_idx" ON "PracticeSession"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialContent_slug_key" ON "EditorialContent"("slug");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEntry" ADD CONSTRAINT "ProjectEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEntry" ADD CONSTRAINT "SkillEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewClaim" ADD CONSTRAINT "InterviewClaim_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeechMetric" ADD CONSTRAINT "SpeechMetric_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "InterviewTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageAssessment" ADD CONSTRAINT "LanguageAssessment_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPerformanceAssessment" ADD CONSTRAINT "InterviewPerformanceAssessment_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalCommunicationAssessment" ADD CONSTRAINT "CulturalCommunicationAssessment_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
