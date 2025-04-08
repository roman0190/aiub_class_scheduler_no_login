import { NextResponse } from "next/server";

// Google Apps Script deployment URL
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "";

// Function to send feedback to Google Sheets via Apps Script
async function sendToGoogleSheets(
  name: string,
  rating: number,
  message: string
) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("Google Script URL not configured");
    return false;
  }

  try {
    // Format date for spreadsheet
    const date = new Date().toLocaleString();
    const params = new URLSearchParams();

    // Add parameters individually to ensure proper encoding
    params.append("date", date);
    params.append("name", name);
    params.append("rating", rating.toString());
    params.append("message", message);

    // Use URL parameters for Google Sheets
    const fetchUrl = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;

    console.log("Sending feedback to Google Sheets...");
    const response = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-cache",
    });

    if (response.ok) {
      console.log("Successfully sent feedback to Google Sheets");
      return true;
    } else {
      const text = await response.text();
      console.error("Google Sheets error:", text.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error("Error sending feedback to Google Sheets:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rating, message } = body;

    // Validate the request data
    if (!name || !rating || !message) {
      return NextResponse.json(
        { error: "Name, rating, and message are required" },
        { status: 400 }
      );
    }

    // Validate rating is a number between 1-5
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Send directly to Google Sheets
    const sheetsSaveResult = await sendToGoogleSheets(
      name,
      numericRating,
      message
    );

    if (!sheetsSaveResult) {
      return NextResponse.json(
        { success: false, message: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully to Google Sheets",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
