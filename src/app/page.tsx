import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white bg-opacity-90 p-8 rounded-lg shadow-xl">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Notes App</h1>
          <p className="mt-2 text-lg text-gray-700 font-medium">
            Multi-tenant SaaS Notes Application
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </Link>

          <div className="mt-6">
            <p className="text-sm text-gray-700 font-bold">
              Test accounts (password: password):
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              <li>admin@acme.test (Admin, Acme)</li>
              <li>user@acme.test (Member, Acme)</li>
              <li>admin@globex.test (Admin, Globex)</li>
              <li>user@globex.test (Member, Globex)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
