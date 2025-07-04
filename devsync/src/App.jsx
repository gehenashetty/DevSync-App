import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading)
    return <div className="p-10 text-center text-gray-600">Loading...</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-600">
        Error: {error.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-blue-100">
      {user ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

export default App;
