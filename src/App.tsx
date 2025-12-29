import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomeScreen } from './components/HomeScreen';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy load heavy page components for better initial bundle size
const QuestionFlow = lazy(() => import('./components/QuestionFlow').then(m => ({ default: m.QuestionFlow })));
const ResultPage = lazy(() => import('./pages/ResultPage').then(m => ({ default: m.ResultPage })));
const ReturnFlow = lazy(() => import('./pages/ReturnFlow').then(m => ({ default: m.ReturnFlow })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-coral-primary border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--coral-primary)', borderTopColor: 'transparent' }} />
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</span>
    </div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';



  const handleContinue = async (input: string) => {
    // Navigate immediately to questions with user input
    // QuestionFlow will handle classification and loading
    navigate('/questions', {
      state: {
        userInput: input
      }
    });
  };

  const handleCodeEnter = (code: string) => {
    navigate('/return', { state: { code } });
  };

  const handleQuestionsComplete = async (
    answers: Record<string, string>,
    archetypeId: string,
    _selectedFieldKeys?: string[],
    effectiveQuestion?: string,
    decisionType?: string
  ) => {
    // Use effectiveQuestion (from clarification) or fallback to original userInput
    const userInput = effectiveQuestion || location.state?.userInput;

    if (!userInput) {
      console.error('No user input found');
      return;
    }

    // Navigate immediately to result page to avoid waiting
    // The result page will handle creating the session and generating analysis
    navigate('/result/creating', {
      state: {
        userInput,
        answers,
        archetypeId,
        decisionType: decisionType || 'binary_decision'
      }
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <Layout isHomePage={isHomePage}>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <HomeScreen
                onContinue={handleContinue}
                onCodeEnter={handleCodeEnter}
                isLoading={false} // No longer managing loading in App
              />
            }
          />
          <Route
            path="/questions"
            element={
              <QuestionFlow
                userInput={location.state?.userInput}
                archetypeId={location.state?.archetypeId}
                selectedFieldKeys={location.state?.selectedFieldKeys}
                onComplete={handleQuestionsComplete}
                onBack={handleBackToHome}
              />
            }
          />
          <Route
            path="/result/:code"
            element={<ResultPage />}
          />
          <Route
            path="/return"
            element={<ReturnFlow />}
          />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;

