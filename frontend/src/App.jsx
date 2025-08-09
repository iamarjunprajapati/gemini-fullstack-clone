import { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const chatWindowRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() && !imageFile) return;

    const userMessage = { text: input, isUser: true, image: imagePreview };
    const currentMessages = user ? messages : [];
    const updatedMessages = [...currentMessages, userMessage];
    setMessages(updatedMessages);

    handleRemoveImage();
    setInput("");

    if (imageFile) {
      setLoadingText("Uploading and processing image...");
    } else {
      setLoadingText("Thinking...");
    }
    setIsLoading(true);
    
    let imageData = null;
    if (imageFile) {
        imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = () => resolve(reader.result);
        });
    }
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                history: currentMessages, 
                prompt: input, 
                image: imageData 
            }),
        });

        if (!response.ok) throw new Error('Something went wrong');
        const data = await response.json();
        const aiMessage = { text: data.response, isUser: false };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error("Failed to fetch from backend:", error);
        const errorMessage = { text: "माफ़ कीजिए, कुछ गड़बड़ हो गई।", isUser: false };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error("Login failed:", error); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setMessages([]); } catch (error) { console.error("Logout failed:", error); }
  };

  const handleInputChange = (event) => { setInput(event.target.value); };
  const handleUploadButtonClick = () => { fileInputRef.current.click(); };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null); setImagePreview(null);
    if(fileInputRef.current) { fileInputRef.current.value = null; }
  };

  if (loading) { return <div className="flex justify-center items-center min-h-screen"><h1>Loading...</h1></div>; }
  if (!user) { return ( <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100"> <h1 className="text-4xl font-bold text-center mb-8">Welcome to Gemini Clone</h1> <button onClick={handleLogin} className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors" > Login with Google </button> </div> ); }

  return (
    <div className="app bg-gray-100 h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white border-b flex-shrink-0">
        <h1 className="text-xl font-bold">Gemini Chat</h1>
        <div className="flex items-center">
          <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full mr-4"/>
          <button onClick={handleLogout} className="font-semibold text-red-600 hover:underline">Logout</button>
        </div>
      </header>
      {/* === YEH NAYI LINE ADD KAREIN === */}
      <p style={{ padding: '0 1rem', background: 'yellow', textAlign: 'center' }}>
        DEBUG: Backend URL is: {import.meta.env.VITE_API_BASE_URL}
      </p>

      <main ref={chatWindowRef} className="chat-window flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && ( <div className="text-center text-gray-500">नमस्ते! मैं जेमिनी हूँ। आप मुझसे क्या पूछना चाहेंगे?</div> )}
          {messages.map((msg, index) => (
            <div key={index} className={`message flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg shadow-md max-w-[80%] md:max-w-2xl ${msg.isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                {msg.image && <img src={msg.image} alt="sent content" className="rounded-lg mb-2 max-w-full md:max-w-xs" />}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message flex justify-start">
              <div className="p-3 rounded-lg shadow-md max-w-2xl bg-white text-gray-800">
                <p className="whitespace-pre-wrap">{loadingText}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="input-area-container bg-white p-4 border-t border-gray-200 flex-shrink-0">
        {imagePreview && ( <div className="image-preview relative w-24 h-24 mb-4"> <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg"/> <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">&times;</button> </div> )}
        <form onSubmit={handleSubmit} className="chat-input-form flex items-center space-x-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button type="button" onClick={handleUploadButtonClick} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.687 7.687a1.5 1.5 0 0 0 2.122 2.122l7.687-7.687-2.122-2.122Z" /></svg></button>
          <input className="chat-input flex-grow p-3 border-none focus:outline-none focus:ring-0" type="text" placeholder="Message Gemini..." value={input} onChange={handleInputChange} />
          <button type="submit" className="send-button p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg></button>
        </form>
      </div>
    </div>
  )
}

export default App;