/**
 * Utility functions for interacting directly with the Google Calendar API
 * using standard REST endpoints and the user's authorized Google OAuth Access Token.
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  htmlLink?: string;
}

/**
 * Fetch upcoming events from the user's primary Google Calendar
 */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  try {
    // Set a date range (e.g. 6 months before and after current time)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, 1);

    const timeMin = sixMonthsAgo.toISOString();
    const timeMax = sixMonthsFromNow.toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Calendar Fetch Error:", errorText);
      throw new Error(`Google Calendar API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    return [];
  }
}

/**
 * Create a new event in the user's primary Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: { title: string; date: string; notes?: string }
): Promise<GoogleCalendarEvent | null> {
  try {
    const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    
    // We can schedule all-day events on the content roadmap
    const body = {
      summary: event.title,
      description: event.notes || "Scheduled via Creative Content Marketing Operations Platform",
      start: {
        date: event.date, // "YYYY-MM-DD" formats create all-day events
      },
      end: {
        date: event.date, // Google Calendar end date for all-day events is exclusive, but we can set start and end date to the same to occupy that day
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Calendar Create Event Error:", errorText);
      throw new Error(`Google Calendar API Create Error: ${response.statusText}`);
    }

    const createdEvent = await response.json();
    return createdEvent;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
}
