"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantPlan: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchNotes();
  }, [router]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "An error occurred while fetching notes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "SUBSCRIPTION_LIMIT") {
          setShowUpgradeModal(true);
        } else {
          throw new Error(data.error || "Failed to create note");
        }
        return;
      }

      setTitle("");
      setContent("");
      fetchNotes();
    } catch (err) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "An error occurred while creating the note"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      fetchNotes();
    } catch (err) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "An error occurred while deleting the note"
      );
    }
  };

  const upgradeSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Upgrading subscription for tenant:", user?.tenantSlug);

      const url = `/api/tenants/${user?.tenantSlug}/upgrade`;
      console.log("Request URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Upgrade response:", data);

      if (!response.ok) {
        console.error("Upgrade failed with status:", response.status);
        throw new Error(data.error || "Failed to upgrade subscription");
      }

      // Update user in localStorage
      if (user) {
        const updatedUser = { ...user, tenantPlan: "PRO" };
        console.log("Updating user in local storage:", updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setShowUpgradeModal(false);
    } catch (err) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "An error occurred while upgrading the subscription"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white bg-opacity-90 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl text-yellow-700 font-bold">Notes App</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 flex items-center md:ml-6">
                <p className="text-sm text-gray-700 mr-4 font-medium">
                  {user?.tenantName} ({user?.tenantPlan}) - {user?.email} (
                  {user?.role})
                </p>
                <button
                  onClick={logout}
                  className="ml-3 bg-yellow-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white bg-opacity-90 shadow overflow-hidden sm:rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Note</h2>
          <form onSubmit={createNote} className="mt-3">
            <div className="mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
                className="shadow-sm placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm text-black border-gray-300 rounded-md p-2 border"
              />
            </div>
            <div className="mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
                required
                rows={3}
                className="shadow-sm placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm text-black border-gray-300 rounded-md p-2 border"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isCreating ? "Creating..." : "Create Note"}
            </button>

            {user?.role === "ADMIN" && user?.tenantPlan === "FREE" && (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Upgrade to Pro
              </button>
            )}
          </form>
        </div>

        <div className="bg-white bg-opacity-90 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-2xl leading-6 mb-10 font-bold text-gray-900">
              Your Notes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-700 font-medium">
              {user?.tenantPlan === "FREE"
                ? `${notes.length}/3 notes (Free Plan)`
                : "Unlimited notes (Pro Plan)"}
            </p>
          </div>
          {notes.length === 0 ? (
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-500">
                No notes yet. Create your first note above!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notes.map((note) => (
                <li key={note.id} className="px-4 py-4 sm:px-6">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {note.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                        {note.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upgrade Modal - Simplified Implementation */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowUpgradeModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 z-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                You&apos;ve reached the limit of 3 notes on the Free plan.
                Upgrade to Pro for unlimited notes!
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Cancel
                </button>

                {user?.role === "ADMIN" && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={upgradeSubscription}
                  >
                    Upgrade Now
                  </button>
                )}

                {user?.role !== "ADMIN" && (
                  <p className="text-sm text-gray-500 py-2">
                    Contact your admin to upgrade.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
