"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useCurrentUser, useSocket } from "./SocketProvider";

const DEFAULT_AVATAR_COLOR = "#000000";
const DEFAULT_USER_LOCATION = { x: 0, y: 0 };

type LoginPayload = {
  username: string;
  avatarColor: string;
};

export default function Home() {
  const socket = useSocket();
  const router = useRouter();
  const { setCurrentUser } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToMap, setIsRedirectingToMap] = useState(false);
  const loginTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleLoginSuccess = (payload: {
      username?: string;
      avatarColor?: string;
      location?: { x: number; y: number };
      message?: string;
    }) => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      const nextUser = {
        username: payload.username ?? username.trim(),
        avatarColor: payload.avatarColor ?? avatarColor ?? DEFAULT_AVATAR_COLOR,
        location: payload.location ?? DEFAULT_USER_LOCATION,
      };

      setCurrentUser(nextUser);
      setIsSubmitting(false);
      setIsRedirectingToMap(true);
      setErrorMessage("");
      router.replace("/map");
    };

    const handleLoginError = (payload: {
      message?: string;
      error?: string;
    }) => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      setErrorMessage(
        payload.message ?? payload.error ?? "Login failed. Please try again.",
      );
      setIsSubmitting(false);
    };

    socket.on("login:success", handleLoginSuccess);
    socket.on("login:error", handleLoginError);

    return () => {
      socket.off("login:success", handleLoginSuccess);
      socket.off("login:error", handleLoginError);
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, [avatarColor, router, setCurrentUser, socket, username]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage("Please enter a username.");
      return;
    }

    const payload: LoginPayload = {
      username: trimmedUsername,
      avatarColor,
    };

    setIsSubmitting(true);
    setErrorMessage("");

    if (loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
    }

    loginTimeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setErrorMessage("Login request timed out. Please try again.");
    }, 5000);

    if (!socket.connected) {
      console.log("Socket not connected yet; reconnecting before login emit");
      socket.connect();
      socket.once("connect", () => {
        console.log("Socket ready for login emit", payload);
        socket.emit("login", payload);
      });
      return;
    }

    console.log("Emitting login", payload);
    socket.emit("login", payload);
  };

  if (isRedirectingToMap) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="shadow-lg w-fit mx-auto p-5 rounded-(--rounded-corners)">
        <form onSubmit={handleSubmit} className="flex flex-col gap-0.5">
          <section className="flex flex-col mb-2">
            <label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="border border-gray-300 rounded-(--rounded-corners) p-2"
            />
          </section>
          <section className="flex flex-col mb-2">
            <label htmlFor="avatarColor">Avatar color</label>
            <input
              type="color"
              id="avatarColor"
              name="avatarColor"
              value={avatarColor}
              onChange={(event) => setAvatarColor(event.target.value)}
              className="border border-gray-300 rounded-(--rounded-corners) p-2 cursor-pointer"
            />
          </section>

          {errorMessage ? (
            <p className="mb-2 text-sm text-red-600" role="status">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
