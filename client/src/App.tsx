import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LegalPage from "./pages/LegalPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
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
