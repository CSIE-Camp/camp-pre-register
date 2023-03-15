import { D1Database } from "$lib/server/d1";
import { z } from "zod";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ platform, url }) => {
	const email = url.searchParams.get("email");
	if (!email) {
		return json({ success: false, error: "請輸入電子郵件" });
	}

	try {
		z.string().email().max(128).parse(email);
	} catch {
		return json({ success: false, error: "電子郵件格式錯誤" });
	}

	const db_fetcher = platform?.env?.__D1_BETA__DB || platform?.env?.DB;
	if (!db_fetcher) {
		return json({ success: false, error: "資料庫在鬧脾氣" });
	}

	const db = "fetch" in db_fetcher ? new D1Database(db_fetcher) : db_fetcher;

	try {
		const result = await db
			.prepare("INSERT INTO EMAILS (email, date) VALUES (?, ?)")
			.bind(email, new Date().toISOString())
			.run();

		platform.context.waitUntil(send(email, platform.env.HERMES_TOKEN));

		return json({ success: result.success, error: result.error || "" });
	} catch (err) {
		if (err instanceof Error) {
			console.error(err.name, err.cause, err.stack);
		}
		return json({ success: false, error: "已經訂閱了" });
	}
};

async function send(to: string, key: string) {
	const endpoint = "https://hermes.csie.cool/api/send";

	console.log("Sending email ...");

	await fetch(endpoint, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: {
				email: "camp@csie.cool",
				name: "師大資工營",
			},
			to: [to],
			subject: "師大資工營事前登錄成功！",
			content: {
				template: "simple",
				params: {
					icon: "https://camp-storage.csie.cool/camp-icon.jpg",
					greeting: "恭喜",
					main: "師大資工營事前登錄成功！",
					body: "我們會在報名開始時通知你，請保持關注！偶爾也可以到我們的粉專看看喔！",
					link: "",
					footer: "官方網站,https://camp.csie.cool/;粉絲專頁,https://www.facebook.com/ntnucsiecamp",
				},
			},
		}),
	}).then(async (res) => {
		if (res.ok) {
			console.log("Email sent successfully!");
		} else {
			console.error("Failed to send email", res.status, await res.text());
		}
	});
}
