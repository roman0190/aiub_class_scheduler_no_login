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

// Enable cookie support for axios
const client = wrapper(
  axios.create({
    timeout: parseInt(process.env.API_TIMEOUT || "30000"),
  })
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
    const url = process.env.AIUB_PORTAL_URL;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Portal URL is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Fetch the login page to retrieve the anti-forgery token
    const response = await client.get(url, {
      jar,
      withCredentials: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        Referer: url,
        Origin: url,
      },
    });

    const $ = cheerio.load(response.data);
    const antiForgeryToken = $(
      "input[name='__RequestVerificationToken']"
    ).val() as string;

    if (!antiForgeryToken) {
      return new Response(
        JSON.stringify({ error: "Anti-forgery token not found" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Retrieved __RequestVerificationToken:", antiForgeryToken);

    // Step 2: Create FormData for the login request payload
    const formData = new URLSearchParams();
    formData.append("__RequestVerificationToken", antiForgeryToken);
    formData.append("UserName", body.username);
    formData.append("Password", body.password);
    formData.append("fingerPrint", "-"); 
    console.log("FormData payload:", formData.toString());

    const loginResponse = await client.post(url, formData.toString(), {
      jar,
      withCredentials: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        Referer: url,
        Origin: url,
      },
    });

    console.log("Login response status:", loginResponse.status);
    console.log("Login response data:", loginResponse.data);

    if (loginResponse.status !== 200) {
      console.error("Login failed with status:", loginResponse.status);
      return new Response(
        JSON.stringify({ error: "Login failed. Invalid credentials." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const $1 = cheerio.load(loginResponse.data);

    // Step 3: Check for error messages in the response
    const errorMessage = $1(".text-danger").text().trim();
    if (errorMessage) {
      console.error("Login error message:", errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawName = $1(".navbar-text.navbar-right a small").text().trim();

    console.log("Extracted rawName:", rawName);

    if (!rawName) {
      console.error("Failed to extract user name from response");
      return new Response(
        JSON.stringify({ error: "Login failed. Invalid response data." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formattedName = rawName
      .toLowerCase()
      .split(", ")
      .reverse()
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const scheduleTable: { date: string; classInfo: string }[] = [];
    $1(".scheduleTable")
      .find(".row")
      .each((_, element) => {
        const date = $(element).find(".col-md-2").text().trim();
        const classInfo = $(element).find(".col-md-6").text().trim();
        scheduleTable.push({ date, classInfo });
      });

    console.log("Extracted scheduleTable:", scheduleTable);

    if (scheduleTable.length === 0) {
      console.error("No schedule data found");
      return new Response(
        JSON.stringify({ error: "No schedule data available." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get the courses
    const AllCourses = await client.get(`${url}/Student/Section/Offered`, {
      jar,
      withCredentials: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        Referer: url,
        Origin: url,
      },
    });
    const $2 = cheerio.load(AllCourses.data);

    const courses: Course[] = [];
    $2("tbody tr").each((_, element) => {
      const tds = $2(element).find("td");

      if (tds.length < 6) return;

      const classId = $2(tds[0]).text().trim();
      const title = $2(tds[1]).text().trim();
      const status = $2(tds[2]).text().trim();
      const capacity = $2(tds[3]).text().trim();
      const count = $2(tds[4]).text().trim();

      const timeData: TimeSchedule[] = [];
      const nestedTableRows = $2(tds[5]).find("table tbody tr");

      nestedTableRows.each((__, tr) => {
        const timeTds = $2(tr).find("td");
        if (timeTds.length < 5) return;

        timeData.push({
          type: $2(timeTds[0]).text().trim(),
          day: $2(timeTds[1]).text().trim(),
          timeStart: $2(timeTds[2]).text().trim(),
          timeEnd: $2(timeTds[3]).text().trim(),
          room: $2(timeTds[4]).text().trim(),
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

    console.log("Extracted courses:", courses);

    const responseData: ResponseData = {
      name: formattedName,
      schedule: scheduleTable,
      courses: courses,
    };

    console.log("Final response data:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
