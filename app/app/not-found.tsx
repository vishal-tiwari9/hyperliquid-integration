export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold mb-4">404</h1>
        <p className="text-2xl mb-8">Page not found</p>
        <a
          href="/"
          className="px-8 py-4 bg-white text-black rounded-2xl font-semibold hover:bg-white/90"
        >
          Go to Main page
        </a>
      </div>
    </div>
  );
}