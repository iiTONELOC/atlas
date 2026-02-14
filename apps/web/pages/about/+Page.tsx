export default function Page() {
  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">About TrashScanner™</h1>
        <a className="text-sm text-blue-600 underline" href="/">
          Home
        </a>
      </div>
      <p className="mt-4 text-gray-700">Static multi-page build with Vike SSG.</p>
    </div>
  );
}
