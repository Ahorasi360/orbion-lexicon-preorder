import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const PlatformHome = lazy(() => import("./pages/PlatformHome"));
const BookPage = lazy(() => import("./pages/BookPage"));
const LexiconPage = lazy(() => import("./pages/LexiconPage"));
const LexiconEntryPage = lazy(() => import("./pages/LexiconEntryPage"));
const DomainsPage = lazy(() => import("./pages/DomainsPage"));
const DomainPage = lazy(() => import("./pages/DomainPage"));
const MapsPage = lazy(() => import("./pages/MapsPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const SourcesPage = lazy(() => import("./pages/SourcesPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const OnlineAccessPage = lazy(() => import("./pages/OnlineAccessPage"));
const OnlineAccessSuccessPage = lazy(() => import("./pages/OnlineAccessSuccessPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading Orbion…</div>}>
      <Switch>
      <Route path={"/"} component={PlatformHome} />
      <Route path={"/book"} component={BookPage} />
      <Route path={"/lexicon"} component={LexiconPage} />
      <Route path={"/lexicon/access/success"} component={OnlineAccessSuccessPage} />
      <Route path={"/lexicon/access"} component={OnlineAccessPage} />
      <Route path={"/lexicon/:term"} component={LexiconEntryPage} />
      <Route path={"/domains"} component={DomainsPage} />
      <Route path={"/domains/:domain"} component={DomainPage} />
      <Route path={"/maps"} component={MapsPage} />
      <Route path={"/methodology"} component={MethodologyPage} />
      <Route path={"/sources"} component={SourcesPage} />
      <Route path={"/search"} component={SearchPage} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/intelligence"} component={IntelligencePage} />
      <Route path={"/account"} component={AccountPage} />
      <Route path={"/terms-of-sale"}>{() => <LegalPage slug="terms-of-sale" />}</Route>
      <Route path={"/preorder-refund-policy"}>{() => <LegalPage slug="preorder-refund-policy" />}</Route>
      <Route path={"/shipping-delay-policy"}>{() => <LegalPage slug="shipping-delay-policy" />}</Route>
      <Route path={"/privacy-policy"}>{() => <LegalPage slug="privacy-policy" />}</Route>
      <Route path={"/contact"}>{() => <LegalPage slug="contact" />}</Route>
      <Route path={"/corrections"}>{() => <LegalPage slug="corrections" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
