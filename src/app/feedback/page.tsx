"use client";
import React, { useState } from "react";
import { Star, Send } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      Swal.fire({
        title: "Rating Required",
        text: "Please provide a rating before submitting",
        icon: "warning",
        confirmButtonColor: "#003366",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          rating,
          message,
        }),
      });

      if (response.ok) {
        Swal.fire({
          title: "Thank you!",
          text: "Your feedback has been submitted successfully",
          icon: "success",
          confirmButtonColor: "#003366",
        }).then(() => {
          router.push("/");
        });
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to submit your feedback. Please try again.",
        icon: "error",
        confirmButtonColor: "#003366",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f8ff] text-blue-950">
      <div className="container mx-auto max-w-2xl p-6">
        <div className="bg-white shadow-md rounded-lg p-6 mt-8">
          <h1 className="text-2xl font-bold text-[#003366] mb-6 text-center">
            We Value Your Feedback
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                placeholder="Enter your name"
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="flex space-x-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    fill={
                      star <= (hoveredRating || rating)
                        ? "#FFD700"
                        : "transparent"
                    }
                    stroke={
                      star <= (hoveredRating || rating) ? "#FFD700" : "#6B7280"
                    }
                    className="cursor-pointer transition-all"
                  />
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-1">
                {rating > 0
                  ? `You rated: ${rating} star${rating > 1 ? "s" : ""}`
                  : "Select a rating"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please share your thoughts, suggestions, or any issues you've experienced..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#003366] text-white rounded-md hover:bg-[#002244] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
