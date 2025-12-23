import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomeScreen } from './components/HomeScreen';
import { QuestionFlow } from './components/QuestionFlow';
import { ResultPage } from './pages/ResultPage';
import { ReturnFlow } from './pages/ReturnFlow';
import { ScrollToTop } from './components/ScrollToTop';
// type Archetype import removed

// @ts-ignore
import registryData from '../config/registry/archetypes.json';

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
    archetypeId: string
  ) => {
    const userInput = location.state?.userInput;

    if (!userInput) {
      console.error('No user input found in state');
      return;
    }

    // Navigate immediately to result page to avoid waiting
    // The result page will handle creating the session and generating analysis
    navigate('/result/creating', {
      state: {
        userInput,
        answers,
        archetypeId
      }
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <Layout isHomePage={isHomePage}>
      <ScrollToTop />
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
    </Layout>
  );
}

export default App;
