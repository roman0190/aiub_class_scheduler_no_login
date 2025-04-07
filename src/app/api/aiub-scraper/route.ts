import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";

interface Schedule {
  date: string;
  classInfo: string;
}

interface ResponseData {
  name: string;
  schedule: Schedule[];
  courses: Course[];
}
// This function handles the POST request to scrape data from the AIUB portal
// and returns the schedule and course information.
// It uses axios for HTTP requests and cheerio for parsing HTML.
// The function expects a JSON body with username and password fields.
// It returns a JSON response with the scraped data or an error message.
// The function also handles cookie management using tough-cookie and axios-cookiejar-support.
// The function is designed to be used in a Next.js API route.
// It uses the POST method to receive data and respond with the scraped information.
// The function is asynchronous and returns a Promise that resolves to a Response object.
// The function is designed to be used in a server-side environment, such as a Next.js API route.
// Enable cookie support for axios
const client = wrapper(
  axios.create({
    timeout: parseInt(process.env.API_TIMEOUT || "30000"),
  })
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure both username and password are provided
    if (!body.username || !body.password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const jar = new CookieJar();

    // Get the URL from environment variable only
    const url = process.env.AIUB_PORTAL_URL;

    // Ensure URL is available
    if (!url) {
      return new Response(
        JSON.stringify({ error: "Portal URL is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await client.post(url, body, {
      jar,
      withCredentials: true,
    });

    const $ = cheerio.load(response.data);

    const rawName = $(".navbar-text.navbar-right a small").text().trim();

    const formattedName = rawName
      .toLowerCase()
      .split(", ")
      .reverse()
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const scheduleTable: { date: string; classInfo: string }[] = [];
    $(".scheduleTable")
      .find(".row")
      .each((_, element) => {
        const date = $(element).find(".col-md-2").text().trim();
        const classInfo = $(element).find(".col-md-6").text().trim();
        scheduleTable.push({ date, classInfo });
      });
    // Get the courses
    const AllCourses = await client.get(`${url}/Student/Section/Offered`, {
      jar,
      withCredentials: true,
    });
    const $1 = cheerio.load(AllCourses.data);

    const courses: Course[] = [];

    $1("tbody tr").each((_, element) => {
      const tds = $1(element).find("td");

      if (tds.length < 6) return;

      const classId = $1(tds[0]).text().trim();
      const title = $1(tds[1]).text().trim();
      const status = $1(tds[2]).text().trim();
      const capacity = $1(tds[3]).text().trim();
      const count = $1(tds[4]).text().trim();

      const timeData: TimeSchedule[] = [];
      const nestedTableRows = $1(tds[5]).find("table tbody tr");

      nestedTableRows.each((__, tr) => {
        const timeTds = $1(tr).find("td");
        if (timeTds.length < 5) return;

        timeData.push({
          type: $1(timeTds[0]).text().trim(),
          day: $1(timeTds[1]).text().trim(),
          timeStart: $1(timeTds[2]).text().trim(),
          timeEnd: $1(timeTds[3]).text().trim(),
          room: $1(timeTds[4]).text().trim(),
        });
      });

      courses.push({
        classId,
        title,
        status,
        capacity,
        count,
        schedule: timeData,
      });
    });

    if (response.status === 200) {
      const responseData: ResponseData = {
        name: formattedName,
        schedule: scheduleTable,
        courses: courses,
      };
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Login failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("POST request error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
