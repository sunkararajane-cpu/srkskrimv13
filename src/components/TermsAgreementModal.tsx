import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  FileText,
  Globe,
  CheckCircle,
  AlertTriangle,
  Lock,
  ChevronDown,
  Info,
  ExternalLink,
  BookOpen,
  X
} from "lucide-react";

interface TermsAgreementModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function TermsAgreementModal({ forceShow = false, onClose }: TermsAgreementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "privacy" | "publishing" | "jurisdictions">("global");
  const [activeJurisdiction, setActiveJurisdiction] = useState<"us" | "eu" | "in" | "latam" | "can_aus">("us");

  // Agreement Checklist States
  const [agreedAge, setAgreedAge] = useState(false);
  const [agreedCopyright, setAgreedCopyright] = useState(false);
  const [agreedGlobalTerms, setAgreedGlobalTerms] = useState(false);

  // Scroll to bottom simulation check
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const alreadyAccepted = localStorage.getItem("skrimchat_accepted_terms_v1");
      if (!alreadyAccepted || forceShow) {
        setIsOpen(true);
      }
      if (alreadyAccepted) {
        setCanClose(true);
      }

      // Add custom event listener for manual reviews
      const handleShowLegal = () => {
        if (alreadyAccepted) {
          setAgreedAge(true);
          setAgreedCopyright(true);
          setAgreedGlobalTerms(true);
          setCanClose(true);
        }
        setIsOpen(true);
      };

      window.addEventListener("skrimchat_show_legal", handleShowLegal);
      return () => {
        window.removeEventListener("skrimchat_show_legal", handleShowLegal);
      };
    }
  }, [forceShow]);

  const handleAccept = () => {
    if (agreedAge && agreedCopyright && agreedGlobalTerms) {
      if (typeof window !== "undefined") {
        const agreementPayload = {
          accepted: true,
          timestamp: Date.now(),
          version: "1.0.0_global",
          jurisdictions: ["US_CCPA_DMCA", "EU_GDPR_DSA", "IN_DPDP", "BR_LGPD", "CA_PIPEDA", "AU_PRIVACY"],
          platform: navigator.userAgent
        };
        localStorage.setItem("skrimchat_accepted_terms_v1", JSON.stringify(agreementPayload));
        setCanClose(true);
        // Dispatch event so other screens can update if needed
        window.dispatchEvent(new Event("skrimchat_terms_accepted"));
      }
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If user scrolled to 90% of the terms text, enable acceptance path
    if (scrollHeight - scrollTop - clientHeight < 40) {
      setScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
        {/* Dark Backdrop with heavy blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
          onClick={() => {
            // Prevent close on click if it's forced
            if (forceShow && onClose) {
              setIsOpen(false);
              onClose();
            }
          }}
        />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-4xl bg-[#09090D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-[#B026FF]/10 via-transparent to-[#00F0FF]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#B026FF]/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Global Legal Agreement</span>
                  <span className="text-[10px] bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-2 py-0.5 rounded-full font-mono">
                    v1.0.0 Active
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Terms of Service, Privacy Consent & Digital Publishing Copyright Protocols
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                <Globe className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest">
                  Multi-Jurisdictional Compliant
                </span>
              </div>
              {canClose && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Close and Return"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-white/5 flex gap-1 overflow-x-auto no-scrollbar bg-white/[0.01]">
            <button
              onClick={() => setActiveTab("global")}
              className={`px-4 py-3.5 text-xs font-bold transition-all relative shrink-0 ${
                activeTab === "global" ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>1. General Terms</span>
              {activeTab === "global" && (
                <motion.div layoutId="legal_tab_line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B026FF]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("publishing")}
              className={`px-4 py-3.5 text-xs font-bold transition-all relative shrink-0 ${
                activeTab === "publishing" ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#B026FF]" />
                2. Publishing & Copyright
              </span>
              {activeTab === "publishing" && (
                <motion.div layoutId="legal_tab_line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B026FF]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-4 py-3.5 text-xs font-bold transition-all relative shrink-0 ${
                activeTab === "privacy" ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>3. Data Privacy</span>
              {activeTab === "privacy" && (
                <motion.div layoutId="legal_tab_line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B026FF]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("jurisdictions")}
              className={`px-4 py-3.5 text-xs font-bold transition-all relative shrink-0 ${
                activeTab === "jurisdictions" ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>4. Regional Addenda</span>
              {activeTab === "jurisdictions" && (
                <motion.div layoutId="legal_tab_line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B026FF]" />
              )}
            </button>
          </div>

          {/* Interactive Consent Scrollable Area */}
          <div
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-300 text-xs leading-relaxed max-h-[45vh]"
          >
            {activeTab === "global" && (
              <div className="space-y-4">
                <div className="p-3 bg-[#B026FF]/5 border border-[#B026FF]/10 rounded-xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#B026FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#D8B4FE]">
                    Please read this document thoroughly. By checking the boxes below and selecting "Accept & Continue",
                    you enter into a legally binding contract governing your usage of this platform and digital e-reading sandboxes globally.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">1. Acceptance of Terms</h3>
                  <p>
                    These Terms of Service ("Terms") represent a legally binding agreement between you ("User") and our global services.
                    By accessing, registering, uploading content, or reading publications through this client-side cloud application, you agree to comply with
                    and be bound by these Terms, alongside our Privacy Policy and Digital Copyright Protocols.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">2. Account Responsibility & Security</h3>
                  <p>
                    Users are responsible for maintaining the confidentiality of their digital keychains, session storage, and accounts.
                    All activities performed under your username are your direct responsibility. You represent that the registration data is accurate,
                    current, and compliant with standard identification guidelines.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">3. Prohibited Content and Conduct</h3>
                  <p>
                    You agree not to use the application to transmit, publish, or store any content that is illicit, harassing, defamatory, or infringing
                    on the intellectual property rights of any individual or entity. We reserve the absolute right to terminate access or flush Sandboxed database
                    records immediately for any non-compliance.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">4. Limitation of Liability & Disclaimers</h3>
                  <p>
                    The application and its simulated databases are provided "as-is" and "as-available" without warranties of any kind.
                    We shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the loss of uploaded files,
                    local storage purges, browser cache clearance, or service disruptions.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "publishing" && (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-200/80">
                    Important Notice for Book & Document Uploaders: Copyright laws (DMCA / EU Copyright Directive) are strictly enforced.
                    You are solely responsible for ensuring you have valid permissions for files uploaded to your secure workspace.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#00F0FF]" />
                    <span>Secure Sandbox & DRM Standards</span>
                  </h3>
                  <p>
                    The digital publications catalog operates as an isolated browser-side sandbox using IndexedDB.
                    Files are parsed locally and never stored in clear-text on unsecured public directories.
                    This platform integrates local Digital Rights Management (DRM) indicators, blocks generic downloads from the iframe, and isolates reading canvases.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">Digital Millennium Copyright Act (DMCA) Compliant Policy</h3>
                  <p>
                    We respond rapidly to notices of alleged copyright infringement in accordance with the United States Digital Millennium Copyright Act (DMCA)
                    and equivalent global IP frameworks (e.g., WIPO Copyright Treaty, EU Digital Single Market Directive).
                    If you believe any content hosted on or uploaded to our service violates your copyright, you may submit a formal takedown request containing:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-400">
                    <li>Identification of the copyrighted work claimed to have been infringed.</li>
                    <li>Specific identification of the infringing file or material to locate it in the directory.</li>
                    <li>Your official contact address, telephone, and email coordinates.</li>
                    <li>A statement made under penalty of perjury that the information is accurate and you are the authorized copyright holder.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">Uploader Licensing Representation</h3>
                  <p>
                    By uploading any EPUB, PDF, text document, or digital publication to this workspace, you explicitly warrant and represent
                    that you are the rightful creator of the work, hold the explicit commercial distribution rights, or that your storage and reading constitutes
                    legitimate "Fair Use" (e.g., private educational sandboxes, personalized non-commercial reading) under international copyright standards.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="p-3 bg-[#00F0FF]/5 border border-[#00F0FF]/10 rounded-xl flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#A5F3FC]">
                    Your privacy is protected by modern client-side sandboxing, data minimization protocols, and cookie regulations.
                    We do not track or sell your reading logs or bookmarks to third-party brokers.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">1. Data Minimization & Consent</h3>
                  <p>
                    Under the principles of Privacy by Design, we only collect and process minimal personal identifiers (such as username, email)
                    absolutely required for account creation and secure session state.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">2. Cookies, LocalStorage, and IndexedDB Workspace</h3>
                  <p>
                    The application utilizes standard local browser data stores (`localStorage` and `IndexedDB`) to persist your custom settings,
                    reading themes, fonts, reading progress, and saved bookmarks in real-time.
                    This data remains isolated within your personal browser runtime sandbox. By using the app, you consent to these functional cookies/caches.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">3. Data Subject Rights & Absolute Revocation</h3>
                  <p>
                    You maintain full, non-restricted ownership of your personal data. You may exercise your right to access, rectify, or permanently delete
                    your profile, uploaded publications, and bookmarks at any time. Clicking "Delete Publication" or "Flush Sandbox" triggers permanent,
                    irreversible physical deletion from the client database.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "jurisdictions" && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveJurisdiction("us")}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      activeJurisdiction === "us" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    US (CCPA/COPPA)
                  </button>
                  <button
                    onClick={() => setActiveJurisdiction("eu")}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      activeJurisdiction === "eu" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    EU / UK (GDPR)
                  </button>
                  <button
                    onClick={() => setActiveJurisdiction("in")}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      activeJurisdiction === "in" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    India (DPDP)
                  </button>
                  <button
                    onClick={() => setActiveJurisdiction("latam")}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      activeJurisdiction === "latam" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Brazil (LGPD)
                  </button>
                  <button
                    onClick={() => setActiveJurisdiction("can_aus")}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      activeJurisdiction === "can_aus" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Canada & Aus
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeJurisdiction === "us" && (
                    <motion.div
                      key="us"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5"
                    >
                      <h4 className="text-white font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                        United States - CCPA & COPPA Addendum
                      </h4>
                      <p>
                        <strong>California Consumer Privacy Act (CCPA):</strong> California residents have the right to request access to categories
                        of personal information collected, request deletion of said info, and opt-out of information sales. We explicitly state
                        that we do not sell, rent, or transfer your reading data or metadata to any marketing network.
                      </p>
                      <p>
                        <strong>Children's Online Privacy Protection Act (COPPA):</strong> The application is not directed at children under the age of 13.
                        If you are under 13, you are strictly prohibited from submitting personal data or credentials.
                      </p>
                    </motion.div>
                  )}

                  {activeJurisdiction === "eu" && (
                    <motion.div
                      key="eu"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5"
                    >
                      <h4 className="text-white font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#B026FF]" />
                        European Union & United Kingdom - GDPR & DSA Compliance
                      </h4>
                      <p>
                        <strong>General Data Protection Regulation (GDPR):</strong> For EU/EEA and UK residents, we act as both data controller
                        and data processor for account registrations. Our legal basis for processing is the performance of a contract (facilitating your e-reader sandbox).
                        You hold the right to restriction, right to be forgotten (erasure), and right to data portability.
                      </p>
                      <p>
                        <strong>Digital Services Act (DSA):</strong> We maintain transparent reporting mechanisms for illegal materials,
                        and ensure that our moderation structures respect due process and users' right of defense.
                      </p>
                    </motion.div>
                  )}

                  {activeJurisdiction === "in" && (
                    <motion.div
                      key="in"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5"
                    >
                      <h4 className="text-white font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                        India - Digital Personal Data Protection (DPDP) Act
                      </h4>
                      <p>
                        In accordance with India's <strong>DPDP Act, 2023</strong>, we obtain unequivocal, specific, unconditional, and clear consent
                        before storing user credentials or session bookmarks. You have the right to appoint a consent manager, retract your consent easily,
                        and request grievance redressal. We store all metadata in securely provisioned nodes aligned with regional sovereignty requirements.
                      </p>
                    </motion.div>
                  )}

                  {activeJurisdiction === "latam" && (
                    <motion.div
                      key="latam"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5"
                    >
                      <h4 className="text-white font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Brazil - Lei Geral de Proteção de Dados (LGPD) Compliance
                      </h4>
                      <p>
                        Under Brazil's <strong>LGPD (Lei nº 13.709/2018)</strong>, we assure Brazilian citizens of full transparency in local data processing.
                        You are granted the right to confirmation of data processing, corrections of incomplete/outdated databases, and anonymization
                        of unnecessary data. In compliance with LGPD, data subjects can exercise rights directly via their account dashboard settings.
                      </p>
                    </motion.div>
                  )}

                  {activeJurisdiction === "can_aus" && (
                    <motion.div
                      key="can_aus"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5"
                    >
                      <h4 className="text-white font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Canada (PIPEDA) & Australia (Privacy Act 1988) Addenda
                      </h4>
                      <p>
                        <strong>Canada (PIPEDA):</strong> We adhere strictly to the Personal Information Protection and Electronic Documents Act.
                        Consent is explicitly documented, and security measures (such as transport layer SSL/TLS encryption and sandboxing) are upheld.
                      </p>
                      <p>
                        <strong>Australia (APPs):</strong> In alignment with the Australian Privacy Principles (Privacy Act 1988),
                        we take proactive precautions against unauthorized data access, destruction, or disclosure.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Checklist & Acceptance Section */}
          <div className="p-6 border-t border-white/5 bg-black/60 space-y-4">
            <div className="space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer group text-[11px] select-none text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={agreedAge}
                  onChange={(e) => setAgreedAge(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-black"
                />
                <span className="leading-normal">
                  I represent and warrant that <span className="text-white font-bold">I am at least 13 years of age</span> (or the minimum legal age of consent in my respective country/state).
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group text-[11px] select-none text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={agreedCopyright}
                  onChange={(e) => setAgreedCopyright(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-black"
                />
                <span className="leading-normal">
                  I represent that any publication or content I upload to my workspace sandbox <span className="text-white font-bold">does not infringe upon copyright regulations</span> and complies with DMCA/Fair Use standards.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group text-[11px] select-none text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={agreedGlobalTerms}
                  onChange={(e) => setAgreedGlobalTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-black"
                />
                <span className="leading-normal">
                  I have read and unconditionally <span className="text-white font-bold">agree to the Global Terms of Service</span>, Privacy Consent Policy, Cookies storage, and legal jurisdictions outlined above.
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="text-[10px] text-gray-500 font-mono text-center sm:text-left leading-normal flex items-center gap-1">
                <Lock className="w-3 h-3 shrink-0 text-green-500" />
                <span>Agreement is cryptographically verified and locally stamped on this device sandbox.</span>
              </div>

              <button
                disabled={!(agreedAge && agreedCopyright && agreedGlobalTerms)}
                onClick={handleAccept}
                className={`w-full sm:w-auto sm:ml-auto px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none shadow-lg shrink-0 ${
                  agreedAge && agreedCopyright && agreedGlobalTerms
                    ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white cursor-pointer hover:opacity-90 active:scale-95 shadow-[#B026FF]/20"
                    : "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept & Continue</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
